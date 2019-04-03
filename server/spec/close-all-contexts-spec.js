let StartProcessTick = require('./support/start-process-tick');
var fsmEventEmitter = require('FSM/fsm-event-emitter.js');
var results = {};
describe('close all', () => {
  var startProcessTick;
  beforeEach((done) => {
    startProcessTick = new StartProcessTick();

    // start the process & tick
    startProcessTick.start('../convocode/anonymous/fsms/unit-tests/trees/close-context/close-context.json').then(() => {

      done();
    });


  });

  it('should allow change entities and reset running childs messages, if backtrack child succeeded', (done) => {
    startProcessTick.expect("wire or help?").then(() => {
      startProcessTick.send({
        useNLU: false,
        "intentId": "WireIntent",
        "entities": {
          "number": '400'
        }
      }).then(() => {
        startProcessTick.expect("confirming").then(() => {
          startProcessTick.expect("wire 400?").then(() => {
            startProcessTick.send({
              useNLU: false,
              "intentId": "WireIntent",
              "entities": {
                "number": '500'
              }
            }).then(() => {
              startProcessTick.expect("do you want to change your answer?").then(() => {
                startProcessTick.send("PositiveIntent").then(() => {
                  startProcessTick.expect("yes to change").then(() => {
                    startProcessTick.expect("confirming").then(() => {
                      startProcessTick.expect("wire 500?").then(() => {
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
    })


  });
  it('shouldnt allow change if backtrack child failed', (done) => {
    startProcessTick.expect("wire or help?").then(() => {
      startProcessTick.send({
        useNLU: false,
        "intentId": "WireIntent",
        "entities": {
          "number": '400'
        }
      }).then(() => {
        startProcessTick.expect("confirming").then(() => {
          startProcessTick.expect("wire 400?").then(() => {
            startProcessTick.send({
              useNLU: false,
              "intentId": "WireIntent",
              "entities": {
                "number": '500'
              }
            }).then(() => {
              startProcessTick.expect("do you want to change your answer?").then(() => {
                startProcessTick.send("NegativeIntent").then(() => {
                  startProcessTick.expect("no to change").then(() => {
                    startProcessTick.expect("wire 400?").then(() => {
                      done();
                    });
                  });
                });
              });
            });
          });
        });
      });
    })


  });
  afterEach(() => {
    startProcessTick.stop();
  })

});