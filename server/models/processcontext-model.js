var config = require("../config");
var Promise = require('promise');
var dblogger = require("../utils/dblogger.js");
var fs = require('fs');
var _ = require('underscore');
var baseModel = require("./base-model")
var uuid = require("uuid");
var DAL = require("../dal/router");
var cacheFactory = require('models/cache-factory');


// use a cache with 10 min expiration so we dont have to read from the disk
var _cache = cacheFactory.createCache({ stdTTL: 600 });

function procesContextModel() { };

_.extend(procesContextModel, baseModel)

module.exports = procesContextModel;
/***
 * get context by id
 */
procesContextModel.get = function (id) {
    value = _cache.get(id);
    if (value != undefined) return Promise.resolve(value);

    return new Promise((resolve, reject) => {
        DAL.ProcessContext.get(id).then((processContextObj) => {
            _cache.set(id, processContextObj);
            resolve(processContextObj);
        }).catch((err) => {
            console.error(err);
            reject(err);
        });
    });
}

/**
 * set a context
 */
procesContextModel.set = function (id, data) {
    return new Promise((resolve, reject) => {
        DAL.ProcessContext.insert(id, data).then((processContextObj) => {
            _cache.set(id, data);
            resolve(processContextObj);

        }).catch((err) => {
            console.error(err);
            reject(err);
        });
    });
}



/**
 * add a context record
 */
procesContextModel.add = function (data) {
    var promise = new Promise(function (resolve, reject) {
        var id = "prcsscntxt::" + uuid.v4();
        procesContextModel.set(id, data).then(function (res) {
            console.log('context added:', res)
            resolve(id);
        }).catch(function (err) {
            reject(err);
        })
    });
    return promise;
}
