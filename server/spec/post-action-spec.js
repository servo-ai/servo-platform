let StartProcessTick = require('./support/start-process-tick');
var fsmEventEmitter = require('FSM/fsm-event-emitter.js');
var results = {};
describe('load', () => {
  var startProcessTick;
  beforeEach((done) => {
    startProcessTick = new StartProcessTick();

    // start the process & tick
    startProcessTick.start('../convocode/anonymous/fsms/unit-tests/trees/post-action-tree/post-action-tree.json');
    done();

  });

  it('a post action test', (done) => {
    startProcessTick.expect("post ok: ddd").then(() => {
      done();
    });
  });

  afterEach(() => {
    startProcessTick.stop();
  })

});