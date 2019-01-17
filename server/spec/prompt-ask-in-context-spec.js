let ProcessTick = require('./support/start-process-tick');

describe('non-cyclic aic test', () => {
  var processTick;
  beforeEach((done) => {
    processTick = new ProcessTick();
    // get the tree
    // start the process  & tick
    return processTick.start('../convocode/anonymous/fsms/unit-tests/trees/prompt-ask-in-context-tree/prompt-ask-in-context-tree.json').then(() => {

      done();
    });
  });

  it('asks the current prompt', (done) => {

    processTick.expect('test aic1').then(() => {
      processTick.send('PositiveIntent').then(() => {
        processTick.expect('test aic2').then(() => {
          processTick.send('PositiveIntent').then(() => {
            processTick.expect('test aic2').then(() => {
              done();
            }).catch((x) => {
              done.fail(x);
            });
          })
        }).catch((x) => {
          done.fail(x);
        });
      }).catch(() => {
        console.log('reject1');
      });
    }).catch(() => {
      console.log('reject2');
    });


  });


  afterEach(() => {
    processTick.stop();
  });

});
