let StartProcessTick = require('./support/start-process-tick');
var fsmEventEmitter = require('FSM/fsm-event-emitter.js');
var results = {};
describe('load environment nodes', () => {
    var startProcessTick;
    beforeEach((done) => {
        startProcessTick = new StartProcessTick();
        // start the process & tick
        startProcessTick.start('../convocode/anonymous/fsms/unit-tests/trees/repeat-until-condition/repeat-until-condition.json');
        done();

    });

    it('repeat until 24', (done) => {
        startProcessTick.expect('left is 24. repeatCount is 24').then(() => {
            done();
        });
    });

    afterEach(() => {
        startProcessTick.stop();
    });

});