/**
 * MaxTime
 * 
 * Copyright (c) 2017 Servo Labs Inc.  

 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to 
 * deal in the Software without restriction, including without limitation the 
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is 
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 **/


// namespace:
var b3 = require('../core/b3')
var Decorator = require('../core/decorator')
var _ = require('underscore');

/**
 * The MaxTime decorator limits the maximum time the node child can execute. 
 * Notice that it does not interrupt the execution itself (i.e., the child must
 * be non-preemptive), it only interrupts the node after a `RUNNING` status.
 *@memberof module:Decorators
 **/
class MaxTime extends Decorator {

  constructor(settings) {

    settings = settings || {};
    super(settings);

    this.name = 'MaxTime';


    this.title = 'Max <maxTime>ms';

    /**
     * Node parameters
     * @property parameters
     * @type {Object}
     * @property {number} parameters.maxTime - Maximum time a child can execute
     */
    this.parameters = _.extend(this.parameters, {
      'maxTime': 0
    });

    // TODO: MOVE this to an Initialize and THROWconsole.error
    if (!settings.maxTime) {
      console.error("maxTime parameter in MaxTime decorator is an obligatory " +
        "parameter");
    }

    this.description = "Sets a maximum milliseconds time, after which it returns failure."

    this.maxTime = settings.maxTime;
  }

  /**
   * Open method.
   *
   * @private open
   * @param {Tick} tick A tick instance.
   **/
  open(tick) {
    var startTime = (new Date()).getTime();
    tick.process.set('startTime', startTime, tick.tree.id, this.id);
  }

  /**
   * Tick method.
   *
   * @private
   * @param {Tick} tick A tick instance.
   * @return {TickStatus} A state constant.
   **/
  tick(tick) {
    if (!this.child) {
      return b3.ERROR();
    }

    var currTime = (new Date()).getTime();
    var startTime = tick.process.get('startTime', tick.tree.id, this.id);

    var status = this.child._execute(tick);
    if (currTime - startTime > this.maxTime) {
      return b3.FAILURE();
    }

    return status;
  }

  /**
   * defines validation methods to execute at the editor; if one of them fails, a dashed red border is displayed for the node
   * @return {Array<Validator>}
   */
  validators(node) {
    return [{
      condition: node.child,
      text: "should have a child"
    }, {
      condition: !isNaN(node.properties.maxLoop),
      text: "maxTime should be a number"
    }];
  }
}
module.exports = MaxTime;