/* eslint-disable no-unused-vars */
var b3 = require('FSM/core/b3');
var Action = require('FSM/core/action');
var _ = require('underscore');
var dblogger = require('utils/dblogger');
var utils = require('utils/utils');
var fsmModel = require('models/fsmmodel');

var processModel = require('models/processmodel');
/**
 * connect and query MongoDB according to the fields,  on an collection provided in collectionName." +
 * stores result in targetFieldName.
 * @memberof module:Actions
 */
class GetProcessDataByKey extends Action {

    constructor() {
        super();
        this.title = this.name = 'GetProcessDataByKey';
        this.description = "get a process according to the field key, query its data and" +
            " stores result in targetFieldName.";
        /**
         * Node parameters
         * @property parameters
         * @type {Object}
         * @property {Object} parameters 
         * @property {string} parameters.keyName key name to search on
         * @property {string} parameters.keyValue to match 
         * @property {MemoryField} settings.targetFieldName: to place result in
         * @property {ExpressionString} settings.queryDataFieldName - a field name on the global data area of the retrieved process
         * @property {string}  ettings.queryFieldName - a field name on the the data item to search from
         *  @property {string} setting.queryCommand: either LAST,HIGHTODAY or HIGHEST
         * 
         **/
        this.parameters = _.extend(this.parameters, {
            'keyName': '',
            'keyValue': '',
            'targetFieldName': '',
            'queryFieldName': '',
            'queryCommand': '',
            "queryDataFieldName": ''
        });
    }

    /**
     * open lifecycle hook
     * @private
     */
    open(tick) {
        this.local(tick, 'step', 0);
    }

    /**
     * 
     * @param {Process} processObj 
     */
    makeQuery(processObj) {
        let data = processObj._baseMemory.data[this.properties.queryDataFieldName];
        //dblogger.assert(data.isArray(), "field should point to an array");
        let retItem = null;
        let highest = -1;

        function getDateString(d) {
            d = new Date(d);
            return d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate();
        }
        let todayString = getDateString(Date.now());

        data.forEach(element => {
            switch (this.properties.queryCommand) {
                case "HIGHEST":
                    if (highest < element[this.properties.queryFieldName]) {
                        highest = element[this.properties.queryFieldName];
                        retItem = element;
                    };
                    break;
                case "HIGHTODAY":
                    {
                        let dayString = getDateString(element.timestamp);
                        if (dayString === todayString) {
                            if (highest < element[this.properties.queryFieldName]) {
                                highest = element[this.properties.queryFieldName];
                                retItem = element;
                            };

                        }

                    }
                    break;
            }
        });

        if (!retItem) {
            retItem = data[data.length - 1];
        }

        return retItem;
    }

    /**
     * searches the sourceField
     * @param {*} tick 
     * @private
     */
    tick(tick) {
        var step = this.local(tick, 'step');
        var node = this;

        if (step === 0) {
            this.local(tick, 'step', 1);
            node.waitCode(tick, b3.RUNNING());
            var targetField = this.properties.targetFieldName;
            try {
                let data = this.alldata(tick);
                var processLinkId = _.template(utils.wrapExpression(this.properties.keyValue))(data);
                processModel.getByKey(this.properties.keyName, processLinkId).then((doc) => {
                    if (!doc) {
                        node.waitCode(tick, b3.FAILURE());
                    } else {
                        // query
                        var targetValue = this.makeQuery(doc);
                        node.alldata(tick, targetField, targetValue);
                        node.waitCode(tick, b3.SUCCESS());
                    }
                });

            } catch (ex) {
                dblogger.error('error ' + this.summary(tick), ex);
                node.waitCode(tick, b3.ERROR());
            }

        }
        var status = node.waitCode(tick); //console.log("3 - returned: " + status, tick.tree.id, node.id);
        return status;

    }


    /**
     * safe(r) eval code for the query
     * @param {*} data 
     * @param {string} codeToEval 
     * @param {*} collection 
     * @param {function} cb 
     */
    evalQuery(data, codeToEval, collection, cb) {
        // eslint-disable-next-line no-unused-vars
        var require = {}; // deter malicious requires
        // eslint-disable-next-line no-unused-vars
        var fs = {}; // or popular file system access
        //  try {
        // eslint-disable-next-line no-unused-vars
        var global = data.global || {};
        // eslint-disable-next-line no-unused-vars
        var context = data.context || {};
        // eslint-disable-next-line no-unused-vars
        var message = data.message || {};
        // eslint-disable-next-line no-unused-vars
        var fsm = data.fsm || {};
        // eslint-disable-next-line no-unused-vars
        var process = data.process || {};
        // eslint-disable-next-line no-unused-vars
        var volatile = data.volatile || {};
        //        collection.find({"Make":{ $regex: new RegExp(context.carMakeEntity), $options: 'i' },"Model":{ $regex: new RegExp(context.carModelEntity), $options: 'i' }})
        var value = eval("(" + codeToEval + ")");

    }

    /**
     * defines validation methods to execute at the editor; if one of them fails, a dashed red border is displayed for the node
     * @return {Array<Validator>}
     */
    validators(node) {

        function validCompositeField(field) {

            return field && (field.indexOf('message.') === 0 || field.indexOf('context.') === 0 || field.indexOf('global.') === 0 || field.indexOf('volatile.') === 0 || field.indexOf('fsm.') === 0);
        }



        return [{
            condition: validCompositeField(node.properties.targetFieldName),
            text: "targetFieldName should start with message., context., global., fsm. or volatile."
        }, {
            condition: node.properties.query != "",
            text: "query should no tbe empty"
        }];
    }
}


module.exports = GetProcessDataByKey;