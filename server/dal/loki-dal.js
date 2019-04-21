var _ = require('underscore');
var Promise = require('bluebird');

var Logger = require('./logger');
var lokijs = require('lokijs');
var Deferred = require('utils/deferred');

var MessageModel = require('../models/message-model');
//var UserModel = require('../models/user-model');
var Process = require('../FSM/core/process');

// Use connect method to connect to the server
var db = new lokijs('./loki-servo-db.json', {
  autoload: true,
  autoloadCallback: databaseInitialize,
  autosave: true,
  autosaveInterval: 400
});

var _dbInitialized = new Deferred();

function databaseInitialize() {
  //   getAddCollection('processes');
  //   getAddCollection('users');
  //   getAddCollection('messages');
  _dbInitialized.resolve();

}

function getAddCollection(name) {
  var c = db.getCollection(name);
  if (!c) {
    c = db.addCollection(name);
  }

  return c;
}



/**
 * make a function to avoid recursive dependency problems
 */
var dblogger = function () {
  var dblogger1 = require("../utils/dblogger");
  return dblogger1;
};

class _Process {
  static get(id) {
    return new Promise(function (resolve, reject) {
      _dbInitialized.then(() => {
        var col = getAddCollection("processes");
        var doc = col.findOne({
          id: id
        });

        if (!doc) {
          reject(0);
        } else {
          resolve(doc);
        }
      });

    });

  }

  static getLinkedProcessId(fsm, processLinkId) {
    return new Promise(function (resolve, reject) {
      _dbInitialized.then(() => {
        var col = getAddCollection("processes");

        var doc = col.findOne({
          link_id: processLinkId
        });

        if (!doc) {
          dblogger().error('Process.getFSMLinkedProcess(' + fsm.userFsmId() + ' processLinkId:' + processLinkId + ') error: no doc');
          reject(0);;
        } else {
          resolve(doc.id);
        }
      });

    });
  }

  static getFSMProcesses(fsm) {
    if (_.has(fsm.properties, "loadAllProccesses") && !fsm.properties.loadAllProccesses) {
      return Promise.resolve([]);
    }
    return new Promise(function (resolve) {
      _dbInitialized.then(() => {
        // make them all processes
        var col = getAddCollection("processes");
        var processes = col.find({
          fsm_id: fsm.userFsmId()
        });
        var procRet = [];

        if (processes.data) {
          processes.data.map(function (doc) {
            if (!doc) {
              dblogger().log('DB._Process.getFSMProcesses(' + fsm.userFsmId() + ') got ' + processes.length + ' processes.');
              resolve(procRet);
            } else {
              try {
                dblogger().log('DB._Process.getFSMProcesses(' + fsm.userFsmId() + ') Got a proccess id=', doc.id, doc._id);
                var process = new Process({
                  "id": doc.fsm_id
                }, doc);
                if (process.id && _.isFunction(process.data)) {
                  procRet.push(process);
                } else {
                  dblogger().warn('DB._Process.getFSMProcesses(' + fsm.userFsmId() + ') warning: process with no id or with  an illegal data object', process.id, process.fsm_id, process.data);
                }
              } catch (ex) {
                dblogger().warn('DB._Process.getFSMProcesses(' + fsm.userFsmId() + ') error: can\'t create a process', ex);
              }
            }
          });
        } else {
          resolve(procRet);
        }

      });
    });
  }
  static upsert(id, processObj) {
    return new Promise(function (resolve) {
      _dbInitialized.then(() => {
        var col = getAddCollection("processes");

        var cached = col.findOne({
          id: processObj.id
        });
        try {
          JSON.stringify(processObj)
        } catch (ex) {
          console.log(ex, processObj)
        }
        if (cached) {
          col.update(cached);
        } else {
          col.insert(processObj);
        }

        // resolve even if failure
        resolve(id);
      });
    });
  }
  static delete(pid) {
    return new Promise(function (resolve) {
      _dbInitialized.then(() => {
        var col = getAddCollection("processes");
        col.remove({
          id: pid
        });
        resolve();
      }).catch((err) => {
        dblogger().error(err);
        resolve();
      });
    });
  }
}

class Message {
  static get(id) {
    return new Promise(function (resolve) {
      _dbInitialized.then(() => {
        var col = getAddCollection("messages");
        var msg = col.findOne({
          id: id
        });
        if (!msg) {
          resolve(0);
        } else {
          resolve(msg);
        }
      });
    });
  }

  static getMessagesByUsersID(toUserID, fromUserID) {
    return new Promise(function (resolve) {
      _dbInitialized.then(() => {
        var messages = [];
        var col = getAddCollection("messages");
        var arrFound = col.find({
          toUser: {
            id: toUserID
          },
          fromUser: {
            id: fromUserID
          }
        });

        arrFound.data.map(function (doc) {
          if (!doc) {
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
    });

  }

  static insert(messageObj) {
    return new Promise(function (resolve) {
      _dbInitialized.then(() => {
        var col = getAddCollection("messages");

        col.insert(messageObj);


        // resolve even if failure
        resolve();
      });
    });
  }
}

class User {
  static getByFacebookID(facebookID) {
    return new Promise(function (resolve, reject) {
      _dbInitialized.then(() => {
        var col = getAddCollection("users");
        var doc = col.findOne({
          facebookID: facebookID
        });
        if (!doc) {
          reject(0);
        } else {
          resolve(doc);
        }
      });
    });
  }



  static upsert(userObj) {
    return new Promise(function (resolve) {
      _dbInitialized.then(() => {
        var col = getAddCollection("users");
        var cached = col.findOne({
          id: userObj.facebookID || userObj.githubID
        });
        if (cached) {
          col.update(userObj);
        } else {
          userObj.id = userObj.facebookID || userObj.githubID;
          col.insert(userObj);
        }

        // resolve even if failure
        resolve(true);
      });
    });
  }
}

module.exports = {
  Logger: Logger,
  Process: _Process,
  Message: Message,
  User: User
};