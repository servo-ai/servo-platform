var Promise = require('bluebird');
var express = require('express');
var router = express.Router();
var _ = require('underscore');
var dblogger = require('../utils/dblogger');
var FSMManager = require("../FSM/fsm-manager");
var processModel = require('../models/processmodel');
var config = require("../config");
var ChatDriverInterface = require("./chat-driver-interface");
var PipeManager = require("../pipes/pipemanager");
var MessageModel = require("../models/message-model");
let _inst = null;
class MycroftChatDriver extends ChatDriverInterface {
  static getInst() {
    if (!_inst) {
      _inst = new MycroftChatDriver();
    }
    return _inst;
  }
  static sendMessage(response, toID, tree, node) {
    return new Promise(function (resolve, reject) {
      var obj = {};
      var optionals = {};
      var text = response.text;
      if (!text) {
        text = "";
      }
      var messageObj = getScheme(text);
      getProcessByID(tree, messageObj, toID).then(function (processObj) {
        aggregateMessages(response.text, processObj, tree, node).then(function (text) {
          messageObj = getScheme(text);
          if (text) {
            sendResponse(messageObj, processObj);
            console.log('message sent: ' + text)
          }
        });
      });
      resolve('message aggregated');
    });
  }

  static startAll(app, trees) {
    for (var key in trees) {
      var tree = trees[key];
      if (tree.properties && tree.properties.channels && tree.properties.channels.includes("mycroft")) {
        start(tree);
      }
    }
    var baseUrl = config.baseUrl;
    app.use(baseUrl + "/entry/mycroft", router);
  }
}
module.exports = MycroftChatDriver;

function sendResponse(messageObj, processObj) {
  var sessionObj = processObj.volatile('sessionObj');
  if (sessionObj && sessionObj.responseObj) {
    sessionObj.responseObj.json(messageObj);
    sessionObj.responseObj = null;
    processObj.volatile('sessionObj', sessionObj);
  } else {
    dblogger.warn("no responseObj found. The message wasnt sent:", messageObj);
  }
}

/**
 * agregate the message until its time
 * @param {*} message 
 */
function aggregateMessages(text, processObj, tree, node) {
  return new Promise((resolve, reject) => {
    var messagesAggregator = processObj.data('messagesAggregator') || "";
    if (messagesAggregator !== "") {
      messagesAggregator += ". ";
    }
    messagesAggregator += text;

    if (node.name !== 'CardWaitAction' && node.name !== 'AskAndWait') {
      // aggregate and save
      processObj.data('messagesAggregator', messagesAggregator);

      // set a timeout for this
      setTimeout(() => {
        messagesAggregator = processObj.data('messagesAggregator') || "";
        if (messagesAggregator !== "") {
          // send from the available response
          sendResponse(messagesAggregator, processObj);
          processObj.data('messagesAggregator', "");
        }
      }, 5000);
      resolve(); // dont send yet
    } else {
      // send and reset
      processObj.data('messagesAggregator', "");
      resolve(messagesAggregator);
    }
  });
}

function processRequest(req, res, tree) {
  try {
    var sessionObj = {};
    sessionObj.responseObj = res;
    var messageObj = createMessageObject({
      id: config.serverBaseDomain
    }, {
      id: "NatiPiDevice"
    }, req.body.data.utterance, tree.id);
    var nluProperties = tree.properties.nlu;
    var messageText = req.body.data && req.body.data.utterance || "";
    var nlu = PipeManager.getPipe(nluProperties.engine, nluProperties);
    nlu.process(messageText).then(function (nluObj) {
      messageObj.intentId = nluObj.intent;
      messageObj.entities = nluObj.entities;
      getCreateProcessAndMessage(messageObj, tree, res).then(function (processObj) {
        processObj.volatile("sessionObj", sessionObj);
        setTimeout(() => {
          if (sessionObj && sessionObj.responseObj) {
            var messageObj = getScheme("acknowledged");
            sendResponse(messageObj, processObj);
          }
        }, 10000);
      }).catch(function (err) {
        dblogger.error("error in getCreateProcessAndMessage", err);
      });
    });
  } catch (err) {
    dblogger.error("error in mycroft post /mycroft/" + tree.id, req, err);
    res.send({
      message: 'error'
    });
  }
}

/**
 * Starts a mycroft bot
 * in Facebook, the webhook is chatflows.com/entry/mycroft/<tree id>
 * the validationToken should be set in the tree
 * @param tree
 */
function start(tree) {
  router.post('/' + tree.id, function (req, res) {
    processRequest(req, res, tree);
  });
  router.get('/' + tree.id, function (req, res) {
    processRequest(req, res, tree);
  });

  console.log('listen for mycroft message for ' + tree.id + ' on ' + config.serverBaseDomain + "/" + config.baseUrl + '/mycroft/' + tree.id);
}

/**
 * Build the post string from an object
 * @param toID string
 * @param message object
 * @param view string
 * @returns {Promise}
 */
function getScheme(message) {
  var postObj = {
    "message": {
      "text": message
    }
  };

  return postObj;
}

/**
 * Creating a new process
 * @param tree
 * @param messageObj
 * @param pid
 * @param processIds
 * @param errObjects
 * @param messages
 * @param p
 */
function getProcessByID(tree, messageObj, pid, res) {
  FSMManager = require("../FSM/fsm-manager");
  return new Promise((resolve) => {
    processModel.get(pid, tree).then(function (processObj) {
      if (res) {
        var sessionObj = {};
        sessionObj.responseObj = res;
        processObj.volatile('sessionObj', sessionObj);
      }
      resolve(processObj);
    }).catch(function (err) {
      // if we simply didnt find such a document
      if (err === 0) {
        dblogger.info({
          cat: 'flow'
        }, 'create new process ', pid);
        FSMManager.startOneProcess(tree, messageObj, pid).then((processObj) => {
          dblogger.log("process " + pid + " created");
          if (res) {
            var sessionObj = {};
            sessionObj.responseObj = res;
            processObj.volatile('sessionObj', sessionObj);
          }
          resolve(processObj);
        }).catch((err) => {
          dblogger.error('error in process.save', pid, err);
          // continue the chain.
          reject({
            process: {
              id: pid
            },
            message: messageObj,
            index: p,
            error: err
          });
        });
      } else {
        dblogger.error('error in getProcessByID', pid, err);
      }
    });
  });
}

/**
 * try to get individual process, if not then create it
 * resolve together with the messageObj
 * @param retProc
 * @param tree
 */
function getCreateProcessAndMessage(messageObj, tree, res) {
  return new Promise(function (resolve, reject) {
    console.log("in getCreateProcessAndMessage promise chain");

    var pid = getProccessID(messageObj);
    getProcessByID(tree, messageObj, pid, res).then(function (processObj) {
      actOnProcess(messageObj, processObj);
      resolve(processObj);
    }).catch(function (err) {
      reject(err);
    });
  });
}

function actOnProcess(messageObj, processObj) {
  // log some statistics
  var lastUserTimestamp = Date.now();
  var counter = (processObj.data('lastWakeup') && processObj.data('lastWakeup').counter) || 0;
  var lastWakeup = {
    //  normalize time based on user timezone
    timestamp: lastUserTimestamp,
    // replay leaf if its not the first wakeup
    counter: counter + 1
  }
  processObj.data('lastWakeup', lastWakeup);
  processObj.volatile('replayLastLeaf', !!counter);
  processObj.data('lastUserTimestamp', lastUserTimestamp);

  FSMManager.actOnProcess(messageObj, processObj).then((res) => {
    console.log('acted on process: ', processObj.summary());
  });
  console.log("message proccessed");
}

function getProccessID(messageObj) {
  return messageObj.fromUser.id;
}

function createMessageObject(recipient, sender, text, treeID) {
  var recipient = {
    id: recipient.id,
    firstName: treeID,
    lastName: '',
    channel: 'mycroft'
  };
  var sender = {
    id: sender.id,
    firstName: 'user',
    lastName: '',
    channel: 'mycroft'
  };

  return new MessageModel(recipient, sender, "audio", text, "mycroft", treeID);
}
