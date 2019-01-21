var b3 = require('FSM/core/b3');
var Condition = require('FSM/core/condition');
var utils = require('utils/utils');
/**
 * Conditions are used to control flow. They are derived from Condition class. As a general rule, conditions should be read only
 * @module Conditions
 **/
/**
 * Condition to return SUCCESS if any intent is present on the target
 * 
 */
class AnyTarget extends Condition {

  constructor() {
    super();
    this.title = this.name = 'AnyTarget';
    this.description = "return SUCCESS if any intent is present on the target"
  }

  /**
   * Tick method.
   *
   * @private
   * @param {Tick} tick A tick instance.
   * @return {Constant} A state constant.
   **/
  tick(tick) {

    if (this.target(tick) && this.target(tick).exists()) {
      return b3.SUCCESS();
    } else {
      return b3.FAILURE();
    }
  }
}

module.exports = AnyTarget;
