let StartProcessTick = require('./support/start-process-tick');
var fsmEventEmitter = require('FSM/fsm-event-emitter.js');
var results = {};
describe('a get action test ', () => {
  var startProcessTick;
  beforeEach((done) => {
    startProcessTick = new StartProcessTick();

    // start the process & tick
    startProcessTick.start('../convocode/anonymous/fsms/unit-tests/trees/retrieveJSON-action/retrieveJSON-action.json');
    done();

  });

  it('should get ok from httpbin', (done) => {
    startProcessTick.expect("get ok: \"https://httpbin.org/get\"").then(() => {
      done();
    });
  });

  afterEach(() => {
    startProcessTick.stop();
  })

});