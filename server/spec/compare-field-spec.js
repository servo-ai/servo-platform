let ProcessTick = require('./support/start-process-tick');

describe('compare field tree', () => {
  var processTick;
  beforeEach((done) => {
    processTick = new ProcessTick();
    // get the tree
    // start the process  & tick
    processTick.start('../convocode/anonymous/fsms/unit-tests/trees/compare-field-spec/compare-field-spec.json').then(() => {
      done();
    });
  });

  it('global/context/message compare test', (done) => {

    processTick.expect('global field 2').then(() => {
      console.log('2')
      processTick.expect('context field 3').then(() => {
        console.log('3')
        processTick.expect('enter a message').then(() => {
          console.log('4')
          processTick.send({
            "useNLU": false,
            "utterance": "the message text",
            "intentId": "testIntent"
          }).then(() => {
            processTick.expect('message field good').then(() => {
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
      }).catch((x) => {
        processTick.fail(x, done);
      });
    });
  });

  afterEach(() => {
    processTick.stop();
  });

});
