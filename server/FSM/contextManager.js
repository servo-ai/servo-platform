/**
 * ContextManager
 *
 * Copyright (c) 2017-2019 Servo Labs Inc.
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
var statsManager = require('FSM/statsManager');
var _ = require('underscore');

var dblogger = require('utils/dblogger');
var b3 = require('FSM/core/b3');
var Tick = require('FSM/core/tick');
var utils = require('utils/utils');

/**
 * @typedef {Object} EntitiesToContextMapItem
 * @property {string} [contextFieldName] - field name on the context. defaults to entityName
 * @property {string}  entityName - entity name on the message
 * @property {string} [intentId]
 * @property {string|Array} [expectedValue] - expected values for this entityName
 * @property {number}   entityIndex - for composite entities; should default to 0
 */

/**
 * reserved key names
 * @private
 */
const ContextManagerKeys = Object.freeze({
  CONTEXTMEM: "contextMem",
  // SHORTTERMMEMORYDISTANCE: 2,
  INTENTID: "intentId",
  LIFECYCLESTATE: "life-cycle-state",
  LASTCONTEXT: 'lastContext',
  CONTEXTFRAMES: 'contextFrames',
  DOWNWARDS: 'downwards',
  UPWARDS: 'upwards',
  HELPER: 'helper',
  UNMAPPEDENTITIES: 'unmappedEntities',
  NONE: "None",
  EXPIREMINUTES: 600
});
/**
 * Manages a node with child contexts. 
 * 
 * @memberof module:Core
 * @private
 */
class ContextManager {

  static contextManagerKeys() {
    return ContextManagerKeys;
  }
  static EXPIREMINUTES() {
    return 600;
  }

  /**
   * 
   * @param {Tick} tick 
   * @returns {FoundContext} 
   */
  noContext(tick) {
    return {
      index: -1,
      prevIndex: -1,
      score: -1,
      helper: false,
      tick: tick,
      contextManager: this,
      isRootContext: this.node.isRoot(),
      target: null
    };
  }

  /**
   * ContextManager initializer
   * @param {BaseNode} node 
   */
  constructor(node) {
    this.node = node;
  }

  /**
   * find my ContextManager's parent's ContextManager
   * @param {Tick} tick
   */
  findNextContextManagerEntities(tick) {
    var myContextManager = this.node.findContextManagerEntities(tick);

    var parentEtts = myContextManager.node.parentEntities(tick);

    if (!parentEtts.node) {
      return {
        node: undefined,
        tick: undefined
      };
    } else return parentEtts.node.findContextManagerEntities(parentEtts.tick);
  }

  /**
   * 
   * @param {Tick} tick 
   * @param {FoundContext} newContext 
   * @return {boolean} is it a valid backtrack
   */
  isBacktrack(tick, newContext) {
    let isBack = newContext.index === newContext.prevIndex && newContext.index >= 0 && newContext.prevIndex >= 0
    /*&& // this.node.isQuestion() &&
         1 <= contextDistance && contextDistance <= (tick.process.properties().maxBacktrackDistance || ContextManagerKeys.SHORTTERMMEMORYDISTANCE)*/
    ;
    let currentChildIndex = this.node.currentChildIndex(tick);
    // no backtrack from backtrack
    let backTrackAllowed = !this.node.contextProperties()[currentChildIndex] || !this.node.contextProperties()[currentChildIndex].backtrack;

    return backTrackAllowed && isBack;
  }
  /**
   * @typedef FoundContext
   * @property {Tick} tick
   * @property {boolean}[isRootContext]
   * @property {number} index - an index of new context child of this.node.
   * @property {number} prevIndex - previous index of new context child of this.node.
   * @property {boolean} [helper] true if this is a helper context 
   * @property {boolean} [backtrack] true if this is a backtrack context
   * @property {boolean} [passThru] true if two consequitive AskAndMaps - do not use intent
   * @property {number} [score]
   * @property {Object} [contextManager]
   * @property {boolean} [autoBacktrack] true if this context selected and its a backtracking, but no backtrack context is available (children will close and re-open)
   * @property {Target} [target] the target, according to which the context was found
   */

  /**
   * @typedef {Object} KeyValueArrayPair
   * @property {string} key
   * @property {string|Array} value - an array of values for each key
   */
  /**
   * @typedef {Object} MessageObject
   * @property {string} intentId
   * @property {Map<KeyValueArrayPair>} entities
   * @property {number} score
   * 
   */
  /****
   *
   * "search": search up to find the right context in the right level to switch to
   * "map": map the message entities to the expected entities 
   * "switch": when u have a prev context, switch to a new one
   * "select": no context selected yet, need to select
   * Search & mapping up
   * 
   *  for context switch & select:
   * 1. search by intent. if found
   *  a. switch
   *  b. map entities
   * 
   * 2. for context select, otherwise search by entities. if found(meaning, we have a number >= 1 of entities match)
   *   a. map the entities iteratively by going up from the level we found
   * 
   * 3. if its a trace back, and there's a backtrack child, switch to it, and then to the selected context
   * 
   * 4. if there's pre-context child, and there's a selection . switch to it, and then to the selected context
   * 
   * 5. a backtrack or pre-context are called intermediary contexts. 
   *  
   */


  /**
   * for this manager, find the right contexts
   * try first by intents, otherwise try entities, otherwise helper
   * @param {Tick} tick
   * @param {string} intentDirection - search direction for intents: "downwards" or "upwards", or both when undefined 
   * @param {boolean} backtrackLimitPassed memory distance (for backtrack)
   * @return {Array<FoundContext>}
   */
  selectContexts(tick, intentDirection, backtrackLimitPassed /* contextDistance = ContextManagerKeys.SHORTTERMMEMORYDISTANCE*/ ) {
    let noContext = this.noContext(tick);
    let newContext = _.clone(noContext);
    let intermediateContext = _.clone(noContext);
    let contextsParams = this.node.contextProperties();
    // for back compatibility, convert intent ids to entities
    this.convertIntents(contextsParams);

    /**try to find a context using the entities:  no intent,or couldnt find a context for the intent.
     *  see if there is a **current** context, see if it has such entity 
     * otherwise, check sibling contexts*/
    let ettMatchObj = this.selectContextWithMaxEntities(tick, intentDirection);
    dblogger.flow('ettMatchObj:' + JSON.stringify(ettMatchObj));
    if (ettMatchObj.index > -1 && ettMatchObj.count > 0) {
      newContext = _.extend(newContext, {
        index: ettMatchObj.index,
        prevIndex: this.node.currentChildIndex(tick),
        score: ettMatchObj.count * this.node.entityWeight,
        helper: false,
        tick: tick
      });
    }
    let retContextArray = [newContext];
    // find default if no previous 
    var defaultContextIndex = -1,
      defaultContext;
    if (tick.target.exists() && newContext.score < 0 &&
      !(this.node.currentChildIndex(tick) >= 0)) {
      defaultContext = contextsParams.find((ctxParam, index) => {
        if (ctxParam.default) {
          defaultContextIndex = index;
          return true;
        }
      });
      // if a default context exists here - continue use for default
      if (defaultContext) {
        newContext = _.extend(newContext, {
          index: defaultContextIndex,
          prevIndex: this.node.currentChildIndex(tick),
          default: true,
          score: 0.01,
          tick: tick
        });
      }
    }

    // find helper context if no default 
    var helperContextIndex, helperContext;

    // if nothign was found and we search upwards, find helper context as default 
    if (tick.target.exists() && !(newContext.index >= 0) &&
      defaultContextIndex < 0) {
      helperContext = contextsParams.find((ctxParam, index) => {
        if (ctxParam.helper) {
          helperContextIndex = index;
          return true;
        }
      });
      // if a helper context exists here - continue use for helper
      if (helperContext) {
        newContext = _.extend(newContext, {
          index: helperContextIndex,
          prevIndex: this.node.currentChildIndex(tick),
          helper: true,
          score: -1,
          tick: tick
        });
      }
    }

    retContextArray = [newContext];
    // its a backtrack if the context is the same context as was already selected before and not too long ago
    // dblogger.flow('contextDistance:' + contextDistance);
    if (!backtrackLimitPassed && this.isBacktrack(tick, newContext)) {
      // see if we have a backtrack member
      var backtrackIndex = contextsParams.findIndex((ctxParam) => {
        return ctxParam.backtrack;
      });
      dblogger.flow("backtrack detected. index:" + newContext.index + " prev:" + newContext.prevIndex + " at " + this.node.summary(tick));
      // allow only after passing in backcktrack detected:" track
      if (backtrackIndex >= 0) {
        dblogger.flow("backtrack index found:" + backtrackIndex);
        intermediateContext = _.clone(newContext);
        // set a chain of contexts to go thru. so the newContext.prev is going to be this backtrack index
        retContextArray[0].prevIndex = intermediateContext.index = backtrackIndex;
        dblogger.assert(intermediateContext.prevIndex == this.node.currentChildIndex(tick), "must have prev index set");
        intermediateContext.backtrack = true;
        intermediateContext.score = -1;
        retContextArray.push(intermediateContext);
      } else {
        // no backtrack child, so make this a backtrack
        newContext.autoBacktrack = true;
      }

    }
    // log the list
    intentDirection == ContextManagerKeys.UPWARDS && this.debugLogContextsFound(retContextArray, tick);

    return retContextArray;
  }

  /**
   * get the index of the helper context from here 
   * @param {Array<FoundContext>} foundContexts 
   */
  helperContextIndex(foundContexts) {
    return foundContexts.findIndex((ctx) => {
      return ctx.helper;
    }) >= 0;
  }

  /**
   * print debug log
   * @param {Array<FoundContext>}  foundContexts 
   */
  debugLogContextsFound(foundContexts, tick) {

    // dont debug for root
    if (this.node.parentId === null) {
      return;
    }
    if (foundContexts.length > 0) {
      dblogger.flow("found " + foundContexts.length + " contexts at " + this.node.id, tick && tick.target.summary());
      // console.trace();
    }
    _.each(foundContexts, (ctx) => {

      dblogger.flow('search context... found index:' + ctx.index + ' at ' + this.node.id);
    });

  }

  /**
   * return true if there's a real context on the list
   * @param {Array<FoundContext>} foundContexts 
   */
  contextFound(foundContexts) {
    var mostSignificantContext = foundContexts[0];
    return mostSignificantContext && mostSignificantContext.index >= 0 && mostSignificantContext.score > 0 /*no helper*/ ;
  }
  /**
   * the current context of the process is on here 
   * @param {Tick} tick 
   */
  isOnCurrentContext(tick) {
    let crtx = tick.process.currentContextEntities();
    return crtx && crtx.contextManager === this;
  }

  getContextsFoundScore(foundContexts) {
    return foundContexts[0].score;
  }

  isIntermediary(elem) {
    return elem.backtrack || elem.preContextSwitch;
  }

  /**
   * return true if the entityValue is found in ettExpectedValues
   * @param {Array<any>} ettExpectedValues 
   * @param {any} entityValue 
   */
  compareExpectedValues(ettExpectedValues, entityValue) {

    // if an expected value exists, compare angainst is
    let entityStringValue = utils.safeIsNaN(entityValue) ? entityValue : entityValue.toString();

    let found = ettExpectedValues.find((elem) => {
      elem = '^' + elem + '$'; // if its a number, make sure 1223 !== 122
      let expectedValueRegex = new RegExp(elem.toLowerCase(), 'i');
      return expectedValueRegex.test(entityStringValue);
    });
    return found;
  }

  /**
   * 
   * @param {Tick} tick 
   * @param {ContextItem} contextDetails 
   * @param {Target} target 
   * @param {boolean} countOnly true if not using the entities
   * @return {number} count of mappings that happened (if !countOnly) or due to happen
   */
  mapTargetEntitiesToContext(tick, contextDetails, target, countOnly) {
    let numberOfMaps = 0;
    if (!target) {
      dblogger.error('no target on mapTargetEntitiesToContext');
      return numberOfMaps;
    }
    _.each(contextDetails.entities, (ett) => {
      let ettCount = 0;
      var entityValue = target.getEntity(ett.entityName, ett.entityIndex);
      dblogger.flow('compare entity ' + ett.entityName + ', value ' + entityValue);

      // if found this (expected) entity on the target
      if (!_.isUndefined(entityValue)) {

        // if expected value exists, map only if the names matches
        let ettExpectedValues = ett.expectedValue && (Array.isArray(ett.expectedValue) ? ett.expectedValue : [ett.expectedValue]);
        var found = true;
        let expectedValueFound = false;
        if (ettExpectedValues) {
          found = this.compareExpectedValues(ettExpectedValues, entityValue);
          expectedValueFound = true;
        }
        // if the value equals the expected value, or the expected value doesnt matter
        if (found) {

          // count if we have a change here, ie its not been accounted for previously, THIS IS NEEDED WHEN THE TARGET INCLUDES AN ENTITY MAPPED ON PREVIOUS CONTEXT.
          let prevValueMappedAtThisContext = this.getContextMemory(tick)[ett.contextFieldName || ett.entityName];
          dblogger.warn('no sure why we need prevValueMappedAtThisContext. this was found already mapped' + prevValueMappedAtThisContext)
          if (!countOnly) {
            this.setContextField(tick, ett.contextFieldName || ett.entityName, entityValue);
            target.useEntity(ett.entityName, ett.entityIndex);

          }

          if (prevValueMappedAtThisContext !== entityValue) {
            numberOfMaps++;
            ettCount++;
            // give an extra point if that's an intent
            if (ContextManagerKeys.INTENTID === ett.entityName || expectedValueFound) {
              numberOfMaps++;
              ettCount++;
            }
            dblogger.flow('mapTargetEntitiesToContext', 'target value ' + entityValue + (countOnly ? (' counted ' + ettCount + ' against entity ') : ' mapped to ') + ett.entityName + ' at ' + this.node.summary(tick))
          }


        }


      }
    });

    return numberOfMaps;
  }

  /**
   * countPastContextEntities
   * @param {Tick} tick 
   * @param {ContextItem} contextDetails 
   *  @return {number} number of maps from past contexts to here
   */
  countPastContextEntities(tick, contextDetails) {
    let ettCount = 0;
    // for each ett
    for (let ettkey in contextDetails.entities) {
      let ett = contextDetails.entities[ettkey];
      // see if it was mapped already somewhere up
      let ettName = ett.contextFieldName || ett.entityName;
      // get the context field of ettName up to the next newContext context
      let ettValue = this.getContextField(tick, ettName, true);
      if (ettValue) {
        // if expected value exists, map only if the names matches
        let ettExpectedValues = ett.expectedValue && (Array.isArray(ett.expectedValue) ? ett.expectedValue : [ett.expectedValue]);
        var found = true;
        let expectedValueFound = false;
        if (ettExpectedValues) {
          found = this.compareExpectedValues(ettExpectedValues, ettValue);
          expectedValueFound = true;
        }

        if (found) {
          ettCount++;
          // give an extra point if its expected value
          if (expectedValueFound) {
            ettCount++;
          }
        }
      }

    }

    return ettCount;
  }

  /**
   * selects an index in the contexts that has the maximal entity match
   * @param {Tick} tick 
   */
  selectContextWithMaxEntities(tick, intentDirection) {
    let maxEttCount = 0;
    let retIndex = -1;
    dblogger.flow(this.node.id + ' select Context With Max Entities - ' + this.node.summary(tick));

    // look on the contexts of the current contextManager
    var ctxParams = this.node.contextProperties();
    for (let c = 0; c < ctxParams.length; c++) {
      let ettCountThisTarget = 0;
      let ettCountAtPastTargets = 0;
      // count for current tick target
      ettCountThisTarget = this.mapTargetEntitiesToContext(tick, ctxParams[c], tick.target, true);

      dblogger.flow('For child ' + c + ': ett Count This Target ' + ettCountThisTarget);
      // check if we have historical contexts that can be mapped here to this context
      // TODO: WE HAVE AN UNNECESSARY DOUBLE LOOP HERE - mapPastUnmapedEntitiesToContext ALSO LOOPS UNTIL ROOT
      ettCountAtPastTargets = this.mapPastUnmapedEntitiesToContext(tick, ctxParams[c], tick.target, true);
      dblogger.flow('ettCountAtPastTargets ' + ettCountAtPastTargets);
      // now use previously mapped entities for the counting! 
      let ettCountAtPastContexts = 0;
      // for downwards, non-intent entities, we allow them to be taken from previous conversations
      if (intentDirection === ContextManagerKeys.DOWNWARDS &&
        ctxParams[c].entityName !== ContextManagerKeys.INTENTID) {
        ettCountAtPastContexts = this.countPastContextEntities(tick, ctxParams[c]);
        dblogger.flow('ettCountAtPastContexts ' + ettCountAtPastTargets);
      }

      // does this child hold the max?
      if ((ettCountAtPastTargets + ettCountThisTarget + ettCountAtPastContexts) > maxEttCount) {
        maxEttCount = ettCountAtPastTargets + ettCountThisTarget + ettCountAtPastContexts;
        retIndex = c;
      }
    }

    return {
      index: retIndex,
      count: maxEttCount
    };
  }


  /**
   * set the current context entities
   * if this is the root, its not considered a context to 
   * @param {Tick} tick
   * @param {ContextManagerEntities} [contextEntities]
   */
  setCurrentContext(tick, contextEntities) {
    let nodeId = (contextEntities && contextEntities.node.id) || this.node.id;
    var fsmManager = require('FSM/fsm-manager');
    var btRoot = fsmManager.getBehaviorTree(tick.process.fsm_id);
    // never save the root as a context
    if (nodeId !== btRoot.root.id && tick.tree.id !== tick.process.properties().pipeTreeId) {
      tick.process.currentContextEntities({
        contextManager: (contextEntities && contextEntities.node.contextManager) || this,
        tick: (contextEntities && contextEntities.tick) || tick
      });
    }
  }



  /**
   * build the tree of contextManagers
   * @param {ContextManager} parentContextManager 
   * @param {BaseNode} node - current node
   */
  buildManagerTree(parentContextManager, node) {

    if (node.contextManager) {
      node.contextManager.parent = parentContextManager;
      if (parentContextManager) {
        parentContextManager.child = node.contextManager;
      }
      // now this becomes the parent
      parentContextManager = node.contextManager;
    }

    if (node.children) {
      node.children.forEach((child) => {
        this.buildManagerTree(parentContextManager, child);
      });
    } else if (node.child) {
      this.buildManagerTree(parentContextManager, node.child);
    }
  }

  /**
   * Assign the current target to all contexts 
   * @param {Tick} tick 
   * @param {Array<FoundContext>} contextsSelected
   */
  assignTargetToContexts(tick, contextsSelected) {

    _.each(contextsSelected, (context) => {
      if (!context.target) {
        dblogger.flow('assign target ' + tick.target.summary() + ' to context at ' + this.node.summary(tick));
        context.target = tick.target.clone();
      }
    });

  }
  /**
   * switch to the first context on the array provided; if array has more contexts, push them for further switch
   * @param {Tick} tick
   * @param {Array<FoundContext>} contextsSelected 
   * @param {boolean} noPrev - dont save previous  
   * @param {boolean} useTarget - true if need to use the tick target
   * @return {boolean} true if switched 
   */
  switchContext(tick, contextsSelected, noPrev, useTarget = true) {
    // the new context is the first one - either intermediate or just a single context
    let firstContext = contextsSelected[contextsSelected.length - 1];
    let selectedConvoIndex = firstContext.index;
    let prevSelectedConvoIndex = firstContext.prevIndex;

    tick.process.currentContextEntities(firstContext);

    // set the context at the node
    this.node.setContextChild(tick, firstContext.index);

    dblogger.assert(selectedConvoIndex !== prevSelectedConvoIndex, "selectedConvoIndex === prevSelectedConvoIndex " + this.node.summary(tick));

    var contextFrames = this.getContextFrames(tick);

    var oldContext = contextFrames[contextFrames.length - 1]; // last /current one
    // add the selected context(s) to the previous ones
    // REMOVED CONDITION:unless its backtracking (== a question node) 
    var framesWithoutSelectedContext = [];
    //  if (!firstContext.backtrack) {
    framesWithoutSelectedContext = contextFrames.filter((item) => {
      return (item.index !== selectedConvoIndex);
    });
    //}

    // push new frame always last, and filter out the later duplicates (duplicates can happen if we have intermediaries) 
    contextFrames = framesWithoutSelectedContext.concat(contextsSelected);
    dblogger.flow('switchContext from ' + prevSelectedConvoIndex + ' to ' + selectedConvoIndex + ' at ' + this.node.summary(tick));
    // now, find previous and save last opened leaf
    if (!noPrev) {
      var oldLeafNode = this.node.findCurrentWaitNode(tick, this.node.contextChildren()[prevSelectedConvoIndex]);
      dblogger.flow('old leaf:', oldLeafNode.node && oldLeafNode.node.id, 'old leaf tree:', oldLeafNode && oldLeafNode.tick.tree.id);
      if (!oldLeafNode.node || !oldContext) {
        this.node.log(tick, 'no leaf node, could happen when starting a tree');
      } else {
        oldContext.leafNodeId = oldLeafNode.node && oldLeafNode.node.id;
        oldContext.leafTreeId = oldLeafNode.tick.tree.id;
      }
    }


    dblogger.assert(firstContext.index >= 0, "switch context to -1???");
    // now that the context child, CONTEXT FRAMES, is set
    if (useTarget && !this.node.contextProperties()[firstContext.index].passThru) { // passThru is for two consequent contexts where the upper one only makes the routing
      // save the targets in context memory
      this.assignTargetToContexts(tick, contextFrames);
      this.mapEntitiesToContext(tick, this.node.contextProperties(), firstContext.index, contextFrames);
      // and remove from tick
      if (tick.target.passedThruPipe) {
        tick.target.remove();
      }

    }

    // if a backtrack was detected, but no auto-backtrack
    if (firstContext.autoBacktrack) {
      // this will be in use in AskAndMap, after 2 backtracks (todo: test case)
      this.node.contextChildren()[firstContext.index]._closeMe(tick);
    }

    // re-save all frames
    this.setContextFrames(tick, contextFrames);

    // save some stats
    statsManager.addConversationStart(tick, selectedConvoIndex, this.node);

    return true;
  }

  /**
   * deserialize an array of contexts
   * @param {Tick} tick 
   * @param {Array<FoundContexts>} array of context frames
   */
  deserializeContexts(tick, cframes) {
    var contextFrames = [];
    _.each(cframes, (cframe, index) => {
      contextFrames[index] = tick.process.deserializeContext(cframe);
    });
    return contextFrames;
  }


  /**
   * get the context array
   * @param {Tick} tick
   * @return  {Array<FoundContext>} array of context frames
   */
  getContextFrames(tick) {

    var cframes = tick.process.get(ContextManagerKeys.CONTEXTFRAMES, tick.tree.id, this.node.id) || [];

    return this.deserializeContexts(tick, cframes);

  }


  /**
   * serialize an array 
   * @param {Tick} tick 
   * @param {Array<FoundContext>} contextFrames - array of context frames
   * @return  {Array<Object>} array of context frames serialized
   */
  serializeContexts(tick, contextFrames) {
    var cframes = [];
    _.each(contextFrames, (contextFrame, index) => {
      cframes[index] = tick.process.serializeContext(contextFrame);
    });
    // this will error if there's a cycle
    utils.isCyclic(cframes);

    return cframes;
  }



  /**
   * set the context array
   * @param {Tick} tick
   * @return  {Array<FoundContext>} array of context frames
   */
  setContextFrames(tick, contextFrames) {
    var cframes = this.serializeContexts(tick, contextFrames);
    return tick.process.set(ContextManagerKeys.CONTEXTFRAMES, cframes, tick.tree.id, this.node.id);
  }
  /**
   * map entities to parent context
   * @param {Tick} tick
   */
  close(tick, status) {

    var child = this.node.currentChildIndex(tick);
    if (child < 0 || child === undefined) {
      // if not running - ended, always clear, so no entities will be left for next round
      this.clearAllContexts(tick, false);
      statsManager.closeContext(tick, this.node);
      return;
    }
    this.mapEntitiesToParent(tick);
    // assert
    // todo: remove on debug
    // _.each(this.node.contextProperties()[child].entities, (fieldMap) => {
    //   // if exists on target, then it should have been mapped
    //   if (!_.isUndefined(this.node.target(tick).getEntity(fieldMap.entityName, fieldMap.entityIndex))) {
    //     dblogger.log('entity wasnt used!', this.node.target(tick), fieldMap.entityName, tick.tree.id);
    //   }

    // });

    // if success/running
    if (status != b3.FAILURE() && status != b3.ERROR()) {
      statsManager.setLastRun(tick, child, this.node);
    } // set a flag on mapped entities so next context would not deal with them
    // if not running - ended, always clear, so no entities will be left for next round
    this.clearAllContexts(tick, false);

    // this.returnContextToParent(tick);

    // since we might close after a context switch (w/out proper closing), we must close explicitly the children
    for (let child of this.node.contextChildren()) {
      child._close(tick);
    }

    // reset for next open
    this.node.local(tick, 'runningChild', -1);
    statsManager.closeContext(tick, this.node);
  }


  /**
   * map context fields to parent
   * @param {Tick} tick
   * @param {Object} [contextProperties] - properties of the context-managed node 
   */
  mapEntitiesToParent(tick, contextProperties) {
    var parentContextManagerEtts = this.findNextContextManagerEntities(tick);
    if (!parentContextManagerEtts.node) {
      return;
    }

    dblogger.assert(!utils.safeIsNaN(this.node.currentChildIndex(tick)), 'child has not been selected correctly at ' + this.node.summary(tick) + ' - check intents/contexts properties against message');
    if (tick.process.properties().strict) {
      _.each(contextProperties || this.node.contextProperties()[this.node.currentChildIndex(tick)].entities, (fieldMap) => {
        var value = this.getContextField(tick, (fieldMap.contextFieldName || fieldMap.entityName));
        if (!_.isUndefined(value)) {
          parentContextManagerEtts.node.contextManager.setContextField(parentContextManagerEtts.tick, fieldMap.contextFieldName || fieldMap.entityName, value);
        }
      });
    } else {
      var contextMemory = this.getContextMemory(tick);
      _.each(contextMemory, (value, key) => {
        parentContextManagerEtts.node.context(parentContextManagerEtts.tick, key, value);
      });
    }

  }

  /**
   * get the key/value from first context-managed ancestor which keeps it
   * @param {Tick} tick
   * @param {string} key 
   * @param {boolean?} limited - if true, do not continue beyond a context which is a newContext node
   * @return {any}  value
   */
  getContextField(tick, key, limited = false) {
    var node = this.node;
    var value;
    var contextManager = this;

    do {
      dblogger.assert(contextManager, "node must have a contextManager");
      value = contextManager.getContextMemory(tick)[key];
      if (_.isUndefined(value) && (!limited || !contextManager.node.properties.newContext)) {
        var nextCntxtMgrEtts = contextManager.findNextContextManagerEntities(tick);
        node = nextCntxtMgrEtts && nextCntxtMgrEtts.node;
        tick = nextCntxtMgrEtts && nextCntxtMgrEtts.tick;
        contextManager = node && node.contextManager;
      }
    } while (node && (_.isUndefined(value) && !contextManager.node.properties.newContext));

    return value;
  }

  /**
   * saves the ctxMgrEtts as the current context entities (currentContextEntities)
   * @param {Tick} tick 
   * @param {ContextManagerEntities} ctxMgrEtts 
   */
  saveGlobalContext(tick, ctxMgrEtts) {
    tick.process.currentContextEntities(ctxMgrEtts.node && {
      contextManager: ctxMgrEtts.node && ctxMgrEtts.node.contextManager,
      tick: ctxMgrEtts.tick
    });
  }

  /**
   * when done with this context, called to return context to parent 
   * @param {Tick} tick
   * @return {boolean} true if parent node
   */
  returnContextToParent(tick) {
    var ctxMgrEtts = this.findNextContextManagerEntities(tick);

    if (ctxMgrEtts.node) {
      this.setCurrentContext(tick, ctxMgrEtts);
    }

    return !!ctxMgrEtts.node;
  }


  /**
   * put intentId as an entity
   * @param {Tick} tick 
   * @param {ContextItem} contextsParams 
   */
  convertIntents(contextsParams) {
    for (let ctx of contextsParams) {
      ctx.entities = ctx.entities || [];
      let intentEtt = ctx.entities.find((ett) => {
        return ett.entityName === ContextManagerKeys.INTENTID;
      });
      let intentId = ctx[ContextManagerKeys.INTENTID];
      if (!intentEtt && intentId) {
        ctx.entities.push({
          entityName: ContextManagerKeys.INTENTID,
          expectedValue: intentId
        });
      }
    }
  }

  /**
   * save unused entities for later use
   * @param {Tick} tick 
   * @param {Target} target with entities
   */
  saveUnmappedEntitiesToContext(tick, target) {
    let unmappedEntities = target.getUnusedEntities();

    let prevUnmappedEtts = this.getContextMemory(tick)[ContextManagerKeys.UNMAPPEDENTITIES] || {};
    // TODO - deal with unmapped of same key
    _.extend(prevUnmappedEtts, unmappedEntities);

    this.setContextField(tick, ContextManagerKeys.UNMAPPEDENTITIES, prevUnmappedEtts);


  }



  /**
   * search the tree upwards to see if in a previous context we had the same entity that was not mapped yet
   * @param {Tick} tick 
   * @param {ContextItem} contextDetails 
   * @param {boolean?} countOnly - count possible mappings only, no actual maps  
   * @return {number} - number Of Maps
   */
  mapPastUnmapedEntitiesToContext(tick, contextDetails, target, countOnly) {
    let numberOfMaps = 0;
    let unmappedEntities = this.node.aggregateObjectContextField(tick, ContextManagerKeys.UNMAPPEDENTITIES) || [];
    _.each(contextDetails.entities, (ett) => {

      // count if we already mapped here
      if (this.getContextMemory(tick)[ett.contextFieldName || ett.entityName]) {
        return;
      }
      var parentContextManagerEtts = this.findNextContextManagerEntities(tick);

      while (parentContextManagerEtts && parentContextManagerEtts.node) {
        var contextManager = parentContextManagerEtts.node.contextManager;
        var entityValue = unmappedEntities[ett.entityName] && unmappedEntities[ett.entityName][ett.entityIndex];
        if (entityValue !== undefined) {
          // if expected value exists, map only if the names matches
          let ettExpectedValues = ett.expectedValue && (Array.isArray(ett.expectedValue) ? ett.expectedValue : [ett.expectedValue]);
          var found = true;
          if (ettExpectedValues) {
            // if an expected value exists, compare angainst is
            found = this.compareExpectedValues(ettExpectedValues, entityValue);
          }
          // if the value equals the expected value, or the expected value doesnt matter
          if (found) {
            if (!countOnly) {
              this.setContextField(tick, ett.contextFieldName || ett.entityName, entityValue);
              delete unmappedEntities[ett.entityName][ett.entityIndex];
            }
            numberOfMaps++;
            // increase numberOfMaps if it was an expectedValue that was found
            numberOfMaps += (ettExpectedValues && found) ? 1 : 0;
          }
        }
        parentContextManagerEtts = contextManager.findNextContextManagerEntities(parentContextManagerEtts.tick);

      }


    });

    return numberOfMaps;

  }

  /**
   * maps from the context expected entities to the context memory fields, 
   * according to the map defined at the context-managed node properties
   * @param {Tick} tick 
   * @param {Array<EntitiesToContextMapItem>} map - a array of expected context entities to context fields 
   * @param {number} childIndex - current child Index
   * @param {Array<FoundContext>} contextFrames
   * @returns {number} - number of maps
   */
  mapEntitiesToContext(tick, map, childIndex, contextFrames) {
    dblogger.assert(!utils.safeIsNaN(childIndex), "No current context");

    let numberOfMaps = 0;
    let contextDetails = map[childIndex];
    dblogger.assert(contextDetails, "no context details - bug at" + this.node.summary(tick));
    let ctxFrames = contextFrames || this.getContextFrames(tick);
    let target = ctxFrames[ctxFrames.length - 1].target;

    numberOfMaps += this.mapTargetEntitiesToContext(tick, contextDetails, target, false);

    // re-save
    this.setContextFrames(tick, ctxFrames);

    // TODO: check only on short-term memory
    // check if we have historical contexts that can be mapped here to this context
    numberOfMaps += this.mapPastUnmapedEntitiesToContext(tick, contextDetails, target, false);

    this.saveUnmappedEntitiesToContext(tick, target);

    return numberOfMaps;
  }

  /**
   * does the contextDetails has this intentId 
   * @param {ContextItem} contextDetails 
   * @param {string} intentIdToFind 
   * @return {string} string or undefined
   */
  hasIntent(contextDetails, intentIdToFind) {
    intentIdToFind = intentIdToFind || ContextManagerKeys.NONE;
    let ctxIntentId = contextDetails.intentId;
    if (!ctxIntentId) {
      return null;
    }
    var intents = Array.isArray(ctxIntentId) ?
      ctxIntentId : [ctxIntentId];
    var found = intents.find((elem) => {
      return intentIdToFind.toLowerCase() === elem.toLowerCase() || !!(new RegExp(elem, "i")).exec(intentIdToFind.toLowerCase());
    });
    return found;
  }

  /**
   * the context memories are set at the relevant child's local memory, under CONTEXTMEM() key
   * 
   */
  /**
   * set a context field
   * ASSUMES the call to this function can come only from within the current context
   * @param {Tick} tick
   * @param {string} fieldName 
   * @param {string} value 
   * @return {string} value set 
   */
  setContextField(tick, fieldName, value) {

    var contextMem = this.getContextMemory(tick);
    try {
      eval(ContextManagerKeys.CONTEXTMEM + "." + fieldName + "= value");
    } catch (ex) {
      dblogger.error('error in setContextField(' + fieldName + "," + value + "):", ex);
      contextMem.fieldName = value;
    }


    // currentContextChild always point to the right context
    this.node.currentContextChild(tick).local(tick, ContextManagerKeys.CONTEXTMEM, contextMem);

    return value;
  }

  /**
   * return properties object of current context
   * @param {*} tick 
   */
  currentContextProperties(tick) {
    return this.node.properties.contexts[this.node.currentChildIndex(tick)];
  }


  /**
   * get full object of current selected context memory
   * @param {Tick} tick 
   * @return {Object}
   */
  getContextMemory(tick) {
    let curChild = this.node.currentContextChild(tick);
    return curChild ? (curChild.local(tick, ContextManagerKeys.CONTEXTMEM) || {}) : {};
  }

  /**
   * clears current selected context memory
   * @param {Tick} tick 
   */
  clearContext(tick) {
    this.node.currentContextChild(tick).local(tick, ContextManagerKeys.CONTEXTMEM, {});
  }

  /**
   * clears all  context memories at the current context manager
   * @param {Tick} tick 
   * @param {boolean} leaveCurrent - leaves current context intact
   */
  clearAllContexts(tick, leaveCurrent) {
    _.each(this.node.contextChildren(), (child, childIndex) => {
      if (!leaveCurrent || this.node.currentChildIndex(tick) !== childIndex) {
        child.local(tick, ContextManagerKeys.CONTEXTMEM, {});
      }

    });
    if (!leaveCurrent) {
      this.setContextFrames(tick, [this.noContext(tick)]);
    } else {
      var contexts = this.getContextFrames(tick);
      for (let i = 0; i < contexts.length; i++) {
        let context = contexts[i];
        if (i === context.index) {
          let newContexts = [this.noContext(tick), context];
          this.setContextFrames(tick, newContexts);
          return;
        }
      }
    }

  }



  /**
   * saves current context memeory at the lastContext field at the current context-managed node
   * not used 
   * @param {Tick} tick 
   * @private
   */
  saveLastContext(tick) {
    var curContext = this.getContextMemory(tick);
    var contextForSaving = {
      data: curContext,
      timestamp: Date.now()
    };

    // save last
    this.node.local(tick, ContextManagerKeys.LASTCONTEXT, contextForSaving);
  }

  /**
   * deduplicate the  context array
   * @param {Array<FoundContext>} contextFrames1 
   * @param {boolean} latterPrevail if true, the latter context wins - it would set the prevIndex and more importantly, the target
   */
  dedupeContexts(contextFrames1, latterPrevail) {
    let contextFrames = contextFrames1.filter((itemToDedupe, pos) => {
      // findIndex will find only the first pos of itemToDedupe, so on further finds it will dedupe
      let firstIndexFound = contextFrames1.findIndex((arrItem) => {
        return itemToDedupe.index === arrItem.index;
      });
      if (latterPrevail) {
        // take the latter  frame and use it
        for (let i = firstIndexFound + 1; i < contextFrames1.length; i++) {
          if (itemToDedupe.index === contextFrames1[i].index) {
            // save only prevIndex
            let realPrevIndex = itemToDedupe.prevIndex;
            _.extend(itemToDedupe, contextFrames1[i]);
            itemToDedupe.prevIndex = realPrevIndex;

          }
        }
      }

      return firstIndexFound === pos;
    });

    return contextFrames;

  }

  /**
   * pop last context, set a new selected convo, close and re-open
   * @param {Tick} tick
   * @return {boolean} true if there are more contextFrames
   */
  switchToPrevContext(tick, status) {

    var contexts = this.getContextFrames(tick);
    // POP
    var poppedContext = contexts.pop();
    // if there are duplicate contexts, its because there was an intermediary from backtrack. if it failes, we discard the backtracked context  
    contexts = this.dedupeContexts(contexts, status === b3.SUCCESS());

    // save
    this.setContextFrames(tick, contexts);

    // SWITCH TO PREVIOUS, if any 
    if (!contexts.length || contexts[contexts.length - 1].index === -1) {
      //if (status === b3.SUCCESS()) {
      this.returnContextToParent(tick);
      return status;
      //}

    }
    var prevContext = contexts[contexts.length - 1];
    dblogger.flow('switchToPrevContext ' + prevContext.index);
    var contextSwitched = this.switchContext(tick, [prevContext], true, poppedContext.backtrack && status === b3.SUCCESS());
    dblogger.assert(contextSwitched, 'how can a context not switch on return to prev??');
    // if its succesful backtrack, close
    if (poppedContext.backtrack && status === b3.SUCCESS()) {
      this.node.contextChildren()[prevContext.index]._closeMe(tick);
    }

    // if needed, replay last leaf
    // ===========================
    else if (prevContext.leafNodeId) {
      dblogger.assert(prevContext.leafTreeId, "leafnodeid and leaftreeid should come together")
      dblogger.flow('switching to prev. tree id:' + prevContext.leafTreeId + " leaf id:" + prevContext.leafNodeId);
      // now re-open that one child (so any outstanding requests could be cancelled?)
      var fsmManager = require('FSM/fsm-manager');
      var bt = fsmManager.getBehaviorTree(prevContext.leafTreeId);
      dblogger.assert(bt, 'Cant find bt when switching context to prev. treeId:' + prevContext.leafTreeId);

      // re-open the last leaf. so if there was a question, ask again - unless its a return from backtrack
      // TODO: send a message of returning to context
      var leafNode = bt.nodes[prevContext.leafNodeId];
      dblogger.assert(leafNode, 'Cant find leaf node when switching context to prevCant find leaf node when switching context to prev. leaf id:' + prevContext.leafNodeId);
      var newTick = new Tick(tick.process, bt, tick.target, tick.depth);
      // TODO: create tick as if it was really reached from a regular tick 
      // the closeme only cares about the tree id TODO: make bt.closeCurrentLeaf()
      leafNode.waitCode(newTick, status); // this will stop the node on next tick. if its 2, it will fail the leaf node
      if (leafNode.properties && leafNode.properties.replayActionOnReturnFromContextSwitch && (
          status === b3.SUCCESS() || (status === b3.FAILURE() && poppedContext.backtrack))) {

        leafNode._closeMe(newTick, status);
        leafNode.open(newTick);
      }



    } else
      // if its a regular context which returned false, and there is no leaf fail the node
      if (!poppedContext.backtrack && status === b3.FAILURE()) {
        return status;
      }

    return b3.RUNNING();
  }



  /**
   * opens the context - select the right context, saves it as global context, and switch to it
   * @param {Tick} tick 
   * @param {boolean} useTarget: if false, do not use the target
   * @return {Array<FoundContext>}
   */
  open(tick) {
    this.clearAllContexts(tick, false);
    // no context got selected yet: then if we have a target, select by it the right context child
    // this answers cases where the first selection come from above (and tick is 'downwards')
    let foundContexts = this.selectContexts(tick, ContextManagerKeys.DOWNWARDS, false);

    // if no context found, and there's a target, choose the background
    if (!tick.target.exists() && foundContexts[foundContexts.length - 1].index < 0 && this.node.backgroundContextIndex !== undefined) {
      foundContexts[foundContexts.length - 1].index = this.node.backgroundContextIndex;
    }

    // initialize the running child
    this.node.local(tick, 'runningChild', foundContexts[foundContexts.length - 1].index);

    // only now you can open openContext 
    statsManager.openContext(tick, this.node);

    // set this as the context,when opened.
    this.setCurrentContext(tick);

    // if we had a selection, treat it as a context switch, so we'll know to get back to it
    if (foundContexts[foundContexts.length - 1].index >= 0) {
      // switch
      this.switchContext(tick, foundContexts, true);
      // if there was a target but still no selection ,it means the target wasnt understood
    }

    if (!(!tick.target.exists() || foundContexts[foundContexts.length - 1].index >= 0)) {
      dblogger.assert(!tick.target.exists() || foundContexts[foundContexts.length - 1].index >= 0,
        "Warning: AskAndMap open was called, and no context was found for a target that exists. this could happen if parent context switched here due to multiple targets or default, but not all of them were present here");
      tick.target.remove();
    }
    return foundContexts;
  }

}

module.exports = ContextManager;