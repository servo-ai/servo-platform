var Promise = require('bluebird');

var express = require('express');

var router = express.Router();

var _ = require('underscore');

var dblogger = require('../utils/dblogger');

var https = require('https');

var FSMManager;

var processModel = require('../models/processmodel');

var config = require("../config");

var ChatDriverInterface = require("./chat-driver-interface");

var PipeManager = require("../pipes/pipemanager");

var MessageModel = require("../models/message-model");



let MAX_TEXT_MESSAGE_LENGTH = 320;

let _inst = null;



class cal4uChatDriver extends ChatDriverInterface {



  static getInst() {

    if (!_inst) {

      _inst = new cal4uChatDriver();

    }

    return _inst;

  }





  startAll(app, fsms) {

    for (var key in fsms) {

      var fsm = fsms[key];

      if (fsm.properties && fsm.properties.channels && fsm.properties.channels.includes("chatsim") && key == 'cal4u') {

        start(fsm);

      }

    }

    var baseUrl = config.baseUrl;

    app.use(baseUrl + "/entry", router);

  }

}

module.exports = cal4uChatDriver;



function start(fsm) {

  const userDir = fsm.path.split("/")[1];



  router.post('/cal4u/' + userDir + '/' + fsm.id, function (req, res) {

    processRequest(req, res, fsm);



    //router.post('/' + fsm.id, processRequest);

  });



  //router.get('/cal4u/' + userDir + '/' + fsm.id, function (req, res) {  

  // validate(req, res, facebookOptions.validationToken);

  //});



  //addProfileOptions(fsm);

  dblogger.flow('listen for cal4u message for ' + fsm.id + ' on ' + config.serverBaseDomain + "/" + config.baseUrl + '/entry/cal4u/' + userDir + '/' + fsm.id);

}



function processRequest(req, res, fsm) {

  FSMManager = FSMManager || require("../FSM/fsm-manager");

  try {

    // respond immediately

    /*res.send({

      message: "ACTED ON CAL4U MESSAGE"

    });*/



    var messageObj = req.body;

    var sessionObj = {};

    var lastUserTimestamp = Date.now();

    var processID = fsm.properties.userId || getProccessID(messageObj);



    getProcessByID(processID, fsm, messageObj).then((processObj) => {

      // get or create all the processes whose messages reside in this request

      // TODO: MAKE A QUEUE AND WORK ON THE QUEUE IN FSM

      //actOnProcess(req.body, fsm).then(function () {

      //});

      sessionObj.responseObj = res;

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



      processObj.data('lastUserTimestamp', messageObj.request.timestamp);

      // act (saves, too)

      FSMManager.actOnProcess(messageObj, processObj).then(function () {

        //dblogger.log('acted on process ', processObj.summary());

        res.send({

          message: 'finished'

        });

      });

    }).catch(function (err) {

      if (err.nomessages) {

        dblogger.log("a message arrived with no valid messages. This could be an echo subscription on facebook webhook, or other non-message hooks")

      } else {

        dblogger.error("error in getCreateProcessesAndMessages", err);

      }

      res.send({

        message: 'error'

      });

    })

  } catch (err) {

    dblogger.error("error in cal4u post + /cal4u/" + fsm.id, err);

    res.send({

      message: 'error'

    });

  }



}



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



        var messageText = (message.message && message.message.quick_reply && message.message.quick_reply.payload) ||

          (message.message && message.message.text) ||

          (message.postback && message.postback.payload.toString());



        if (messageText) {

          if (fsm.properties.nlu) {

            var messageObj = createMessageObject(message.recipient, message.sender, "text", messageText, "cal4u", fsm.id);

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

            messageObj = createMessageObject(message.recipient, message.sender, "text", messageText, "cal4u", fsm.id);

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

                    var messageObj = createMessageObject(message.recipient, message.sender, "audio", text, "cal4u", fsm.id);

                    textQueue.push(getCreateProcessAndMessage(messageObj, fsm));

                    resolve(1);

                  });

                }).catch((err) => {

                  dblogger.error("Error proccessing ASR from: " + audioURL, err);

                  reject("Error proccessing ASR from: " + audioURL);

                })

              );

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



function processRequest2(req, res, fsm) {


  FSMManager = FSMManager || require("../FSM/fsm-manager"); // require now if not yet required (to avoid circular dependency)



  var messageObj = req.body;

  var sessionObj = {};

  try {





    var processID = fsm.properties.userId || getProccessID(messageObj);

    getProcessByID(processID, fsm, messageObj).then((processObj) => {





      messageObj.fromUser = {

        lastName: "",

        channel: "cal4u"

      };



      dblogger.info({

        cat: 'flow'

      }, 'cal4u message RECEIVED:', messageObj.intentId, 'processID:', processID);



      // TODO: PUT RES ON messageObj, otherwise we might get out of order

      /*_exchanges.push({

        res: res

      });*/



      sessionObj.responseObj = res;

      var lastUserTimestamp = Date.now();



      if (messageObj.wakeUp = (messageObj.request.type === 'LaunchRequest')) {

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



        processObj.data('lastUserTimestamp', messageObj.request.timestamp);

        // act (saves, too)

        FSMManager.actOnProcess(messageObj, processObj).then(function () {

          dblogger.log('acted on process ', processObj.summary());

        });



      } else {

        processObj.id = processID;

        processObj.volatile('sessionObj', sessionObj);

        processObj.customer = messageObj.fromUser;



        if (messageObj.request.type === 'SessionEndedRequest') {

          messageObj.intentId = "stop";

          sessionObj.shouldEndSession = true;

          try {

            FSMManager.resetTargets(processObj.id);

            // TODO: RUN A SESSION ENDED CONTROLLER AND ACTION

          } catch (ex) {

            dblogger.error('cant resetTargets', ex);

          }



        } // act



        // save last timestamp

        processObj.data('lastUserTimestamp', messageObj.request.timestamp);

        FSMManager.actOnProcess(messageObj, processObj).then(function (res) {

          dblogger.log('acted on process ', processObj.summary());

        });



      }

    }).catch((err) => {

      dblogger.error(err.message);

    });

  } catch (ex) {

    dblogger.error(ex.message, 'error in cal4u processRequest');

  }

}



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



function createNewProcess(fsm, messageObj, pid) {

  FSMManager = FSMManager || require("../FSM/fsm-manager"); // require now if not yet required (to avoid circular dependency)

  return new Promise((resolve) => {

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

    })

  })

}



function actOnProcess(messageObj, processObj) {

  FSMManager = FSMManager || require("../FSM/fsm-manager"); // require now if not yet required (to avoid circular dependency)



  // log some statistics

  var lastUserTimestamp = Date.now();

  processObj.properties = function (res) {

    console.log('processObj.properties res = ', res)

  };



  processObj.getNonVolatile = function (res) {

    console.log('processObj.getNonVolatile res = ', res)

  };



  processObj.summary = function (res) {

    console.log('processObj.summary res = ', res)

  };



  processObj.data = function (key, value) {



    var processData = this.get('data') || {};

    if (arguments.length === 0) {

      return processData;

    } else if (arguments.length === 1) {

      return processData[key];

    } else {

      // convert to number if needed

      if (!utils.safeIsNaN(value)) {

        value = parseFloat(value);

      }



      if (key !== null && key != "") {

        try {

          eval("processData." + key + "= value");

        } catch (ex) {

          dblogger.error('error in global/process.data(' + key + "," + value + "):", ex);

          processData[key] = value;

        }

      } else {

        dblogger = require('utils/dblogger');

        dblogger.assert(_.isObject(value), "value needs to be an object to replace all of processData");

        processData = value;

      }

      return this.set('data', processData);

    }

  }



  processObj.fsm_id = 'cal4u';



  processObj.loadContextEntities = function () {



    let curCtxIds = this.data('currentContextEntityIds');

    if (_.isEmpty(curCtxIds)) {

      return;

    }



    var currentContextEntities = this.deserializeContext(curCtxIds);



    this.currentContextEntities(currentContextEntities);

  }



  return new Promise(function (resolve) {



    dblogger.flow("going to actOnProcess with ", messageObj);



    FSMManager.actOnProcess(messageObj, processObj).then(function () {

      dblogger.log("message " + messageObj.text + " processed done");

      resolve();

    });

  });

}



function getProccessID(messageObj) {

  return 'cal4u-sender:' + messageObj.fromUser.id + '-recipient:' + messageObj.toUser.id;

}



function getProcessByID(id, fsm, messageObj) {



  return new Promise(function (resolve) {

    //  update the process profile

    processModel.get(id, fsm).then((process1) => {



      // put profile here



      process1.customer = {

        firstName: "cal4u User",

        lastName: id

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
