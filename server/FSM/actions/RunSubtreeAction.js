var b3 = require('FSM/core/b3');
var _ = require('underscore');
var Action = require('FSM/core/action');
var FSM = require("FSM/fsm-manager");
var uuid = require('uuid');
var fsmModel = require('models/fsmmodel')
var dblogger = require('utils/dblogger');
var TreeNode = require('FSM/core/treeNode');
// TODO: fix
class RunSubtreeAction extends Action {
  /**
   * Node name. Default to `RunSubtreeAction`.
   *
   * @property name
   * @type {String}
   * @readonly
   **/
  constructor() {
    super();
    this.title = this.name = 'RunSubtreeAction';
    this.parameters = {
      'subtreeId': '',
      'subtreeKey': ''
    };
    this.description = `Loads and runs a subtree with id of subtreeId as defined in the properties. If subtreeId is empty, takes id from subtreeKey in process' data. `;
  }

  /**
   * reset the step
   * @param {Tick} tick 
   */
  open(tick) {
    tick.process.set('step', 0, tick.tree.id, this.id);
  }

  /**
   * tick if we are in the right step
   */
  tickIfNeeded(tick, step) {


    if (step === 'ticking') {
      var nodeTree = this.volatile(tick, 'childTree');
      var status = nodeTree.tick(tick);

      this.waitCode(tick, status);
    }
  }

  /**
   * Tick method.
   *
   * @private tick
   * @param {Tick} tick A tick instance.
   * @return {Constant} A state constant.
   **/
  tick(tick) {
    // get id from properties or from process data
    var subtreeId = this.properties.subtreeId;
    if (_.isEmpty(subtreeId)) {
      subtreeId = tick.process.data(this.properties.subtreeKey);
    }

    var step = this.volatile(tick, 'step');

    // if not loaded, load the tree
    if (!step) {
      this.waitCode(tick, b3.RUNNING());
      // save it in volatile so a reload will re-read the tree
      step = 'loading-tree';
      this.volatile(tick, 'step', step);

      // create unique id for the new tree
      var new_fsm_id = 'dst:' + this.id + ":" + subtreeId;
      fsmModel.get(subtreeId, tick.process.userId).then((fsm) => {
        // and load into a new node 
        FSM.loadBehaviorTree(fsm, tick.process, this.id, new_fsm_id).then((subtree) => {
          var dynamicNode = {
            name: 'name ' + new_fsm_id,
            id: uuid.v4(),
            title: this.title,
            description: this.description,
            properties: this.properties
          };
          dblogger.info({
            cat: 'flow'
          }, 'loading new RunSubtreeAction dynamic subtree', dynamicNode.id, new_fsm_id);
          var node1 = new TreeNode(dynamicNode, subtree);
          node1.tree = tick.tree; // node1 belongs to the tick.tree - meaning, its a node under that node 


          this.waitCode(tick, b3.RUNNING());
          step = 'ticking';
          this.volatile(tick, 'step', step);

          this.volatile(tick, 'childTree', node1);

          this.tickIfNeeded(tick, step);

        }).catch((ex) => {
          dblogger.error('FSM.loadBehaviorTree failed:', ex);
          this.waitCode(tick, b3.ERROR());
        });
      }).catch((ex) => {
        dblogger.error('cannot load the fsm ' + subtreeId, ex);
        this.waitCode(tick, b3.ERROR());
      });

    }

    this.tickIfNeeded(tick, step);

    var status = this.waitCode(tick);

    return status;

  }
}

module.exports = RunSubtreeAction;
