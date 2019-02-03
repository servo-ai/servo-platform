var config = require('config');
var express = require('express');
var dblogger = require('../utils/dblogger');
var processModel = require('../models/processmodel');
var PipeManager = require("../pipes/pipemanager");
var router = express.Router();

var FSMManager;
class ChatDriverInterface {
  ChatDriverInterface() {}

  static getInst() {
    throw "need to implement this.getInst()";
  }

  sendMessage(promptHtml, toId, tree, node = undefined) {
    throw "need to implement sendMessage for driver " + this.channelName();
  }


  stopAll(app) {

  }

  /**
   * 
   * @param {MessageObject} mOject 
   */
  getProccessID(mOject) {
    return this.pidPrefix() + mOject.fromUser.id;
  }

  pidPrefix() {
    throw "not implemented pidPrefix " + this.channelName();
  }

  createMessageObject(body, fsmId) {
    throw "not implemented createMessageObject " + this.channelName();
  }


  start(fsm) {
    throw "not implemented start " + this.channelName();
  }
  channelName() {
    return this.constructor.name;
  }

  processNLU(messageObj, pid, processObj, fsm) {
    let lang = this.calcLang(processObj, fsm);
    var nluProperties = fsm.properties.nlu;
    if (nluProperties[lang]) {
      nluProperties = fsm.properties.nlu[lang];
    }
    if (!nluProperties.engine) {
      throw "need default NLU in fsm properties of " + fsm.id;
    }
    var nlu = PipeManager.getPipe(nluProperties.engine, nluProperties);
    nlu.process(messageObj.text).then((nluObj) => {
      messageObj.intentId = nluObj.intent;
      messageObj.entities = nluObj.entities;
      dblogger.flow("NLU  intent:", nluObj.intent, " entities:", nluObj.entities);
      this.getCreateProcessAndMessage(messageObj, pid, fsm);
    })

  }

  /**
   * process the request
   * @param {*} req 
   * @param {*} res 
   * @param {*} fsm 
   */
  processRequest(req, res, fsm) {
    try {

      var messageObj = this.createMessageObject(req.body, fsm.id);
      let pid = this.getProccessID(messageObj);

      processModel.get(pid, fsm).then((processObj) => {
        this.processNLU(messageObj, pid, processObj, fsm)
      }).catch((err) => {
        if (err == 0) {
          // If process not found
          this.processNLU(messageObj, pid, null, fsm);
        } else {
          dblogger.error('error in get process:', err);
        };
      });
    } catch (err) {
      dblogger.error("error in processRequest " + fsm.id, req, err);
      res.send({
        message: 'error'
      });
    }
  }


  /** see if a process exists, create if needed, and act on it with the messageObj
   * 
   * @param {*} messageObj 
   * @param {*} pid 
   * @param {*} fsm 
   */
  getCreateProcessAndMessage(messageObj, pid, fsm) {
    return new Promise((resolve, reject) => {
      processModel.get(pid, fsm).then((processObj) => {
        processObj.options = fsm.properties;
        processObj.properties(fsm.properties);
        return this.actOnProcess(messageObj, processObj);
      }).catch((err) => {
        // if we simply didnt find such a document
        if (err === 0) {

          this.createNewProcess(fsm, messageObj, pid).then((processObj) => {
            processObj.options = processObj.properties(fsm.properties);

            return this.actOnProcess(messageObj, processObj);
          });
        } else {
          dblogger.error('error in processModel.get:', pid, err);

        }
      });
    });

  }




  /**
   * Creating a new process
   * @param fsm
   * @param messageObj
   * @param pid
   */
  createNewProcess(fsm, messageObj, pid) {
    FSMManager = FSMManager || require("../FSM/fsm-manager"); // require now if not yet required (to avoid circular dependency)
    return new Promise((resolve, reject) => {
      // insert
      dblogger.info({
        cat: 'flow'
      }, 'create new process ', pid);

      FSMManager.startOneProcess(fsm, messageObj, pid).then((process1) => {
        // collect the process
        dblogger.log("process " + pid + " created");

        // continue the chain.
        resolve(process1);
      }).catch((err) => {
        dblogger.error('error in process.save', pid, err);
        // continue the chain.
        reject({
          process: {
            id: pid
          },
          message: messageObj,
          error: err
        });
      });
    });
  }


  /**
   * calcs and sets the language for a process. 
   * @param {*} processObj 
   * @param {*} fsm 
   */
  calcLang(processObj, fsm) {
    var globalData = processObj && processObj.data(); // this is similar to Node.global memory
    var lang = null;
    if (globalData && globalData.lang) {
      lang = globalData.lang;
    } else if (fsm.properties.defaultLang) {
      processObj && processObj.data("lang", fsm.properties.defaultLang);
      lang = fsm.properties.defaultLang;
    }

    return lang;
  }

  /**
   * 
   * @param {*} messageObj 
   * @param {Process} processObj 
   */
  actOnProcess(messageObj, processObj) {
    FSMManager = FSMManager || require("../FSM/fsm-manager"); // require now if not yet required (to avoid circular dependency)

    // log some statistics
    var lastUserTimestamp = Date.now();
    var counter = (processObj.data('lastWakeup') && processObj.data('lastWakeup').counter) || 0;
    var lastWakeup = {
      //  normalize time based on user timezone
      timestamp: lastUserTimestamp,
      // replay leaf if its not the first wakeup
      counter: counter + 1
    };
    processObj.data('lastWakeup', lastWakeup);
    processObj.volatile('replayLastLeaf', !!counter);
    processObj.data('lastUserTimestamp', lastUserTimestamp);

    return new Promise((resolve) => {

      dblogger.flow("going to actOnProcess with ", messageObj);

      FSMManager.actOnProcess(messageObj, processObj).then(() => {
        dblogger.log("message " + messageObj.text + " processed done");
        resolve();
      });
    });
  }

  /**
   * Starts a bot
   * @param fsm
   */
  listenPost(fsm) {
    const userDir = fsm.path.split("/")[1];

    router.post('/' + this.channelName() + '/' + userDir + '/' + fsm.id, (req, res) => {
      this.processRequest(req, res, fsm);
    });

    dblogger.flow('listen for ' + this.channelName() + ' message for ' + fsm.id + ' on ' + config.serverBaseDomain + "/" + config.baseUrl + '/entry/twilio/' + userDir + '/' + fsm.id);
  }


  /**
   * starts a map of fsms
   * @param {*} app 
   * @param {Map} fsms 
   */
  startAll(app, fsms) {
    for (var key in fsms) {
      var fsm = fsms[key];
      this.start(fsm);
    }
    var baseUrl = config.baseUrl;
    app.use(baseUrl + "/entry", router);
  }

}

module.exports = ChatDriverInterface;