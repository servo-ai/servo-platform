var uuid = require("uuid");
var config = require("../config");
var Promise = require('promise');
var baseModel = require("./base-model")
var _ = require('underscore');
var DAL = require("../dal/router");
var fs = require('fs');

function loggerModel() {};
_.extend(loggerModel, baseModel)

module.exports = loggerModel;

// insert
loggerModel.insertLog = function (type, logObj, cat = "main") {
  return DAL.Logger.insert(type, logObj, cat);
};

/**
 * get log files list
 * @param month
 * @return {Promise}
 */
loggerModel.list = function (month = null) {
  var folder = 'log';
  return new Promise(function (resolve, reject) {
    if (month) folder += "/" + month;
    fs.readdir(folder, (err, files) => {
      for (i = 0; i < files.length; i++) {
        files[i] = files[i].replace(".txt", "");
      }
      if (err) reject(err);
      else resolve(files);
    });
  });
};

/**
 * get log file content
 * @param file
 * @return {Promise}
 */
loggerModel.file = function (file) {
  var folder = 'log';
  var path = folder + "/" + file + ".txt";
  return new Promise(function (resolve, reject) {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}
