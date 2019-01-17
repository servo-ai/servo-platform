let ProcessTick = require('./support/start-process-tick');


describe('hello world', () => {
  var processTick;
  beforeEach((done) => {
    processTick = new ProcessTick();

    // start the process  & tick
    return processTick.start('../convocode/anonymous/fsms/unit-tests/trees/helloworld/helloworld.json').then(() => {

      done();
    });
  });

  it('should be uttered once', (done) => {
    processTick.send('anything').then(() => {
      processTick.expect('hello world').then(() => {
        done();
      }).catch((x) => {
        done.fail(x);
      });
    });
  });

  afterEach(() => {
    processTick.stop();
  });

});
