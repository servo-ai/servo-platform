let ProcessTick = require('./support/start-process-tick');

xdescribe('fsm properties tree', () => {
  var processTick;
  beforeEach((done) => {
    processTick = new ProcessTick();
    // get the tree
    // start the process  & tick
    processTick.start('../convocode/anonymous/fsms/unit-tests/trees/set-fsm-properties-tree/set-fsm-properties-tree.json').then(() => {
      done();
    });
  });

  it('fsm compare test', (done) => {

    processTick.expect('english enabled').then(() => {
      done()
    }).catch((x) => {
      processTick.fail(x, done);
    });

  });

  afterEach(() => {
    processTick.stop();
  });

});
