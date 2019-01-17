let StartProcessTick = require('./support/start-process-tick');
var fsmEventEmitter = require('FSM/fsm-event-emitter.js');
var results = {};
describe('load environment nodes', () => {
  var startProcessTick;
  beforeEach((done) => {
    startProcessTick = new StartProcessTick();
    // start the process & tick
    startProcessTick.start('../convocode/anonymous/fsms/unit-tests/trees/general-message-tree/general-message-tree.json');
    done();

  });

  it('a general message test', (done) => {
    startProcessTick.expect('test general message').then(() => {
      done();
    });
  });

  afterEach(() => {
    startProcessTick.stop();
  })

});
