let ProcessTick = require('./support/start-process-tick');


describe('nested context test', () => {
  var processTick;
  beforeEach((done) => {
    processTick = new ProcessTick();
    // get the tree
    // start the process  & tick
    processTick.start('../convocode/anonymous/fsms/unit-tests/trees/nested-servo-bank-demo/nested-servo-bank-demo.json').then(() => {
      done();
    });
  });

  it('wire answer on same context', (done) => {
    processTick.expect('what would you like to do?').then(() => {
      processTick.send({
        useNLU: false,
        "intentId": "WireIntent"
      }).then(() => {
        processTick.expect('how much would you like to transfer?').then(() => {
          processTick.send({
            useNLU: false,
            entities: {
              'number': '1245'
            }
          }).then(() => {
            processTick.expect('transfer of $1245 scheduled').then(() => {
              processTick.expect('an amount question').then(() => {
                processTick.send({
                  useNLU: false
                }).then(() => {
                  processTick.expect('amount 1245 accessible from lower context').then(() => {
                    done();
                  });
                });
              });
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
    });

  });

  it('wire answer on same context', (done) => {
    processTick.expect('what would you like to do?').then(() => {
      processTick.send({
        useNLU: false,
        "intentId": "WireIntent"
      }).then(() => {
        processTick.expect('how much would you like to transfer?').then(() => {
          processTick.send({
            useNLU: false,
            entities: {
              'number': '1245'
            }
          }).then(() => {
            processTick.expect('transfer of $1245 scheduled').then(() => {
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
    });

  });

  it('balance answer on same context', (done) => {
    processTick.expect('what would you like to do?').then(() => {
      processTick.send({
        useNLU: false,
        "intentId": "BalanceIntent"
      }).then(() => {
        processTick.expect('your balance is $10000').then(() => {
          done();
        });
      });
    });
  });

  it('helper if no intent', (done) => {
    processTick.expect('what would you like to do?').then(() => {
      processTick.send({
        useNLU: false,
        "intentId": "WireIntent"
      }).then(() => {
        processTick.expect('how much would you like to transfer?').then(() => {
          processTick.send({
            useNLU: false
          }).then(() => {
            processTick.expect('help2').then(() => {
              done();
            });
          });
        });
      });
    });
  });

  it('switch context', (done) => {
    processTick.expect('what would you like to do?').then(() => {
      processTick.send({
        useNLU: false,
        "intentId": "WireIntent"
      }).then(() => {
        processTick.expect('how much would you like to transfer?').then(() => {
          processTick.send({
            useNLU: false,
            "intentId": "BalanceIntent"
          }).then(() => {
            processTick.expect('your balance is $10000').then(() => {
              processTick.expect('how much would you like to transfer?').then(() => {
                done();
              });
            });
          });
        }).catch((x) => {
          processTick.fail(x, done);
        });
      });
    });
  });

  afterEach(() => {
    processTick.stop();
  });

});
