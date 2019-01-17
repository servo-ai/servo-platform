let ProcessTick = require('./support/start-process-tick');


describe('load environment for AskAndMap switch', () => {
  var processTick;
  beforeEach((done) => {
    processTick = new ProcessTick();
    // start the process  & tick
    processTick.start('../convocode/anonymous/fsms/unit-tests/trees/ask-in-context-switch-tree/ask-in-context-switch-tree.json').then(() => {
      done();
    });
  });

  it('ask as root node', (done) => {

    processTick.expect('ask yes or not?').then(() => {
      processTick.send('PositiveIntent').then(() => {
        processTick.expect('hi or help?').then(() => {
          processTick.send('NegativeIntent').then(() => {
            processTick.expect('No!').then(() => {
              done();
            }).catch((x) => {
              done.fail(x);
            });
          }).catch(() => {
            console.log('reject1');
          });
        }).catch(() => {
          console.log('reject2');
        });
      }).catch(() => {
        console.log('reject3');
      });
    }).catch(() => {
      console.log('reject4');
    });


  });



  afterEach(() => {
    processTick.stop();
  });

});
