let ProcessTick = require('./support/start-process-tick');


describe('backtrack test', () => {
  var processTick;
  beforeEach((done) => {
    processTick = new ProcessTick();
    // get the tree

    // start the process  & tick
    processTick.start('../convocode/anonymous/fsms/unit-tests/trees/backtrack/backtrack.json').then(() => {
      //processTick.start('./spec-trees/backtrack-tree.json').then(() => {
      done();
    });
  });


  // it('ask in root node', (done) => {

  //   processTick.expect('yes or no?').then(() => {
  //     processTick.send('PositiveIntent').then(() => {
  //       processTick.expect('yes answered').then(() => {
  //         done();
  //       }).catch((x) => {
  //         done.fail(x);
  //       });
  //     }).catch(() => {
  //       console.log('reject1');
  //     });
  //   }).catch(() => {
  //     console.log('reject2');
  //   });


  // });

  it('asks AFTER message received ', (done) => {

    processTick.expect('yes or no?').then(() => {
      processTick.send('NegativeIntent').then(() => {
        processTick.expect('no answered').then(() => {
          processTick.expect('may i ask why?').then(() => {
            processTick.send('PositiveIntent').then(() => {
              processTick.expect("yes answered").then(() => {
                processTick.expect('done').then(() => {
                  console.log('============done ================');
                  done();
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