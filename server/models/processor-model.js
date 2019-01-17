var config = require("../config");
var Promise = require('promise');
var dblogger = require("../utils/dblogger.js");
var cacheFactory = require('models/cache-factory');
var fs = require('fs');

// use a cache with 10 min expiration so we dont have to read from the disk
var _processorCache = cacheFactory.createCache({ stdTTL: 600 });

function processorModel() { };
module.exports = processorModel;

processorModel.get = function (filename, fsmId, userId) {

    userId = userId || config.convocode.id;
    var promise = new Promise(function (resolve, reject) {
        var file = 'convocode/' + userId + '/fsms/' + fsmId + '/processors/' + filename;
        try {
            value = _processorCache.get(file, true);
            resolve(value);
        } catch (err1) {
            // ENOTFOUND: Key not found
            fs.readFile(file, function (err, data) {
                if (err) {
                    var error = 'error in reading from file ' + file + ' fsm id ' + fsmId + ': ' + err;

                    dblogger.error(error);
                    reject(error);
                }
                else {
                    data = data.toString();
                    _processorCache.set(file, data);
                    resolve(data);
                }
            });
        }

    });

    return promise;
}