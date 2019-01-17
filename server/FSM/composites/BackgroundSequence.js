/**
 * BackgroundSequence
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


/**
 * The BackgroundSequence node is suitable for performing background tasks or target transformations.
 * It executes its children sequentially until one of them returns 
 * `FAILURE`, `RUNNING` or `ERROR`. If all children return success , 
 * the sequence also returns `SUCCESS`. On every tick, it restarts from child 0. 
 * Put background subtrees first
 *@memberof module:Composites
 **/
class BackgroundSequence extends Composite {


  constructor() {
    super();
    this.title = this.name = 'BackgroundSequence';
    this.description = "Runs all children synchronuously, always starting from first child";
  }

  /**
   * Tick method.
   *
   * @private tick
   * @param {Tick} tick A tick instance.
   * @return {Constant} A state constant.
   **/
  tick(tick) {
    for (var i = 0; i < this.children.length; i++) {
      var status = this.children[i]._execute(tick);
      if (status !== b3.SUCCESS()) {
        return status;
      }
    }

    return status;
  }

  /**
   * @return {Array<Validator>}
   */
  validators(node) {
    return [{
      condition: node.children && node.children.length,
      text: "should have children"
    }];
  }
}
module.exports = BackgroundSequence;
