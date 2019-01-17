// namespace:
var b3 = require('FSM/core/b3');
var Action = require('FSM/core/action')


/**
 *Close current context, effectively reseting all the runningChilds and allowing re-open 
 * 
 *  @memberof module:Actions
 **/
class CloseAllContexts extends Action {

  constructor() {
    super();

    this.title = this.name = 'CloseAllContexts';
    this.description = "Close current context and all its siblings, effectively reseting all the runningChilds and allowing re-open";
  }
  /**
   * Tick method.
   * @param {Tick} tick A tick instance.
   * @return {TickStatus} SUCCESS always
   * @private
   **/
  tick(tick) {

    this.closeAllContexts(tick);

    return b3.SUCCESS();
  }
}
module.exports = CloseAllContexts;
