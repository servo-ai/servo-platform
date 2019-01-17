var uuid = require("uuid");
var baseModel = require('../models/base-model');
var _ = require('underscore');
var Promise = require('promise');

var Logger = require('./logger');

var couchbase = require('couchbase');
var ViewQuery = couchbase.ViewQuery;
var config = require("../config");
var N1qlQuery = couchbase.N1qlQuery;
var db = (new couchbase.Cluster(config.db.connectionString))
    .openBucket(config.db.user, config.db.password, function (err) {
        dblogger().log("couchbase connection - bucket opened:", err || '');
        if (err) {
            throw err;
        }
    });
db.operationTimeout = db.viewTimeout = db.managementTimeout = config.db.timeoutMSec;
var Process = require('../FSM/core/process');
var _throttleTime = 1000;// 15sec
var _timeouts = {};


/**
 * make a function to avoid recursive dependency problems
 */
var dblogger = function () {
    var dblogger1 = require("../utils/dblogger");
    return dblogger1;
}
class DbEntity {
    static get(dbEntityType, dbEntity_id) {
        return new Promise(function (resolve, reject) {
            // Retrieve a document
            // TODO: DbEntitys collection
            db.get(dbEntityType, function (err, result) {
                if (err) {
                    console.error('getDbEntity err', err);
                    // Failed to retrieve key
                    reject(err);
                }
                else {
                    //TODO: use an index on DbEntitys
                    var dbEntitys = result.value.dbEntitys;
                    console.log('getDbEntitys ok. length =', dbEntitys.length)
                    var resultDbEntity = dbEntitys.filter(function (dbEntity) {
                        return (dbEntity.id.toString() === dbEntity_id);
                    });

                    console.log('dbEntity found:', resultDbEntity.length)
                    resolve(resultDbEntity[0]);
                }
            });
        });
    }
    static all(dbEntityType, pageIndex, pageSize, sortBy, asc) {
        return new Promise(function (resolve, reject) {
            // all DbEntityS are stored in document dbEntityType
            db.get(dbEntityType).then((err, result) => {
                if (err) {
                    console.error('getAllDbEntitys error', err);
                    // Failed to retrieve key
                    reject(err);
                }
                else {
                    //TODO: use an index on DbEntitys

                    var dbEntitys = result.value.dbEntitys.filter(function (dbe) {
                        return !dbe.deleted;
                    });
                    if (sortBy) {
                        dbEntitys.sort(function (a, b) {
                            if (asc.toUpperCase() === "ASC") {
                                if (parseInt(a[sortBy]) > parseInt(b[sortBy])) {
                                    return 1;
                                }
                                else return -1;
                            }
                            else {
                                if (parseInt(a[sortBy]) > parseInt(b[sortBy])) {
                                    return -1;
                                }
                                else return 1;
                            }
                        });
                    }

                    if (pageIndex && pageSize) {
                        pageIndex = parseInt(pageIndex);
                        pageSize = parseInt(pageSize);
                        var end = (pageIndex + 1) * pageSize;
                        end = Math.min(end, dbEntitys.length);
                        var start = pageIndex * pageSize;
                        start = Math.min(start, dbEntitys.length - 1);

                        dbEntitys = result.value.dbEntitys.slice(start, end);
                    }
                    console.log('getAllDbEntitys ok. type=', dbEntityType, dbEntitys.length);
                    resolve(dbEntitys);
                }
            });
        });
    }
    static allByPage(dbEntityTypei, pageIndex, pageSize) {
        //TODO: join forces with all
        return new Promise(function (resolve, reject) {
            // all DbEntityS are stored in document dbEntityType
            db.get(dbEntityType, function (err, result) {
                if (err) {
                    console.error('getAllDbEntitys error', err);
                    // Failed to retrieve key
                    reject(err);
                }
                else {
                    //TODO: use an index on DbEntitys
                    var nonDeletedDbEntitys = result.value.dbEntitys.filter(function (dbe) {
                        return !dbe.deleted;
                    })
                    var dbEntitys = nonDeletedDbEntitys.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
                    console.log('getAllDbEntitysByPage ok. type=', dbEntityType, dbEntitys.length);
                    resolve(dbEntitys);
                }
            });
        });
    }
    static delete(dbEntityType, dbEntityId) {
        return new Promise(function (resolve, reject) {
            DbEntity.getDbEntity(dbEntityType, dbEntityId).then((dbe) => {
                dbe.deleted = true;
                DbEntity.upsert(dbEntityType, dbEntityId, dbe)
                    .then(function (resp) {
                        resolve(dbEntityType + ":" + dbEntityId);
                    }).catch(function (err) {
                        dblogger().error('deleteDbEntity err at upsert', err);
                        reject(err);
                    })
            }).catch(function (err) {
                dblogger().error('deleteDbEntity err at get', err);
                reject(err);
            })
        });
    }

    static upsert(dbEntityType, dbEntityId, dbEntityObject) {
        return new Promise(function (resolve, reject) {
            // all DbEntityS are stored in document dbEntityType
            db.get(dbEntityType, function (err, result) {

                var dbEntitys = [];
                if (err) {
                    // Failed to retrieve key
                    console.log('db.get warning:', err);
                    // probably ok: no document yet
                }
                else {
                    //TODO: use an index on DbEntitys
                    dbEntitys = result.value.dbEntitys;
                }
                var updated = false;
                for (var i = 0; i < dbEntitys.length; i++) {
                    if (dbEntitys[i].id === dbEntityId) {// found
                        dbEntitys[i] = dbEntityObject; // update
                        updated = true;
                        break;
                    }
                }

                // if not found, add
                if (!updated) {
                    dbEntitys.push(dbEntityObject);
                }


                console.log('dbEntitys.length----------', dbEntitys.length)
                db.upsert(dbEntityType, { "dbEntitys": dbEntitys }, function (err, res) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(res);
                    }
                });
            });
        });
    }
}

class _Process {
    static get(id) {
        return new Promise(function (resolve, reject) {
            // if in the local pool
            db.get(id, function (err, res) {
                if (err && (err.code === 23 || err.message.startsWith("Client-Side timeout exceeded for operation"))) {
                    dblogger().error('problem with db', err.message);
                    reject(0);
                }
                else if (err && (err.code !== 13 || err.message !== "The key does not exist on the server")) {
                    reject(err);
                } else if (err && err.code === 13 && err.message === "The key does not exist on the server") {
                    reject(0);
                } else {
                    if (Array.isArray(res)) {
                        res = res[0];
                    }
                    resolve(res.value);
                }
            });
        });
    }
    static getLatestByIds(fromId, toId) {
        return new Promise(function (resolve, reject) {
            var query = ViewQuery.from('dev_process', 'process_by_ids').full_set(true).limit(1).
                key(fromId.toString() + ":" + toId.toString()).order(2);

            // Retrieve by query
            db.query(query, function (err, results) {
                if (err) {
                    console.error('getDbEntity err', err);
                    // Failed to retrieve key
                    reject(err);
                }
                else {

                    console.log('number of results of process by Ids:', results.length);
                    // create from prototype. if no results,
                    var process = new Process(fsm, results.length ? results[0].value.process : {});

                    if (results.length)
                        resolve(process);
                    else reject("Id pair was not found. from:" + fromId + "/to:" + toId);
                }
            });
        });
    }

    static getLatest(pageIndex, pageSize) {
        pageSize = Math.min(pageSize, 11);
        console.log("PAGE SIZE REDUCED FOR DEMO. DO NOT LEAVE AS IS")

        return new Promise(function (resolve, reject) {
            var query = ViewQuery.from('dev_process', 'all_processes').order(2).full_set(true).skip(pageIndex * pageSize).limit(pageSize);

            // Retrieve by query
            db.query(query, function (err, results) {
                if (err) {
                    dblogger().error('all_processes query err', err);
                    // Failed to retrieve
                    reject(err);
                }
                else {
                    resolve(results);
                }

            });
        });
    }

    static getFSMProcesses(fsm) {
        if (_.has(fsm.properties, "loadAllProccesses") && !fsm.properties.loadAllSessions) {
            return Promise.resolve([]);
        }
        return new Promise(function (resolve, reject) {
            // make them all processes
            var processes = [];

            // we get here out of memory
            // var q1 = N1qlQuery.fromString('SELECT COUNT(*) as size FROM FSM where fsm_id="' + fsm.id + '"');
            // db.query(q1, (err, rows, meta) => {
            //     dblogger().log({ cat: 'flow' }, 'number of fsm ' + fsm.id + ' processes recieved ', rows, meta, err)
            // });
            var q = N1qlQuery.fromString('SELECT * FROM FSM where fsm_id="' + fsm.id + '"');
            var req = db.query(q);
            req.on('row', function (row) {
                try {
                    dblogger().log({ cat: "db" }, 'Got a process ', row.FSM.fsm_id, row.FSM.id);
                    var process = new Process({ "id": row.FSM.fsm_id }, row.FSM);
                    if (process.id && _.isFunction(process.data)) {
                        processes.push(process);
                    }
                    else {
                        dblogger().warn(
                            'warning: process with no id or with  an illegal data object', process.id, process.fsm_id);
                    }
                }
                catch (ex) {
                    console.error(fsm.id, 'error creating process ', ex);
                }

            });
            req.on('error', function (err) {

                dblogger().error('Got error ', err, fsm.id);
                resolve(processes);

            });
            req.on('end', function (meta) {
                console.log('All rows received. fsm id is %s  Metadata is :', fsm.id, meta);

                dblogger().log('got ' + processes.length + ' processes ');
                resolve(processes);
            });
            /* var query = ViewQuery.from('dev_process', 'processesByFsm').full_set(true)
                 .stale(ViewQuery.Update.BEFORE).limit(128).
                 key(fsm.id).order(1);
             var fsmid = fsm.id;
             //TODO: shard-it this by fsm.id
 
             // Retrieve by query
             //if (fsm.id!=='drbrook') {resolve([]);return;}
             db.query(query, function (err, results) {
                 if (err) {
                     // cant use dblogger on itself
                     console.error('processesByFsm query err', err);
                     // Failed to retrieve key
                     reject(err);
                 }
                 else {
 
                     for (var i = 0; i < results.length; i++) {
                         var processObj = results[i].value;
                         console.log("loaded process ", processObj.id, processObj.fsm_id)
                         var process = new Process({ "id": processObj.fsm_id }, processObj);
 
                         processes.push(process);
 
                     }
 
                     dblogger().log('got getFSMProcesses', processes.length);
                     resolve(processes);
 
                 }
             })*/
        });
    }
    static upsert(id, processObj) {

        return new Promise(function (resolve, reject) {
            function upsert() {
                db.upsert(id, processObj, function (err, res) {
                    if (err) {
                        dblogger().error('process upsert error', err, processObj.id, processObj.fsm_id);

                    } else {
                        var displayID = id;
                        if (displayID.toString().length > 30) {
                            displayID = displayID.substr(0, 10) + "..." + displayID.substr(-10);
                        }

                        dblogger().log({ cat: "db" }, 'process upserted', id);

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
    static delete(processId) {
        return new Promise(function (resolve, reject) {
            db.remove(processId, function (err, res) {
                console.log('deleted');
                if (err) {
                    console.log('process deletion failed', processId, err);
                    return resolve('fail' + err);
                }
                console.log('process deleted!', processId);
                resolve('deleted ' + processId);
            })
        });
    }
}
module.exports = {
    Logger: Logger,
    Process: _Process
};
