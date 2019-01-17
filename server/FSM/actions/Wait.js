/**
 * Wait
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
var b3 = require('../core/b3');
var Action = require('../core/action')
var _ = require('underscore');

/**
 * Wait a few seconds.
 * @memberof module:Actions
 **/
class Wait extends Action {


  constructor(settings) {
    settings = settings || {};
    super();

    this.name = 'Wait';


    this.title = 'Wait <milliseconds> ms';

    /**
     * Node parameters
     * @property parameters
     * @type {Object}
     * @property {string} parameters.milliseconds (*Integer*) Maximum time, in milliseconds, a child can execute.
     */
    this.parameters = _.extend(this.parameters, {
      'milliseconds': 0
    });


    this.endTime = settings.milliseconds || 0;
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
   * @private tick
   * @param {Tick} tick A tick instance.
   * @return {TickStatus} A state constant.
   **/
  tick(tick) {
    var currTime = (new Date()).getTime();
    var startTime = tick.process.get('startTime', tick.tree.id, this.id);

    if (currTime - startTime > this.endTime) {
      return b3.SUCCESS();
    }

    return b3.RUNNING();
  }
}
module.exports = Wait;
