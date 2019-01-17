/**
 * Target - a queue of targets 
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
var deepClone = require('clone-deep');
/**
 * a target class maintaining a queue of outputs from NLU classifier layers 
 *
 *@memberof module:Core
 **/
class Target {

  /**
   * constructor
   */
  constructor() {
    /** @member {number} lastTargetId - running index of the target id*/
    this.lastTargetId = 0;
    /** @member {Array<TargetObject>} targetObjs - target queue*/
    this.targetObjs = [];
    /** @member {Array<TargetObject>} unusedTargetObjs - backup target queue. targets in the queue remain intact until the whole tree return success or failure*/
    this.unusedTargetObjs = [];
    /** @member {boolean} passedThruPipe - true if passed already through fsm incoming pipe */
    this.passedThruPipe = false;
  }

  /***
   * @typedef {TargetObject}
   * @property {MessageModel} messageObj - an object with the message details from NLU
   * @property {Any}
   */
  /**
   * add a target object to the queue
   * @param {TargetObject} targetObj 
   */
  add(targetObj) {
    var dblogger = require('utils/dblogger');
    dblogger.flow('Add target. targets:' + (this.targetObjs.length + 1) + " intent:" + (targetObj.messageObj && targetObj.messageObj.intentId) + ". entities:", targetObj.messageObj && targetObj.messageObj.entities);
    this.passedThruPipe = false;
    // start searching from the top 
    targetObj.searchContextDownwards = true;

    targetObj.usage = targetObj.usage || {};

    var id = this.lastTargetId + 1;
    if (this.lastTargetId === 9007199254740992) { // maxint: https://stackoverflow.com/questions/21350175/max-integer-value-in-javascript
      this.lastTargetId = 0;
    }
    this.lastTargetId = id;
    targetObj.id = id;

    this.targetObjs.unshift(targetObj);
    this.unusedTargetObjs.unshift(deepClone(targetObj));
    var utils = require('utils/utils');
    if (this.unusedTargetObjs.length > utils.longTermMemoryLength()) {
      this.unusedTargetObjs.pop();
    }


  }

  /**
   * remove target from the queue and return it
   */
  remove() {

    var dblogger = require('utils/dblogger');
    dblogger.flow('remove target ' + this.summary());
    return this.targetObjs.pop();
  }

  /**
   * remove all targets from the queue
   */
  removeAll() {
    this.unusedTargetObjs = [];
    this.targetObjs = [];
  }


  /**
   * get last target object 
   * @return [TargetObject] - current target object in queue
   */
  get() {
    return this.targetObjs[this.targetObjs.length - 1];
  }

  /**
   * get last target object 
   * @return [TargetObject] - current target object in queue
   */
  getLatest() {
    return this.targetObjs[this.targetObjs.length - 1] || this.unusedTargetObjs[0];
  }

  getUnused() {
    return this.unusedTargetObjs;
  }
  /**
   * @return {string} last id 
   */
  id() {
    return this.get().id;
  }

  /**
   * a wakeup message is relevant to non-push clients like Alexa
   * @return {boolean} true if the current message received is a wakeup event
   * 
   */
  isWakeUp() {
    return this.getMessageObj() && this.getMessageObj().wakeUp;
  }

  /**
   * get intent id of last targetObj
   */
  getIntent() {
    return this.getMessageObj() && this.getMessageObj().intentId;
  }

  /**
   * text summary of this
   */
  summary() {
    return this.getMessageObj() ? "messageObj.intentId:" + this.getIntent() + " entities:" +
      JSON.stringify(this.getMessageObj().entities) : "no messageObj";
  }

  /**
   * @return 
   */
  getMessageObj() {
    return this.get() && this.get().messageObj;
  }

  /**
   * @return {boolean} true if a target exist
   */
  exists() {
    return !!this.getMessageObj();
  }


  /**
   * get entity by name. if an array of entities with same name, get then entity by index 
   * @param {string} entityName 
   * @param {number} [index=0] 
   */
  getEntity(entityName, index = 0) {
    var entity = this.getMessageObj() &&
      this.getMessageObj().entities &&
      this.getMessageObj().entities[entityName];
    return (Array.isArray(entity) ? entity[index] : entity);
  }

  /**
   * use ettName, remove targetObj when all is used
   * @param {string} ettName 
   * @param {number} ettIndex 
   */
  useAndRemove(ettName, ettIndex = 0) {
    let msgObj = this.getMessageObj();
    let ContextManager = require('FSM/contextManager');
    // if intentId is an array, remove the index
    if (ettName === ContextManager.contextManagerKeys().INTENTID) {
      msgObj.intentId = null;
    }
    if (msgObj.entities[ettName][ettIndex]) {
      delete msgObj.entities[ettName][ettIndex];
      msgObj.entities[ettName] = msgObj.entities[ettName].filter((ett) => {
        return ett !== undefined;
      });
      // delete the array
      if (!msgObj.entities[ettName].length) {
        delete msgObj.entities[ettName];
      }
    }


    // if no more, remove target
    if (Object.keys(msgObj.entities).length === 0 && (!msgObj.intentId || msgObj.intentId === ContextManager.contextManagerKeys().NONE)) {
      this.remove();
    }
  }

  /***
   * @return Map<KeyValuePairArray> - entities objects
   */
  getUnusedEntities() {
    let msgObj = this.getMessageObj();
    return msgObj ? msgObj.entities : {};
  }

  /**
   * set a flag for using this entity for context mapping
   * @param {string} ettName 
   * @param {number} ettIndex - the index of this entity in the message from NLU (in case there were several entities or a composite entity)
   * @param {number} depth - the depth at which it was used for mapping
   * @return {number} 
   */
  useEntity(ettName, ettIndex = 0) {
    if (this.passedThruPipe) {
      this.useAndRemove(ettName, ettIndex);
    }

  }

  /**
   * get targetObjs
   */
  getTargets() {
    return this.targetObjs;
  }

  /**
   * return a deep clone of this 
   */
  clone() {
    let trg = deepClone(this);
    return trg;
  }


}

module.exports = Target;
