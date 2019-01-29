let StartProcessTick = require('./support/start-process-tick');
describe('load environment nodes', () => {
    var startProcessTick;
    beforeEach((done) => {
        startProcessTick = new StartProcessTick();
        // start the process & tick
        startProcessTick.start('../convocode/anonymous/fsms/unit-tests/trees/valid-field/valid-field.json');
        done();

    });

    it('9 digit field 0XXXXXXXX should be valid', (done) => {
        startProcessTick.expect('id?').then(() => {
            startProcessTick.send({
                entities: {
                    "intentId": "",
                    'number': '059560938'
                }
            }).then(() => {
                startProcessTick.expect('valid 9 digit number').then(() => {
                    done();
                });
            })

        });
    });

    afterEach(() => {
        startProcessTick.stop();
    });

});