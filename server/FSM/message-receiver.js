var config = require("../config");
var processModel = require("../models/processmodel.js");
var fsmModel = require("../models/fsmmodel.js");
var Promise = require('promise');
var dblogger = require("../utils/dblogger.js");
var _ = require('underscore');
var fs = require('fs');
var utils = require("../utils/utils");
var ticker = require('FSM/ticker').getInst();

var FSM;

function messageReceiver() {};
module.exports = messageReceiver;



/**
 * util function to find the index of a state by its name
 * @param fsm
 * @param stateName
 * @return {number}
 */
function findStateIndex(fsm, stateName) {
  var stateIndex = -1;
  // get state by name
  var resultState = fsm.states.filter(function (state, index) {
    if (state.name === stateName) {
      stateIndex = index;
      return true;
    }
  });

  return stateIndex;
}

// cache for timeout clearance
_delayTimeoutIDs = {}

/**
 * fetch and run the state processors
 * @param  {[obj]} fsm     [description]
 * @param  {[obj]} process [description]
 * @param  {[string]}     [description]
 * @return {[obj]} body        [description]
 */
var runEntryProcessors = function (fsm, process, curState, body) {
  var promise = new Promise(function (resolve, reject) {

    // get the promise for process' entry processor
    dblogger.log('About to run fsm.entryProcessor ', fsm.entryProcessor);
    var fsmEntryPromise = execProcessorPromise(fsm.entryProcessor, fsm, process, body);

    // when Processor's code is executed
    fsmEntryPromise.then(function () {

      // get the promise for state's entry processor
      dblogger.log('About to run curState.entryProcessor ', curState.entryProcessor);
      var stateEntryPromise = execProcessorPromise(curState.entryProcessor, fsm,
        process, body);

      // when Processor's code is executed
      stateEntryPromise.then(function () {
        resolve()
      }).catch(function (err) {
        var errmsg = 'err in stateEntryProcessor,process ' + process.id + " state " + curState.name

        dblogger.error(errmsg, err.message);
        reject(errmsg + err);
      });
    }).catch(function (err) {
      var errmsg = 'err in FSM.entryProcessor,process ' + process.id + " state " + curState.name

      dblogger.error(errmsg, err);
      reject(errmsg + err);
    });
  });

  return promise;
}


/***
 * generic act on process
 * @param messageBody
 * @param process
 * @param cb
 */
messageReceiver.actOnProcess = function (messageObj, process) {
  return new Promise(function (resolve, reject) {
    //console.log('messageReceiver.actOnProcess-------------------------', messageObj.entities)
    FSM = FSM || require("../FSM/fsm-manager"); // require now to avoid circular dependency
    // for debug - if $tag then just log and return
    if (messageObj && messageObj.text && messageObj.text.substr(0, 4).toLowerCase() === '/tag') {
      var strLog = "--TAG--" + " " + (new Date()).toString();
      strLog += " " + messageObj.text;
      strLog += " PROCESS:" + process.id;
      strLog += " FROM:" + messageObj.fromUser.firstName + ' ' + messageObj.fromUser.lastName;
      dblogger.info(strLog);
      return resolve(process.id);
    }
    //console.log('messageReceiver.actOnProcess1.5-------------------------', messageObj.entities)
    // only now we have a full object 
    var processLocal = process;
    // add the message to the process
    processModel.addMessage(process.id, processLocal, messageObj);
    //console.log('messageReceiver.actOnProcess1.6-------------------------', messageObj.entities)
    // get the fsm
    fsmModel.get(processLocal.fsm_id, processLocal.userId).then((fsm) => {
      //console.log('messageReceiver.actOnProcess1.7-------------------------', messageObj.entities)
      // load the tree if not there
      FSM.loadRootProcessTree(fsm, processLocal).then(() => {

        //execute timeout now
        ticker.breakIn(process.id);
        //console.log('messageReceiver.actOnProcess2-------------------------', messageObj.entities)
        // save async
        processLocal.save();
        // add message to tick queue
        return FSM.calculateIntentAndTickIt(fsm, processLocal, messageObj).then(resolve).catch(reject);
      }).catch((ex) => {
        dblogger.error('error in loading the tree/or calculateIntentAndTickIt ', fsm.id, ex);
        return reject('error in loading the tree/or calculateIntentAndTickIt');
      });

    }).catch(function (err) {
      dblogger.error('err in fsmModel.get for ' + process.summary(), err);
      return reject('error after fsmModel.get for ' + process.summary());
    });


  });
}


/***
 * wrap act on process with a promise, for chaining
 * @param object with messages and processes (and errors if any)
 */
messageReceiver.actOnProcessI = function (processToAct) {
  var i = processToAct.i,
    processObjects = processToAct.processObjects,
    errObjects = processToAct.errorObjects;

  var process = processObjects[i].process;

  var promise = new Promise(function (resolve, reject) {
    // and act
    messageReceiver.actOnProcess(processObjects[i].message, process, process.properties(), function (err, pid) {
      if (!err) {
        resolve({
          i: ++i,
          processObjects: processObjects,
          errorObjects: errObjects
        });
      } else {
        errObjects.push({
          error: err,
          pid: pid,
          process: processObjects[i],
          message: "error in actOnProcess"
        });
        resolve({
          i: ++i,
          processObjects: processObjects,
          errorObjects: errObjects
        });
      }
    }, processToAct.options)
  });
  return promise;
}
