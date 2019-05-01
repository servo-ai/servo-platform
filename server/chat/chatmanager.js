var _ = require('underscore');
var formbotDriver = require("./formbot").getInst();
var facebookChatDriver = require('./facebook.v2').getInst();
var config = require("../config");
var mycroftService, chatsim;
var alexaService = require('./alexa.v2').getInst();
var utils = require("utils/utils");
var dblogger = require("utils/dblogger");
var fsmEventEmitter = require('FSM/fsm-event-emitter.js');
var ticker = require('FSM/ticker').getInst();
var twilioService = require('./twilio').getInst();
var restPostService = require('./rest-post').getInst();

/**
 * Router for sending messages out to different channels
 * {
        recipient: { id: 1 },
        sender: { id: 2 },
        text: "",
            treeID: TESTPID,
                raw: { }
    }
 */
class ChatManager {
  static createMessageObject(channel, dataObj) {

    switch (channel) {
      case "chatsim":
        chatsim = require('./chatsim').getInst();
        return chatsim.createMessageObject(
          dataObj.recipient,
          dataObj.sender,
          dataObj.text,
          dataObj.treeID,
          dataObj.raw);
    }
  }

  static isChannel(channelName, process) {
    return (process.properties() && process.properties().channels && process.properties().channels.toLowerCase().indexOf(channelName) != -1);

  }
  /***
   * send a message depending on the context
   */
  static sendMessage(prompt, tree, process, node) {

    var processData = process.get('data', tree.id);
    var message = prompt.text || prompt;
    var customer = process.customer;
    if (utils.isEmpty(message) && utils.isEmpty(prompt.payload || prompt.view)) {

      return new Promise(function (resolve, reject) {
        reject("empty image,view and text. nothing sent");
      });
    }
    // statistics
    process.data('lastMessage', Date.now());
    ticker.start(process.id);

    dblogger.flow('chatManager.sendMessages ' + (prompt.text || ""), prompt);
    if (customer && (customer.fbId || customer.channel === "facebook")) {
      return new Promise(function (resolve, reject) {
        var fsmModel = require('models/fsmmodel');
        var fsm = fsmModel.getFSMSync(process.fsm_id, process.userId);
        if (!fsm) {
          dblogger.log('WARNING: no fsm ', process.fsm_id);
        }
        facebookChatDriver.sendMessage(prompt, process, fsm, node).then((postObj) => {

          // save the state
          process.save().then(() => {
            resolve(postObj);
            fsmEventEmitter.messageSent(postObj, process);
          }).catch((err) => {
            dblogger.error(err.message);
          });
        }, function (err) {
          dblogger.error('SENDMESSAGE ERROR:---->', process.summary());
          reject(err);
        });
      });
    }
    if (process.properties() && process.properties().channels && process.properties().channels.toLowerCase().indexOf("formbot") != -1) {
      // not working
      return new Promise(function (resolve, reject) {
        formbotDriver.sendMessage(prompt, process, tree, node).then((postObj) => {

          // save the state
          process.save().then(() => {
            resolve(postObj);
            fsmEventEmitter.messageSent(postObj, process);

          }).catch((err) => {
            dblogger.error(err.message);
          });


        }, function (err) {
          reject(err);
        });
      });
    }
    if (process.properties() && process.properties().channels && process.properties().channels.indexOf("mycroft") != -1) {

      return new Promise(function (resolve, reject) {
        mycroftService = mycroftService || require('./mycroft').getInst();
        mycroftService.sendMessage(prompt, customer.id, tree, node).then((postObj) => {
          // save the state
          process.save().then(() => {
            resolve(postObj);

            fsmEventEmitter.messageSent(postObj, process);
          }).catch((err) => {
            dblogger.error(err.message);
          });
        }, function (err) {
          reject(err);
        });
      });
    }
    if (process.properties() && process.properties().channels &&
      (process.properties().channels.toLowerCase().indexOf("chatsim") != -1)) {
      return new Promise((resolve) => {
        chatsim = require('./chatsim').getInst();

        chatsim.sendMessage(prompt, process.id, tree, node, process).then((postObj) => {

          // save the state
          process.save().then(() => {
            resolve(postObj);

            fsmEventEmitter.messageSent(postObj, process);
          });
        }, function (err) {
          resolve(err);
        }).catch((err) => {
          dblogger.error(err.message);
          resolve(err);
        });
      });
    }
    if (process.properties() && process.properties().channels &&
      (process.properties().channels.toLowerCase().indexOf("websocket") != -1)) {
      return new Promise(function (resolve) {
        let websocket = require('./websocket-driver').getInst();
        websocket.sendMessage(prompt, process.id, tree, node, process).then((postObj) => {

          // save the state
          process.save().then(() => {
            resolve(postObj);

            fsmEventEmitter.messageSent(postObj, process);
          });
        }, function (err) {
          resolve(err);
        }).catch((err) => {
          dblogger.error(err.message);
          resolve(err);
        });
      });
    }
    if (process.properties() && process.properties().channels && process.properties().channels.indexOf('alexa') > -1) {
      return new Promise(function (resolve, reject) {

        alexaService.sendMessage(prompt, process, tree, node).then((postObj) => {

          // save the state
          process.save().then(() => {
            resolve(postObj);
            fsmEventEmitter.messageSent(postObj, process);

          }).catch((err) => {
            dblogger.error(err.message);
          });


        }, function (err) {
          reject(err);
        });
      });
    }
    if (this.isChannel("twilio", process)) {
      return twilioService.sendMessage(prompt, process.id, tree, node, process);
    }

    if (this.isChannel("rest-post", process)) {
      return restPostService.sendMessage(prompt, process.id, tree, node, process);
    }


    if (process.properties() && !process.properties().channels) {
      dblogger.error("no channel detected", process.id, node.id, tree.id);
      return new Promise((resolve) => {
        resolve("no channel detected" + process.id + "/" + node.id + "/" + tree.id);
      });
    }
  }

  /**
   * start all fsms
   */
  static startAll(app, fsms) {

    facebookChatDriver.startAll(app, fsms);

    alexaService.startAll(app, fsms);

    // avoid circular ref
    chatsim = chatsim || require('./chatsim').getInst();
    chatsim.startAll(app, fsms);
    formbotDriver = formbotDriver || require("./formbot").getInst();
    formbotDriver.startAll(app, fsms);
    twilioService.startAll(app, fsms);
    restPostService.startAll(app, fsms);

  }

  /**
   * stop all
   * @param {*} app - the express app
   */
  static stopAll(app) {

    facebookChatDriver.stopAll(app);

    alexaService.stopAll(app);

    // avoid circular ref
    // mycroftService = require('./mycroft').getInst();
    // mycroftService.stopAll();
    twilioService.stopAll(app);

    // avoid circular ref
    chatsim = require('./chatsim').getInst();
    chatsim.stopAll(app);

    restPostService.stopAll(app);

  }
}



module.exports = ChatManager;