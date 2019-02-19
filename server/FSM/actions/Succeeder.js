/**
 * Succeeder
 *
 * Copyright (c) 2017 Servo Labs Inc.
 * Copyright(c)  Renato de Pontes Pereira.  
 * 
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
 * This action node returns `SUCCESS` always.
 *  @memberof module:Actions
 **/
class Succeeder extends Action {

  constructor() {
    super();
    /**
     * Node name. Default to `Succeeder`.
     *
     * @property name
     * @type String
     * @readonly
     **/
    this.title = this.name = 'Succeeder';
  }
  /**
   * Tick method.
   *
   * @private
   * @param {Tick} tick A tick instance.
   * @return {Constant} Always return `b3.SUCCESS`.
   **/
  tick(tick) {

    return b3.SUCCESS();
  }

}
module.exports = Succeeder;