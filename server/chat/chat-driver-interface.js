var config = require('config');
var express = require('express');
var dblogger = require('../utils/dblogger');
var PipeManager = require("../pipes/pipemanager");
var processModel = require('../models/processmodel');
var router = express.Router();
var MessageModel = require("../models/message-model");
var _exchanges = [];

var FSMManager;
class ChatDriverInterface {
  constructor() {

  }

  static getInst() {
    throw "need to implement this.getInst()";
  }

  /**
   * @param {*} response 
   * @param {string} toId 
   * @param {*} tree
   * @param {*} node 
   * @param {Process} process 
   * @return {Promise}
   */
  sendMessage(response, toId, tree, node, processObj) {

    var sessionObj = processObj.volatile('sessionObj');
    return new Promise((resolve) => {
      if (sessionObj && sessionObj.responseObj) {
        // TODO: add message running index?  
        var xObj = _exchanges.shift();

        sessionObj.responseObj.json(response);
        sessionObj.responseObj = null;
        processObj.volatile('sessionObj', null);
      } else {
        dblogger.warn("no responseObj found. The message wasnt sent:", response);
      }
      resolve();
    });
  }

  /**
   * process the request
   * @param {*} req 
   * @param {*} res 
   * @param {*} fsm 
   */
  processRequest(req, res, fsm) {
    try {
      var sessionObj = {};
      var messageObj = this.createMessageObject(req.body, fsm.id);
      let pid = this.getProccessID(messageObj);
      _exchanges.push({
        res: res
      });

      sessionObj.responseObj = res;
      this.getProcessByID(pid, fsm, messageObj).then((processObj) => {
        // default processing, no NLU
        messageObj.setIntentId(req.body.intentId);
        for (let ettName in req.body.entities) {
          messageObj.addEntity(ettName, req.body.entities[ettName]);
        }


        var lastUserTimestamp = Date.now();
        // save it
        processObj.volatile('sessionObj', sessionObj);
        // log some statistics
        var counter = (processObj.data('lastWakeup') &&
          processObj.data('lastWakeup').counter) || 0;
        var lastWakeup = {
          //  normalize time based on user timezone
          timestamp: lastUserTimestamp,
          // replay leaf if its not the first wakeup
          counter: counter + 1
        }
        processObj.data('lastWakeup', lastWakeup);
        processObj.volatile('replayLastLeaf', !!counter);

        // act (saves, too)
        FSMManager = FSMManager || require("../FSM/fsm-manager"); // require now if not yet required (to avoid circular dependency)
        FSMManager.actOnProcess(messageObj, processObj).then(() => {
          dblogger.log('acted on process ', processObj.summary());
          // TODO: use sendMessage
          this.sendMessage({
              text: 'acted on process',
              "summary": processObj.summary()
            },
            null,
            null, null,
            processObj);
        });

      }).catch((err) => {
        dblogger.error('error in get process:', err);
        res.status(500).end();
      });

    } catch (err) {
      dblogger.error("error in processRequest " + fsm.id, req, err);
      res.status(500).end();
    }
  }


  stopAll(app) {

  }

  /**
   * create a process id by the generating user id, and the fsmId
   * @param {MessageObject} mOject 
   */
  getProccessID(mOject) {
    return this.pidPrefix() + mOject.fromUser.id + "--" + mOject.toUser.id + "--" + mOject.fsmId;
  }

  pidPrefix() {
    return this.channelName() + "-";
  }

  /**
   * return a message object
   * @param {*} data 
   * @param {*} fsmId 
   */
  createMessageObject(data, fsmId) {

    let mo = new MessageModel({
      id: data.to,
      firstName: data.firstName,
      lastName: data.lastName,
      channel: this.channelName()
    }, {
      id: data.from,

      firstName: data.firstName,
      lastName: data.lastName,
      channel: this.channelName()
    }, this.channelName(), data.payload, this.channelName(), fsmId, data);
    return mo;
  }


  start(fsm) {
    throw "not implemented start " + this.channelName();
  }
  channelName() {
    return "alexa";
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
   * 
   * @param {string} id 
   * @param {MessageModel} messageObj 
   */
  getProcessByID(id, fsm, messageObj) {

    return new Promise((resolve) => {
      //  update the process profile
      processModel.get(id, fsm).then((process1) => {

        // put profile here

        process1.customer = {
          firstName: this.channelName() + " User",
          lastName: id
        };

        resolve(process1);
      }).catch((err) => {
        // if we simply didnt find such a document
        if (err === 0) {
          FSMManager = FSMManager || require("../FSM/fsm-manager"); // require now if not yet required (to avoid circular dependency)

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
        this.actOnProcess(messageObj, processObj).then(() => {
          resolve();
        });
      }).catch((err) => {
        // if we simply didnt find such a document
        if (err === 0) {

          this.createNewProcess(fsm, messageObj, pid).then((processObj) => {
            processObj.options = processObj.properties(fsm.properties);

            this.actOnProcess(messageObj, processObj).then(() => {
              resolve();
            });
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

    dblogger.flow('listen for ' + this.channelName() + ' message for ' + fsm.id + ' on ' + config.serverBaseDomain + "/" + config.baseUrl + '/entry/' + this.channelName() + '/' + userDir + '/' + fsm.id);
  }


  /**
   * starts a map of fsms
   * @param {*} app 
   * @param {Map} fsms 
   */
  startAll(app, fsms) {
    for (var key in fsms) {
      var fsm = fsms[key];
      if (fsm.properties && fsm.properties.channels && fsm.properties.channels.includes(this.channelName())) {
        this.start(fsm);
      }
    }
    var baseUrl = config.baseUrl;
    app.use(baseUrl + "/entry", router);
  }

}

module.exports = ChatDriverInterface;