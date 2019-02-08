var uuid = require("uuid");
var Promise = require('promise');
var loggerModel = require('../models/loggermodel');
// logs  promise unhandled rejections
require('promise/lib/rejection-tracking').enable({
  allRejections: true
});

var _ = require('underscore');
var config = require('../config');
var DBLogger = function () {

};
DBLogger.clientLoggers = {};

function shouldLog(cat) {
  var catFound = config["log-categories"].findIndex((elem) => {
    return cat === elem;
  });

  return catFound !== -1;
}
module.exports = DBLogger;

var _lastLine;
var _lastLineCounter = 0;
DBLogger.add = function () {
  var args = Array.prototype.slice.call(arguments);

  try {
    var obj = JSON.stringify(args.slice(1, args.length));
  } catch (ex) {
    loggerModel.insertLog(ex, 'stringify failed: WARNING');
  }
  var cat = "main";
  if (args.length > 2 && args[1].cat) {
    cat = args[1].cat;
    try {
      obj = JSON.stringify(args.slice(2, args.length));
    } catch (ex) {
      loggerModel.insertLog(ex, 'stringify failed: WARNING');
    }

  }
  loggerModel.insertLog(args[0], obj, cat).then(function (data) {
    //console.log('insertlog ok');
  }).catch(function (err) {
    console.error(' LOGGER insert ERROR', err);
  });

  for (var clientLoggerId in DBLogger.clientLoggers) {
    let logger = DBLogger.clientLoggers[clientLoggerId];
    logger(clientLoggerId, {
      logType: args[0],
      logData: args.slice((args[0] === 'info' || args[0] === 'error') ? 2 : 3, args.length),
      logCategory: cat
    });
  }
}

/**
 * info is used for category based logging
 */
DBLogger.info = function () {
  if (!shouldLog(arguments[0].cat))
    return;


  var args = Array.prototype.slice.call(arguments);


  args.unshift(new Date(Date.now()).toISOString().split("T")[1]);
  console.info.apply(null, args);
  args.unshift('info');
  DBLogger.add.apply(null, args);
}

DBLogger.assert = function () {
  var args = Array.prototype.slice.call(arguments);
  if (!args[1]) {

    args.unshift(new Date(Date.now()).toISOString().split("T")[1]);
    console.error.apply(null, args);
    args.unshift('assert');
    DBLogger.add.apply(null, args);

  }

}

DBLogger.flow = function () {
  if (!shouldLog("flow"))
    return;

  var args = Array.prototype.slice.call(arguments);

  args.unshift(new Date(Date.now()).toISOString().split("T")[1]);
  console.info.apply(null, args);
  args.unshift({
    cat: 'flow'
  });
  args.unshift('info');
  DBLogger.add.apply(null, args);
};


DBLogger.warn = function () {
  if (!shouldLog('warn'))
    return;

  var args = Array.prototype.slice.call(arguments);
  if (_.isEqual(args, _lastLine)) {
    _lastLineCounter++;
  } else {

    _lastLineCounter && args.unshift("(Last log repeated " + _lastLineCounter + " times)\r\n");
    // args.unshift('\r\n');
    args.unshift(new Date(Date.now()).toISOString().split("T")[1]);

    console.warn.apply(null, args);
    args.unshift('warn');
    DBLogger.add.apply(null, args);
    // make a new last line w/out the number
    _lastLine = _.clone(args);
    _lastLineCounter = 0;
  }
};

DBLogger.log = function () {
  if (!shouldLog(arguments[0].cat || 'log'))
    return;
  var args = Array.prototype.slice.call(arguments);

  if (_.isEqual(args, _lastLine)) {
    _lastLineCounter++;
  } else {
    // send number of last line 
    var thisArgs = _.clone(args);
    if (_lastLineCounter) {
      args.unshift("(Last log repeated " + _lastLineCounter + " times)\r\n");
    } else {
      args.unshift(new Date(Date.now()).toISOString().split("T")[1]);
    }

    console.log.apply(null, args);

    args.unshift('log');
    DBLogger.add.apply(null, args);
    // make a new last line w/out the number
    _lastLine = thisArgs;
    _lastLineCounter = 0;
  }
}

DBLogger.error = function () {
  var args = Array.prototype.slice.call(arguments);
  if (_.isEqual(args, _lastLine)) {
    _lastLineCounter++;
  } else {
    // send number of last line 
    var thisArgs = _.clone(args);
    //args.unshift(_lastLineCounter && "(Last log repeated " + _lastLineCounter + " times)\r\n");
    args.unshift(new Date(Date.now()).toISOString().split("T")[1]);
    console.error.apply(null, args);
    console.trace();

    args.unshift({
      cat: 'error'
    });
    args.unshift('error');

    DBLogger.add.apply(null, args);
    // make a new last line w/out the number
    _lastLine = thisArgs;
    _lastLineCounter = 0;

  }
};

DBLogger.assert = function (cond, msg) {
  if (!cond)
    DBLogger.error(msg);
};

/**
 * allow not to log based on debug level
 */
DBLogger.setDebug = function (level) {
  DBLogger.debugLevel = level;
};

DBLogger.addClientLoggerCallback = function (processId, clientLogger) {
  DBLogger.clientLoggers[processId] = clientLogger;
};

DBLogger.removeClientLoggerCallback = function (processId) {
  delete DBLogger.clientLoggers[processId];
};
DBLogger.debug = function () {
  if (!shouldLog('debug'))
    return;
  var args = Array.prototype.slice.call(arguments);

  if (_.isEqual(args, _lastLine)) {
    _lastLineCounter++;
  } else {
    // send number of last line 
    var thisArgs = _.clone(args);
    _lastLineCounter && args.unshift("(Last log repeated " + _lastLineCounter + " times)\r\n");
    args.unshift(new Date(Date.now()).toISOString().split("T")[1]);
    console.log.apply(null, args);

    args.unshift('log');
    DBLogger.add.apply(null, args);
    // make a new last line w/out the number
    _lastLine = thisArgs;
    _lastLineCounter = 0;
  }
}

/**
 * indented debug output based on depth first param
 */
DBLogger.depthDebug = function () {
  var depth = arguments[0];
  depthStr = "=";
  var args = Array.prototype.slice.call(arguments)
  args.shift();
  for (i = 0; i < depth; i++) {
    depthStr += "=="
  }
  depthStr += ">";
  args.unshift(depthStr)
  DBLogger.log.apply(null, args)
};