/**
 * fsm-manager
 * FSM: Full Scale Machine
 */
var processModel = require("../models/processmodel.js");
var fsmModel = require("../models/fsmmodel.js");
var chatManager = require("../chat/chatmanager");
var dblogger = require("utils/dblogger.js");
var _ = require('underscore');
var messageReceiver = require('./message-receiver.js');
var BehaviorTree = require('./core/behaviorTree');
var b3 = require('./core/b3');
var Target = require('./core/target');
var uuid = require("uuid");
var config = require('../config.json');
var cacheFactory = require('models/cache-factory');
var Ticker = require('FSM/ticker');

var _pausedProcesses = {};
// TODO: rethink stdTTL. if we enable it, need to make sure process is reloaded otherwise getFromCache fails

// we have one target Object per process
var _processTargetCache = cacheFactory.createCache({
  stdTTL: 0,
  useClones: false
});
// on this target object, we queue up messages inside an object
var _messageQueueCache = cacheFactory.createCache({
  stdTTL: 0,
  useClones: false
});
// cache for behavior trees
var _btCache = cacheFactory.createCache({
  stdTTL: 0,
  useClones: false
});

// load b3
b3.load();

/****
 * static Full Scale Machine manager
 */
class FSMManager {

  constructor() {
    /**
     * Ticker for managing tick frequency
     * 
     * @property ticker
     * @type {Ticker} 
     */
    this.ticker = null;
  }

  /**
   * sets the ticker member
   */
  static setTicker(ticker) {

    FSMManager.ticker = ticker;
  }

  /**
   * a parallel async function to start all processes
   * TODO: make sequential - restart dormant after all listening finished
   */
  static startAll(app, userId) {

    dblogger.log('FSM manager starting');
    return new Promise((resolve, reject) => {
      fsmModel.getAllFSMs(userId).then((fsms) => {
        // start chat drivers listening
        chatManager.startAll(app, fsms);
        var fsmRoots = [];
        _.each(fsms, (fsm) => {
          if (fsm.isRoot && fsm.properties && !fsm.properties.resetMemory) {
            fsmRoots.push(fsm);
          }
        });
        var fsmCounter = 0;
        _.each(fsmRoots, (fsm) => {

          // get all processes
          if (fsm.isRoot) {
            fsmCounter++;
            dblogger.info({
              cat: 'flow'
            }, 'getting processes for ' + fsm.userFsmId());
            processModel.loadFSMProcesses(fsm).then((processes) => {

              var loadRoots = [];
              if (processes && processes.length) {
                _.each(processes, (process) => {
                  // load the tree
                  loadRoots.push(FSMManager.loadRootProcessTree(fsm, process));
                });
              }

              let promiseCount = 0;
              for (let i = 0; i < loadRoots.length; i++) {
                let loadPromise = loadRoots[i];
                let processX = processes[i];
                // local function to wait on each process 
                ((p, loadPromise1) => {
                  loadPromise1.catch((error) => {
                    dblogger.error('error in loading a tree  ', error);
                    if (++promiseCount >= fsmRoots.length) {
                      resolve(fsmRoots.length);
                    }
                  }).then(() => {
                    FSMManager.tickStart(p.fsm_id, p);
                    dblogger.log('root loaded' + p.fsm_id);
                    dblogger.log('starting process:', p.id, 'fsm id:', p.fsm_id);
                    if (++promiseCount >= fsmRoots.length) {
                      resolve(fsmRoots.length);
                    }
                  });
                })(processX, loadPromise);

              }

            }).catch((err) => {
              dblogger.error('error in loadFSMProcesses ', err.message);
              if (fsmCounter >= fsmRoots.length) {
                resolve(fsmRoots.length);
              }
            });
          }

        });

      }).catch((err) => {
        dblogger.error('error in fsmModel.getAllFSMs ', err.message);

        reject(err);

      });
    });

  }



  /**
   * start it
   * **/
  static startProcess(fsm_id, customers, cb) {
    for (var i = 0; i < customers.length; i++) {
      this.startOneProcess(fsm_id, customers[i]).then(function (data) {
        cb(null, data);
      }).catch(function (err) {
        cb(err, null);
      });
    }

  }

  static getCustomNodesClasses(bt, nodes) {
    var classes = {};
    _.each(nodes, (node) => {

      var userId = userId || config.convocode.id;
      var classFile = '../convocode/' + userId + '/fsms/' + bt.id + '/' + node.category + "s/" +
        node.name;
      try {
        var theClass = require(classFile);
        classes[node.name] = theClass;
      } catch (err) {
        dblogger.warn('cant find ' + classFile);
        if (bt.properties.alias) {
          try {
            classFile = '../convocode/' + userId + '/fsms/' + bt.properties.alias + '/' + node.category + "s/" +
              node.name;
            classes[node.name] = theClass;
          } catch (err) {
            console.warn('cant find ' + classFile);
          }
        }
      }


    })

    return classes;

  }

  /**
   * purge the bt cache, and the non global memory of all processes that are currently on this cache
   * @param {string} userId 
   * @param {string} fsmId 
   */
  static resetBehaviorTrees(userId, fsmId) {
    var app = require('../app');
    chatManager.stopAll(app);

    _btCache.flushAll();
    // flush all the views
    let viewModel = require('models/view-model');
    viewModel.flushAll();

    // reload user's fsms
    // TODO: reload that fsm only
    fsmModel.reload(userId).then(() => {
      let fullFsmIds = fsmModel.fsmCacheKey(userId, fsmId, '');
      processModel.getActiveFSMProcesses(fullFsmIds.fsmId).then((processes) => {
        _.each(processes, (process1) => {
          // stop the tick
          FSMManager.tickStop(process1.id);
          // reset the non globals
          process1.resetNonGlobalMemory();
        });
        var app = require('../app');
        FSMManager.startAll(app, userId);
      });
    });
  }


  /**
   * load the main, root tree, and copy its properties to the process
   */
  static loadRootProcessTree(fsm, process) {
    return new Promise((resolve, reject) => {
      dblogger.log('loadRootProcessTree ' + process.fsm_id);
      // use fsm.getId() - user-specific id, so two users can have two ids
      FSMManager.loadBehaviorTree(fsm, undefined, fsm.userFsmId()).then((rootTree) => {

        process.loadContextEntities();
        // if not extended yet, extend
        if (Object.keys(process.properties()).length == 0) {
          //_.extend(process.properties, rootTree.properties);
          process.properties(rootTree.properties);
        }

        if (process.properties().pipeTreeId) {
          var fsmPipe = fsmModel.getFSMSync(process.properties().pipeTreeId, fsm.userId);
          FSMManager.loadBehaviorTree(fsmPipe, undefined, fsmPipe.id, true).then((pipeTree) => {
            rootTree.pipeTree = pipeTree;
            resolve(rootTree);
          });
        } else {
          resolve(rootTree);
        }
      }).catch((ex) => {
        ex.errorFsmId = fsm.userFsmId();
        dblogger.error('problem in loading the root tree:', ex);
        reject(ex);
      });
    });
  }


  /**
   *   
   * load from files, with subtrees
   * @param {Object} fsm 
   * @param {*} treeNodeId 
   * @param {string} tree_id 
   * @param {Boolean} noDefaultRootEntities  if true, dont create default root enitites 
   */
  static loadBehaviorTree(fsm, treeNodeId, tree_id, noDefaultRootEntities) {
    // load the tree
    dblogger.log('loadBehaviorTree ' + tree_id, fsm.folderName);
    return new Promise((resolve, reject) => {
      // if already loaded
      var bt = _btCache.get(tree_id);
      if (bt) {
        resolve(bt);
      } else {
        var behaviorTree = new BehaviorTree(tree_id, treeNodeId, fsm.userFsmId());

        // load the tree
        b3.load(fsm.folderName).then((names) => {
          behaviorTree.load(fsm, names, noDefaultRootEntities).then(() => {
            dblogger.log('loaded BehaviorTree ' + tree_id);
            _btCache.set(tree_id, behaviorTree);
            resolve(behaviorTree);
          }).catch((ex) => {
            reject(ex);
          });
        });

      }


    });


  }

  static getBehaviorTree(fsm_userFsmId) {
    return _btCache.get(fsm_userFsmId);
  }

  static getBehaviorTreeStats() {
    return _btCache.getStats();
  }

  static removeFromQueue(pid) {
    // get b3 queue
    var queue = _messageQueueCache.get(pid) || [];
    var qObj = queue.pop();

    return qObj;
  }

  /**
   * pid: processid
   * targetObj
   * addToHead: true if priority should be given
   */
  static addToQueue(pid, targetObj, addToHead) {
    // get b3 queue
    var queue = _messageQueueCache.get(pid) || [];
    if (addToHead) {
      queue.push({
        targetObj: targetObj
      });
    } else {
      queue.unshift({
        targetObj: targetObj
      });
    }

    _messageQueueCache.set(pid, queue);
  }


  static resetQueue(pid) {
    //FSMManager.queus = FSMManager.queus || {};
    _messageQueueCache.del(pid);
    _pausedProcesses[pid] = false;
  }

  /**
   * remove all targets
   */
  static resetTargets(pid) {

    dblogger.flow('removing all ' + _processTargetCache.get(pid).target.getTargets().length + ' targets');
    _processTargetCache.get(pid).target.removeAll();
    _pausedProcesses[pid] = false;
  }


  /**
   * to stop a certain process tick, we add a stop command to the queue
   */
  static tickStop(pid) {

    var targetObj = {
      stopCommand: true
    };
    FSMManager.addToQueue(pid, targetObj, true);
  }

  static tickPause(pid) {

    var targetObj = {
      pauseCommand: true
    };
    FSMManager.addToQueue(pid, targetObj, true);
  }

  static tickContinue(fsm_id, process) {
    // make sure tickStart will work
    // TODO: MOVE TICKITNOW OUT. 
    _pausedProcesses[process.id] = false;
    _processTargetCache.del(process.id);
    // and re-start
    FSMManager.tickStart(fsm_id, process);

  }


  /**
   * call this function for every behaviour tree 
   */
  static tickStart(fsm_id, process) {
    // in memory flag for calling tickStart only once per process
    var targetObj = _processTargetCache.get(process.id);
    if (targetObj && targetObj.target) {
      return;
    }

    // if paused
    if (_pausedProcesses[process.id]) {
      return;
    }

    _processTargetCache.set(process.id, {
      target: new Target()
    });

    // 1. different tick loop for every process (TODO: and for every bt)
    // we use TickItNow so we can refer process id by val  
    // 2. if target/intent arrive in the middle tick, it needs to wait until its treatment  is finished
    // 3. otherwise, tick continues indefinetly until stopped, 
    function tickItNow(pid, fsm_id) {

      function tickIt() {
        try {
          var thisProcess = processModel.getFromCache(pid);

          var behaviorTree = _btCache.get(fsm_id);
          dblogger.assert(behaviorTree, 'no bt in cache for ' + fsm_id + " " + pid);

          // ADD TARGET
          // treatmet of previous target is done, we can pop next
          var qObject = FSMManager.removeFromQueue(pid);
          // and put it on the target for the next tick 
          if (qObject) {

            if (qObject.targetObj.stopCommand || !thisProcess) { // if this process is no longer in play, kill the loop, too

              _processTargetCache.del(process.id);
              FSMManager.ticker.stop(pid);
              FSMManager.resetQueue(pid);

              return;
            }

            if (qObject.targetObj.pauseCommand) {
              FSMManager.ticker.stop(pid);
              _pausedProcesses[pid] = true;
              return;
            }


            // if (qObject.targetObj.messageObj && qObject.targetObj.messageObj.queueAfterDoneRunning) {

            //   //if an object for adding after done, save it
            //   queueAfterDoneRunningObj = qObject;
            // } else 
            { // add as target
              // The responsibility of removing a target, is on the actions (mostly on AskAndWait-type actions)
              _processTargetCache.get(pid).target.add(qObject.targetObj);
            }

          }
          // the process might be out of the cache if it got a stop
          if (!_processTargetCache.get(pid)) {
            dblogger.log('WARNING no process with id ' + pid);
            return; // no more timeouts on this process
          }
          // TICK
          var ret = behaviorTree.tick(thisProcess, _processTargetCache.get(pid).target);
          // dblogger.flow('tree returned', ret)
          if (ret === b3.ERROR()) {
            dblogger.error('SOMETHING FAILED IN THIS TICK. ret:' + ret + " fsm id:" + fsm_id + " pid:" + pid);
          }

          // if we are done with our top - level tree
          if (ret && ret !== b3.RUNNING()) {
            // we can remove all targets - they will not be used and only confuse the engine
            FSMManager.resetTargets(pid); //we remove all targets - this happens once the conversation ended (ie not running), 
            // so might be here a removal of many  targets that came to the conversation.
            //  but since every new AskAndMap we remove the previous target, we should have no targets here in the 'end' (end is success/failure)
            //==============================================================================================================
            // // if there is an object saved for post-tick addition, its time to queue it properly 
            // if (queueAfterDoneRunningObj) {
            //   // make it a regular object
            //   queueAfterDoneRunningObj.targetObj.messageObj.queueAfterDoneRunning = undefined;
            //   FSMManager.addToQueue(pid, queueAfterDoneRunningObj.targetObj, true);
            // }
            // adjust timeout for this process            
            FSMManager.ticker.adjust(pid);
          }

          // if need to requeue 
          // if (queueAfterDoneRunningObj && (ret === b3.RUNNING() || ret === b3.ERROR())) {
          //   FSMManager.addToQueue(pid, queueAfterDoneRunningObj.targetObj, true);
          // }

          // An action node might be waiting a new target. So RUNNING is a possible return.

        } catch (ex) {
          dblogger.error('tick err', ex, ex.stack);
        }
        // if we are not in a breakpoint
        if (ret) {
          //  set the timer again
          FSMManager.ticker.timeout(pid, tickIt);
        } else {
          _processTargetCache.del(process.id);
          FSMManager.ticker.stop(pid);
        }

      }


      // start the ticker with default minimum 
      FSMManager.ticker.start(pid);

      tickIt();
    }

    tickItNow(process.id, fsm_id);
  }

  /**
   * calculateIntent and start ticking
   * @return {Promise}
   */
  static calculateIntentAndTickIt(fsm, process, messageObj) {
    return new Promise(function (resolve) {

      // create a target
      messageObj.mid = messageObj.mid || uuid.v4();
      //dblogger.assert(messageObj.intentId, "chat driver needs to put intentId on messageObj.intentId");
      var targetObj = {
        messageObj: messageObj
      };

      dblogger.info({
        cat: 'flow'
      }, 'about to addToQueue intent:', targetObj.messageObj.intentId, targetObj.messageObj.entities);

      FSMManager.addToQueue(process.id, targetObj);
      FSMManager.tickStart(process.fsm_id, process);

      // and... return
      resolve(' process ' + process.summary() + ' tick started');
    });
  }


  /***
   * start a process
   * @param fsm_id
   * @param customer
   * @param cb
   * @returns {Promise}
   */
  static startOneProcess(fsm, messageObj, processId, additionalFields) {
    dblogger.assert(fsm, 'no fsm for pid' + processId);

    var promise = new Promise((resolve) => {
      var Process = Process || require('./core/process');
      additionalFields = additionalFields || {};
      // create in memory
      additionalFields = _.extend(additionalFields, {
        id: processId,
        customer: messageObj.fromUser,
        parent: null,
        messengerType: messageObj.channel,
        channelId: messageObj.channel && messageObj.channel.toLowerCase(),
        createdTimestamp: new Date().getTime(),
        lang: fsm.properties.defaultLang,
        userId: fsm.userId
      });
      var process1 = new Process(fsm, additionalFields);
      // notify everyone
      var fsmEventEmitter = require('../FSM/fsm-event-emitter.js');
      fsmEventEmitter.processStarted(process1);

      // upsert to db
      process1.save().then(() => {
        resolve(process1);
      }).catch((err) => {
        dblogger.error("err in process1.save():" + err);
        // be flexible - resolve even if no db
        resolve(process1);
      });
    });

    return promise;

  }




  /***
   * pass it along
   * @param messageObj
   * @param process
   * @param cb
   */
  static actOnProcess(messageObj, process) {
    return new Promise(function (resolve, reject) {

      messageReceiver.actOnProcess(messageObj, process).then(() => {
        resolve();
      }).catch(() => {
        reject();
      });

    });
  }

  /***
   * pass it along
   * @param messageObj
   * @param process
   * @param cb
   */
  static actOnProcessI(pobj) {
    return messageReceiver.actOnProcessI(pobj);
  }


}

// set the default ticker
FSMManager.setTicker(Ticker.getInst());

module.exports = FSMManager;