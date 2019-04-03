let ProcessTick = require('./support/start-process-tick');


describe('entity-usage test', () => {
  var processTick;
  beforeEach((done) => {
    processTick = new ProcessTick();
    // get the tree

    // start the process  & tick
    processTick.start('../convocode/anonymous/fsms/unit-tests/trees/entity-usage/entity-usage.json').then(() => {

      done();
    });
  });


  it('dont show the question if the answer is already in the target', (done) => {
    processTick.send('PositiveIntent').then(() => {
      processTick.expect('yes answered').then(() => {
        done();
      }).catch((x) => {
        done.fail(x);
      });
    }).catch((x) => {
      console.log('reject1');
      done.fail(x);
    });



  });

  // it('context selector answers hi', (done) => {


  //   processTick.send('HelloIntent').then(() => {
  //     processTick.expect('hi answered').then(() => {

  //       done();
  //     });
  //   });
  // });



  afterEach(() => {
    processTick.stop();
  });

});