let ProcessTick = require('./support/start-process-tick');


describe('set field tree', () => {
  var processTick;
  beforeEach((done) => {
    processTick = new ProcessTick();
    // get the tree
    // start the process  & tick
    processTick.start('../convocode/anonymous/fsms/unit-tests/trees/set-field/set-field.json').then(() => {
      done();
    });
  });

  it('global/context/message set field test', (done) => {

    processTick.expect('global field 2').then(() => {
      processTick.expect('context field 3').then(() => {
        processTick.expect('enter a message').then(() => {
          processTick.send({
            "useNLU": false,
            "utterance": "the message text"
          }).then(() => {
            processTick.expect('message field the message text').then(() => {
              done();
            }).catch((x) => {
              done.fail(x);
            });
          }).catch((x) => {
            done.fail(x);
          });
        }).catch((x) => {
          done.fail(x);
        });
      }).catch((x) => {
        done.fail(x);
      });
    });
  });

  afterEach(() => {
    processTick.stop();
  });

});
