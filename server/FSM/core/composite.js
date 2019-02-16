/**
 * Composite
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


var b3 = require('./b3');
var _ = require('underscore');
var BaseNode = require('./baseNode')
/**
 * Composite is the base class for all composite nodes. Thus, if you want to 
 * create new custom composite nodes, you need to inherit from this class. 
 * 
 * When creating composite nodes, you will need to propagate the tick signal to
 * the children nodes manually. To do that, override the `tick` method and call 
 * the `_execute` method on all nodes. For instance, take a look at how the 
 * Sequence node inherit this class and how it call its children:
 *@memberof module:Core
 **/
class Composite extends BaseNode {

  /**
   * Initialization method.
   *
   **/
  constructor(settings) {
    super();

    this.category = b3.COMPOSITE;
    settings = settings || {};
    this.children = (settings.children || []).slice(0);
    this.entityWeight = (settings && settings.entityWeight) || 0.1;
  };

  /**
   * return running child index
   * @param {Tick} tick 
   * @return {number} of the current running child 
   */
  currentChildIndex(tick) {
    return this.local(tick, 'runningChild');
  }




  /***
   * @override switch context
   */
  switchContext(tick, contextsSelected, noPrev) {
    this.contextManager.switchContext(tick, contextsSelected, noPrev);
  }

  /**
   * @override return array of contexts
   */
  contextProperties() {
    return this.properties.contexts;
  }

  /**
   * checks if the child is a non-contextual child
   * @param {number} index - of a child to check
   * @return {boolean} - true if not a context child 
   */
  nonContextChild(index) {

    return (!this.contextProperties()[index].intentId &&
      !this.contextProperties()[index].entities &&
      !this.contextProperties()[index].helper && !this.contextProperties()[index].timeout
    );
  }

  /**
   * a composite must have children 
   * we can't use super so reuse by copy & paste for now
   * defines validation methods to execute at the editor; if one of them fails, a dashed red border is displayed for the node
   * @return {Array<Validator>}
   */
  validators(node) {
    return [{
      condition: node.title,
      text: "must have a non-empty title"
    }, {
      condition: node.children,
      text: "must have children"
    }];
  }

}
module.exports = Composite;