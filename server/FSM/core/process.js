var _ = require('underscore');
var utils = require("utils/utils");
var dblogger = require("utils/dblogger.js");
var Promise = require('promise');
var deepClone = require('clone-deep');
var FSMManager;
var ProcessModel;
var Blackboard = require('./blackboard');
var Target = require('FSM/core/target');
var Tick = require('FSM/core/tick');
/**
 * Process holds the nodes and trees memory, and serializes/deserializes them to the database abstraction layer 
 * @memberof module:Core
 */
class Process extends Blackboard {

  /**
   *Start a process and its children in memory
   */
  constructor(fsm, base) {
    super();
    _.extend(this, base);

    this.treeId = this.fsm_id = fsm.folderName + "/" + fsm.name + '.json';
    this.type = base.type || "processInstance";
    this.status = base.status || "active";
    this.channelId = base.channel && base.channel.toLowerCase();
    this.options = fsm.properties;

    ProcessModel = ProcessModel || require('../../models/processmodel');

    //this.set('openNodes', [], fsm.id); // TODO: reload these as well

    // language -obsolete. now properties as a whole are supported
    if (fsm.properties) {
      fsm.properties.defaultLang = fsm.properties.defaultLang || "en";
      // backwards compatibility
      this.data('lang', fsm.properties.defaultLang);
      this.volatileAllData = fsm.properties.resetMemory;
      this.properties(fsm.properties);
    }


  }

  fsmId() {
    return this.fsm_id;
  }

  /**
   * bring in the properties as a whole
   * @param {*} props 
   */
  properties(props) {
    if (!props) {
      var properties = this.data('properties');
      if (!properties) {
        dblogger = require('utils/dblogger');
        dblogger.error('no properties in process');
        properties = {};
        this.data('properties', properties);
      }
      return properties;
    } else {
      return this.data('properties', props);
    }

  }
  /***
   * @typedef BreakpointData
   * @property nodeId 
   */
  /**
   * setBreakpoint 
   * @param {BreakpointData} breakpointReached 
   */
  setBreakpoint(bpData) {
    var breakpoints = this.volatile('breakpoints') || {};

    breakpoints[bpData.nodeId] = bpData;

    this.volatile('breakpoints', breakpoints);
  }

  /**
   * clear breakpoint
   * @param {string} nodeId 
   */
  clearBreakpoint(nodeId) {
    var breakpoints = this.volatile('breakpoints') || {};
    breakpoints[nodeId] = undefined;
    this.volatile('breakpoints', breakpoints);
  }

  isBreakpoint(nodeId) {
    let bps = this.volatile('breakpoints') || {};
    return !!bps[nodeId];
  }


  /**
   * returns the breakpoints set on this node
   * @param {string} nodeId 
   */
  breakpoint(nodeId) {
    let bps = this.volatile('breakpoints') || {};
    return bps[nodeId];
  }

  /**
   * save this process
   * @return a promise
   */
  save() {
    // save in the db the process
    return new Promise((resolve, reject) => {

      // save
      //var vltMem = this.resetVolatile();
      ProcessModel.upsert(this).then((resultDocID) => {
        // this.resetVolatile(vltMem);
        resolve(resultDocID);
      }).catch((err) => {
        dblogger = require('utils/dblogger');
        dblogger.error('ProcessModel.upsert', this.summary(), err)
        reject(err);
      })
    });
  }

  // marker for logging
  summary() {
    return "tree:" + this.treeId + "/id:" + this.id;
  }
  /**
   * get the prompt for a state
   * @param stateMemberObj
   * @param key
   * @return {*}
   */
  getPrompt(stateMemberObj, key) {
    return this.getCurState()[stateMemberObj][key];

  }

  /**
   * set / empty nodes volatile
   * @param {Object} volMem 
   */
  resetVolatile(volMem) {
    if (volMem) {
      return this._volatileMemory = volMem;
    } else {
      var retMem = this._volatileMemory;
      this._volatileMemory = {};
      return retMem;
    }
  }

  /**
   * setter/getter
   */
  volatile(key, value) {
    if (arguments.length === 0) {
      return this._volatileMemory["process-volatile-memory"];
    } else if (arguments.length >= 2) {
      return this._volatileMemory["process-volatile-memory"][key] = value;
    } else {
      return this._volatileMemory["process-volatile-memory"][key];
    }
  }




  /**
   * sets process data. 
   * pass no arguments to get all data
   * pass explicit null key to replace all data with value
   * @param {string} [key] 
   * @param {*} [value] 
   */
  data(key, value) {

    var processData = this.get('data') || {};
    if (arguments.length === 0) {
      return processData;
    } else if (arguments.length === 1) {
      return processData[key];
    } else {
      // convert to number if needed
      if (!utils.safeIsNaN(value)) {
        value = parseFloat(value);
      }

      if (key !== null && key != "") {
        try {
          eval("processData." + key + "= value");
        } catch (ex) {
          dblogger.error('error in global/process.data(' + key + "," + value + "):", ex);
          processData[key] = value;
        }
      } else {
        dblogger = require('utils/dblogger');
        dblogger.assert(_.isObject(value), "value needs to be an object to replace all of processData");
        processData = value;
      }
      return this.set('data', processData);
    }
  }

  /**
   * from Context tree and node ids,construct a Context object 
   * @param {*} curCtxIds 
   * @return {FoundContext} 
   */
  deserializeContext(curCtxIds0) {

    FSMManager = require('FSM/fsm-manager');
    // construct target
    let target = new Target();
    _.extend(target, deepClone(curCtxIds0.target));
    //  take all the rest
    let curCtxIds = deepClone(curCtxIds0);
    curCtxIds.target = target;

    let tree1 = FSMManager.getBehaviorTree(curCtxIds.treeId);
    var node = tree1 && tree1.getNode(curCtxIds.nodeId);
    if (!tree1 || !node) {
      tree1 = FSMManager.getBehaviorTree(this.fsm_id);
      node = tree1.root;
    }

    if (!node || !node.contextManager) {
      var dblogger = require('utils/dblogger');
      console.trace();
      dblogger.error('node should have a context manager. current context entity ids:', curCtxIds0, curCtxIds);
      return;
    }

    // construct tick
    var tick = new Tick(this, tree1, curCtxIds.target, curCtxIds.tickDepth);
    // and the context
    var contextEntities = _.extend(curCtxIds, {
      contextManager: node.contextManager,
      tick: tick,
      node: node
    });
    return contextEntities;
  }

  /**
   * return an object with ids and numbers, not with object
   * @param {*} contextObj 
   * @return {FoundContext}
   */
  serializeContext(contextObj) {
    if (!contextObj) {
      return {};
    }
    let ctxObj = _.clone(contextObj);
    ctxObj.tick = ctxObj.contextManager = ctxObj.node = null;
    let target1 = deepClone(ctxObj.target);

    _.extend(ctxObj, {
      nodeId: contextObj.contextManager.node.id,
      treeId: contextObj.tick.tree.id,
      tickDepth: contextObj.tick.depth,
      target: target1
    });


    return ctxObj;
  }

  /**
   * Get context entities ids and load context entity 
   * instances into volatile memory
   */
  loadContextEntities() {

    let curCtxIds = this.data('currentContextEntityIds');
    if (_.isEmpty(curCtxIds)) {
      return;
    }

    var currentContextEntities = this.deserializeContext(curCtxIds);

    this.currentContextEntities(currentContextEntities);
  }

  /**
   * sets the current contextManager and tick
   * @param {FoundContext} crntCtxEtts 
   */
  currentContextEntities(crntCtxEtts) {
    if (arguments.length === 1) {
      this.data('currentContextEntityIds', this.serializeContext(crntCtxEtts));
      return this.volatile('currentContextEntities', this.serializeContext(crntCtxEtts));
    } else {
      var crntCtxEtts1 = this.volatile('currentContextEntities');
      if (_.isEmpty(crntCtxEtts1)) {
        return;
      }
      return this.deserializeContext(crntCtxEtts1);
    }
  }

  /***
   * get non-volatile memory
   */
  getNonVolatile() {
    var retProcess = {};
    if (this.volatileAllData) {
      return null;
    }
    for (var k in this) {
      if (k !== "_volatileMemory" && k !== "messages") {
        retProcess[k] = this[k];
      }
    }

    // some special data related ones
    retProcess.data = () => {
      return this.data();
    }

    return retProcess;
  }

}

module.exports = Process;