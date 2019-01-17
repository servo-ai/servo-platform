// namespace:
var b3 = require('FSM/core/b3');
var Action = require('FSM/core/action')
var _ = require('underscore');


/**
 * 
 * find current contextmanager and clear all its contexts.
 *  @memberof module:Actions 
 **/
class ClearAllContexts extends Action {

  constructor() {
    super();


    this.title = this.name = 'ClearAllContexts';
    this.description = 'find current context managed node and clear all its contexts. if leaveCurrent is true, leave current context intact'
    var parameters = {
      "leaveCurrent": false
    };
    this.parameters = _.extend(this.parameters, parameters);
  }
  /**
   * Tick method.
   * @param {Tick} tick A tick instance.
   * @return {TickStatus} Always return `b3.SUCCESS`.
   * @private
   **/
  tick(tick) {

    this.clearAllContexts(tick, this.parameters.leaveCurrent);

    return b3.SUCCESS();
  }
}
module.exports = ClearAllContexts;
