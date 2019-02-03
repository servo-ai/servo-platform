let ProcessTick = require('./support/start-process-tick');


describe('cyclic prompt test', () => {
  var processTick;
  beforeEach((done) => {
    processTick = new ProcessTick();
    // get the tree;
    // start the process  & tick
    processTick.start('../convocode/anonymous/fsms/unit-tests/trees/test-prompt-cyclic-tree/test-prompt-cyclic-tree.json').then(() => {
      done();
    });
  });

  it('cycling 3 times', (done) => {
    processTick.expect('test prompt 1').then(() => {
      processTick.expect('test prompt 2').then(() => {
        processTick.expect('test prompt 1').then(() => {
          done();
        }).catch((x) => {
          processTick.fail(x, done);
        });
      }).catch((x) => {
        processTick.fail(x, done);
      });
    }).catch((x) => {
      processTick.fail(x, done);
    });
  });
  afterEach(() => {
    processTick.stop();
  });

});