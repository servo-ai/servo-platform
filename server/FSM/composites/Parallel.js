var b3 = require('FSM/core/b3');
var Composite = require('FSM/core/composite');
/**
 * @private
 */
class Parallel extends Composite {
  /**
   * Node name. Default to `Sequence`.
   *
   * @property name
   * @type {String}
   * @readonly
   **/
  constructor() {
    super();
    this.title = this.name = 'Parallel';
  }

  /**
   * Tick method.
   *
   * @private
   * @param {Tick} tick A tick instance.
   * @return {Constant} A state constant.
   **/
  tick(tick) {

    /*for (var  i=0; i<this.children.length; i++) {
			setTimeout(()=>{
				this.children[i]._execute(tick)
			},0)
         }*/

    var failCount = 0;
    for (var i = 0; i < this.children.length; i++) {
      var state_i = this.children[i]._execute(tick);
      failCount += state_i === b3.FAILURE() ? 1 : 0;

    }
    // this could be parametrized. as of now we  stop only if everyone failed
    if (failCount > (this.children.length - (this.properties.countForSuccess || 1)))
      return b3.FAILURE();
    else
      return b3.RUNNING();

  }
}


module.exports = Parallel;