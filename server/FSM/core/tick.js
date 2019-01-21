/**
 * Tick
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
 **/


var _ = require('underscore');

/**
 * A new Tick object is instantiated every tick by BehaviorTree. It is passed 
 * as parameter to the nodes through the tree during the traversal.
 * 
 * The role of the Tick class is to store the instances of tree, target
 * and process. So, all nodes can access it.
 * @memberof module:Core
 **/
class Tick {

  /**
   * constructoor 
   * @param {Process} [process=null] 
   * @param {BehaviorTree} [tree=null] 
   * @param {Target} [target=null] 
   * @param {number} [depth=0]
   */
  constructor(process = null, tree = null, target = null, depth = 0) {
    // set by BehaviorTree
    /**
     * The tree reference.
     * 
     * @property tree
     * @type {BehaviorTree}
     * @readOnly
     */
    this.tree = tree;
    /**
     * The tree id.
     * 
     * @property treeId
     * @type {string}
     * @readOnly
     */
    this.treeId = tree && tree.id;
    /**
     * The target object reference.
     * 
     * @property target
     * @type {Target}
     * @readOnly
     */
    this.target = target;
    /**
     * The process reference.
     * 
     * @property process
     * @type {process}
     * @readOnly
     */
    this.process = process;
    /**
     * The process id.
     * 
     * @property processId
     * @type {string}
     * @readOnly
     */
    this.processId = process && process.id;

    /**
     * The number of nodes entered during the tick. Update during the tree 
     * traversal.
     * 
     * @property _nodeCount
     * @type {number}
     * @private
     * @readOnly
     */
    this._nodeCount = 0;

    this.session = {};
    /**
     * The depth of the current execution from FSM root
     * 
     * @property depth
     * @type {number}
     */
    this.depth = depth;
  }

  /**
   * copy-construct Tick from another tick instace
   * @param {Object} tickOptions 
   */
  copyFrom(tickOptions) {
    this.process = tickOptions.process;
    this.tree = tickOptions.tree;
    this.depth = tickOptions.depth;
  }

  /**
   * decrement tick Depth
   */
  decrementDepth() {
    this.depth--;
    if (this.depth < 0) {
      var dblogger = require('utils/dblogger');
      dblogger.assert(this.depth >= 0, 'depth negative');
    }

  }

  /**
   * increment tick depth
   */
  incrementDepth() {
    this.depth++;
  }

  /**
   * reset all the process data, the target and the 
   */
  resetAll() {
    this.target && this.target.remove();
    if (!(this.process && this.tree)) {
      var dblogger = require('utils/dblogger');
      dblogger.error('resetAll called on empty process or tree');
    }
  }

  /**
   * Called when entering a node (called by BaseNode).
   *
   * @param {Object} node The node that called this method.
   * @protected
   **/
  _enterNode() {
    this._nodeCount++;

  }

  /**
   * Callback when opening a node (called by BaseNode). 
   *
   * @param {Object} node The node that called this method.
   * @protected
   **/
  _openNode() {}

  /**
   * Callback when ticking a node (called by BaseNode).
   *
   * @private 
   * @param {Object} node The node that called this method.
   * @protected
   **/
  _tickNode() {}

  /**
   * Callback when exiting a node (called by BaseNode).
   *
   * @private 
   * @param {Object} node The node that called this method.
   * @protected
   **/
  _exitNode() {}


}
module.exports = Tick;