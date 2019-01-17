let ProcessTick = require('./support/start-process-tick');


describe('default-vs-intent test', () => {
  var processTick;
  beforeEach((done) => {
    processTick = new ProcessTick();
    // get the tree

    // start the process  & tick
    processTick.start('../convocode/anonymous/fsms/unit-tests/trees/default-vs-intent/default-vs-intent.json').then(() => {

      done();
    });
  });




  it('intent should win default ', (done) => {

    processTick.send('ExpensiveIntent').then(() => {
      processTick.expect('assume we solve expensive').then(() => {
        done();
      });
    });

  });

  afterEach(() => {
    processTick.stop();
  });

});
