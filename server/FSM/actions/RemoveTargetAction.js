var b3 = require('FSM/core/b3');
var _ = require('underscore');
var Action = require('FSM/core/action');
var utils = require('utils/utils');

/**
 * removes current target(s) from the tick
 *  @memberof module:Actions
 */
class RemoveTargetAction extends Action {

  constructor(settings) {
    super();
    this.title = this.name = 'RemoveTargetAction';

    /** 
     * Node parameters
     * @property parameters
     * @type {Object}
     * @property  {boolean} parameters.removeAll if true, removes all targets
     *  
     */
    this.parameters = _.extend(this.parameters, {
      "removeAll": false
    });
  }

  /**
   * Tick method.
   *
   * @private 
   * @param {Tick} tick A tick instance.
   * @return {TickStatus} A state constant.
   **/
  tick(tick) {
    try {
      if (this.properties.removeAll) {
        tick.target.removeTargets();
      } else {
        this.removeTargets(tick);
      }

      return b3.SUCCESS();
    } catch (err) {
      var dblogger = require('utils/dblogger');
      dblogger.error(err);
      return b3.FAILURE();
    }
  }
}

module.exports = RemoveTargetAction;