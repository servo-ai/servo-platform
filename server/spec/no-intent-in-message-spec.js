let ProcessTick = require('./support/start-process-tick');


describe("a message with no intent", () => {
  var processTick;
  beforeEach((done) => {
    processTick = new ProcessTick();
    // get the tree
    // start the process  & tick
    return processTick.start('../convocode/anonymous/fsms/unit-tests/trees/no-intent-on-message/no-intent-on-message.json').then(() => {

      done();
    });
  });

  it('should go to help if intent is None', (done) => {

    return processTick.expect('what').then(() => {
      processTick.send({
        useNLU: false,
        "intentId": "None"
      }).then(() => {
        processTick.expect('help').then(() => {
          done();
        }).catch((x) => {
          console.error('send none', x);
        });
      })

    });
  })



  it('should answer hello if an entity with greeting', (done) => {

    return processTick.expect('what').then(() => {
      processTick.send({
        useNLU: false,
        entities: {
          'greetings': true
        }
      }).then(() => {
        processTick.expect('hello').then(() => {
          done();
        }).catch((x) => {
          console.error('send greeting', x);
        });
      })

    });
  });




  afterEach(() => {
    console.log('afterEach-------------------------')
    processTick.stop();
  });

});
