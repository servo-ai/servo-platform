var Promise = require('promise');
var express = require('express');
var _ = require('underscore');
var Process = require('../FSM/core/process')
var dblogger = require('../utils/dblogger');
var https = require('https');
var fs = require('fs');
var fsmModel = require("../models/fsmmodel.js");
var router = express.Router();
var FSMManager;
var processModel = require('../models/processmodel');
var utils = require("../utils/utils");
var config = require("../config");
var baseChat = require("./base-chat");
var alexaVerifier = require('alexa-verifier');
var bodyParser = require('body-parser');
var Tick = require('../FSM/core/tick');

var Alexa = function () {};
module.exports = Alexa;
_.extend(Alexa, baseChat);

function isObject(x) {
  return typeof x === 'object' && x !== null;
}

class AlexaExchangeObj {
  constructor(req, res) {
    this.req = req;
    this.res = res;
  }

}

_intentsCodes = {
  "AMAZON.YesIntent": "yes",
  "AMAZON.NoIntent": "no",
  "AMAZON.CancelIntent": "cancel",
  "AMAZON.FOUR_DIGIT_NUMBER": "number",
  "AMAZON.StartOverIntent": "startover",
  "AMAZON.StopIntent": "stop"
}
var _exchanges = [];

function sendResponse(text, sessionObj) {
  if (!sessionObj)
    return;
  // take the response
  // TODO: add message running index?  
  var xObj = _exchanges.shift();
  // and send it back
  var alexaResponse = {
    "version": "1.0",
    "response": {
      "shouldEndSession": !!sessionObj.shouldEndSession,
      "outputSpeech": {
        "type": "SSML",
        "ssml": "<speak>" + text + "</speak>"
      }
    }
  }
  dblogger.info('sending an alexa response-->', alexaResponse.shouldEndSession, alexaResponse)
  if (sessionObj.responseObj) {
    sessionObj.responseObj.json(alexaResponse);
    sessionObj.responseObj = null;
  } else {
    dblogger.warn("no responseObj found. The message wasnt sent: ", text);
  }
  // xObj && xObj.res && xObj.res.json(alexaResponse);
  // if (!xObj || !xObj.res ) {
  //     dblogger.error('no response object for Alexa send')
  // } 
}

/**
 * agregate the message until its time
 * @param {*} message 
 */
Alexa.aggregateMessages = function (toSpeak, process, tree, node) {
  return new Promise((resolve, reject) => {

    // we are on alexa
    if (node.name !== 'CardWaitAction' && node.name !== 'AskAndWait') {
      // aggregate and save
      var messagesAggregator = process.data('messagesAggregator') || "";
      if (messagesAggregator !== "") {
        messagesAggregator += ". ";
      }
      messagesAggregator += toSpeak;
      process.data('messagesAggregator', messagesAggregator);
      resolve(-1); // not yet

      // set a timeout for this
      setTimeout(() => {
        messagesAggregator = process.data('messagesAggregator') || "";
        if (messagesAggregator !== "") {
          // send from the available response
          sendResponse(messagesAggregator, process.volatile('session'));

          process.data('messagesAggregator', "");

        }
      }, process.properties().aggregateTimeout || 5500);
    } else {
      // send and reset
      var messagesAggregator = process.data('messagesAggregator') || "";
      if (messagesAggregator !== "") {
        messagesAggregator += ". ";
      }
      messagesAggregator += toSpeak;
      process.data('messagesAggregator', "");
      resolve(messagesAggregator);
    }


  })

}

Alexa.processById = function (id, fsm, messageObj) {

  return new Promise(function (resolve, reject) {
    //  update the process profile
    processModel.get(id, fsm).then((process1) => {

      // put profile here

      process1.customer = {
        firstName: "Alexa User",
        lastName: messageObj.session.user.userId
      };


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
    })

  });

}
/***
 * send a message natively to Alexa
 * @param promptHtml
 * @param toId
 * @return {Promise}
 */
Alexa.sendMessage = function (promptHtml, process, tree, node) {

  return new Promise(function (resolve, reject) {
    var toSpeak;
    if (typeof promptHtml == "string") {
      var message = promptHtml;
      promptHtml = {};
      promptHtml.text = message;
    }
    if (promptHtml.text) {
      toSpeak = promptHtml.text
    } else if (promptHtml.payload) {
      var payload = JSON.parse(promptHtml.payload);
      toSpeak = payload.cards[0].text;
    } else {
      dblogger.error('nothing to send - ', promptHtml);
    }

    Alexa.aggregateMessages(toSpeak, process, tree, node).then((text) => {
      // if time to send
      if (text !== -1) {
        sendResponse(text, process.volatile('session'));
      }

      resolve();
    });

  });
}
Alexa.stopAll = function () {}
/**
 * Start an Alexa FSM
 */
Alexa.start = function (app, fsm) {

  /**
   * process the incoming request
   */
  Alexa.processRequest = function (req, res) {
    FSMManager = FSMManager || require("../FSM/fsm-manager"); // require now if not yet required (to avoid circular dependency)
    var messageObj = req.body;
    var sessionObj = {};
    try {

      // convert to intent
      var intentId = messageObj.request && messageObj.request.intent && messageObj.request.intent.name;
      // translate from AMAZON intents to ours
      messageObj.intentId = _intentsCodes[intentId] || intentId;
      var processID = fsm.properties.userId || "al:" + messageObj.session.user.userId;
      getProcessById(processID, fsm, messageObj).then((processObj) => {

        messageObj.fromUser = {
          id: messageObj.session.user.userId,
          firstName: messageObj.session.user.userId,
          lastName: "",
          channel: "alexa"
        };

        dblogger.flow(' alexa message RECEIVED:', messageObj.intentId, 'processID:', processID);

        // TODO: PUT RES ON messageObj, otherwise we might get out of order
        _exchanges.push({
          res: res
        });

        sessionObj.responseObj = res;
        var lastUserTimestamp = Date.now();

        if (messageObj.wakeUp = (messageObj.request.type === 'LaunchRequest')) {
          processObj.resetMemory();
          // save it
          processObj.volatile('session', sessionObj);
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

          processObj.data('lastUserTimestamp', messageObj.request.timestamp);
          // act (saves, too)
          FSMManager.actOnProcess(messageObj, processObj).then(function () {
            dblogger.log('acted on process ', processObj.summary(), 'res:', res);
          })

        } else {
          processObj.id = processID;
          processObj.volatile('session', sessionObj);
          processObj.customer = messageObj.fromUser;

          if (messageObj.request.type === 'SessionEndedRequest') {
            messageObj.intentId = "stop";
            sessionObj.shouldEndSession = true;

            FSMManager.resetTargets(processObj.id);
            // TODO: RUN A SESSION ENDED CONTROLLER AND ACTION
          } // act

          // save last timestamp
          processObj.data('lastUserTimestamp', messageObj.request.timestamp);
          FSMManager.actOnProcess(messageObj, processObj).then(function (res) {
            dblogger.log('acted on process ', processObj.summary());
          });

        }
      }).catch((err) => {
        dblogger.error(err);
      })

    } catch (ex) {
      dblogger.error(ex.message, 'error in Alexa.processRequest', ex);
    }
  }

  // so we get acess to raw body */
  app.use(bodyParser.json({
    verify: function getRawBody(req, res, buf) {
      req.rawBody = buf.toString();
      console.log('body verified....')
    }
  }));

  /***
   *  entry point
   */

  router.post('/' + fsm.id, Alexa.processRequest);

  // GET FOR THE VERIFICATION
  router.get('/' + fsm.id, function (req, res) {
    res.send('alexa back');
  });

  console.log('listen for Alexa message for ' + fsm.id + ' on ' + config.serverBaseDomain + config.baseUrl + "/alexa/" + fsm.id);
}


Alexa.startAll = function (app, fsms) {
  for (var key in fsms) {
    var fsm = fsms[key];
    if (fsm.properties && fsm.properties.channels && fsm.properties.channels.indexOf("alexa") >= 0) {
      Alexa.start(app, fsm);
    }
  }
  var baseUrl = config.baseUrl;
  app.use(baseUrl + "/entry/alexa/", router);
}

/**
 * verify the request
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
function requestVerifier(req, res, next) {
  alexaVerifier(
    req.headers.signaturecertchainurl,
    req.headers.signature,
    JSON.stringify(req.body),
    function verificationCallback(err) {
      if (err) {
        dblogger.warn('verification error!!', err)
        res.status(401).json({
          message: 'Verification Failure',
          error: err
        });
      } else {
        next();
      }
    }
  );
}