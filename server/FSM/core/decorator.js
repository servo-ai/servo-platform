/**
 * Decorator
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
var b3 = require('./b3')
var BaseNode = require('./baseNode')

/**
 * Decorator is the base class for all decorator nodes. Thus, if you want to 
 * create new custom decorator nodes, you need to inherit from this class. 
 * 
 * When creating decorator nodes, you will need to propagate the tick signal to
 * the child node manually, just like the composite nodes. To do that, override
 * the `tick` method and call the `_execute` method on the child node. For 
 * instance, take a look at how the Inverter node inherit this class and how it
 * call its children:
 * @memberof module:Core
 **/
class Decorator extends BaseNode {

  constructor(settings) {

    super();
    /**
     * Node category. Default to b3.DECORATOR.
     *
     * @property category
     * @type {string}
     * @readonly
     **/
    this.category = b3.DECORATOR;
    settings = settings || {};

    this.child = settings.child || null;
  }

  /**
   * Tick method.
   *
   * @param {Tick} tick A tick instance.
   * @return {TickStatus} A state constant.
   **/
  tick(tick) {
    if (!this.child) {
      return b3.ERROR();
    }

    var status = this.child._execute(tick);


    return status;
  }


}
module.exports = Decorator;
