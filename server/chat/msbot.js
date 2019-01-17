var Promise = require('promise');
var _ = require('underscore');
var builder = require('botbuilder');
var connector = require('botconnector');
var express = require('express');
var url = require('url');
var msRest = require('ms-rest');

var config = require('../config');
var utils = require('../utils/utils');
var dblogger = require('../utils/dblogger');
var FSMManager; // circular dependency; require at runtime
var fsmModel = require("../models/fsmmodel.js");
var processModel = require("../models/processmodel.js");

var router = express.Router();
var credentials = new msRest.BasicAuthenticationCredentials(config.msbot.appId, config.msbot.appSecret);

var MSBot = {};
module.exports = MSBot;

var baseChat = require("./base-chat");
_.extend(MSBot, baseChat);
/*
 received: { type: 'Message',
 id: 'dQsFLawuQ7',
 conversationId: 'BgW6Ig1xSBm55QI1To2jY2N51RU1CpEFmvYAI883UEniCAx',
 created: '2016-05-16T15:47:53.3343207Z',
 language: 'en',
 text: 'dssds',
 attachments: [],
 from:
 { name: 'devportal',
 channelId: 'test',
 address: 'devportal',
 id: 'JMQ0KLCKN6R',
 isBot: false },
 to:
 { name: 'FlightStatus',
 channelId: 'test',
 address: 'ServoFlightStatus1',
 id: 'ServoFlightStatus1',
 isBot: true },
 participants:
 [ { name: 'devportal',
 channelId: 'test',
 address: 'devportal',
 id: 'JMQ0KLCKN6R',
 isBot: false },
 { name: 'FlightStatus',
 channelId: 'test',
 address: 'ServoFlightStatus1',
 id: 'ServoFlightStatus1',
 isBot: true } ],
 totalParticipants: 2,
 mentions: [],
 channelConversationId: 'ServoFlightStatus1',
 botUserData: {},
 botConversationData: { 'BotBuilder.Data.SessionId': '55781340-1b13-11e6-84d0-9f6cab19f708' },
 botPerUserInConversationData: {},
 hashtags: [] }
 
 
 */

/**
 * util func to create an obj
 * @param process
 */
function constructMessageObj(process) {
  var toObj = {
    // userId:'USER156', not used
    firstName: 'Workflow' + process.fsm_id,
    lastName: 'Servo'
  };
  // got the process, build a message object
  var messageObj = {
    // switch to and from
    fromUser: process.customer,
    toUser: toObj,
    // that this from the chat window
    text: process.session.message.text,
    // take these from the process entity
    fsm_id: process.fsm_id,
    processId: process.id,
    messengerType: "MSBot"
  };

  return messageObj;
}

/**
 * start a bot
 * @param app
 * @param fsm
 */
MSBot.start = function (app, fsm) {

  // Create bot and add dialogs
  var bot = new builder.BotConnectorBot({
    appId: config.msbot.appId,
    appSecret: config.msbot.appSecret
  });
  bot.add('/', function (session) {
    //session.send();
    console.log("arrived MS--------:", session.message.text);
  });

  // listen for incoming on this URL
  console.log('msbot - router start listen on', fsm.originPath);
  router.post(fsm.originPath, function (req, res) {
    console.log('got msbot call')
    bot.listen()(req, res);
  });


  // listen on any incoming message
  bot.use(function (session, next) {
    console.log('received:', session.message);
    // if the process hasnt started yet
    if (!session.conversationData.processId) {
      throw "todo: getCreateMessagesAndProcesses, then actonProcess. like in FB";

      console.log('new process');
      // start it - its a start state, so DO NOT run state entry processor, and
      // no sendMessage. this state should treat the text as a reply. therefore,
      // only run the intentProcessor
      var customerObj = session.message.from;
      customerObj.firstName = customerObj.name; // adhere to our internal structure
      FSMManager.startIncomingProcess(fsm, customerObj, session.message.text, "MSBOT", session).then(function (process) {

        // save the process in the bot connector service @ Microsoft server
        session.conversationData.processId = process.id;

        // and start the first state
        dblogger.log('msbot startIncomingProcess good', process.id);

      }).catch(function (err) {
        dblogger.error('ERR in startIncomingProcess - creating new process:', err);
        // TODO: fail the session
      });
    } else {
      console.log('old process', session.conversationData.processId)
      // process is there. find it and act on it
      processModel.getProcessById(session.conversationData.processId).then(function (process) {
        // attach a volatile session so we could send message
        process.session = session;
        process.fsm = fsm;
        process.fsm_id = fsm.id;
        process.channelId = session.message.from.channelId;
        console.log('msbot found process', process.id)


        console.log('going to actOnProcess with ', session.message.text, process.currentStateName)
        // and act
        FSMManager.actOnProcess(constructMessageObj(process), process,
          function (out) {
            console.log('acted on process:', out);
          });

      }).catch(function (err) {
        dblogger.log('WARNING: A CONVERSATION ID WITHOUT A PROCESS. This means that the conversation with this user was logged in a different db. Creating a new process here');
        var customerObj = session.message.from;
        customerObj.firstName = customerObj.name; // adhere to our internal structure
        FSMManager.startIncomingProcess(fsm, customerObj, session.message.text, "MSBOT", session).then(function (process) {

          // save the process in the bot connector service @ Microsoft server
          session.conversationData.processId = process.id;

        }).catch(function (err) {
          dblogger.error('ERR in startIncomingProcess - creating new process:', err);
          // TODO: fail the session
        });
      });
    }
    next();
  });

}

/**
 * start all the process types which are on MSBots
 TODO: recall when FSM/processor changes
 */
MSBot.startAll = function (app) {

  fsmModel.getAllFSMs().then(function (fsms) {
    FSMManager = require("../FSM/fsm-manager.js"); // require now to avoid circular dependency
    for (var i = 0; i < fsms.length; i++) {
      var fsm = fsms[i];

      if (fsm.msbot) {
        MSBot.start(app, fsm)
      }
    }
    app.use("/entry", router);
  })
}


/**
 *
 * @param session
 * @param message
 * @param htmlSnippet
 * @return {Promise}
 */
MSBot.sendMessage = function (session, message, images) {
  var promise = new Promise(function (resolve, reject) {

    /**
     * Sends message to MSBot
     * 
     * @return {undefined}
     */
    function sendMessage(imgUrl) {

      var sent;
      if (!dbSession) {
        msg.setText(session, message);
        console.log('------------- MSG object --------------', msg);

        sent = session.send(msg);
        if (sent) {
          console.log('Message sent to MSBot Successfully using session. ' + message + " " + imgUrl);
        } else {
          dblogger.error('Problem sending message to MSBot.' + message + " " + imgUrl);
        }
        // anyways resolve
        resolve({
          text: message,
          imageUrl: imgUrl
        });
      } else {
        var options = {
          customHeaders: {
            'Ocp-Apim-Subscription-Key': credentials.password
          }
        };
        client.messages.sendMessage(msg, options, function (err, result, request, response) {
          if (!err && response && response.statusCode >= 400) {
            dblogger.error('Message rejected with "' + response.statusMessage + '"');
          }
          // anyways resolve
          resolve({
            text: message,
            imageUrl: imgUrl
          });
        });
      }
    }

    var msg = new builder.Message();

    // if the session object was not new-ed by an incoming message, but taken from db
    var dbSession = !session.vgettext; // function on the prototype
    if (dbSession) {

      var client = new connector(credentials);

      if (!session.message) {
        dblogger.error('no message on session!');
        // TODO: construct a message from scratch
      }


      var ses = session;
      msg.from = ses.message.to;
      msg.to = ses.message.replyTo ? ses.message.replyTo : ses.message.from;
      msg.replyToMessageId = ses.message.id;
      msg.conversationId = ses.message.conversationId;
      msg.channelConversationId = ses.message.channelConversationId;
      msg.channelMessageId = ses.message.channelMessageId;
      msg.participants = ses.message.participants;
      msg.totalParticipants = ses.message.totalParticipants;

      msg.text = message;
      msg.language = "en";

    }

    if (images) {
      _.each(images, function (imgUrl) {
        imgUrl = imgUrl || '';
        console.log('adding attachment to msbot message: ' + imgUrl);
        msg.addAttachment({
          fallbackText: message,
          contentType: 'image/jpeg',
          contentUrl: imgUrl
        });
        sendMessage(imgUrl);
      });

    } else {
      sendMessage();
    }

  });

  return promise;
}
