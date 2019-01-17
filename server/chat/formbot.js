var express = require('express');
var router = express.Router();
var _ = require('underscore');
var dblogger = require('../utils/dblogger');
var FSMManager;
var processModel = require('../models/processmodel');
var config = require("../config");
var ChatDriverInterface = require("./chat-driver-interface");
var MessageModel = require("../models/message-model");

let _inst = null;
/**
 * create a @MessageObject
 * @param {Object} recipient 
 * @param {Object} sender 
 * @param {*} type 
 * @param {*} text 
 * @param {*} messengerType 
 * @param {string} fsmID 
 * 
 * @return MessageModel
 */
function createMessageObject(sender, fsmID) {
  let recipient = {
    id: "servo",
    firstName: fsmID,
    lastName: '',
    channel: 'formbot'
  };
  sender = {
    id: sender.id,
    firstName: 'user',
    lastName: '',
    channel: 'formbot'
  };
  return new MessageModel(recipient, sender, "formbot", "", "formbot", fsmID);
}

/**
 * 
 * @param {*} route 
 * @param {*} userId 
 * @param {*} fsm 
 * @param {*} processObj 
 */
function gotoRoute(route, userId, fsm, processObj) {
  return new Promise((resolve, reject) => {

    FSMManager = FSMManager || require("../FSM/fsm-manager");
    let crntContext = processObj.currentContextEntities();
    if (!crntContext) {
      return resolve();
    } else {
      var contextManager = crntContext.contextManager;
      var node = contextManager.node;
      var loopStop = false;
      var parentetts = {
        node,
        tick: crntContext.tick
      };
    }
    // search up until you find
    while (!loopStop) {

      // if reached the root,
      let view = parentetts.node && parentetts.node.view();
      if (!parentetts.node || (view && view[fsm.properties.defaultLang] && view[fsm.properties.defaultLang].route === route)) {
        // signal loop stop
        break;
      } else {
        contextManager = parentetts.node.contextManager;
        // try next ones
        parentetts = contextManager.findNextContextManagerEntities(parentetts.tick, parentetts.node);

      }

    }

    if (!parentetts.node) {
      return reject('route not found!');
    }
    // if context changed
    if (node !== parentetts.node) {
      // set current context to the found context
      node = parentetts.node;
      let contextObject = _.extend(parentetts, {
        contextManager: node.contextManager,
        target: crntContext.target
      });
      processObj.currentContextEntities(contextObject);
      node._close(parentetts.tick);
      node._open(parentetts.tick);
      // simulate as if we already sent the route to the client
      node.local(parentetts.tick, 'step', 1);

    }
    resolve();

  });

}

function getProcessByID(id, fsm, messageObj) {

  return new Promise(function (resolve) {
    //  update the process profile
    processModel.get(id, fsm).then((process1) => {

      // put profile here
      process1.customer = {
        firstName: "formbot User",
        lastName: id
      };

      process1.properties(fsm.properties);
      resolve(process1);
    }).catch(function (err) {
      // if we simply didnt find such a document
      if (err === 0) {
        FSMManager.startOneProcess(fsm, messageObj, id).then((processObj) => {
          resolve(processObj);
        }).catch((ex) => {
          dblogger.error('startOneProcess failed:', ex);
        });
      } else {
        dblogger.error('error in processModel.get:', id, err);
      }
    });
  });
}
class FormbotDriver extends ChatDriverInterface {


  static getInst() {
    if (!_inst) {
      _inst = new FormbotDriver();
    }
    return _inst;
  }
  stopAll() {}
  sendMessage(view, process, tree, node) {
    return new Promise(function (resolve, reject) {

      let resp = process.volatile("responseObj");
      resp && resp.json(view);
      process.volatile("responseObj", null);
      resolve(view);
    });
  }
  startAll(app, fsms) {
    for (var key in fsms) {
      var fsm = fsms[key];
      if (fsm.properties && fsm.properties.channels && fsm.properties.channels.includes("formbot")) {
        this.start(fsm);
      }
    }
    var baseUrl = config.baseUrl;
    app.use(baseUrl + "/entry", router);
  }

  processRequest(req, res, fsm) {
    FSMManager = FSMManager || require("../FSM/fsm-manager"); // require now if not yet required (to avoid circular dependency)
    try {
      // response
      var messageObj = createMessageObject({
        id: req.body.userId
      }, fsm.id);
      messageObj.entities = req.body.entities;
      messageObj.raw = req.body._raw;
      // messageObj.origin = req.body.route;

      getProcessByID(req.body.userId, fsm, messageObj).then((processObj) => {
        processObj.volatile("responseObj", res);
        gotoRoute(req.body.originRoute, req.body.userId, fsm, processObj).then(() => {
          FSMManager.actOnProcess(messageObj, processObj).then(() => {
            dblogger.log('acted on process ', processObj.summary());
          }).catch((err) => {
            res.json({
              text: err
            });
          });
        });
      }).catch((ex) => {
        dblogger.error("Error in getProcessByID", ex.message);
      });
    } catch (ex) {
      dblogger.error("Error in Formbot driver", ex.message);
    }

  }

  start(fsm) {
    const userDir = fsm.path.split("/")[1];

    router.post('/formbot/' + userDir + '/' + fsm.id, (req, res) => {
      this.processRequest(req, res, fsm);
    });

    dblogger.flow('listen for formbot for ' + fsm.id + ' on ' + config.serverBaseDomain + "/" + config.baseUrl + '/entry/formbot/' + userDir + '/' + fsm.id);
  }
}
module.exports = FormbotDriver;
