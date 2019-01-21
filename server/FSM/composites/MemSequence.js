/**
 * MemSequence
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
var Composite = require('../core/composite');
var dblogger = require('../../utils/dblogger');
/**
 * MemSequence is similar to Sequence node, but when a child returns a 
 * `RUNNING` state, its index is recorded and in the next tick the MemPriority 
 * call the child recorded directly, without calling previous children again.
 * @memberof module:Composites
 * 
 * 
 **/
class MemSequence extends Composite {

  constructor() {
    super();

    this.title = this.name = 'MemSequence';

  }

  /**
   * Open method.
   *
   * @private open
   * @param {Tick} tick A tick instance.
   **/
  open(tick) {

    tick.process.set('runningChild', 0, tick.tree.id, this.id);
  }

  /**
   * Tick method.
   *
   * @private
   * @param {Tick} tick A tick instance.
   * @return {Constant} A state constant.
   **/
  tick(tick) {
    var child = tick.process.get('runningChild', tick.tree.id, this.id);
    var status = b3.ERROR();
    for (var i = child; i < this.children.length; i++) {
      status = this.children[i]._execute(tick);

      if (status !== b3.SUCCESS()) {
        if (status === b3.RUNNING()) {

          tick.process.set('runningChild', i, tick.tree.id, this.id);
        }

        return status;
      }
    }
    dblogger.assert(status !== b3.ERROR(), 'no child executed at node ' + this.id + ' fsm:' + tick.tree.id + ". check number of children");
    return status;
  }

  /**
   * defines validation methods to execute at the editor; if one of them fails, a dashed red border is displayed for the node
   * @return {Array<Validator>}
   */
  validators(node) {
    return [{
      condition: node.children && node.children.length,
      text: "should have children"
    }];
  }
}
module.exports = MemSequence;