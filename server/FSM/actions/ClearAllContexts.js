// namespace:
var b3 = require('FSM/core/b3');
var Action = require('FSM/core/action')
var _ = require('underscore');


/**
 * 
 * finds closest context managed ancestor and clear all its contexts. 
 *  @memberof module:Actions 
 **/
class ClearAllContexts extends Action {

  constructor() {
    super();


    this.title = this.name = 'ClearAllContexts';
    this.description = 'find closest context managed ancestor and clear all its contexts. If leaveCurrent is true, leaves current context intact';

    var parameters = {
      leaveCurrent: false
    };
    /** 
     * Node parameters
     * @property parameters
     * @type {Object}
     * @property  {boolean} parameters.leaveCurrent if true, leaves current context intact
     *  
     */
    this.parameters = _.extend(this.parameters, {
      leaveCurrent: false
    });
  }
  /**
   * Tick method.
   * @param {Tick} tick A tick instance.
   * @return {TickStatus} Always return `b3.SUCCESS`.
   * @private
   **/
  tick(tick) {

    this.clearAllContexts(tick, this.properties.leaveCurrent);

    return b3.SUCCESS();
  }
}
module.exports = ClearAllContexts;