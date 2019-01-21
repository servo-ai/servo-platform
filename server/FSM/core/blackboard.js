/**
 * Blackboard
 * 
 * Copyright (c) 2017-2019 Servo Labs Inc.  
 * Parts Copyright (c)  Renato de Pontes Pereira.  
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

// namespace:
var b3 = require('../core/b3')


/**
 * The Blackboard is the memory structure required by `BehaviorTree` and its 
 * nodes. It only have 2 public methods: `set` and `get`. These methods works 
 * in 3 different contexts: global, per tree, and per node per tree.
 * 
 * Suppose you have two different trees controlling a single object with a 
 * single blackboard, then:
 *
 * - In the global context, all nodes will access the stored information. 
 * - In per tree context, only nodes sharing the same tree share the stored 
 *   information.
 * - In per node per tree context, the information stored in the blackboard can
 *   only be accessed by the same node that wrote the data.
 *   
 * The context is selected indirectly by the parameters provided to these 
 * methods, for example:
 * 
 *     // getting/setting variable in global context
 *     blackboard.set('testKey', 'value');
 *     var value = blackboard.get('testKey');
 *     
 *     // getting/setting variable in per tree context
 *     blackboard.set('testKey', 'value', tree.id);
 *     var value = blackboard.get('testKey', tree.id);
 *     
 *     // getting/setting variable in per node per tree context
 *     blackboard.set('testKey', 'value', tree.id, node.id);
 *     var value = blackboard.get('testKey', tree.id, node.id);
 * 
 * Note: Internally, the blackboard store these memories in different objects,
 *  being the global on `_baseMemory`, the per tree on `_treeMemory` and the 
 *  per node per tree dynamically create inside the per tree memory (it is 
 *  accessed via `_treeMemory[id].nodeMemory`). Avoid to use these variables 
 *  manually, use `get` and `set` instead.
 *  
 * @memberof module:Core
 **/
class Blackboard {


  /**
   * constructor
   */
  constructor() {
    this.resetMemory();
  }


  /**
   * Internal methods to retrieve the tree context memory. If the memory does
   * not exist, this method creates it.
   *
   * @private _getTreeMemory
   * @param {string} treeScope The id of the tree in scope.
   * @return {Object} The tree memory.
   * @private
   **/
  _getTreeMemory(treeScope) {
    if (!this._treeMemory[treeScope]) {
      this._treeMemory[treeScope] = {
        'nodeMemory': {},
        // 'openNodes'          : [],
        'traversalDepth': 0,
        'traversalCycle': 0,
      };
    }
    return this._treeMemory[treeScope];
  }

  _getVolatileMemory(treeScope) {
    if (!this._volatileMemory[treeScope]) {
      this._volatileMemory[treeScope] = {
        'nodeMemory': {},
        // 'openNodes'          : [],
        'traversalDepth': 0,
        'traversalCycle': 0,
      };
    }
    return this._volatileMemory[treeScope];
  }

  /**
   * Internal method to retrieve the node context memory, given the tree 
   * memory. If the memory does not exist, this method creates is.
   *
   * @private _getNodeMemory
   * @param {Object} treeMemory the tree memory.
   * @param {string} nodeScope The id of the node in scope.
   * @return {Object} The node memory.
   * @private
   **/
  _getNodeMemory(treeMemory, nodeScope) {
    var memory = treeMemory['nodeMemory'];
    if (!memory[nodeScope]) {
      memory[nodeScope] = {};
    }

    return memory[nodeScope];
  }

  /**
   * Internal method to retrieve the context memory. If treeScope and 
   * nodeScope are provided, this method returns the per node per tree 
   * memory. If only the treeScope is provided, it returns the per tree 
   * memory. If no parameter is provided, it returns the global memory. 
   * Notice that, if only nodeScope is provided, this method will still 
   * return the global memory.
   *
   * @private _getMemory
   * @param {string} treeScope The id of the tree scope.
   * @param {string} nodeScope The id of the node scope.
   * @return {Object} A memory object.
   * @private
   **/
  _getMemory(treeScope, nodeScope, volatile) {
    var memory = this._baseMemory;

    if (treeScope) {
      memory = volatile ? this._getVolatileMemory(treeScope) : this._getTreeMemory(treeScope);;

      if (nodeScope) {
        memory = this._getNodeMemory(memory, nodeScope);
      }
    }

    return memory;
  }




  /**
   * Stores a value in the blackboard. If treeScope and nodeScope are 
   * provided, this method will save the value into the per node per tree 
   * memory. If only the treeScope is provided, it will save the value into 
   * the per tree memory. If no parameter is provided, this method will save 
   * the value into the global memory. Notice that, if only nodeScope is 
   * provided (but treeScope not), this method will still save the value into
   * the global memory.
   *
   * @private set
   * @param {string} key The key to be stored.
   * @param {string} value The value to be stored.
   * @param {string} treeScope The tree id if accessing the tree or node 
   *                           memory.
   * @param {string} nodeScope The node id if accessing the node memory.
   * @param {boolean} volatile: true if this is the volatile memory area
   **/
  set(key, value, treeScope, nodeScope, volatile) {

    var memory = this._getMemory(treeScope, nodeScope, volatile);
    memory[key] = value;

    // save if not volatile
    if (!volatile && this.id) {
      this.dirty = true;
      // make it async - otherwise save confuses promise chains 
      setTimeout(() => {
        this.save().then(() => {
          this.clean();
        }).catch((ex) => {
          console.error('ERROR ON blackboard.set', ex);
        });
      });

    }
    return value;
  }
  clean() {
    this.dirty = true;
  }
  /**
   * Retrieves a value in the blackboard. If treeScope and nodeScope are
   * provided, this method will retrieve the value from the per node per tree
   * memory. If only the treeScope is provided, it will retrieve the value
   * from the per tree memory. If no parameter is provided, this method will
   * retrieve from the global memory. If only nodeScope is provided (but
   * treeScope not), this method will still try to retrieve from the global
   * memory.
   *
   * @private get
   * @param {string} key The key to be retrieved.
   * @param {string} treeScope The tree id if accessing the tree or node 
   *                           memory.
   * @param {string} nodeScope The node id if accessing the node memory.
   * @param {boolean} volatile: true if this is the volatile memory area
   * @return {Object} The value stored or undefined.
   **/
  get(key, treeScope, nodeScope, volatile) {
    var memory = this._getMemory(treeScope, nodeScope, volatile);
    return memory[key];
  }

  resetMemory() {
    this._treeMemory = {};
    this._baseMemory = {};
    this._volatileMemory = {
      'process-volatile-memory': {}
    };
  }

  resetNonGlobalMemory() {
    this._treeMemory = {};
    this._volatileMemory = {
      'process-volatile-memory': {}
    };
  }




}
module.exports = Blackboard;