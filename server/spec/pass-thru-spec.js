let ProcessTick = require('./support/start-process-tick');


describe('when a context switch done ', () => {
  var processTick;
  beforeEach((done) => {
    processTick = new ProcessTick();

    // start the process  & tick
    return processTick.start('../convocode/anonymous/fsms/unit-tests/trees/pass-thru/pass-thru.json').then(() => {

      done();
    });
  });

  it('path thru upper context should route context down unused and return to previous context', (done) => {
    processTick.expect('what ud like to do?').then(() => {
      processTick.send("BalanceIntent").then(() => {

        processTick.expect("which account?").then(() => {

          processTick.send("HowAreYouIntent").then(() => {

            processTick.expect("I'm good").then(() => {


              processTick.expect("which account?").then(() => {

                processTick.send({

                  entities: {
                    "intentId": "BalanceIntent",
                    'number': 9198

                  }
                }).then(() => {

                  processTick.expect("balance for account #9198 is $10000").then(() => {

                    done();

                  });
                });

              });

            });
          });

        });
      });
    });

  });

  afterEach(() => {
    processTick.stop();
  });

});
