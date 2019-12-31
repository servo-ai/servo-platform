var express = require('express');
var router = express.Router();
var _ = require('underscore');
var dblogger = require('../utils/dblogger');
var https = require('https');
var FSMManager;
var processModel = require('../models/processmodel');
var config = require("config");
var ChatDriverInterface = require("./chat-driver-interface");
var PipeManager = require("../pipes/pipemanager");
var MessageModel = require("../models/message-model");

let MAX_TEXT_MESSAGE_LENGTH = 320;
let _inst = null;
class FacebookChatDriver extends ChatDriverInterface {

  /**
   * get instance for singleton operation
   */
  static getInst() {
    if (!_inst) {
      _inst = new FacebookChatDriver();
    }
    return _inst;
  }

  /**
   * send typing indicator
   * @param {*} on 
   */
  sendTyping(on, facebookProperties, toID) {
    let fbObj = {
      "recipient": {
        "id": toID
      },
      "sender_action": on ? "typing_on" : "typing_off"
    };

    return postRequest(facebookProperties.accessToken, '/v3.2/me/messages', fbObj);
  }
  /**
   * 
   */
  stopAll() {}

  /**
   * 
   * @param {*} response 
   * @param {*} process 
   * @param {*} tree 
   * @param {*} node 
   */
  sendMessage(response, process, tree, node) {

    return new Promise(function (resolve, reject) {
      let toID = process.customer.fbId || process.customer.id;
      var optionals = {};

      // backward compat., we now use payload
      response.view = response.view || response.payload || "";
      if (!_.isEmpty(response.text) && !_.isEmpty(response.view)) {
        dblogger.warn("WARNING: on Facebook channel TEXT and VIEW should be mutually exclusive. Ignoring optionals and view " + response.view.substr(0, 10) + "...");

        return handleDelivery(tree.properties.facebook.accessToken, toID, response.text, optionals, resolve, reject);
      }
      if (_.isEmpty(response.text) && _.isEmpty(response.view)) {
        dblogger.warn("Facebook channel, trying to send an empty message. Might happen if AskAndMap has an empty prompt and view");
        return;
      }

      if (!_.isEmpty(response.view)) {
        optionals.view = response.view;
      } else if (node.properties.facebook) {
        optionals = node.properties.facebook;
      }

      if (optionals.view && typeof optionals.view != "object") {
        optionals.view = JSON.parse(optionals.view);
      }
      if (optionals.view && optionals.view.payload && optionals.view.payload.elements && optionals.view.payload.elements.length > 10) {
        optionals.view.payload.elements.splice(10);
        dblogger.warn("WARNING: More than 10 items sent to facebook carusel, where facebook limit is 10. all items after the 10th item will be ignored");
      }

      var text = response.text || "";
      if (_.isObject(text)) {
        text = response.text.text;
        optionals.quick_replies = response.text.quick_replies;
        optionals.metadata = response.text.metadata;
      }

      tree.properties.facebook = tree.properties.facebook || {
        accessToken: tree.properties.accessToken
      };
      // calculate typing delay
      let lastTypingLastTimestamp = process.data('typingLastTimestamp');
      if (lastTypingLastTimestamp || tree.properties.noTypingSignal) {
        let wordsCount = response.text ? response.text.split(' ').length : 0.75;
        let typingDelay = 500 * wordsCount;
        let nowTS = Date.now();
        typingDelay = typingDelay - (nowTS - lastTypingLastTimestamp);
        typingDelay = typingDelay < 0 ? 0 : typingDelay;
        typingDelay = Math.max(typingDelay, 2000);
        if (tree.properties.noTypingSignal) {
          typingDelay = 0;
        }
        setTimeout(() => {
          FacebookChatDriver.getInst().sendTyping(false, tree.properties.facebook, toID).catch((err) => {
            dblogger.error('typing_onoff error:', err);
            handleDelivery(tree.properties.facebook.accessToken, toID, text, optionals, resolve, reject);
          }).then(() => {
            handleDelivery(tree.properties.facebook.accessToken, toID, text, optionals, resolve, reject);
          });

          // if it's a general message, AND we are using typing signals
          if (!node.isQuestion() && !tree.properties.noTypingSignal) {
            // send typing again
            setTimeout(() => {
              FacebookChatDriver.getInst().sendTyping(true, tree.properties.facebook, toID).catch((err) => {
                dblogger.error('typing_onoff error:', err);
              });
              process.data('typingLastTimestamp', Date.now());
            }, 1000);

          }

        }, typingDelay);

      }



    });
  }

  startAll(app, fsms) {
    for (var key in fsms) {
      var fsm = fsms[key];
      if (fsm.properties && fsm.properties.channels && fsm.properties.channels.includes("facebook")) {
        // fb bot must have access token and validationToken
        var facebookOptions = fsm.properties.facebook;
        if (!facebookOptions) {
          dblogger.error('facebookOptions field is required to work a facebook messenger bot!', fsm.id);
        } else if (_.isEmpty(facebookOptions.validationToken)) {
          dblogger.error('No validationToken for fsm ' + fsm.id);
        } else if (_.isEmpty(facebookOptions.accessToken)) {
          dblogger.error('No access token for facebook messenger. FSM is ' + fsm.id);
        } else {
          start(fsm);
        }
      }
    }
    var baseUrl = config.baseUrl;
    app.use(baseUrl + "/entry", router);
  }
}
module.exports = FacebookChatDriver;

function processRequest(req, res, fsm) {
  try {
    // respond immediately
    res.send({
      message: "ACTED ON FB MESSAGE"
    });

    // get or create all the processes whose messages reside in this request
    // TODO: GET USER NAME OF FIRST INTERACTION (https://developers.facebook.com/docs/messenger-platform/identity/user-profile)
    getCreateProcessesAndMessages(req.body, fsm).then(function () {

    }).catch(function (err) {
      if (err.nomessages) {
        dblogger.log("a message arrived with no valid messages. This could be an echo subscription on facebook webhook, or other non-message hooks")
      } else {
        dblogger.error("error in getCreateProcessesAndMessages", err);
      }
    });
  } catch (err) {
    dblogger.error("error in facebook post + /fb/" + fsm.id, req, err);
    res.send({
      message: 'error'
    });
  }
}

/**
 * add menu if exists
 */
function addProfileOptions(fsm) {

  var facebookOptions = fsm.properties.facebook;
  if (!facebookOptions || !facebookOptions.profile) {
    return;
  }

  if (facebookOptions.profile.persistent_menu && facebookOptions.profile.persistent_menu[0].call_to_actions && facebookOptions.profile.persistent_menu[0].call_to_actions.length > 3) {
    dblogger.error('There can be up to 3 items on the persistent menu ' + fsm.id);
    return;
  }
  return postRequest(facebookOptions.accessToken, '/v3.2/me/messenger_profile', facebookOptions.profile);
}

/**
 * Starts a native FB bot
 * in Facebook, the webhook is chatflows.com/entry/fb/<fsm id>
 * the validationToken should be set in the fsm
 * @param fsm
 */
function start(fsm) {
  const userDir = fsm.path.split("/")[1];

  router.post('/fb/' + userDir + '/' + fsm.id, function (req, res) {
    processRequest(req, res, fsm);
  });
  router.get('/fb/' + userDir + '/' + fsm.id, function (req, res) {
    var facebookOptions = fsm.properties.facebook;
    validate(req, res, facebookOptions.validationToken);
  });

  // TODO: re-add profile options. only after stop will reload one fsm only 
  addProfileOptions(fsm);
  dblogger.flow('listen for facebook message for ' + fsm.id + ' on ' + config.serverBaseDomain + "/" + config.baseUrl + '/entry/fb/' + userDir + '/' + fsm.id);
}

/**
 * Validating facebook webhook
 * in Facebook, the webhook is chatflows.com/entry/fb/<fsm id>
 * the validationToken should be set in the fsm
 * @param req
 * @param res
 * @param validationToken
 */
function validate(req, res, validationToken) {
  if (req.query['hub.mode'] === 'subscribe' &&
    req.query['hub.verify_token'] === validationToken) {
    dblogger.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    dblogger.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);
  }
}

/**
 * loop over the text and sending 320 char chunks
 * or send the attachment
 * @param accessToken
 * * @param obj
 * * @param attachment
 */
function handleDelivery(accessToken, toID, text, optionals = {}, resolve, reject) {
  //send view if any
  if (!_.isEmpty(optionals.view)) {
    var obj = getScheme(toID, text, optionals.view);
    postRequest(accessToken, '/v2.7/me/messages', obj).then(function (res) {
      resolve(res);
    }).catch(function (err) {
      reject(err);
    });
  } else {
    var msgChunk = {};
    if (text.length <= MAX_TEXT_MESSAGE_LENGTH) {
      msgChunk.text = text;
      _.extend(msgChunk, optionals);
      var obj = getScheme(toID, msgChunk);
      postRequest(accessToken, '/v2.7/me/messages', obj).then(function (res) {
        resolve(res);
      }).catch(function (err) {
        reject(err);
      });
    } else {
      msgChunk.text = text.substr(0, MAX_TEXT_MESSAGE_LENGTH);
      var obj = getScheme(toID, msgChunk);
      postRequest(accessToken, '/v2.7/me/messages', obj).then(function (res) {
        handleDelivery(accessToken, toID, text.substr(0, MAX_TEXT_MESSAGE_LENGTH), optionals, resolve, reject);
      }).catch(function (err) {
        reject(err);
      });
    }
  }
}

/**
 * Build the post string from an object
 * @param toID string
 * @param message object
 * @param view string
 * @return {any}
 */
function getScheme(toID, message, view = null) {
  var postObj = {
    "recipient": {
      "id": toID
    },
    "message": {}
  };

  if (!_.isEmpty(view)) {
    if (_.isString(view)) {
      view = JSON.parse(view);
    }
    postObj.message = view;
  } else {
    if (!_.isObject(message)) {
      postObj.message = {
        "text": message
      };
    } else {
      postObj.message = message;
    }
  }

  // normalize quick replies
  if (postObj.message.quick_replies) {
    if (postObj.message.quick_replies.length > 11) {
      dblogger.error("too many quick replies" + toID);
      postObj.message.quick_replies = postObj.message.quick_replies.filter((el, i) => {
        return (i <= 10);
      });
      for (let i = 0; i < postObj.message.quick_replies.length; i++) {
        if (postObj.message.quick_replies[i].payload.length > 1000) {
          dblogger.error('quickreply payload too long' + toID);
          postObj.message.quick_replies[i].payload = postObj.message.quick_replies[i].payload.substr(0, 1000);
        }

      }
    }
  }
  return postObj;
}

/**
 * do the actual posting
 * @param accessToken string
 * @param obj object
 * @return {Promise}
 */
function postRequest(accessToken, endpoint, obj) {
  return new Promise((resolve, reject) => {
    var postData = JSON.stringify(obj);
    var postOptions = {
      host: 'graph.facebook.com',
      port: '443',
      path: endpoint + '?access_token=' + accessToken,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    var postReq = https.request(postOptions, function (res) {
      res.setEncoding('utf8');
      var rawData = "";
      res.on('data', (chunk) => rawData += chunk);
      res.on('end', () => {
        var parsedData = {};
        try {
          parsedData = JSON.parse(rawData);
        } catch (ex) {
          dblogger.error('Parse error: FSM FLOW: FacebookChatDriver.postRequest: ', obj);
          dblogger.error('Parse error: FSM FLOW: FacebookChatDriver Response rawData: ' + rawData);
          return reject(ex);
        }
        if (parsedData.error) {
          dblogger.log('FSM FLOW: FacebookChatDriver.postRequest: ', obj);
          dblogger.error('FSM FLOW: FacebookChatDriver Response: ', parsedData.error);
          reject(parsedData.error.message);
        } else {
          dblogger.info({
            cat: 'flow'
          }, 'FacebookChatDriver.postRequest: ', obj);
          dblogger.info({
            cat: 'flow'
          }, 'FacebookChatDriver.postRequest-response: ', parsedData);
          resolve(parsedData);
        }
      });
    });

    postReq.on('error', function (e) {
      dblogger.error('FacebookChatDriver.postRequest: ', obj);
      dblogger.error('FacebookChatDriver.postRequest error:', e.message, obj);
      reject('postRequest error:' + e.message);
    });

    postReq.write(postData);
    postReq.end();
    dblogger.log('Facebook send message', postData);
  });
}

/**
 * Creating a new process
 * @param fsm
 * @param messageObj
 * @param pid
 * @param processIds
 * @param errObjects
 * @param messages
 * @param p
 */
function createNewProcess(fsm, messageObj, pid) {
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
        index: p,
        error: err
      });
    });
  });
}

/**
 * try to get individual process, if not then create it
 * resolve together with the messageObj
 * @param retProc
 * @param fsm
 */
function getCreateProcessAndMessage(messageObj, fsm) {
  var promise = new Promise(function (resolve, reject) {

    var pid = getProccessID(messageObj);
    dblogger.flow("in getCreateProcessAndMessage. PID===>" + pid);

    if (messageObj.text && messageObj.text.toLowerCase() === '/delete') {
      processModel.deleteProcess(pid).then(() => {
        reject();
      });
    }
    if (messageObj.text && messageObj.text.toLowerCase() === '/reset') {
      processModel.deleteProcess(pid).then(() => {
        createNewProcess(fsm, messageObj, pid).then((obj) => {
          resolve(obj);
        });
      });
    }
    processModel.get(pid, fsm).then(function (processObj) {
      processObj.options = fsm.properties;
      processObj.properties(fsm.properties);
      return actOnProcess(messageObj, processObj);
    }).catch(function (err) {
      // if we simply didnt find such a document
      if (err === 0) {

        createNewProcess(fsm, messageObj, pid).then((processObj) => {
          processObj.options = processObj.properties(fsm.properties);

          return actOnProcess(messageObj, processObj);
        });
      } else {
        dblogger.error('error in processModel.get:', pid, err);
        reject('error in processModel.get:', pid, err);
      }
    });
  });
  return promise;
}

function actOnProcess(messageObj, processObj) {
  FSMManager = FSMManager || require("../FSM/fsm-manager"); // require now if not yet required (to avoid circular dependency)

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
  // send typing signal 
  if (!processObj.properties()['noTypingSignal']) {
    processObj.data('typingLastTimestamp', lastUserTimestamp);
    FacebookChatDriver.getInst().sendTyping(true, processObj.properties()['facebook'], messageObj.fromUser.id).catch((err) => {
      dblogger.error('typing_on error:', err);
    });
  }

  return new Promise(function (resolve) {

    dblogger.flow("going to actOnProcess with ", messageObj);

    FSMManager.actOnProcess(messageObj, processObj).then(function () {
      dblogger.log("message " + messageObj.text + " processed done");
      resolve();
    });
  });
}


/***
 * get/create the process document for this conversation
 * @param messageBody
 * @param fsm
 * @return {Promise}
 */
function getCreateProcessesAndMessages(messageBody, fsm) {
  var textQueue = [],
    asrQueue = [];

  //So Promise.all will be usable.
  textQueue.push(Promise.resolve);
  asrQueue.push(Promise.resolve);

  return new Promise(function (resolve, reject) {
    // loop over all entries and prepare process ids and messages arrays
    for (var i = 0; i < messageBody.entry.length; i++) {
      // TODO: loop over all messaging
      var entry = messageBody.entry[i];
      // loop on messagings
      for (var m = 0; entry.messaging && m < entry.messaging.length; m++) {
        var message = entry.messaging[m];
        if (message.message && message.message.is_echo) {
          // ignore messages sent by your page (at this point). TODO: dont ignore
          continue;
        }

        // get the text
        var messageText = (message.message && message.message.quick_reply && message.message.quick_reply.payload) ||
          (message.message && message.message.text) ||
          (message.postback && message.postback.payload.toString());


        // if simple text
        if (messageText) {
          if (fsm.properties.nlu) {
            var messageObj = createMessageObject(message.recipient, message.sender, "text", messageText, "facebook", fsm.id);
            var pid = getProccessID(messageObj);

            textQueue.push(processModel.get(pid, fsm).then(function (proccessObj) {
              var globalData = proccessObj.data();
              var lang = null;
              if (globalData && globalData.lang) {
                lang = globalData.lang;
              } else if (fsm.properties.defaultLang) {
                proccessObj.data("lang", fsm.properties.defaultLang);
                lang = fsm.properties.defaultLang;
              }
              var nluProperties = fsm.properties.nlu;
              if (nluProperties[lang]) {
                nluProperties = fsm.properties.nlu[lang];
              }
              if (!nluProperties.engine) {
                throw "need default NLU in fsm properties of " + fsm.id;
              }
              var nlu = PipeManager.getPipe(nluProperties.engine, nluProperties);
              nlu.process(messageText).then(function (nluObj) {
                messageObj.intentId = nluObj.intent;
                messageObj.entities = nluObj.entities;
                dblogger.flow("NLU  intent:", nluObj.intent, " entities:", nluObj.entities)
                getCreateProcessAndMessage(messageObj, fsm).then();
              });
            }).catch(function (err) {
              // If process not found
              var lang = null;
              if (fsm.properties.defaultLang) {

                lang = fsm.properties.defaultLang;
              }
              var nluProperties = fsm.properties.nlu;
              if (nluProperties[lang]) {
                nluProperties = fsm.properties.nlu[lang];
              }
              var nlu = PipeManager.getPipe(nluProperties.engine, nluProperties);
              nlu.process(messageText).then(function (nluObj) {
                messageObj.intentId = nluObj.intent;
                messageObj.entities = nluObj.entities;
                getCreateProcessAndMessage(messageObj, fsm).then((processObj) => {
                  processObj.data("lang", fsm.properties.defaultLang);
                });
              });
            }));
          } else {
            messageObj = createMessageObject(message.recipient, message.sender, "text", messageText, "facebook", fsm.id);
            textQueue.push(getCreateProcessAndMessage(messageObj, fsm));
          }
        } else {
          //loop on attachments
          var attachments = entry.messaging[m].message && entry.messaging[m].message.attachments || [];
          for (var a = 0; a < attachments.length; a++) {
            var attachment = attachments[a];
            if (attachment.type == "audio") {
              var audioURL = attachment.payload.url;
              var googleSpeech = PipeManager.getPipe("google-speech", {});
              var converter = PipeManager.getPipe("converter", {});
              asrQueue.push(
                converter.download(audioURL)
                .then(converter.run)
                .then(googleSpeech.recognize)
                .then((text) => {
                  return new Promise((resolve, reject) => {
                    var messageObj = createMessageObject(message.recipient, message.sender, "audio", text, "facebook", fsm.id);
                    textQueue.push(getCreateProcessAndMessage(messageObj, fsm));
                    resolve(1);
                  });
                }).catch((err) => {
                  dblogger.error("Error proccessing ASR from: " + audioURL, err);
                  reject("Error proccessing ASR from: " + audioURL);
                })
              );
            } else if (attachment.type == "image") {
              var imageURL = attachment.payload.url;
              //console.log(imageURL);
              let messageObj = createMessageObject(message.recipient, message.sender, "image", imageURL, "facebook", fsm.id);
              messageObj.intentId = "ImageIntent";
              messageObj.addEntity('intentId', "ImageIntent");
              messageObj.addEntity('imageType', imageURL.toLowerCase().indexOf(".png") >= 0 ? "PNG" : "JPG");
              textQueue.push(getCreateProcessAndMessage(messageObj, fsm));
              resolve(1);
            }
          }
        }
      }
    }
    if (asrQueue.length > 1) {
      Promise.all(asrQueue).then(() => {

        if (textQueue.length > 1) {
          Promise.all(textQueue).then(() => {

            resolve();
          });
        }
      }).catch((err) => {
        dblogger.error(err.message);
        reject(err);
      });
    } else {
      resolve();
    }
  }).catch((ex) => {
    dblogger.error('error in getCreateProcessesAndMessages', ex);
  });
}

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
function createMessageObject(recipient, sender, type, text, messengerType, fsmID) {
  recipient = {
    id: recipient.id,
    firstName: fsmID,
    lastName: '',
    channel: 'facebook'
  };
  sender = {
    id: sender.id,
    firstName: 'user',
    lastName: '',
    channel: 'facebook'
  };

  return new MessageModel(recipient, sender, type, text, messengerType, fsmID);
}

function getProccessID(messageObj) {
  return 'fb2-sender:' + messageObj.fromUser.id + '-recipient:' + messageObj.toUser.id;
}