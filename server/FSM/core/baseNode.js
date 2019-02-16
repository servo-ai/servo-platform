/**
 * BaseNode
 *
 * Copyright (c) 2017-2019 Servo Labs Inc.  
 * Copyright(c)  Renato de Pontes Pereira.  
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
 * @private
 **/
const _RUNNING_TIMEOUT_SEC = 3600; // an hour

// requires
var b3 = require("./b3");
var messageBuilder = require('../message-builder')
var chatManager = require('../../chat/chatmanager')
var _ = require('underscore');
var dblogger = require('utils/dblogger');
var utils = require('utils/utils');
var config = require('config');
var Tick = require('./tick');
var debugFSM = require('FSM/debug-FSM');
let Target = require('FSM/core/target');
/**
 * A string expression to be evaluated against all memory areas.
 * if contains <%= %> with composite variables with the format of (fsm., global., context, volatile., local., message.<field name> ),
 * it will be evaluated against an object with these member objects. Otherwise, evaluated literally. 
 * FOR A STRING, ENCLOSE WITH 'COMMAS'!
 *@typedef ExpressionString 
 */
/**
 * The BaseNode class is used as super class to all nodes in Servo. It 
 * comprises all common variables and methods that a node must have to execute.
 *
 * *Do not inherit from this class, use `Composite`, 
 * `Decorator`, `Action` or `Condition`, instead.
 *
 * The attributes are specially designed to serialization of the node in a JSON
 * format. In special, the `parameters` attribute can be set into the visual 
 * editor (thus, in the JSON file), and it will be used as parameter on the 
 * node initialization at `BehaviorTree.load`.
 * 
 * BaseNode also provide 5 lifecycle callback methods, which the node implementations can
 * override. They are `enter`, `open`, `tick`, `close` and `exit`. See their 
 * documentation to know more. These callbacks are called inside the `_execute`
 * method, which is called in the tree traversal.
 * 
 * All leaf nodes timeouts after runningTimeoutSec, and closes with a failure until maxRetriesNumber reached, upon which it returns error. 
 * Question composite node AskAndMap has its own timeout behavior 
 * @memberof module:Core
 **/

class BaseNode {


  /**
   * initalize the node and its id. members are initialized for default values.
   * @param {string} [id = undefined] 
   **/
  constructor(id) {
    // not needed if we use a unique id from visual editor 
    /** 
     * Node Id (typically a GUID)
     *  @member {string} 
     **/
    this.id = id || b3.createUUID();
    /**
     * Node name. Must be a unique identifier, preferable the same name of the 
     * class. You have to set the node name in the prototype.
     *  @member {string}
     */
    this.name = 'A node';

    /** @member {string} title */
    this.title = this.title || this.name;
    /** @member {string} */
    this.description = '';
    /**
     * ContextManager reference. Defaults to null if no context manager on this node 
     * @member {ContextManager}  */
    this.contextManager = null;

    // parameters are the *default* properties that are set in the RUN TIME CODE
    // they will be merged with the 'properties' defined in the editor
    // We have 2 levels: default (from run time), and  editor, per specific node.
    // once its inside , its called 'settings'

    /** 
     * A dictionary (key, value) describing the node parameters. Useful for 
     * defining parameter values in the visual editor. Note: this is only 
     * useful for nodes when loading trees from JSON files.
     * @member {Object} 
     **/
    this.parameters = {
      'debug-log': '',
      "runningTimeoutSec": 600, // 10 minutes, for leafs only
      "maxRetriesNumber": 5
    };

    /** 
     * editor node properties 
     * @member {Object}
     * */
    this.properties = {};

    /**
     * Node category. Must be `b3.COMPOSITE`, `b3.DECORATOR`, `b3.ACTION`  
     * `b3.CONDITION` or b3.MLMODEL. This is defined automatically be inheriting the 
     * correspondent class.
     * @member {string}
     **/
    this.category = null;

    /***
     * points to the parent tree, for child of a TreeNode
     * @member {BehaviorTree}
     */
    this.parentTree = null;


    /***
     * Id of the TreeNode node, set on its child
     * @member {string}
     */
    this.parentId = null

  }

  /**
   * node log
   * @param {Tick} tick 
   * @param {string} text 
   */
  log(tick, text) {
    dblogger.depthDebug(tick.depth, this.summary(tick), text);
  }

  /**
   * node details summary
   * @param {Tick} tick 
   */
  summary(tick) {
    return "pid:" + tick.process.summary() + "/name:" + this.name + "/title:" + this.title + "/nid:" + this.id.substr(0, 10) + "... ";
  }

  /**
   * assert the condition and present node's summary and message if false
   * @param {Tick} tick 
   * @param {Boolean} cond 
   * @param {string} message 
   */
  assert(tick, cond, message) {
    dblogger.assert(cond, this.summary(tick) + " " + message)
  }

  /**
    @typedef ContextManagerEntities
    @type {Object}
    @property {BaseNode} node - a node on which the ContextManager exists.
    @property {Tick} tick - the tick of the subtree on which the node exist
    **/

  /**
      * A number representing the status returned from the tick. 
      1: success
      2: failure 
      3: running 
      4: error 
     @typedef {number} TickStatus
    **/

  /**
   * Searches up to tree root and return the first contextManager entities found
   * @param {Tick} tick 
   * @return {ContextManagerEntities}
   */
  findContextManagerEntities(tick) {
    /* 
      // if there's a true ambiguity, it means that two fields exist with same name, that belongs to different contextual conversations.
      // for example, say we have an assistant with two convos - 'banking' and 'travel'. score selector node selects between the two.
      // then  banking assistant, with two convos - transfer money and on 'deposit check'.
      // the only place where there will be one context shared for both,  is at the top assitant score selector -
      //  meaning, at the context of banking. there, it shouldnt really matter what context the amount belongs to
  */
    var node = this;
    var newTick = new Tick();
    _.extend(newTick, _.clone(tick));
    while (node && !node.contextManager) {

      var parentEtts = node.parentEntities(newTick);
      node = parentEtts.node;
      newTick = parentEtts.tick;
    }

    return {
      node: node,
      tick: newTick
    };
  }


  /**
   * publish an event up the tree
   * TODO: fix
   * @private 
   */
  emit(tick, event, params) {
    let parentEtts = this.parentEntities(tick);
    let cont = true;
    while (parentEtts.node && cont) {
      cont = parentEtts.node.on(tick, event, params);
      parentEtts = this.parentEntities(tick);
    }
  }


  /**
   * default returns true
   * @private
   */
  on() {
    return true;
  }


  /**
   * upon tree creation, this method is called after the node has been connected to its parents or children 
   */
  postConnect() {

  }


  /**
   * returns an object that is a merge between all contexts up to the root
   * lower context members override the upper ones
   * @param {Tick} tick 
   */
  collectContextsUpToRoot(tick) {
    var contextManagerEtts = this.findContextManagerEntities(tick);
    var contextObj = {};
    while (contextManagerEtts.node) {
      var contextManager = contextManagerEtts.node.contextManager;
      var contextMem = contextManager.getContextMemory(contextManagerEtts.tick);
      contextObj = _.extend(contextMem, contextObj);
      contextManagerEtts = contextManager.findNextContextManagerEntities(contextManagerEtts.tick);
    }

    return contextObj;
  }
  /**
   * sets context data.
   * pass only tick to get all context mem
   * pass explicit null key to replace data all with value
   * @param {Tick} tick 
   * @param {string} [key = null]
   * @param {string} [value = null] if non-null, sets the value
   */
  context(tick, key = null, value = null) {

    var contextManagerEtts = this.findContextManagerEntities(tick);
    //dblogger.assert(contextManagerEtts.node, 'no contextManager entities');

    // global is the root context
    if (!contextManagerEtts.node) {
      return this.global.apply(this, arguments);
    }
    var contextManager = contextManagerEtts.node.contextManager;
    tick = contextManagerEtts.tick;
    var node = contextManagerEtts.node;

    if (arguments.length === 1) {
      var contextMemory = node.collectContextsUpToRoot(tick);
      // return meta - previous intwn
      contextMemory.intents = function () {
        return node.contextProperties();
      };
      return contextMemory;
    } else if (arguments.length === 2) {
      dblogger.assert(!_.isEmpty(key) && !_.isUndefined(key), 'context key must be non-empty');
      return contextManager.getContextField(tick, key);
    } else {
      if (this.category === b3.CONDITION) {
        dblogger.error("conditions are read-only. Shouldn't be used to set data " + tick.process.summary());
      }

      if (!utils.safeIsNaN(value)) {
        value = parseFloat(value);
      }
      contextManager.setContextField(tick, key, value);
    }
  }

  /**
   * set/get volatile memory property for a RUNNING instance of this node
   */
  setVolatile(tick, property, value) {
    this.setVolMem(tick, property, value);
  }
  getVolatile(tick, property) {
    return tick.process.get(property, tick.tree.id, this.id, true /*volatile*/ );
  }

  /**
   * 
   * @param {Tick} tick 
   * @param {?string} compositeFieldName, a field name composed of <memorytype>.<property> eg context.myname 
   * @param {?string} fieldValue 
   */
  alldata(tick, compositeFieldName = null, fieldValue = null) {
    if (arguments.length === 1) {
      return {
        global: this.global(tick) || {},
        context: this.context(tick) || {},
        message: this.message(tick) || {},
        volatile: tick.process.volatile() || {},
        local: this.local(tick) || {},
        fsm: tick.process.properties(), // back compatibility
        process: tick.process.properties()
      };
    }

    if (arguments.length > 3) {
      throw "incorrect number of arguments to alldata function " + tick.process.summary();
    }

    var dotAt = compositeFieldName.indexOf('.');
    if (dotAt < 0) {
      throw "fieldName should  start with fsm., message., global., context., volatile., or local.: " + tick.process.summary();
    } else {
      if (this.category === b3.CONDITION && arguments.length === 3) {
        dblogger.error("conditions are read-only. Shouldn't be used to set data " + tick.process.summary());
      }
      var fieldName = compositeFieldName.substr(dotAt + 1, compositeFieldName.length - dotAt);

      if (compositeFieldName.startsWith('context')) {
        if (arguments.length === 2) {
          return this.context(tick, fieldName);
        } else {
          return this.context(tick, fieldName, fieldValue);
        }

      } else if (compositeFieldName.startsWith('global')) {
        if (arguments.length === 2) {
          return this.global(tick, fieldName);
        } else {
          return this.global(tick, fieldName, fieldValue);
        }
      } else if (compositeFieldName.startsWith('local')) {
        if (arguments.length === 2) {
          return this.local(tick, fieldName);
        } else {
          return this.local(tick, fieldName, fieldValue);
        }
      } else if (compositeFieldName.startsWith('message')) {

        if (arguments.length === 2) {
          return this.message(tick, fieldName);
        } else {
          return this.message(tick, fieldName, fieldValue);
        }

      } else if (compositeFieldName.startsWith('volatile')) {

        if (arguments.length === 2) {

          return this.volatile(tick, fieldName);
        } else {
          return this.volatile(tick, fieldName, fieldValue);
        }
      } else if (compositeFieldName.startsWith('fsm') || compositeFieldName.startsWith('process')) {
        var props = tick.process.properties() || {};
        if (arguments.length === 2) {
          return props[fieldName];
        } else { // save
          props[fieldName] = fieldValue;
          tick.process.properties(props);
          return fieldValue;
        }

      } else {
        throw "compositeFieldName should  start with fsm., message., global., context., volatile., or local. " + tick.process.summary();
      }
    }
  }

  /**
   * convert dot notation into reference
   * https://stackoverflow.com/questions/6393943/convert-javascript-string-in-dot-notation-into-an-object-reference
   * @private
   */
  dotData(obj, is, value) {
    if (typeof is == 'string')
      return this.dotData(obj, is.split('.'), value);
    else if (is.length == 1 && arguments.length === 3)
      return obj[is[0]] = value;
    else if (is.length == 0)
      return obj;
    else
      return this.dotData(obj[is[0]], is.slice(1), value);
  }

  /**
   * get/set process data
   * @param {Tick} tick 
   * @param {string} [key = null]
   * @param {string} [value = null] if non-null, sets the value 
   */
  global(tick, key = null, value = null) {

    if (this.category === b3.CONDITION && arguments.length >= 3) {
      dblogger.error("conditions are read-only. Shouldn't be used to set data " + tick.process.summary());
    }
    var retVal;

    switch (arguments.length) {
      case 1:
        retVal = tick.process.data();
        break;
      case 2:
        retVal = tick.process.data(key);
        break;
      case 3:
        retVal = tick.process.data(key, value);
        break;

    }

    return retVal;

  }
  /**
   * set/get local node memory
   * @param {Tick} tick 
   * @param {string} [key=null] 
   * @param {(string|number)} [ value = null] if non-null, sets the value 
   */
  local(tick, key = null, value = null) {

    if (arguments.length <= 2) {
      return tick.process.get(key, tick.tree.id, this.id);
    } else {
      // convert to number if needed
      if (!utils.safeIsNaN(value)) {
        value = parseFloat(value);
      }
      return tick.process.set(key, value, tick.tree.id, this.id);
    }
  }
  /**
   * Volatile memory get/setter - memory will not persist beyond machine/running restart
   * @param {Tick} tick 
   * @param {string} key 
   * @param {(string|number|Object)} [value] 
   */
  volatile(tick, key, value = undefined) {
    if (arguments.length === 3) {
      // convert to number if needed
      if (!utils.safeIsNaN(value)) {
        value = parseFloat(value);
      }
      return tick.process.volatile(key, value);
    } else {
      return tick.process.volatile(key);
    }
  }

  /**
   * 
   * @param {Tick} tick
   * @returns {Target} tick target. its been unused at this time 
   */
  searchTarget(tick) {
    return tick.target;
  }

  /**
   * return the closest target object up the tree
   * @param {*} tick 
   */
  target(tick, command) {
    let cframesNode = this.findContextManagerEntities(tick).node;

    let cframes = cframesNode.contextManager.getContextFrames(tick);
    let target = cframes[cframes.length - 1] && cframes[cframes.length - 1].target;

    if (target && command === 'remove') {
      target.remove();
      cframesNode.contextManager.setContextFrames(tick, cframes);
    }
    return target;

  }

  /**
   * 
   * @param {Tick} tick 
   * @param {string} [property=null] 
   * @param {string} [value=null] if non-null, sets the value
   */
  message(tick, property = null, value = null) {

    let targetObj = tick.target.getLatest();
    let messageObj = targetObj && targetObj.messageObj;
    if (arguments.length === 3 && messageObj) {
      // convert to number if needed
      if (!utils.safeIsNaN(value)) {
        value = parseFloat(value);
      }
      try {
        eval("messageObj." + property + "= value");
      } catch (ex) {
        dblogger.error('error in message(' + property + "," + value + "):", ex);
        messageObj[property] = value;
      }
    } else if (arguments.length == 2) {
      return messageObj && messageObj[property];
    } else {
      return messageObj;
    }
  }


  /**
   * set volatile memory property for a RUNNING instance of THIS NODE
   * @param {Tick} tick 
   * @param {string} property 
   * @param {(string|number)} value 
   */
  set(tick, property, value) {
    this.setVolMem(tick, property, value)
  }

  /**
   * get volatile memory property for a RUNNING instance of THIS NODE
   * @param {Tick} tick 
   * @param {string} property 
   */
  get(tick, property) {
    return tick.process.get(property, tick.tree.id, this.id, true /*volatile*/ );
  }


  /**
   * We put values on volatileMemory so they dont get saved in the DB 
   * so they are reset if the server is down
   * @private
   */
  setVolMem(tick, key, val) {

    tick.process.set(key, val, tick.tree.id, this.id, true /*volatile*/ );
  }

  /**
   * return properties.view
   * @return {string}
   */
  view() {
    return this.properties && this.properties.view !== "" && this.properties.view;
  }

  /**
   * returns properties.payload or undefined if  empty
   * @return {?string} 
   */
  payload() {
    return this.properties &&
      !_.isEmpty(this.properties.payload) && this.properties.payload !== "{}" &&
      this.properties.payload !== "" && this.properties.payload;
  }

  /**
   * returns the properties.image or images  
   * @return {?string}
   */
  images() {
    var image = this.properties && (this.properties.image || this.properties.images || this.properties.imageHTML);
    return image !== "" && image;
  }

  /**
   * returns the memory field name for an array object that contains data for the images
   * @return {?Array}
   */
  imageDataArrayName() {
    return this.properties && this.properties.imageDataArrayName != "" && this.properties.imageDataArrayName;

  }

  /**
   * returns the text prompt for the message out. 
   * properties.fieldName if any,otherwise properties.prompt
   * @param {string} fieldName 
   */
  prompt(fieldName = undefined) {
    var prompt = this.properties &&
      ((this.properties[fieldName] !== "" && this.properties[fieldName]) || this.properties.prompt);

    if (prompt && Array.isArray(prompt) && !prompt.length) {
      prompt = false;
    }

    return prompt;
  }




  /**
   * executes fn until timeoutMs reached
   * @param {Function}  fn - function to execute  
   * @param {Array|Object} args - arguments array
   * @param {number} [timeoutMs=30000] - timeout interval
   */
  wait(fn, args, timeoutMs = 30000) {

    var thenCalled = false;
    var argsToFn = Array.isArray(args) ? args : [args];
    return new Promise((resolve, reject) => {
      fn.apply(this, argsToFn).then(() => {
        clearTimeout(toInterval); // no need to wait for timeout any longer
        resolve();
      }).catch((err) => {
        dblogger.error(err.message, ' error on ', fn.name, this.name);
        reject(err);
        clearTimeout(toInterval); // no need to wait for timeout any longer
      });

      var toInterval;

      toInterval = timeoutMs > 0 && setTimeout(() => {
        if (!thenCalled) {
          dblogger.error('timeout when waiting for ', fn.name, this.name)
          reject('timeout')
        }
      }, timeoutMs);
    });

  }

  /**
   * output the message base on process data
   *
   * @param {Tick} tick 
   * @param {string} [fieldName] - use when building the prompt
   */
  outputMessage(tick, fieldName) {

    return new Promise((resolve, reject) => {

      // call async
      messageBuilder.build(tick, fieldName, this).then((result) => {

        // now lets send it out
        chatManager.sendMessage(result, tick.tree, tick.process, this).then((msg) => {
          dblogger.log('chatManager.sendMessage sendMessage done');
          // when we send messages out, we reset the incoming message queue
          // otherwise new questions will be answered immediately and skipped
          if (!tick.process.properties().queueIncomingMessages) {
            dblogger.warn("losing " + tick.target.getTargets().length + " messages:", tick.target.getTargets());
            tick.target.removeTargets();
          }
          resolve();

        }).catch((err) => {
          dblogger.error('error in outputMessage ' + this.summary(tick), err);

          reject(err);
        });
      }).catch((err) => {
        dblogger.error('error in outputMessage', err);
        reject(err);
      });
    });


  }
  /**
   * send a message method.
   *
   * output a message asynchrously
   * @param {Tick} tick 
   * @param {string} [fieldName] - to use when building a message. ,instead of prompt
   * @return {TickStatus} A state constant.
   **/
  tickMessage(tick, fieldName) {

    if (!this.waitCode(tick)) {
      this.waitCode(tick, b3.RUNNING());
      this.wait(this.outputMessage, [tick, fieldName], -1).then(() => {
        this.waitCode(tick, b3.SUCCESS());
        //  save on next tick, so (1) we wont get stuck on running (2) we get all composites to reflect right child indexes 
        setTimeout(() => {
          tick.process.save();
        }, 0);


      }).catch(() => {
        tick.resetAll();
        this.waitCode(tick, b3.ERROR());
        // always save now, so we wont get stuck on running
        tick.process.save();

      });
    }


    return this.waitCode(tick);

  }

  /**
   * true if this node timeouted
   * @param {*} tick 
   * @return {boolean} 
   *   */
  isNodeTimeout(tick) {
    var openTime = tick.process.get('openTime', tick.tree.id, this.id);
    var runningForMs = Date.now() - openTime;
    var runningTimeout = this.properties.runningTimeoutSec || tick.process.properties().runningTimeoutSec || config.runningTimeoutSec || _RUNNING_TIMEOUT_SEC;
    return runningForMs > (runningTimeout * 1000);
  }

  /**
   * true if this is a leaf which timeouts (and we are not sitting on a breakpoint)
   * @param {Tick} tick 
   * @return {boolean}
   */
  isLeafTimeout(tick) {
    if (this.isLeaf()) {
      return this.isNodeTimeout(tick);
    }
    return false;

  }

  /**
   * default timeout handling
   */
  handleTimeout(tick) {
    let status = b3.RUNNING();
    if (this.isLeafTimeout(tick)) {
      let numberOfRetries = this.incrementRetries(tick);

      this.log(tick, 'timeout - retry number ' + numberOfRetries);

      if (numberOfRetries < this.properties.maxRetriesNumber) {
        status = b3.FAILURE();
      } else {
        status = b3.ERROR();
        this.error(tick, 'Max timeout retries number reached');
      }

      this._close(tick, status);
    }

    return status;
  }

  /**
   * find the direct context of this node and clear it
   * @param {Tick} tick 
   */
  clearContext(tick) {
    var contextManagerEtts = this.findContextManagerEntities(tick);
    var contextManager = contextManagerEtts.node && contextManagerEtts.node.contextManager;
    contextManager.clearContext(contextManagerEtts.tick);
  }

  /**
   * find the current context and close its children
   * @param {*} tick 
   */
  closeAllContexts(tick) {
    var contextManagerEtts = this.findContextManagerEntities(tick);
    dblogger.assert(contextManagerEtts.node, "no current context");
    // for (let child of contextManagerEtts.node.contextChildren()) {
    //   child._close(tick);
    // }

    contextManagerEtts.node._close(contextManagerEtts.tick);
  }

  /**
   * clear all the sibling contexts of this node 
   * @param {Tick} tick 
   * @param {boolean} leaveCurrent
   */
  clearAllContexts(tick, leaveCurrent) {
    var contextManagerEtts = this.findContextManagerEntities(tick);
    var contextManager = contextManagerEtts.node && contextManagerEtts.node.contextManager;
    contextManager.clearAllContexts(contextManagerEtts.tick, leaveCurrent);
  }

  /**
   * open only if node is not opened
   * @param {Tick} tick 
   */
  safeOpen(tick) {
    if (!tick.process.get('isOpen', tick.tree.id, this.id)) {
      this._open(tick);
    }
  }

  /**
   * remove target from context and tick
   * @param {Tick} tick 
   */
  removeTargets(tick) {
    // remove last targets
    this.target(tick, "remove");
    tick.target.remove();
    tick.target.getUnused().shift();
    //TODO: REMOVE FROM UNMAPPED?
  }



  /**
   * This is the main method to propagate the tick signal to this node. This 
   * method calls all callbacks: `enter`, `open`, `tick`, `close`, and 
   * `exit`. It only opens a node if it is not already open. In the same 
   * way, this method only close a node if the node  returned a status 
   * different of `b3.RUNNING()`.
   *
   * @private _execute
   * @param {Tick} tick A tick instance.
   * @return {TickStatus} The tick state.
   * @protected
   **/
  _execute(tick) {
    try {

      /* ENTER */
      this._enter(tick);

      /* OPEN */
      this.safeOpen(tick);

      /* TICK */
      var status = this._tick(tick);

      /* CLOSE */
      if (status !== b3.RUNNING()) {
        this._close(tick, status);
      } else {
        status = this.handleTimeout(tick);
      }

      /* EXIT */
      this._exit(tick);
    } catch (err) {
      dblogger.error('Error in node' + this.name + '/' + this.id + ':' + err.message, err.stack);
      status = b3.ERROR();
      tick.resetAll();
    }

    return status;
  }

  /**
   * create a new tick object that is relevant to the tree ABOVE this node
   * @param {Tick} tick 
   */
  createParentTick(tick) {
    var newTick = new Tick();
    _.extend(newTick, tick);
    newTick.tree = this.parentTree;

    return newTick;
  }

  isRoot() {
    return this.parentId === null;
  }

  /**
   * return entities representing the parent;
   * @param {Tick} tick 
   * @return ContextManagerEntities
   */
  parentEntities(tick) {
    var parentnode = tick.tree.nodes[this.parentId];
    if (!parentnode && tick.tree.isSubtree) {

      tick = this.createParentTick(tick);
      parentnode = tick.tree.nodes[this.parentId];
    }
    return {
      tick: tick,
      node: parentnode
    };
  }

  /**
   * find the last ticked leaf which decendent of this node
   * @param {Tick} tick 
   * @param {BaseNode} node
   * @return {ContextManagerEntities} 
   */
  findCurrentWaitNode(tick, node) {
    /** @type {Composite} */
    let node2 = node;
    if (!node || node.category === b3.ACTION || node.category === b3.CONDITION ||
      (node.category === b3.COMPOSITE && node2.currentChildIndex(tick) < 0)) { // the last could happen on AskAndMap/PrioritySelector when no child has been selected. this means, that it is effectively a leaf 
      return {
        node: node,
        tick: tick
      };
    }

    if (node.category === b3.TREENODE) {
      /** @type {TreeNode} */
      let node1;
      node1 = node;
      var newTick = node1.createChildTick(tick);
      return this.findCurrentWaitNode(newTick, node1.child.root);
    }
    if (node.category === b3.COMPOSITE) {

      // get current running child
      var child = node2.currentChildIndex(tick);
      // if no child
      if (_.isUndefined(child) || child === null) {
        // then it means that we are stuck here - this would be AskAndMap
        dblogger.assert(node2.name === 'AskAndMap', 'no child on a composite (which is NOT AskAndMap): ' + node2.summary(tick));
        return {
          node: node2,
          tick: tick
        };
      }
      return this.findCurrentWaitNode(tick, node.children[child]);
    }
    if (node.category === b3.DECORATOR || node.category === b3.MLMODEL) {
      return this.findCurrentWaitNode(tick, node.child);
    }

  }

  /**
   * Wrapper for enter method.
   *
   * @private _enter
   * @param {Tick} tick A tick instance.
   * @protected
   **/
  _enter(tick) {
    tick._enterNode(this);

    // set process current leaf


    return this.enter(tick);
  }

  /**
   * Wrapper for open method.
   *
   * @private _open
   * @param {Tick} tick A tick instance.
   * @protected
   **/
  _open(tick) {
    //tick._openNode(this);

    var isOpen = tick.process.get('isOpen', tick.tree.id, this.id);
    if (!isOpen) {
      tick.process.set('openTime', Date.now(), tick.tree.id, this.id);
      tick.process.set('isOpen', true, tick.tree.id, this.id);
    }


    // reset timeout retries 
    this.resetTimeoutRetries(tick);

    this.open(tick);
  }

  /**
   * 
   * @param {*} tick 
   */
  resetTimeoutRetries(tick) {
    this.local(tick, 'retriesCounter', 0);
  }
  /**
   * node is a leaf?
   */
  isLeaf() {
    return !(this.children || this.child)
  }

  isQuestion() {
    return false;
  }

  /**
   * logger function to run if debug-log is truthy
   * @param {Tick} tick 
   * @param {TickStatus} status 
   */
  debugLog(tick, status) {

    var debugLog = this.properties['debug-log'] || tick.process.properties()["debug-log"];
    if (debugLog) {
      // if ((!!debugLog) === true && debugLog) {
      //     debugLog = "'global log'";
      // }
      var data = this.alldata(tick);
      try {
        debugLog = typeof debugLog === "string" ? debugLog : "";
        var message = _.template(debugLog)(data);
      } catch (ex) {
        message = "exception, check template syntax";
      }
      dblogger.log("( ͡° ͜ʖ ͡°) debug-log for node " +
        this.id.substr(0, 12) + "/" + this.name + "/" + this.title + "/pid:" + tick.process.id +
        " - status=" + status + ". message: " + message);
    }

  }

  /**
   * Wrapper for tick method.
   *
   * @private _tick
   * @param {Tick} tick A tick instance.
   * @return {TickStatus} A state constant.
   * @protected
   **/
  _tick(tick) {
    tick._tickNode(this);

    // handle pre breakpoint (currently disabled)
    // var status = this.handleBreakpoint(tick, undefined, 'pre');
    // if (status) {
    //     return status;
    // }
    tick.incrementDepth();

    var status = this.tick(tick);

    tick.decrementDepth();
    // save last status
    //this.local(tick, 'lastStatus', status);
    this.debugLog(tick, status);

    // handle post breakpoint 
    status = this.handleBreakpoint(tick, status, 'post');

    return status;

  }

  /**
   * structured error report
   * @param {Tick} tick 
   * @param {*} message 
   * @param {*} ex 
   */
  error(tick, message, ex = {}) {
    dblogger.error("ERROR IN:" + this.summary(tick) + ":\r\n " + message + ":" + ex.message + " at \r\n" + ex.stack);
  }

  /**
   * 
   * @param {Tick} tick 
   * @param {TickStatus} status 
   * @param {string} type 
   */
  handleBreakpoint(tick, status, type) {
    let breakpoint = tick.process.breakpoint(this.id);
    let atABreakpoint = this.volatile(tick, 'atABreakpoint');
    let postTick = type === 'post';
    let lastBrokeAt = this.volatile(tick, 'lastBrokeAt');
    let stepStop = postTick && this.volatile(tick, 'stepping') && this.isLeaf() && lastBrokeAt !== this.id;
    // this is a flag meaning that we need to exit this breakpoint. step & run are setting it to true
    let exitBreakpoint = this.volatile(tick, 'exitBreakpoint');


    if (!atABreakpoint && (breakpoint || stepStop) && !exitBreakpoint) {

      breakpoint = breakpoint || {
        nodeId: this.id
      };
      dblogger.flow('breakpoint reached:' + this.summary(tick));
      debugFSM.breakpointReached({
        breakpoint: breakpoint,
        treeId: tick.tree.fsmOrigId,
        alldata: _.extend(this.alldata(tick), {
          status: status
        }),
        processId: tick.process.id,
        postTick: type === 'post'
      });
      atABreakpoint = true;
      this.volatile(tick, 'atABreakpoint', atABreakpoint);
      this.volatile(tick, 'lastBrokeAt', this.id);
    }

    if (atABreakpoint) {
      tick.process.set('openTime', Date.now(), tick.tree.id, this.id); // make sure we dont timeout
      return b3.RUNNING();
    }

    return status;
  }


  /**
   * getter
   * @param {Tick} tick 
   * @param {TickStatus} [retcode=undefined] 
   */
  waitCode(tick, retcode = undefined) {

    if (retcode === undefined) {
      return this.get(tick, 'waitRetCode');
    } else {
      if (typeof retcode !== "number")
        throw 'wrong input to waitRetCode'
      this.set(tick, 'waitRetCode', retcode);
    }
  }

  /****************************************
   *      Life cycle overrideables
   ****************************************/

  /**
   * Wrapper for close method.
   *
   * @param {Tick} tick A tick instance.
   * @param {TickStatus} [status] 
   *  @protected
   **/
  _close(tick, status) {
    this._closeMe(tick, status);
  }

  /**
   * closes the node 
   * @param {Tick} tick 
   * @param {TickStatus} [status] 
   */
  _closeMe(tick, status) {
    //console.log('closeMe:' + this.summary(tick))
    tick.process.set('isOpen', false, tick.tree.id, this.id);
    // for next async calls
    this.set(tick, 'waitRetCode', undefined);

    this.close(tick, status);

    // since we might close after a context switch (w/out proper closing), we must close explicitly the children
    _.each(this.children, (child) => {
      if (child.local(tick, 'isOpen')) {
        child._close(tick);
      }
    });
    if (this.child) {
      if (this.child.local) {
        if (this.child.local(tick, 'isOpen')) {
          this.child._close(tick)
        }
      } else {
        dblogger.assert(this.child.root, 'strange, no child, and no root')
        if (this.child.root.local(tick, 'isOpen')) {
          this.child.root._close(tick)
        }
      }
    }
  }

  /**
   * increment number Retries 
   * @param {Tick} tick 
   * @return {number} retries couont
   */
  incrementRetries(tick) {
    var numberOfRetries = this.local(tick, 'retriesCounter');
    this.local(tick, 'retriesCounter', ++numberOfRetries);
    return numberOfRetries;
  }


  /**
   * Wrapper for exit method.
   * @param {Tick} tick A tick instance.
   * @protected
   **/
  _exit(tick) {
    // if we were in the process of exiting a bp, reset it, so the breakpoint could be re-entered
    this.volatile(tick, 'exitBreakpoint', 0);
    tick._exitNode(this);
    this.exit(tick);
  }

  /**
   * Enter method, override this to use. It is called every time a node is 
   * asked to execute, before the tick itself.
   * if return undefined, will now enter into tick - disregarding the node
   * @param {Tick} tick A tick instance.
   * @return {void}
   **/
  enter(tick) {
    // always allow entry as default 
    return;
  }

  /**
   * Open method, override this to use. It is called only before the tick 
   * callback and only if the not isn't closed.
   *
   * Note: a node will be closed if it returned `b3.RUNNING()` in the tick.

   * @param {Tick} tick A tick instance.
   **/
  open(tick) {}

  /**
   * Tick method, override this to use. This method must contain the real 
   * execution of node (perform a task, call children, etc.). It is called
   * every time a node is asked to execute.
   *
   * @private
   * @param {Tick} tick A tick instance.
   * @param {Target} target A target instace
   * @return {TickStatus}
   **/
  tick(tick, target) {}

  /**
   * Close method, override this to use. This method is called after the tick
   * callback, and only if the tick return a state different from 
   * `b3.RUNNING()`.
   *
   * @private close
   * @param {Tick} tick A tick instance.
   * @param {TickStatus} [status] 
   **/
  close(tick, status) {}

  /**
   * Exit method, override this to use. Called every time in the end of the 
   * execution.
   *
   * @private exit
   * @param {Tick} tick A tick instance.
   **/
  exit(tick) {}



  /**
   * create a validator string so we can easily pass it to the angular client editor
   * @private
   * @return {string}
   */
  validatorsString() {
    var validators = JSON.stringify(this.validators());
    return validators;
  }

  /**
      @typedef Validator
      @type {Object}
      @property {boolean} condition - a condition to test
      @property {string} text - text to show the condition is not met
  **/
  /**
   * a base node should have a title
   * defines validation methods to execute at the editor; if one of them fails, a dashed red border is displayed for the node
   * @return {Array<Validator>}
   */
  validators(node) {
    return [{
      condition: node.title,
      text: "should have a title"
    }];
  }

  /**
   * @return {Array}
   */
  contextProperties() {
    dblogger.error("no contextProperties for this node:" + this.title + "/" + this.id);
    return [];
  }



  /**
   * if already haas a context selected, give search the **curent** context  by the entities
   * override if the search needs to be different
   * @param {Tick} tick 
   * @param {MessageModel} msgObj 
   * @param {Object} curCtxParam
   * @return {number} - match counter
   */
  countMatchingEntities(tick, msgObj, curCtxParam) {
    let entityMatchCount = 0;
    _.each(msgObj.entities, (val, key) => {
      _.each(curCtxParam && curCtxParam.entities, (ett) => {
        if (ett.entityName === key) {
          entityMatchCount++;
        }
      });
    });

    return entityMatchCount;
  }
}


module.exports = BaseNode;