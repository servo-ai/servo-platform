let ProcessTick = require('./support/start-process-tick');


fdescribe('first mentioned entities ', () => {
    var processTick;
    beforeEach((done) => {
        processTick = new ProcessTick();
        // get the tree
        // start the process  & tick
        processTick.start('../convocode/anonymous/fsms/unit-tests/trees/question-skipped-if-entity-mapped/question-skipped-if-entity-mapped.json').then(() => {
            done();
        });
    });


    it('allows to skip next questions', (done) => {
        processTick.expect("what car do you have?").then(() => {
            processTick.send({
                entities: {
                    'carEntityMake': "Audi",
                    'carEntityModel': "X6"
                }
            }).then(() => {
                processTick.expect('Audi X6 is a nice car!').then(() => {
                    done();
                });
            }).catch((x) => {
                console.log('reject1');
                done.fail(x);
            });
        });
    });

    afterEach(() => {
        processTick.stop();
    });

});