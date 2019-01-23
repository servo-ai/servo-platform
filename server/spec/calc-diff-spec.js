let StartProcessTick = require('./support/start-process-tick');
describe('load environment nodes', () => {
    var startProcessTick;
    beforeEach((done) => {
        startProcessTick = new StartProcessTick();
        // start the process & tick
        startProcessTick.start('../convocode/anonymous/fsms/unit-tests/trees/calc-date-diff/calc-date-diff.json');
        done();

    });

    it('date diff should show', (done) => {
        startProcessTick.expect('diff is 3660').then(() => {
            done();
        });
    });

    afterEach(() => {
        startProcessTick.stop();
    });

});