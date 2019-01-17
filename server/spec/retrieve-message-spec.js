let StartProcessTick = require('./support/start-process-tick');
var fsmEventEmitter = require('FSM/fsm-event-emitter.js');
var results = {};
describe('load environment nodes', () => {
  var startProcessTick;
  beforeEach((done) => {
    startProcessTick = new StartProcessTick();

    // start the process & tick
    startProcessTick.start('../convocode/anonymous/fsms/unit-tests/trees/retrieve-message/retrieve-message.json');
    done();

  });

  it('retrieve message test', (done) => {
    startProcessTick.expect('yes or no?').then(() => {
      startProcessTick.send('PositiveIntent').then(() => {
        startProcessTick.expect("intent is PositiveIntent").then(() => {
          done();
        });
      });
    });

  });

  afterEach(() => {
    startProcessTick.stop();
  });

});
