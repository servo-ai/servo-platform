var b3 = require('FSM/core/b3');
var _ = require('underscore');
var Action = require('FSM/core/action');
var utils = require('utils/utils');

/**
 * removes current target from the tick
 *  @memberof module:Actions
 */
class RemoveTargetAction extends Action {

  constructor(settings) {
    super();
    this.title = this.name = 'RemoveTargetAction';


    this.parameters = {};
  }

  /**
   * Tick method.
   *
   * @private tick
   * @param {Tick} tick A tick instance.
   * @return {TickStatus} A state constant.
   **/
  tick(tick) {
    try {
      this.removeTargets(tick);
      return b3.SUCCESS();
    } catch (err) {
      var dblogger = require('utils/dblogger');
      dblogger.error(err);
      return b3.FAILURE();
    }
  }
}

module.exports = RemoveTargetAction;
