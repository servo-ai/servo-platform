let StartProcessTick = require('./support/start-process-tick');
describe('set an object field', () => {
    var startProcessTick;
    beforeEach((done) => {
        startProcessTick = new StartProcessTick();
        // start the process & tick
        startProcessTick.start('../convocode/anonymous/fsms/unit-tests/trees/arr-query-test/arr-query-test.json');
        done();

    });

    it('should show all fields of the object', (done) => {
        startProcessTick.expect('2 pizza today').then(() => {
            done();
        });
    });

    afterEach(() => {
        startProcessTick.stop();
    });

});