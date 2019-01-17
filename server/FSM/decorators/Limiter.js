/**
 * Limiter
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
 * This decorator limit the number of times its child can be called. After a
 * certain number of times, the Limiter decorator returns `FAILURE` without 
 * executing the child. This is more useful for synchrnous nodes.
 * @memberof module:Decorators
 **/
class Limiter extends Decorator {
  /**
   * Initialization method. 
   *
   * @constructor
   **/
  constructor(settings) {
    super();
    this.name = 'Limiter';


    /**
     * Node title. Default to `Limit X Activations`. Used in Editor.
     *
     * @property title
     * @type {String}
     * @readonly
     **/
    this.title = 'Limit <maxLoop> Activations';

    /**
     * Node parameters.
     *
     * @property parameters
     * @type {Object}
     * @property {number} parameters.maxLoop - Maximum number of repetitions.
     **/
    this.parameters = _.extend(this.parameters, {
      'maxLoop': 1
    });

    settings = settings || {};

    super(settings);

    // TODO: MOVE this to an Initialize and THROW
    if (!settings.maxLoop) {
      console.error("maxLoop parameter in Limiter decorator is an obligatory " +
        "parameter");
    }

    this.maxLoop = settings.maxLoop;
    this.description = "limit the number of times its child can be called. After a" +
      " certain number of times, the Limiter decorator returns `FAILURE` without" +
      " executing the child." +
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
   * @private tick
   * @param {Tick} tick A tick instance.
   * @return {Constant} A state constant.
   **/
  tick(tick) {
    if (!this.child) {
      return b3.ERROR();
    }

    var i = tick.process.get('i', tick.tree.id, this.id);
    this.context(tick, 'repeatCount', i);

    if (i < this.maxLoop) {
      var status = this.child._execute(tick);

      if (status == b3.SUCCESS() || status == b3.FAILURE())
        tick.process.set('i', i + 1, tick.tree.id, this.id);


      return status;
    }

    return b3.FAILURE();
  }

  /**
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
module.exports = Limiter;
