var express = require('express');
var _ = require('underscore');
var dblogger = require('../utils/dblogger');
var router = express.Router();
var FSMManager;
var processModel = require('../models/processmodel');
var config = require("../config");
var alexaVerifier = require('alexa-verifier');
var bodyParser = require('body-parser');
var PipeManager = require("../pipes/pipemanager");
var ChatDriverInterface = require("./chat-driver-interface");

var _exchanges = [];
const PUSH_MESSAGE_TIMEOUT_SEC = 4000;
let _inst = null;
/**
 * Alexa driver class 
 */
class AlexaChatDriver extends ChatDriverInterface {
  static getInst() {
    if (!_inst) {
      _inst = new AlexaChatDriver();
    }
    return _inst;
  }
  /**
   * Main output 
   * @param {*} response 
   * @param {*} toProcess 
   * @param {*} tree 
   * @param {*} node 
   * @return {Promise} 
   */
  sendMessage(response, toProcess, tree, node) {
    return new Promise((resolve) => {
      var text = "";
      if (response.text) {
        text = response.text;
      } else if (response.payload) {
        var payload = JSON.parse(response.payload);
        text = payload.cards[0].text;
      }
      var messageObj = getScheme(text);
      var reportMsg = 'message aggregated';
      this.getProcessByID(toProcess.id, tree, messageObj).then((processObj) => {
        aggregateMessages(text, processObj, tree, node).then((text) => {
          var sessionObj = processObj.volatile('sessionObj');
          if (!sessionObj) {
            dblogger.error('no session ')
            return;
          }
          messageObj = getScheme(text, !!sessionObj.shouldEndSession);
          if (text) {
            sendResponse(messageObj, processObj);
            reportMsg = 'message sent: ' + text;
          }
          resolve(reportMsg);
        });
      });

    });
  }

  /**
   * 
   * @param {Object} app 
   * @param {Object} fsms 
   */
  startAll(app, fsms) {
    for (var key in fsms) {
      var fsm = fsms[key];
      if (fsm.properties && fsm.properties.channels && fsm.properties.channels.indexOf("alexa") >= 0) {
        this.start(fsm);
      }
    }

    // so we get acess to raw body */
    app.use(bodyParser.json({
      verify: function getRawBody(req, res, buf) {
        req.rawBody = buf.toString();
        //dblogger.log('body verified....');
      }
    }));

    var baseUrl = config.baseUrl;
    app.use(baseUrl + "/entry/", router);
  }

  /**
   * Starts a alexa bot
   * in Facebook, the webhook is chatflows.com/entry/mycroft/<tree id>
   * the validationToken should be set in the tree
   * @param tree
   */
  start(fsm) {
    const userDir = fsm.path.split("/")[1];


    /***
     *  entry point
     */
    router.post('/alexa/' + userDir + '/' + fsm.id, (req, res) => {
      this.processRequest(req, res, fsm);
    });

    //router.post('/' + fsm.id, processRequest);

    // GET FOR THE VERIFICATION
    router.get('/' + fsm.id, (req, res) => {
      res.send('alexa respond back');
    });

    console.log('listen for Alexa message for ' + fsm.id + ' on ' + config.serverBaseDomain + config.baseUrl + "/alexa/" + fsm.id);
  }

  /**
   * 
   * @param {any} req 
   * @param {any} res 
   * @param {Fsm} fsm 
   */
  processRequest(req, res, fsm) {
    FSMManager = FSMManager || require("../FSM/fsm-manager"); // require now if not yet required (to avoid circular dependency)

    var nlu = PipeManager.getPipe("alexa", {});

    var bodyAlexa = req.body;
    var dataAlexa = {
      to: req.body.session.application.applicationId,
      from: req.body.session.user.userId
    }
    let messageObj = this.createMessageObject(dataAlexa, fsm.id);

    var sessionObj = {};
    try {

      nlu.process(bodyAlexa).then((nluObj) => {
        messageObj.entities = nluObj.entities;
        messageObj.setIntentId(nluObj.intent);


        var processID = this.getProccessID(messageObj);
        this.getProcessByID(processID, fsm, messageObj).then((processObj) => {

          dblogger.info({
            cat: 'flow'
          }, 'Alexa message RECEIVED:', messageObj.intentId, 'processID:', processID);

          // TODO: PUT RES ON messageObj, otherwise we might get out of order
          _exchanges.push({
            res: res
          });

          sessionObj.responseObj = res;
          var lastUserTimestamp = Date.now();

          if (bodyAlexa.wakeUp = (bodyAlexa.request.type === 'LaunchRequest')) {
            //processObj.resetMemory();
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

            processObj.data('lastUserTimestamp', bodyAlexa.request.timestamp);
            // act (saves, too)
            FSMManager.actOnProcess(messageObj, processObj).then(() => {
              dblogger.log('acted on process ', processObj.summary());
            });

          } else {
            processObj.id = processID;
            processObj.volatile('sessionObj', sessionObj);
            processObj.customer = messageObj.fromUser;

            if (bodyAlexa.request.type === 'SessionEndedRequest') {
              messageObj.intentId = "StopIntent";
              sessionObj.shouldEndSession = true;
              try {
                FSMManager.resetTargets(processObj.id);
                // TODO: RUN A SESSION ENDED CONTROLLER AND ACTION
              } catch (ex) {
                dblogger.error('cant resetTargets', ex);
              }

            } // act

            // save last timestamp
            processObj.data('lastUserTimestamp', bodyAlexa.request.timestamp);
            FSMManager.actOnProcess(messageObj, processObj).then((res) => {
              dblogger.log('acted on process ', processObj.summary());
            });

          }
        }).catch((err) => {
          dblogger.error(err.message);
        })
      });
    } catch (ex) {
      dblogger.error(ex.message, 'error in Alexa processRequest');
    }
  }

}


module.exports = AlexaChatDriver;

function sendResponse(messageObj, processObj) {
  var sessionObj = processObj.volatile('sessionObj');
  if (sessionObj && sessionObj.responseObj) {
    // TODO: add message running index?  
    var xObj = _exchanges.shift();

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

var _tids = {};

function aggregateMessages(text, processObj, tree, node) {
  return new Promise((resolve, reject) => {
    var messagesAggregator = processObj.data('messagesAggregator') || "";
    if (messagesAggregator !== "") {
      messagesAggregator += ". ";
    }
    messagesAggregator += text;

    // aggregate and save
    processObj.data('messagesAggregator', messagesAggregator);

    if (!(node.name === 'AskAndWait' && node.name === 'AskAndMap') && !node.properties.pushMessageOut) {
      // if a message sending arrived when we are in the middle of a delay
      if (_tids[process.id]) { // then we need to clear it, and re-establish a new timeout
        clearTimeout(_tids[processObj.id]);
      }
      // set a timeout for this
      _tids[processObj.id] = setTimeout(() => {
        messagesAggregator = processObj.data('messagesAggregator') || "";
        if (messagesAggregator !== "") {
          // send from the available response
          var sessionObj = processObj.volatile('sessionObj');
          if (!sessionObj) {
            return;
          }
          let finalMessageObj = getScheme(messagesAggregator, !!sessionObj.shouldEndSession);

          sendResponse(finalMessageObj, processObj);
          processObj.data('messagesAggregator', "");
          _tids[process.id] = undefined;

        }
      }, (processObj.pushMessageTimeoutSec * 1000) || PUSH_MESSAGE_TIMEOUT_SEC);
      resolve(); // dont send yet
    } else {
      // send and reset
      processObj.data('messagesAggregator', "");
      resolve(messagesAggregator);
    }
  });
}




/**
 * Build the post string from an object
 * @param toID string
 * @param message object
 * @param view string
 * @return {Promise}
 */
function getScheme(message, shouldEnd = undefined) {
  var postObj = {
    "version": "1.0",
    "response": {
      "shouldEndSession": shouldEnd,
      "outputSpeech": {
        "type": "SSML",
        "ssml": "<speak>" + message + "</speak>"
      }
    }
  };
  return postObj;
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
        dblogger.warn('Verification error:', err)
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