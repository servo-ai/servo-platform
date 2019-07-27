// add this path to requires
require('app-module-path').addPath(__dirname + "/../..");
var fs = require('fs-extra')
let chatManager = require('chat/chatmanager');
let FSM = require('FSM/fsm-manager');
let fsmModel = require('models/fsmmodel');
let MockupTicker = require('spec/support/mockup-ticker').getInst();
FSM.setTicker(MockupTicker);
const TESTPID = "test-processId";
var chatsim = require('chat/chatsim').getInst();
var fsmEventEmitter = require('FSM/fsm-event-emitter.js');
var _ = require('underscore');
var path = require('path');

console.log('_________USE FDESCRIBE FOR SINGLE SPEC RUNS_________')

class Observer {
  constructor() {
    this._expectedObjects = [];
    this._sentObjects = [];
  }
  expect(cb) {
    console.log('*expect:' + this._sentObjects.length + ' objects');
    if (this._sentObjects.length) {
      let obj = this._sentObjects.pop();
      cb(obj);
    } else {
      this._expectedObjects.unshift(cb);
    }

  }


  set(obj) {
    let cbExpected = this._expectedObjects.pop();
    if (!cbExpected) {
      console.log('*set:message arrived without an expectation:', obj);
      this._sentObjects.unshift(obj);
      console.log('*set:', this._sentObjects.length);
    } else {
      try {
        cbExpected(obj);
      } catch (x) {
        console.error(x, cbExpected);
      }
    }





  }
}




class StartProcessTick {


  constructor() {

    this._results = {};
    this.userId = "anonymous";
    this.pid = TESTPID + "-" + Math.random();
    this.observer = new Observer();
    var _this = this;

    function messageSentCallback(obj, p) {
      console.log('messageSent: ====>', obj, p.pid);
      if (p.id === _this.pid) {
        _this.observer.set(obj);
      }
    }
    fsmEventEmitter.on('messageSent', messageSentCallback);

    this.removeListener = function () {
      fsmEventEmitter.removeListener('messageSent', messageSentCallback);
    };

  }

  recuresiveStart(fsm_id, userId) {
    this.userId = userId;
    var fsmName = fsm_id;
    return new Promise((resolve, reject) => {
      try {

        fsmModel.getAllFSMs(userId, false).then(() => {

          var fsm = fsmModel.getFSMSync(fsm_id, userId);
          fsm.properties['channels'] = "chatsim";
          // load the tree
          //let behaviorTree = new BehaviorTree("general-message-spec", 'general-message-spec', "general-message-spec");
          //behaviorTree.load(tree).then((fsm) => {
          FSM.loadBehaviorTree(fsm, undefined /*this make it root*/ , fsm.userFsmId()).then(() => {
            // create message object
            var messageObj = chatManager.createMessageObject('chatsim', {
              recipient: {
                id: this.pid
              },
              sender: {
                id: this.pid
              },
              text: "",
              treeID: fsm.id,
              raw: {}
            });
            messageObj.userId = "anonymous";

            // start the process
            FSM.startOneProcess(fsm, messageObj, this.pid).then((process1) => {
              // process1.properties('channels', "chatsim");
              FSM.tickStart(fsm.userFsmId(), process1);
              this.fsmId = fsm.id;
              console.log('---------------------- ' + fsmName + ' loaded and started -------------------');
              resolve();
            });
          });
        });
        //fsm.folderName = folderName || '../spec-trees/';



      } catch (er) {
        console.error('problem in starting processTick testing:', er);
        reject(er);
      };

    });


  }
  start(fsm) {
    var fsmName = fsm;
    return new Promise((resolve, reject) => {
      try {
        let fsmInfo = fsmModel.calcFsmInfo(fsm);
        fsmModel.readFSM('./server/' + fsm, fsmInfo).then((fsm) => {
          fsmModel.addFsm(fsm);
          // load the tree
          //let behaviorTree = new BehaviorTree("general-message-spec", 'general-message-spec', "general-message-spec");
          //behaviorTree.load(tree).then((fsm) => {
          FSM.loadBehaviorTree(fsm, undefined /*this make it root*/ , fsm.userFsmId()).then(() => {
            // create message object
            var messageObj = chatManager.createMessageObject('chatsim', {
              recipient: {
                id: this.pid
              },
              sender: {
                id: this.pid
              },
              text: "",
              treeID: fsm.id,
              raw: {}
            });
            messageObj.userId = "anonymous";

            // start the process
            FSM.startOneProcess(fsm, messageObj, this.pid).then((process1) => {

              FSM.tickStart(fsm.userFsmId(), process1);
              this.fsmId = fsm.id;
              console.log('---------------------- ' + fsmName + ' loaded and started -------------------');
              resolve();
            });
          });
        });
        //fsm.folderName = folderName || '../spec-trees/';



      } catch (er) {
        console.error('problem in starting processTick testing:', er);
        reject(er);
      };

    });


  }

  results() {
    return this._results;
  }

  stop() {
    this.removeListener();
    FSM.tickStop(this.pid);
  }

  /**
   * 
   * @param {string|Object} dataObjOrIntentId 
   */
  send(intentObj) {
    if (typeof intentObj === 'string') {
      intentObj = {
        data: {
          useNLU: false,
          utterance: intentObj,
          intentId: intentObj,
          fsmId: this.fsmId,
          processId: this.pid
        }
      };
    } else {
      let intentObj1 = {
        data: {
          useNLU: false,
          fsmId: this.fsmId,
          processId: this.pid
        }
      };

      intentObj.data = _.extend(intentObj1.data, intentObj);
    }

    // send  
    intentObj.data.userId = this.userId;
    return chatsim.onMessage(intentObj);
  }

  fail(err, done) {
    console.log('--------FAILURE-----------:', err);
    done.fail(err);
  }


  /**
   * 
   * @param {string|Object} dataObj 
   */
  expect(dataObj) {
    console.log('##### EXPECT ', dataObj);
    return new Promise((resolve) => {
      if (typeof dataObj === 'string') {
        this.observer.expect((ev) => {
          console.log('####### RECEIVED ', ev, ' FOR EXPECTED ', dataObj);
          expect(dataObj.toLowerCase()).toEqual(ev.payload.toLowerCase());
          resolve();

        });
      }

    });
  }
}



module.exports = StartProcessTick;