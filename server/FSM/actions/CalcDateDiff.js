/**
 * CalcDateDiff
 *
 * Copyright (c) 2017 Servo Labs Inc.
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
var Action = require('../core/action');
var _ = require('underscore');
var utils = require('utils/utils');
var dblogger = require('utils/dblogger');

/**
 * This action node calculates the difference between two dates, provided as strings. the result is stored in a field
 *  @memberof module:Actions
 **/
class CalcDateDiff extends Action {

    constructor() {
        super();
        /**
         * Node name. Default to `CalcDateDiff`.
         *
         * @property name
         * @type String
         * @readonly
         **/
        this.title = this.name = 'CalcDateDiff';
        /**
         * Node parameters
         * @property parameters
         * @type {Object}
         * @property {ExpressionString} parameters.dateFrom string reresenting starting date
         * @property {ExpressionString} parameters.dateTo string reresenting end date
         *@property {MemoryField} parameters.fieldName number of seconds between dateTo and dateFrom
         */
        this.parameters = _.extend(this.parameters, {
            'dateTo': '',
            'dateFrom': '',
            'fieldName': ''
        });
    }
    /**
     * Tick method.
     *
     * @private
     * @param {Tick} tick A tick instance.
     * @return {any} Always return `b3.SUCCESS`.
     **/
    tick(tick) {
        var data = this.alldata(tick);

        var dateTo = _.template(utils.wrapExpression(this.properties.dateTo))(data);
        let dateToDate = new Date(dateTo);
        if (dateToDate.toString() == "Invalid Date") {
            dblogger.error('dateTo has an invalid date format:' + dateTo);
        }
        var dateFrom = _.template(utils.wrapExpression(this.properties.dateFrom))(data);
        let dateFromDate = new Date(dateFrom);
        if (dateFromDate.toString() == "Invalid Date") {
            dblogger.error('dateFrom has an invalid date format:' + dateFrom);
        }
        let diff = dateToDate - dateFromDate;
        diff = diff / 1000;

        this.alldata(tick, this.properties.fieldName, diff.toString());

        return b3.SUCCESS();
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

        return [{
            condition: validCompositeField(node.properties.fieldName),
            text: "fieldName is not a memory field. it should start with \", ', context., global., fsm., volatile. or be a literal number"
        }, {
            condition: validCompositeField(node.properties.dateTo),
            text: "dateTo is not a memory field. it should start with \", ', context., global., fsm., volatile. or be a literal number"
        }, {
            condition: validCompositeField(node.properties.dateFrom),
            text: "dateFrom is not a memory field. it should start with \", ', context., global., fsm., volatile. or be a literal number"
        }];
    }

}
module.exports = CalcDateDiff;