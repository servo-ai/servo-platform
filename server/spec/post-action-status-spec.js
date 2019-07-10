let StartProcessTick = require('./support/start-process-tick');
var fsmEventEmitter = require('FSM/fsm-event-emitter.js');
var results = {};
describe('load', () => {
    var startProcessTick;
    beforeEach((done) => {
        startProcessTick = new StartProcessTick();

        // start the process & tick
        startProcessTick.start('../convocode/anonymous/fsms/unit-tests/trees/post-action-status/post-action-status.json');
        done();

    });

    it('a post status test', (done) => {
        startProcessTick.expect("post status: 500").then(() => {
            done();
        });
    });

    afterEach(() => {
        startProcessTick.stop();
    })

});