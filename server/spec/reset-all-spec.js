let StartProcessTick = require('./support/start-process-tick');
describe('reset all', () => {
  var startProcessTick;
  beforeEach((done) => {
    startProcessTick = new StartProcessTick();

    // start the process & tick
    startProcessTick.start('../convocode/anonymous/fsms/unit-tests/trees/reset-all/reset-all.json');
    done();

  });

  it('should not reset properties but reset all others', (done) => {
    startProcessTick.expect("no global.x").then(() => {
      startProcessTick.expect("fsm.x is 2").then(() => {
        done();
      });
    });
  });

  afterEach(() => {
    startProcessTick.stop();
  })

});
