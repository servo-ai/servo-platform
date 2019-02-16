let StartProcessTick = require('./support/start-process-tick');
describe('set an object field', () => {
    var startProcessTick;
    beforeEach((done) => {
        startProcessTick = new StartProcessTick();
        // start the process & tick
        startProcessTick.start('../convocode/anonymous/fsms/unit-tests/trees/set-field-object/set-field-object.json');
        done();

    });

    it('should show all fields of the object', (done) => {
        startProcessTick.expect('my object is 11').then(() => {
            startProcessTick.expect('my evaluated object is 11').then(() => {
                done();
            });
        });
    });

    afterEach(() => {
        startProcessTick.stop();
    });

});