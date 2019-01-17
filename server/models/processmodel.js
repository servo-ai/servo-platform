var baseModel = require('./base-model');
var _ = require('underscore');
var dblogger = require("../utils/dblogger.js");
var Process = require('../FSM/core/process');
var DAL = require("../dal/router");
var cacheFactory = require('models/cache-factory');
var ticker = require('FSM/ticker').getInst();
var utils = require('utils/utils');

// useClones:false is important to set due to the following memebers:
// properties 
// session (alexa and others)
// if we need to move it to clonable, then we need to find solutions for these
// TODO: rethink stdTTL. if we enable it, need to make sure process is reloaded otherwise getFromCache fails
// TODO: make layered, per-fsm cache
var _cache = cacheFactory.createCache({
  stdTTL: 0,
  useClones: false
});

function ProcessModel() {}

_.extend(ProcessModel, baseModel);

ProcessModel.Process = Process;

/**
 * flush processes from memory
 * (this is done every editor save)
 */
ProcessModel.resetCache = function () {
  _cache.flushAll();
};

/**
 *  get from db process by its id, and creae a new object
 * @param {string} id
 * @return {Promise}
 */
ProcessModel.get = ProcessModel.getProcessById = function (id, fsm) {
  var value = _cache.get(id);
  if (value != undefined)
    return Promise.resolve(value);

  return new Promise((resolve, reject) => {
    DAL.Process.get(id).then((processObj) => {
      // in case data member is there
      processObj.pData = processObj.data;
      processObj.data && delete processObj.data;
      processObj.properties && delete processObj.properties;
      processObj.userId = fsm.userId;
      // new class here!
      var process = new Process(fsm, processObj);

      // save in cache
      _cache.set(id, process);
      // reset mem if needed
      if (fsm.properties.resetMemory) {
        process.resetMemory();
      }
      return resolve(process);
    }).catch((err) => {
      dblogger.log("couldnt get process " + id, err);
      reject(err);
    });
  });
};

ProcessModel.safeGet = function (id, fsm) {
  return new Promise((resolve, reject) => {
    ProcessModel.get(id, fsm).then((processObj) => {
      return resolve(processObj);
    }).catch((err) => {
      if (err == 0) {
        dblogger.log('process not exist ' + id);
        return resolve(null);
      }
      return reject(err);
    });
  });
};

// TODO: reload if undefined
ProcessModel.getFromCache = function (id) {
  var value = _cache.get(id);
  return value;
};

ProcessModel.getProcessStats = function () {
  return _cache.getStats();
};
/**
 * get all processes that are in the cache
 */
ProcessModel.getActiveFSMProcesses = function (fsmId) {
  return new Promise((resolve, reject) => {
    _cache.keys((error, keys) => {
      let retProcs = [];
      if (error) {
        dblogger.error('error in getActiveFSMProcesses', error);
        reject(error);
      } else {
        _.each(keys, (key) => {
          let p1 = _cache.get(key);
          if (p1.fsm_id === fsmId) {
            retProcs.push(p1);
          }
        });
        resolve(retProcs);
      }
    });
  });
};

/**
 * load all processes from db
 */
ProcessModel.loadFSMProcesses = function (fsm) {
  return new Promise((resolve) => {
    DAL.Process.getFSMProcesses(fsm).then((processes) => {
      processes = processes.filter(prc => !prc.id.startsWith('dbgr'));
      for (var i = 0; processes && i < processes.length; i++) {
        var process1 = processes[i];
        let processClass = new Process(fsm, process1)
        processClass.userId = fsm.userId;
        _cache.set(processClass.id, processClass);
        //sretrart tick rate
        ticker.start(processClass.id);
      }
      resolve(processes);
    });
  });
};

/**
 * enhance and put the message in an array in process object
 */
ProcessModel.addMessage = function (id, processObj, message) {

  if (message && message.text !== "" && processObj.getNonVolatile()) {
    message.processId = id; //update
    message.timestamp = message.timestamp || new Date().getTime();
    processObj.messages = processObj.messages || [];
    DAL.Message.insert(message);
    processObj.messages.push(message);
    processObj.lastTalked = message.fromUser.firstName + ' ' + message.fromUser.lastName;

    // make a new MID
    let lastMessageID = processObj.lastMessageID || 1;
    message.id = lastMessageID + 1;
    processObj.lastMessageID = lastMessageID;

    if (processObj.lastTalked === (processObj.customer.firstName + ' ' + processObj.customer.lastName)) {
      message.fromUserType = "customer";
    }
  }
};

/**
 * update by id
 */
ProcessModel.upsert = function (processObj, message) {
  var id = processObj.id || processObj.pid;

  // some general process members
  processObj.type = processObj.type || "processInstance";
  processObj.status = processObj.status || 1;
  processObj.updatedTimestamp = new Date().getTime();

  // get only non-volatile memory
  var processToSave = processObj.getNonVolatile();

  if (!processToSave) {
    return new Promise((resolve) => {
      _cache.set(id, processObj);
      resolve(id);
    });
  } else {
    dblogger.assert(!utils.isCyclic(processToSave), "process object is cyclic");
    // and upsert
    return new Promise((resolve) => {
      DAL.Process.upsert(id, processToSave).then(() => {

        _cache.set(id, processObj);

        resolve(id);
      }).catch((err) => {
        console.error(err);
        // tolerate 
        _cache.set(id, processObj);
        resolve(id);
      });
    });
  }

};

/**
 * get the latest messages for a process
 * @param processId
 * @param laterThan
 * @param pageSize
 * @return {Promise}
 */
ProcessModel.getLatestMessages = function (processId, laterThan, pageSize) {
  pageSize = Math.min(pageSize, 33);
  console.log("PAGE SIZE REDUCED FOR DEMO. DO NOT LEAVE AS IS");
  console.log('getLatestMessages ', processId, laterThan, new Date(laterThan), pageSize);
  var promise = new Promise(function (resolve, reject) {

    ProcessModel.getProcessById(processId).then(function (processObj) {

      processObj.messages = processObj.messages || [];

      // get only those message that are later
      var latestMessages = processObj.messages.filter(function (message) {

        return (message.timestamp > parseInt(laterThan));
      });
      console.log('latestMessages.length', latestMessages.length);
      if (pageSize) {
        latestMessages.splice(0, latestMessages.length - pageSize);
      }
      console.log('latestMessages.length after pageSize', latestMessages.length);

      resolve(latestMessages)
    }).catch(function (err) {
      dblogger.error('err in getProcessById:', err);
      reject('err in getProcessById:' + err);
    });

  });

  return promise;
};


/**
 * delete
 * @param processId
 * @returns {Promise}
 */
ProcessModel.deleteProcess = function (processId) {
  _cache.del(processId);
  return DAL.Process.delete(processId);
};

module.exports = ProcessModel;
