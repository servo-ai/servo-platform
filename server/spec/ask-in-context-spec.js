let ProcessTick = require('./support/start-process-tick');


describe('load environment nodes', () => {
  var processTick;
  beforeEach((done) => {
    processTick = new ProcessTick();

    // start the process  & tick
    return processTick.start('../convocode/anonymous/fsms/unit-tests/trees/ask-in-context-tree/ask-in-context-tree.json').then(() => {

      done();
    });
  });

  it('ask as root node', (done) => {

    processTick.expect('ask yes or not?').then(() => {
      processTick.send('PositiveIntent').then(() => {
        processTick.expect('Yes!').then(() => {
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

  it('asks AFTER message received ', (done) => {

    processTick.send('PositiveIntent').then(() => {
      processTick.expect('ask yes or not?').then(() => {
        processTick.expect('Yes!').then(() => {
          // processTick.send('None').then(() => { // this will not work with the current tree, which always  returns true once initial conversation is done and NOT going into a selector
          // processTick.expect('I don\'t understand').then(() => {
          done();
          //}).catch((x) => {
          //done.fail(x);
          //});
          // }).catch((x) => {
          //   console.log('reject1', x);
          //   done.fail(x)
          // });
        }).catch((x) => {
          console.log('reject2', x);
          done.fail(x)
        });
      }).catch(() => {
        console.log('reject3');
      });
    });


  });


  afterEach(() => {
    processTick.stop();
  });

});
