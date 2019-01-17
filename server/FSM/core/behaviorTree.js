/**
 * BehaviorTree
 *
 * Copyright (c) 2017 Servo Labs Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to 
 * deal in the Software without restriction, including without limitation the 
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is 
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 * 
 **/

var _ = require('underscore');
var uuid = require('uuid');

var dblogger = require("utils/dblogger.js");
var utils = require("utils/utils.js");
var config = require('config');

var b3 = require('./b3');

var Tick = require('./tick');
var TreeNode = require('FSM/core/treeNode');
var fsmModel = require('models/fsmmodel');
var ContextManager = require('FSM/contextManager');
var FSM;

/**
 * The BehaviorTree class, as the name implies, represents the Behavior Tree 
 * structure.
 * 
 * There are two ways to construct a Behavior Tree: by manually setting the 
 * root node, or by loading it from a data structure (which can be loaded from 
 * a JSON). Both methods are shown in the examples below and better explained 
 * in the user guide.
 *
 * The tick method must be called periodically, in order to send the tick 
 * signal to all nodes in the tree, starting from the root. The method 
 * `BehaviorTree.tick` receives a target object and a process as parameters.
 * The target object can be anything: a game agent, a system, a DOM object, 
 * etc. This target is not used by any piece of Behavior3JS, i.e., the target
 * object will only be used by custom nodes.
 * 
 * The process is obligatory and must be an instance of `process`. This 
 * requirement is necessary due to the fact that neither `BehaviorTree` or any 
 * node will store the execution variables in its own object (e.g., the BT does
 * not store the target, information about opened nodes or number of times the 
 * tree was called). But because of this, you only need a single tree instance 
 * to control multiple (maybe hundreds) objects.
 * 
 **/


/**
 * BehaviorTree class
 * @memberof module:Core
 */
class BehaviorTree {

  /**
   * 
   * @param {string} id - tree id 
   * @param {string} parentTreeNodeId  - if a sub tree, id of the node thatg holds it
   * @param {string} fsmId - original fsm (file) 
   */
  constructor(id, parentTreeNodeId, fsmId) {
    // at first the folder name is equal to the id
    // on subtrees, we change it

    /**
     * The tree id, must be unique. By default, created with `b3.createUUID`.
     * 
     * @property id
     * @type {String}
     * @readOnly
     */

    this.id = id;

    /**
     * The tree title.
     *
     * @property title
     * @type {String}
     */

    this.title = 'The behavior tree';
    /**
     * Description of the tree.
     *
     * @property description
     * @type {String}
     */

    this.description = 'Default description';
    /**
     * A dictionary with (key-value) properties. Useful to define custom 
     * variables in the visual editor.
     *
     * @property properties
     * @type {Object}
     */

    this.properties = {};
    /**
     * The reference to the root node. Must be an instance of `b3.BaseNode`.
     *
     * @property root
     * @type {BaseNode}
     */

    this.root = null;
    /**
     * true is this tree has a parent tree.
     *
     * @property isSubtree
     * @type {boolean}
     */

    this.isSubtree = !!parentTreeNodeId;
    /**
     * node id of the tree
     *
     * @property parentTreeNodeId
     * @type {boolean}
     */

    this.parentTreeNodeId = parentTreeNodeId;

    /***
     * id of original file fsm
     * @property fsmOrigId
     * @type {string}
     */
    this.fsmOrigId = fsmId;

  }


  /**
   * close all tree nodes, including subtrees
   * @param {Tick} tick 
   */
  // closeNodes(tick) {
  // NOT WORKING. TODO: START FROM ROOT AND CLOSE ALL DOWN
  //   var counter = 0;
  //   var names = "";
  //   //tick.process.volatile('openNodes', []);
  //   _.each(this.nodes, (node) => {
  //     node._close(tick);
  //     names += node.title + " ";
  //     counter++;
  //     if (node.category == b3.TREENODE) {
  //       var newTick = node.createChildTick(tick);
  //       node.child.closeNodes(newTick);
  //     }
  //   });
  //   dblogger.log('close nodes ', counter, names)
  // }


  /**
   * loads the node from the class in b3
   * @param {Object} spec 
   * @param {Object} [names] A namespace or dict containing custom nodes.
   */
  loadClass(spec, names) {
    var cls;
    //dblogger.log('loadClass', spec.name);
    if (spec.name in names) {
      // Look for the name in custom nodes
      cls = names[spec.name];
    } else if (spec.name in b3) {
      // Look for the name in default nodes
      cls = b3[spec.name];
    } else {
      return undefined;
    }

    var node = new cls(spec.properties);
    node.id = /*this.parentTreeNodeId + */ spec.id || node.id;
    node.title = spec.title || node.title;
    node.description = spec.description || node.description;
    node.properties = spec.properties || node.properties;
    return node;
  }

  /**
   * 
   * @param {number} i index in nodesArray 
   * @param {Array} nodesArray 
   * @param {Object} nodes - destination object
   * @param {Object} [names] A namespace or dict containing custom nodes.
   */
  loadNode(i, nodesArray, nodes, names, noDefaultRootEntities, data) {
    var jsonNode = nodesArray[i];

    return new Promise((resolve, reject) => {
      var id = jsonNode.id;
      // dblogger.log({
      //   'cat': 'flow'
      // }, 'loadNode ' + id);
      var spec = jsonNode;
      var node = this.loadClass(spec, names);
      if (!node) {
        var parentTree = this;
        console.log('loading spec.name', data.userId, spec.name);
        // try to load it as a subtree - 
        fsmModel.get(spec.name, data.userId, data.rootFolderName).then((fsm) => {
          var mid = this.id; //Date.now();a
          var new_tree_id = 'st:' + spec.id + ":" + fsm.userFsmId() + ":" + mid;
          // this will recursively get again to this function
          FSM = FSM || require("../../FSM/fsm-manager"); // require now to avoid circular dependency
          // this is a recursive call since loadBehaviorTree is on our path of how we got here
          console.log('loaded spec.name', fsm.userId, spec.name);
          FSM.loadBehaviorTree(fsm, spec.id, new_tree_id, noDefaultRootEntities).then((subtree) => {
            // every node id should be unique. even across all loads of same subtree. 
            //  spec.id is unique - its created in the editor. in a way, node1 extends it
            var node1 = new TreeNode(spec, subtree);
            node1.tree = parentTree; // the tree member of the dynamic node points to the parent tree
            node1.mid = mid;
            //node1.tree.origId = fsm.userFsmId(); // TODO: NO NEED 
            dblogger.assert(!nodes[id], "nodes id already exists");
            nodes[id] = node1; //TODO: ???
            resolve();
          }).catch((ex) => {

            dblogger.error('FSM.loadBehaviorTree failed:', ex);
            reject(ex);
          });

        }).catch((ex) => {
          dblogger.error('error loading sub behavior tree ' + spec.name + ":" + ex);
          reject(ex);
        });

      } else {
        nodes[id] = node;
        resolve();
      }
    });
  }


  /**
   * connect nodes in a tree 
   * @param {Object} data 
   * @param {Array} nodes 
   */
  connectNodes(data, nodes) {

    // connect the nodes down, and save in an array for parentId
    for (var id in data.nodes) {
      var spec = data.nodes[id];
      var node = nodes[id];

      if (node.category === b3.COMPOSITE && spec.children) {
        for (var i = 0; i < spec.children.length; i++) {
          var cid = spec.children[i];
          var childNode = nodes[cid];
          dblogger.assert(childNode, "no node with id:" + cid + ". this might happen if that node represent a subtree that didnt load")
          childNode.parentId = node.id;
          // childNode.set(tick, 'parentId', node.id);
          node.children.push(childNode);
        }
      } else if ((node.category === b3.DECORATOR || node.category === b3.MLMODEL) &&
        spec.child) {
        node.child = nodes[spec.child];
        node.child.parentId = node.id;
        //node.child.set(tick,'parentId',node.id);
      } else if (node.category === b3.TREENODE) {
        // we can save its parent id under its own memory area
        // and importantly, under its own *tree*
        //node.child.root.set({process:tick.process,tree:node.child},'parentId',node.id);
        node.child.root.parentId = node.id;
        dblogger.log('set parent tree', node.tree.id, node.child.id, node.id, node.name);
        //node.child.root.set({process:tick.process,tree:node.child},'parentTree',node.tree);
        node.child.root.parentTree = node.tree;
      }
      node.postConnect();
    }
  }

  /** 
   *  
   * find the best context for this request, and switch to it
   * @param {Tick} tick 
   */
  searchContextUp(tick) {

    var arrFoundContexts = [];
    var helperContextManager, helperFoundContexts;

    // start with current contextManager
    var contextManagerEntities = tick.process.currentContextEntities();
    contextManagerEntities.tick.target = tick.target; // put target on it
    dblogger.assert(contextManagerEntities, 'currentContextEntities not initialized');
    var contextManager = contextManagerEntities.contextManager;

    var parentetts = {
      tick: contextManagerEntities.tick,
      node: contextManagerEntities.contextManager.node
    };
    let loopStop = false;
    let contextCandidates = [];
    let contextDistance = 0;
    // go up the contextmanager's tree
    while (!loopStop) {
      dblogger.flow('---context search start');
      // and try to find the context
      arrFoundContexts = contextManager.selectContexts(parentetts.tick, ContextManager.contextManagerKeys().UPWARDS, contextDistance++);

      // save first found (ie most specific) helper context
      if (!helperContextManager && contextManager.helperContextIndex(arrFoundContexts)) {
        helperContextManager = contextManager;
        helperFoundContexts = arrFoundContexts;
      } else {
        if (contextManager.contextFound(arrFoundContexts)) {
          // contextCandidates is an array of arrays
          contextCandidates.push(arrFoundContexts);
        }

      }
      // try next ones
      parentetts = contextManager.findNextContextManagerEntities(parentetts.tick, parentetts.node);
      // if reached the root,
      if (!parentetts.node) {
        // signal loop stop
        loopStop = true;
        arrFoundContexts[arrFoundContexts.length - 1].isRootContext = true;
      } else {
        contextManager = parentetts.node.contextManager;
      }

    }

    // if no context was found, use the first helper context found
    let contextSelected;
    if (helperFoundContexts && contextCandidates.length === 0) {
      contextManager = helperContextManager;
      contextSelected = helperFoundContexts;
      //tick.target.useEntity(ContextManager.contextManagerKeys().HELPER, 0, 1); /* depth is set to hard-coded 1. otherwise its 0*/
    } else {
      // otherwise get the largest. if scores are equal, this reduction returns the lower (= more specific) contexts
      contextSelected = contextCandidates.reduce((accumolator, elem) => {
        let elemScore = contextManager.getContextsFoundScore(elem);
        let accScore = contextManager.getContextsFoundScore(accumolator);
        return (elemScore > accScore) ? elem : accumolator;
      });
    }
    contextManager.debugLogContextsFound(contextSelected);
    this.switchContext(tick, contextSelected);

  }


  /**
   * switch the context to the new one, if needed 
   * @param {Tick} tick 
   * @param {Array<FoundContext>} contextsSelected 
   */
  switchContext(tick, contextsSelected) {
    // the new context is the first one - either intermediate or just a single context
    let firstContext = contextsSelected[0];
    dblogger.assert(contextsSelected[1] ? (firstContext.tick === contextsSelected[1].tick) : true, "if there are two contexts, the tick on each must be identical");

    firstContext.tick.target = tick.target;
    // switch on the node to receive particular behaviour
    firstContext.contextManager.node.switchContext(firstContext.tick, contextsSelected, false);

    // if there was a switch and not a selection
    //    if (contextSelected.prevIndex > -1 && contextSelected.prevIndex && contextSelected.index !== contextSelected.prevIndex) {
    //contextSelected.contextManager.mapAllEntitiesUp(contextSelected);
    //  }
  }


  /**
   * create a helper tree 
   * @param {string} defaultHelpPrompt 
   */
  createDefaultHelper(defaultHelpPrompt) {
    // construct a default helper
    var MemSequence = require('FSM/composites/MemSequence');
    var memSequence = new MemSequence();
    var GeneralMessage = GeneralMessage || require('FSM/actions/GeneralMessage');
    var generalHelper = new GeneralMessage();
    generalHelper.title = 'default dynamic help message';
    // remove the target
    var RemoveTargetAction = require('FSM/actions/RemoveTargetAction');
    var removeTargetAction = new RemoveTargetAction();

    generalHelper.properties = generalHelper.parameters = {
      prompt: defaultHelpPrompt || "I don't understand"
    };

    memSequence.children = [removeTargetAction, generalHelper];
    removeTargetAction.parentId = generalHelper.parentId = memSequence.id;
    return memSequence;

  }

  /**
   * set the root of this tree and build a context manager tree
   * @param {Object} data fsm (json file) tree representation 
   * @param {Object} nodes nodes object 
   */
  buildContextEntities(data, nodes) {
    // default
    var rootId = data.root;
    this.root = nodes[rootId];
    // if its the main tree, connectContext
    if (!this.isSubtree) {
      var AskAndMap = require('FSM/composites/AskAndMap');
      var rootNode = new AskAndMap();
      /**
       * rootNode (AskAndMap)  --->    --> old root
       *                              --> helper-sequence1
       * 
       */
      rootNode.title = 'default dynamic root';

      this.root.parentId = rootNode.id = uuid.v4();


      var helperSequence = this.createDefaultHelper(data.properties.defaultHelpPrompt);

      // route the root to context priority
      rootNode.children = [this.root, helperSequence];
      rootNode.properties.contexts = [{
        passThru: true,
        "background": true, // downwards, non message ticks noalso go here
        "default": true // default is the child to be selected if (1) no child to select  (2) there's no other child already selected 
      }, {
        "helper": true // helper is selected if (1) there was no child to select and (2) there was no default or (3) there was another child selected previously  
      }];
      helperSequence.parentId = rootNode.id;

      nodes[rootNode.id] = rootNode;
      nodes[helperSequence.id] = helperSequence;
      this.root = rootNode;

    }
  }

  /**
   * This method loads a Behavior Tree from a data structure, populating this
   * object with the provided data. If the tree contains a 'tree node' then it 
   * will be called recursively again .
   *
   * @param {Object} data The fsm (json file) data structure representing a Behavior Tree.
   * @param {Object} [names] A namespace or dict containing custom nodes.
   * @param {Boolean} noDefaultRootEntities - if true, dont create default root enitites 
   **/
  load(data, names, noDefaultRootEntities) {
    names = names || {};
    var nodes = {};
    var nodesArray = [];

    return new Promise((resolve, reject) => {
      this.title = data.title || this.title;
      this.description = data.description || this.description;
      this.properties = data.properties || this.properties;
      dblogger.log({
        'cat': 'flow'
      }, 'load tree ' + this.title);
      // Create the node list (without connection between them)
      for (var id in data.nodes) {
        nodesArray.push(data.nodes[id]);
      }

      // we are using a nodes array so we can  
      // run loadNode in a loop
      var loadPromise = this.loadNode(0, nodesArray, nodes, names, noDefaultRootEntities, data);
      // condition is i<= so we enter once AFTER the end of nodesArray
      for (var i = 1; i <= nodesArray.length; i++) {
        loadPromise = ((i1) => {
          // console.log(data.title,'before loadPromise ',i1,nodesArray.length)
          return loadPromise.then(() => {
            //dblogger.log(data.title,' loaded ',i1,nodesArray.length)
            if (i1 >= nodesArray.length) {
              // done loading this tree 
              this.connectNodes(data, nodes);

              //this.root = nodes[data.root];
              if (!noDefaultRootEntities) {
                this.buildContextEntities(data, nodes);
              } else {
                var rootId = data.root;
                this.root = nodes[rootId];
              }

              this.nodes = nodes; // for easy mapping
              resolve();
            } else return this.loadNode(i1, nodesArray, nodes, names, noDefaultRootEntities, data);
          }).catch((ex) => {
            dblogger.error('loadPromise failed:', ex);
            reject(ex);
          });
        })(i);
      }

    });

  }

  /**
   * return true if there's a context, and if a target was assigned to it, then the target not mapped yet
   * @param {Tick} tick 
   */
  shouldSearchContext(tick) {
    var contextEtts = tick.process.currentContextEntities();
    if (!contextEtts) {
      return false;
    }

    dblogger.assert(contextEtts.contextManager && contextEtts.tick, 'context should not be without contextManager or tick');
    let isContextOnWaitState = contextEtts.contextManager && contextEtts.contextManager.node && contextEtts.contextManager.node.waitingForAnswer(contextEtts.tick);
    return isContextOnWaitState && contextEtts.tick;


  }

  /**
   * select rot as default context
   * @param {Tick} tick 
   */
  selectRootContext(tick) {
    tick.process.currentContextEntities({
      contextManager: this.root.contextManager,
      tick: tick
    });
  }
  /**
   * get a node by id
   */
  getNode(id) {
    return this.nodes[id];
  }

  /**
   * run thru a pip tree if needed
   * @param {*} tick 
   * @param {*} process 
   */
  passThruPipeTree(process, target) {
    //  activate a pipe tree before the main tree
    if (this.pipeTree && !target.passedThruPipe && target.getMessageObj()) {
      var ret = this.pipeTree.tick(process, target);
      target.passedThruPipe = !(ret === b3.RUNNING());
      return !target.passedThruPipe;
    } else {
      // if the process doesnt have a pipe tree,set to true
      if (!process.properties().pipeTreeId) {
        target.passedThruPipe = true;
      }
    }

  }



  /**
   * Propagates the tick signal through the tree, starting from the root.
   * 
   * This method receives a target object of Target type and a `Process` instance. The target represents 
   * an object arriving from classifiers (eg NLU). The process instance is used by the tree and nodes 
   * to store execution variables (e.g., last node running) and is obligatory
   * to be a `process` instance (or an object with the same interface).
   * 
   * Internally, this method creates a Tick object, which will store the 
   * target and the process objects.
   *
   * 
   * @private tick
   * @param {Object} target A target object.
   * @param {Process} process An instance of process object.
   * @return {TickStatus} The tick signal status.
   **/
  tick(process, target) {

    // see that we have a data object so
    if (!process) {
      throw 'The process parameter is obligatory and must be an ' +
        'instance of Process class';
    }
    // see that we have a data object so we could treat it by reference var data = process.get('data',tree.id) || {};
    var data = process.get('data', this.id);
    process.set('data', data || {}, this.id);

    /* CREATE A TICK OBJECT */
    dblogger.assert(process.properties(), "process should have an fsm");
    var tick = new Tick();
    tick.target = target;
    tick.process = process;
    tick.tree = this;
    tick.depth = 0;

    // if too much targetObjs for too much time ,and production system, clean
    if (target.getTargets().length > 3 && config.productionCleanups) {
      setTimeout(function () {
        target.removeAll();
      }, 2000);
    }

    if (this.passThruPipeTree(process, target)) {
      return b3.RUNNING();
    }


    /* //OPEN ROOT before selecting context */
    //this.root.safeOpen(tick);
    //this.root.setContextChild(tick, 0);


    /* SEARCH FOR a more general CONTEXT if we already have a context 
    and this is a new, unused target */
    if (tick.target.passedThruPipe) {
      if (tick.target.getMessageObj()) {
        // if context selected and not searched yet
        if (this.shouldSearchContext(tick)) {
          // search context up, starting from current context
          this.searchContextUp(tick);
        }

      }
    }

    /* TICK ROOT (& SEARCH FOR CONTEXT down starting from root) */
    var state = this.root._execute(tick);
    if (!state) {
      return;
    }

    if (state !== b3.RUNNING()) {
      this.root._close(tick);
    }


    /* save global process stats */
    process.set('nodeCount', tick._nodeCount, this.id);

    return state;
  };

}
module.exports = BehaviorTree;
