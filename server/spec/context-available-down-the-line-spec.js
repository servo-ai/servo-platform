let ProcessTick = require('./support/start-process-tick');


describe('load context tree', () => {
  var processTick;
  beforeEach((done) => {
    processTick = new ProcessTick();
    // get the tree
    // start the process  & tick
    return processTick.start('../convocode/anonymous/fsms/unit-tests/trees/context-available-down-the-line/context-available-down-the-line.json').then(() => {

      done();
    });
  });

  it('remembers a number from this context and past context', (done) => {

    return processTick.expect('how much?').then(() => {
      processTick.send({
        useNLU: false,
        "intentId": "None"
      }).then(() => {
        processTick.expect('how much?').then(() => {
          processTick.send({
            entities: {
              number: 123
            }
          }).then(() => {

            processTick.expect('123 found').then(() => {
              processTick.expect('124 found').then(() => {

                console.log('done-------------------------');
                done();
              }).catch((x) => {
                console.error('reject expect 124');
                //done.fail(x);
              });;
            }).catch((x) => {
              console.error('reject expect 123');
              //done.fail(x);
            });
          }).catch(() => {
            console.error('reject send 123');
          });
        }).catch((x) => {
          console.error('expect howmuch2', x);
        });
      }).catch((x) => {
        console.error('send none', x);
      });
    })

  });






  afterEach(() => {
    console.log('afterEach-------------------------')
    processTick.stop();
  });

});
