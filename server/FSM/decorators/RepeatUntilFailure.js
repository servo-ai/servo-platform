/**
 * RepeatUntilFailure
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
var b3 = require('../core/b3')
var Decorator = require('../core/decorator')
var _ = require('underscore');


/**
 * RepeatUntilFailure is a decorator that repeats the tick signal until the 
 * node child returns `FAILURE`, `RUNNING` or `ERROR`. Optionally, a maximum 
 * number of repetitions can be defined.
 *
 * 
 * @memberof module:Decorators
 **/
class RepeatUntilFailure extends Decorator {


  constructor(settings) {
    super();

    this.title = this.name = 'RepeatUntilFailure';

    this.title = 'Repeat Until Failure';

    /**
     * Node parameters.
     *
     * @property parameters
     * @type {Object}
     * @property {number} parameters.maxLoop - Maximum number of repetitions. Default to -1 
     *                           (infinite).
     **/
    this.parameters = _.extend({
      'maxLoop': -1
    });

    settings = settings || {};

    this.maxLoop = settings.maxLoop || -1;

    this.description = "Repeats the child node maxLoop times, or until failure, excluding RUNNING ticks" +
      ". Updates context.repeatCount";
  }

  /**
   * Open method.
   *
   * @private open
   * @param {Tick} tick A tick instance.
   **/
  open(tick) {
    tick.process.set('i', 0, tick.tree.id, this.id);
  }

  /**
   * Tick method.
   *
   * @private
   * @param {Tick} tick A tick instance.
   * @return {Constant} A state constant.
   **/
  tick(tick) {
    if (!this.child) {
      return b3.ERROR();
    }

    var i = tick.process.get('i', tick.tree.id, this.id);
    this.context(tick, 'repeatCount', i);

    if (this.maxLoop < 0 || i < this.maxLoop) {
      var status = this.child._execute(tick);
      //if (status !== b3.RUNNING()) console.log('------------------>repeat child status ', status);
      if (status == b3.SUCCESS()) {
        i++;
        status = b3.RUNNING();
      }
    } else if (this.maxLoop >= i) {
      status = b3.SUCCESS();
    }

    var i = tick.process.set('i', i, tick.tree.id, this.id);


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
      text: "maxLoop should be a number"
    }];
  }
}
module.exports = RepeatUntilFailure;