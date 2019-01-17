let ProcessTick = require('./support/start-process-tick');


describe('first mentioned entity ', () => {
  var processTick;
  beforeEach((done) => {
    processTick = new ProcessTick();
    // get the tree
    // start the process  & tick
    processTick.start('../convocode/anonymous/fsms/unit-tests/trees/first-entity-pertains-to-second-question/first-entity-pertains-to-second-question.json').then(() => {

      done();
    });
  });


  it('mapped to second question entity', (done) => {
    processTick.expect('how can I help?').then(() => {
      processTick.send({

        entities: {
          "intentId": "ApptIntent",
          'city': "NYC"

        }
      }).then(() => {
        processTick.expect('ok').then(() => {
          processTick.expect('ok').then(() => {
            processTick.expect('I understand you need an appointment for NYC').then(() => {
              processTick.expect('when is the appointment?').then(() => {
                processTick.send({
                  entities: {
                    'heDate': "15102018"
                  }
                }).then(() => {
                  processTick.expect('I understand you need an appointment for 15102018 around the area of NYC').then(() => {
                    done();
                  })
                })
              })
            })
          }).catch((x) => {
            done.fail(x);
          });
        }).catch((x) => {
          console.log('reject1');
          done.fail(x);
        });
      });
    });



  });
  /*
    it('even if we repeat a previous entity, maps second question entity', (done) => {
      processTick.expect('how can I help?').then(() => {
        processTick.send({

          entities: {
            "intentId": "ApptIntent",
            'city': "NYC"

          }
        }).then(() => {
          processTick.expect('ok').then(() => {
            processTick.expect('ok').then(() => {
              processTick.expect('I understand you need an appointment for NYC').then(() => {
                processTick.expect('when is the appointment?').then(() => {
                  processTick.send({
                    entities: {
                      'heDate': "15102018",
                      "intentId": "ApptIntent"
                    }
                  }).then(() => {
                    processTick.expect('I understand you need an appointment for 15102018 around the area of NYC').then(() => {
                      done();
                    })
                  })
                })
              })
            }).catch((x) => {
              done.fail(x);
            });
          }).catch((x) => {
            console.log('reject1');
            done.fail(x);
          });
        });
      });

      it('if we change a previous entity, and no backtrack child exists, maps second question entity', (done) => {
        processTick.expect('how can I help?').then(() => {
          processTick.send({

            entities: {
              "intentId": "ApptIntent",
              'city': "NYC"

            }
          }).then(() => {
            processTick.expect('ok').then(() => {
              processTick.expect('ok').then(() => {
                processTick.expect('I understand you need an appointment for NYC').then(() => {
                  processTick.expect('when is the appointment?').then(() => {
                    processTick.send({
                      entities: {
                        'heDate': "15102018",
                        "city": "TLV"
                      }
                    }).then(() => {
                      processTick.expect('I understand you need an appointment for 15102018 around the area of TLV').then(() => {
                        done();
                      })
                    })
                  })
                })
              }).catch((x) => {
                done.fail(x);
              });
            }).catch((x) => {
              console.log('reject1');
              done.fail(x);
            });
          });
        });

      });
    });

    it('if we input a non-changed previous entity this should go to help', (done) => {
      processTick.expect('how can I help?').then(() => {
        processTick.send({

          entities: {
            "intentId": "ApptIntent",
            'city': "NYC"

          }
        }).then(() => {
          processTick.expect('ok').then(() => {
            processTick.expect('ok').then(() => {
              processTick.expect('I understand you need an appointment for NYC').then(() => {
                processTick.expect('when is the appointment?').then(() => {
                  processTick.send({
                    entities: {
                      'intentId': "ApptIntent",
                      "xxx": "TLV"
                    }
                  }).then(() => {
                    processTick.expect('please enter the time at which you need the appointment').then(() => {
                      done();
                    })
                  })
                })
              })
            }).catch((x) => {
              done.fail(x);
            });
          }).catch((x) => {
            console.log('reject1');
            done.fail(x);
          });
        });
      });


    });
  */
  afterEach(() => {
    processTick.stop();
  });

});
