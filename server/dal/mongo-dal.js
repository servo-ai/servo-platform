var uuid = require("uuid");
var baseModel = require('../models/base-model');
var _ = require('underscore');
var Promise = require('bluebird');

var Logger = require('./logger');
var config = require("../config");
var mongojs = require('mongojs');

var MessageModel = require('../models/message-model');
var UserModel = require('../models/user-model');
var Process = require('../FSM/core/process');


// Use connect method to connect to the server

var db = mongojs(getConnectionString());

function getConnectionString() {
  return config.db.username + ":" + config.db.password + "@" + config.db.host + "/" + config.db.database + "?authSource=admin";
}

db.operationTimeout = db.viewTimeout = db.managementTimeout = config.db.timeoutMSec;
var _throttleTime = 15000; // 15sec
var _timeouts = {};


/**
 * make a function to avoid recursive dependency problems
 */
var dblogger = function () {
  var dblogger1 = require("../utils/dblogger");
  return dblogger1;
}

class _Process {
  static get(id) {
    return new Promise(function (resolve, reject) {
      var col = db.collection("processes");
      col.findOne({
        id: id
      }, function (err, doc) {
        if (err) {
          dblogger().error('DB._Process.get() error: ', err);
          reject(err);
        } else if (!doc) {
          dblogger().log('DB._Process.get() error: no process found');
          reject(0);
        } else {
          resolve(doc);
        }
      });
    });
  }

  static getProcessByKeyId(keyName, processLinkId) {
    return new Promise(function (resolve, reject) {
      var col = db.collection("processes");
      var finbObj = {};
      finbObj[keyName] = processLinkId;
      col.findOne(
        finbObj,
        function (err, doc) {
          if (err) {
            dblogger().error('Process.getProcessByKeyId(  processLinkId:' + processLinkId + ') error: ', err);
            reject(err);
          } else if (!doc) {
            dblogger().warn('Process.getProcessByKeyId( processLinkId:' + processLinkId + ') + no processes.');
            resolve(null);
          } else {
            dblogger().log('Process.getProcessByKeyId( processLinkId:' + processLinkId + ') Got a proccess' + doc.id);
            resolve(doc.id);
          }
        });
    });
  }

  static getFSMProcesses(fsm) {
    if (_.has(fsm.properties, "loadAllProccesses") && !fsm.properties.loadAllProccesses) {
      return Promise.resolve([]);
    }
    return new Promise(function (resolve, reject) {
      // make them all processes
      var processes = [];
      dblogger().log('getFSMProcesses for ', fsm.userFsmId());
      var col = db.collection("processes");

      var prx = col.find({
        fsm_id: fsm.userFsmId()
      });
      prx.forEach(function (err, doc) {
        if (err) {
          dblogger().error('DB._Process.getFSMProcesses(' + fsm.userFsmId() + ') error: ', err);
          reject(err);
        } else if (!doc) {
          dblogger().warn('DB._Process.getFSMProcesses(' + fsm.userFsmId() + ') got ' + processes.length + ' processes.');
          resolve(processes);
        } else {
          try {
            dblogger().log('DB._Process.getFSMProcesses(' + fsm.userFsmId() + ') Got a proccess' + doc.id);
            var process = new Process({
              "id": doc.fsm_id
            }, doc);
            if (process.id && _.isFunction(process.data)) {
              processes.push(process);
            } else {
              dblogger().warn('DB._Process.getFSMProcesses(' + fsm.userFsmId() + ') warning: process with no id or with  an illegal data object', process.id, process.fsm_id, process.data);
            }
          } catch (ex) {
            dblogger().warn('DB._Process.getFSMProcesses(' + fsm.userFsmId() + ') error: can\'t create a process', ex);
          }
        }
      });
    });
  }
  static upsert(id, processObj) {
    return new Promise(function (resolve) {
      function upsert() {
        var col = db.collection("processes");

        col.update({
          id: id
        }, processObj, {
          upsert: true
        }, function (err) {
          if (err) {
            dblogger().error('DB._Process.upsert(' + id + ') error', err, processObj.id, processObj.fsm_id);
          }
        });
      }
      if (!_timeouts[id]) {
        // now set a timeout
        _timeouts[id] = setTimeout(() => {
          upsert();
          _timeouts[id] = false;
        }, _throttleTime);
      }

      // resolve even if failure
      resolve(id);
    });
  }
  static delete(pid) {
    return new Promise(function (resolve, reject) {
      var col = db.collection("processes");
      col.remove({
        id: pid
      }, function () {
        console.log("DB._Process.delete(" + displayProcessID(pid) + ")");
        resolve(pid);
      });
    });
  }
}

class Message {
  static get(id) {
    return new Promise(function (resolve, reject) {
      var col = db.collection("messages");
      col.findOne({
        _id: id
      }, function (err, doc) {
        if (err) {
          dblogger().error('DB.Message.get() error: ', err);
          reject(err);
        } else if (!doc) {
          dblogger().log('DB.Message.get() error: no message found');
          reject(0);
        } else {
          resolve(doc);
        }
      });
    });
  }

  static getMessagesByUsersID(toUserID, fromUserID) {
    return new Promise(function (resolve, reject) {
      var messages = [];
      var col = db.collection("messages");
      col.find({
        toUser: {
          id: toUserID
        },
        fromUser: {
          id: fromUserID
        }
      }).forEach(function (err, doc) {
        if (err) {
          dblogger().error('DB.Message.getMessagesByUsersID(' + toUserID + ',' + fromUserID + ') error: ', err);
          reject(err);
        } else if (!doc) {
          dblogger().log('DB.Message.getMessagesByUsersID(' + toUserID + ',' + fromUserID + ') got ' + messages.length + ' messages.');
          resolve(messages);
        } else {
          try {
            dblogger().log('DB.Message.getMessagesByUsersID(' + toUserID + ',' + fromUserID + ') Got a proccess');
            var message = MessageModel.create(doc);
            messages.push(message);
          } catch (ex) {
            dblogger().warn('DB.Message.getMessagesByUsersID(' + toUserID + ',' + fromUserID + ') error: can\'t create a message', ex);
          }
        }
      });
    });
  }

  static insert(messageObj) {
    return new Promise(function (resolve, reject) {
      var col = db.collection("messages");

      col.insert(messageObj, function (err, result) {
        if (err) {
          dblogger().error('DB.Message.upsert() error', err, messageObj);
        } else {
          dblogger().log('DB.Message.upsert() message upserted');
        }
      });

      // resolve even if failure
      resolve();
    });
  }
}

class User {
  static getByFacebookID(facebookID) {
    return new Promise(function (resolve, reject) {
      var col = db.collection("users");
      col.findOne({
        facebookID: facebookID
      }, function (err, doc) {
        if (err) {
          dblogger().error('DB.User.get(' + facebookID + ') error: ', err);
          reject(err);
        } else if (!doc) {
          dblogger().error('DB.User.get(' + facebookID + ') error: no user found');
          reject(0);
        } else {
          var user = UserModel.create(doc);
          resolve(user);
        }
      });
    });
  }

  static getByGithubID(githubID) {
    return new Promise(function (resolve, reject) {
      var col = db.collection("users");
      col.findOne({
        githubID: githubID
      }, function (err, doc) {
        if (err) {
          dblogger().error('DB.User.get(' + githubID + ') error: ', err);
          reject(err);
        } else if (!doc) {
          dblogger().log('DB.User.get(' + githubID + ') error: no user found');
          reject(0);
        } else {
          var user = UserModel.create(doc);
          resolve(user);
        }
      });
    });
  }

  static upsert(userObj) {
    return new Promise(function (resolve, reject) {
      var col = db.collection("users");

      col.update({
        facebookID: userObj.facebookID
      }, userObj, {
        upsert: true
      }, function (err, result) {
        if (err) {
          dblogger().error('DB.User.upsert() error', err, userObj);
        } else {
          dblogger().log('DB.User.upsert() user upserted');
        }
      });

      // resolve even if failure
      resolve(true);
    });
  }
}

function displayProcessID(processID) {
  return processID;

}

module.exports = {
  Logger: Logger,
  Process: _Process,
  Message: Message,
  User: User
};