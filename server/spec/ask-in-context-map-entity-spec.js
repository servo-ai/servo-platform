let ProcessTick = require('./support/start-process-tick');


describe('load environment nodes', () => {
  var processTick;
  beforeEach((done) => {
    processTick = new ProcessTick();

    // start the process  & tick
    processTick.start('../convocode/anonymous/fsms/unit-tests/trees/ask-in-context-map-entity-tree/ask-in-context-map-entity-tree.json').then(() => {
      done();
    });
  });

  it('map entity in ask in context test', (done) => {

    processTick.expect('ask yes or not with a number').then(() => {
      processTick.send({
        intentId: 'PositiveIntent',
        entities: {
          'number': 12121
        }
      }).then(() => {
        processTick.expect('Yes 12121!').then(() => {
          done();
        }).catch((x) => {
          done.fail(x);
        });
      }).catch(() => {
        console.log('reject1');
      });
    }).catch(() => {
      console.log('reject2');
    });


  });

  afterEach(() => {
    processTick.stop();
  });

});
