/**
 * Runner
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


/**
 * This action node returns RUNNING always.
 *  @memberof module:Actions
 **/
class Runner extends Action {
  constructor() {
    super();


    this.title = this.name = 'Runner';
  }
  /**
   * Tick method.
   *
   * @private tick
   * @param {Tick} tick A tick instance.
   * @return {Constant} Always return `b3.RUNNING`.
   **/
  tick(tick) {
    return b3.RUNNING();
  }
}
module.exports = Runner;
