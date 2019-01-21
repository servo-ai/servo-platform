var _ = require('underscore');

var dblogger = require("utils/dblogger.js");

var b3 = require('./b3');
var BaseNode = require('FSM/core/baseNode');

var Tick = require('./tick');
/**
 * TreeNode encapsulates a sub tree. 
 * @memberof module:Core
 * 
 */
class TreeNode extends BaseNode {

  /**
   * 
   * @param {BaseNode} node 
   * @param {BehaviorTree} tree 
   */
  constructor(node, tree) {
    super();
    this.category = b3.TREENODE;
    this.title = this.name = node.name;
    this.id = node.id;
    this.title = node.title;
    this.description = node.description;
    this.properties = node.properties;
    /** holds a reference to the subtree
     * @member {BaseNode} 
     * */
    this.child = tree;

  };

  /**
   * create a new tick object that is relevant to the tree below this node
   * @param {Tick} tick 
   */
  createChildTick(tick) {
    var newTick = new Tick();
    _.extend(newTick, tick);
    newTick.tree = this.child;
    newTick.treeId = this.child.id;
    return newTick;
  }


  /**
   * Tick method.
   *
   * @private
   * @param {Tick} tick A tick instance.
   * @return {TickStatus} A state status.
   **/
  tick(tick) {
    if (!this.child || !this.child.root) {
      return b3.ERROR();
    }
    // we use a different tree object for every subtree, so we have a unique 
    // tree id for set/get operations 
    var subTreeTick = new Tick();
    _.extend(subTreeTick, tick);
    subTreeTick.tree = this.child;
    // we dont treat a child tree as a root tree (which manages open nodes)
    // so we call its _execute and not its tick()
    var status = this.child.root._execute(subTreeTick);
    return status;
  };

  /**
   * 
   * @param {Tick} tick 
   * @param {TickStatus} status 
   */
  close(tick, status) {

    // we use a different tick object for the subtree
    var subTreeTick = new Tick();
    _.extend(subTreeTick, tick);
    subTreeTick.tree = this.child;
    this.child.root._close(subTreeTick, status);

  }
}
module.exports = TreeNode;