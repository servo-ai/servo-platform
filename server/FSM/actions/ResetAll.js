var b3 = require('FSM/core/b3');
var _ = require('underscore');
var Action = require('FSM/core/action');
var utils = require('utils/utils');
var dblogger = require('utils/dblogger');
/**
 * ResetAll removes last target, ends session (for session-based clients) closes all nodes, and empties the global memory, too 
 *  @memberof module:Actions
 */
class ResetAll extends Action {

  /**
   * 
   * @private
   */
  constructor() {
    super();
    this.title = this.name = 'ResetAll';

    /**
     * Node parameters.
     *
     * @property parameters
     * @type {Object}
     * @property {boolean} parameters.dontRemoveTarget- if false, removes target
     * @property {boolean} parameters.dontEndSession - if false, ends the session
     * @property {boolean} parameters.emptyGlobalMemory - if false, ends the session
     * 
     **/
    this.parameters = _.extend(this.parameters, {
      dontEndSession: false,
      dontRemoveTarget: false,
      emptyGlobalMemory: false
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

      /**
       * for alexa 
       */
      if (!this.properties.dontEndSession && tick.process.session) {
        tick.process.session.shouldEndSession = true;
      }

      // remove last target
      if (!this.properties.dontRemoveTarget) {
        this.target(tick, "remove");
      }

      let props = tick.process.properties();
      tick.process.resetMemory();
      tick.process.properties(props);
      // backwards compatibility
      tick.process.data('lang', tick.process.properties().defaultLang);

      return b3.SUCCESS();

    } catch (err) {

      dblogger.error('error in ResetAll' + err.message, err);
      return b3.FAILURE();
    }
  }
}

module.exports = ResetAll;