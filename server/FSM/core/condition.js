/**
 * Condition
 *
 * Copyright (c) 2017-2019 Servo Labs Inc.  
 * Copyright(c)  Renato de Pontes Pereira.   
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
var _ = require('underscore');
/**
 * Condition is the base class for all condition nodes. Thus, if you want to 
 * create new custom condition nodes, you need to inherit from this class. 
 *
 * @memberof module:Core
 * 
 **/
class Condition extends BaseNode {

  /**
   * @constructor
   **/
  constructor() {
    super();
    /**
     * Node category. Default to `b3.CONDITION`.
     *
     * @property category
     * @type {string}
     * @readonly
     **/
    this.category = b3.CONDITION;

    var parameters = {};

    _.extend(this.parameters, parameters);
  }

  /**
   * conditions doesnt do anythingf
   * @param {*} tick 
   */
  //decrementRetriesLeft(tick) {}
  //resetRetries(tick) {}

}
module.exports = Condition;