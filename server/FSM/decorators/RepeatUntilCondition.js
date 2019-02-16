/**
 * RepeatUntilCondition
 * Copyright (c) 2017 Servo Labs Inc.  
 * Copyright (c) Renato de Pontes Pereira.  
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

var utils = require('utils/utils');
var dblogger = require('utils/dblogger');

/**
 * Repeats until a condition is true. The condition compare memory fields
 * left and right operands should have a dot notation with the object name. Eg: message.text, context.amount etc.
 * Operator could be any logical operator like ===, <, <==, !==, ==> etc. 
 * Side effects: sets context.repeatCount
 * @memberof module:Decorators
 **/
class RepeatUntilCondition extends Decorator {


    constructor() {
        super();

        this.title = this.name = 'RepeatUntilCondition';

        this.title = 'Repeat Until Condition';
        /**
         * Node parameters.
         *
         * @property parameters
         * @type {Object}
         * @property {ExpressionString|MemoryField} parameters.left
         * @property {Operator} parameters.operator - logical operator
         * @property {ExpressionString|MemoryField} parameters.right 
         *  
         **/
        this.parameters = _.extend(this.parameters, {
            'left': '',
            'operator': '',
            'right': ''
        });

        this.description = "Repeats the child node until a condition is true" +
            ". Updates context.repeatCount";
    }

    /**
     * Open method.
     *
     * @private open
     * @param {Tick} tick A tick instance.
     **/
    open(tick) {
        this.local(tick, 'i', 0);
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

        var i = this.local(tick, 'i');

        var status = this.child._execute(tick);
        if (status == b3.FAILURE()) {
            dblogger.warn('FAILURE returned at RepeatUntilCondition decorator. continuing anyways');
        }
        let statusCondition = utils.evalCondition(tick, this);
        i++;
        if (statusCondition == b3.SUCCESS()) {
            status = b3.SUCCESS();
        } else {
            status = b3.RUNNING();
        }

        this.local(tick, 'i', i);
        this.context(tick, 'repeatCount', i);

        return status;
    }

    /**
     * defines validation methods to execute at the editor; if one of them fails, a dashed red border is displayed for the node
     * @return {Array<Validator>}
     */
    validators(node) {
        function validCompositeField(field) {

            var bool1 = field && (field.indexOf('message.') === 0 || field.indexOf('context.') === 0 || field.indexOf('global.') === 0 || field.indexOf('volatile.') === 0 || field.indexOf('fsm.') === 0);
            var bool2 = field && (field.indexOf('\'') === 0 || field.indexOf('"') === 0 || !isNaN(field));
            return bool1 || bool2;
        }

        function validOperator(oper) {
            oper = oper.trim();
            return oper === '===' || oper === '==' || oper === '<' || oper === '>' || oper === '<=' || oper === '>=' || oper === '!==' || oper === '!=';
        }


        return [{
            condition: validOperator(node.properties.operator),
            text: "operator should be a ==, ===, !==, !=, <, >, >= or <="
        }, {
            condition: node.child,
            text: "should have a child"
        }, {
            condition: validCompositeField(node.properties.right),
            text: "right should be a memory field, a number or a string expression"
        }, {
            condition: validCompositeField(node.properties.left),
            text: "right should be a memory field, a number or a string expression"
        }];
    }
}
module.exports = RepeatUntilCondition;