let ProcessTick = require('./support/start-process-tick');


describe('add target sent', () => {
  var processTick;
  beforeEach((done) => {
    processTick = new ProcessTick();

    // start the process  & tick
    return processTick.start('../convocode/anonymous/fsms/unit-tests/trees/add-target/add-target.json').then(() => {

      done();
    });
  });

  it('should add an entity to the context as if it came from the user', (done) => {
    processTick.expect('hi, do you want to give me your name?').then(() => {
      processTick.send("NegativeIntent").then(() => {

        processTick.expect("Thank you Moishe").then(() => {

          done();

        });
      });

    });

  });

  afterEach(() => {
    processTick.stop();
  });

});
