/* eslint-disable no-unused-vars */
var b3 = require('FSM/core/b3');
var Action = require('FSM/core/action');
var _ = require('underscore');
var _mongodb = require('mongodb');
var dblogger = require('utils/dblogger');
var utils = require('utils/utils');

/**
 * connect and query MongoDB according to the fields,  on an collection provided in collectionName." +
 * stores result in targetFieldName.
 * @memberof module:Actions
 */
class MongoQuery extends Action {

    constructor() {
        super();
        this.title = this.name = 'MongoQuery';
        this.description = "connect and query mongoDB according to the fields,  on an collection provided in collectionName." +
            " stores result in targetFieldName.";
        /**
         * Node parameters
         * @property parameters
         * @type {Object}
         * @property {Object} parameters 
         * @property {string} parameters.collectionName collection name
         * @property {string} parameters.dbName database name         * 
         * @property {string} parameters.url -  connection url (defaults to 'mongodb://localhost:27017')
         * @property {MemoryField} settings.targetFieldName
         * @property {ExpressionString} settings.query - an expression with the query code, called as a method on collection. eg: find({a:1}) 
         * 
         **/
        this.parameters = _.extend(this.parameters, {
            'collectionName': '',
            'dbName': '',
            'query': '',
            'url': 'mongodb://localhost:27017',
            'targetFieldName': ''

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
     * searches the sourceField
     * @param {*} tick 
     * @private
     */
    tick(tick) {
        var step = this.local(tick, 'step');
        var node = this;

        if (step === 0) {
            //RequestJSON
            this.local(tick, 'step', 1);
            node.waitCode(tick, b3.RUNNING());
            var data = this.alldata(tick);
            var dbName = this.properties.dbName;
            var targetField = this.properties.targetFieldName;
            var collectionName = this.properties.collectionName;
            const MongoClient = _mongodb.MongoClient;
            // Connection URL
            const url = this.properties.url || 'mongodb://localhost:27017';
            try {
                // Use connect method to connect to the server
                MongoClient.connect(url, (err, client) => {
                    if (err) {
                        dblogger.error('error in connecting to Mongo:' + JSON.stringify(node.properties), err);
                        node.waitCode(tick, b3.ERROR());
                        return;
                    }

                    const db = client.db(dbName);

                    // eslint-disable-next-line no-unused-vars
                    function cb(err, doc) {
                        try {
                            client.close();
                            if (err) {
                                dblogger.error('Error in connecting to Mongo:' + node.summary(tick) + JSON.stringify(node.properties), err);
                                node.waitCode(tick, b3.ERROR());
                                return;
                            }
                            node.alldata(tick, targetField, doc);
                            client.close();
                            node.waitCode(tick, b3.SUCCESS());
                        } catch (ex) {
                            dblogger.error('error in Mongo callback  ' + node.summary(tick), ex);
                            node.waitCode(tick, b3.ERROR());

                        }

                    }

                    // Get the documents collection
                    // @ts-ignore
                    const collection = db.collection(collectionName);

                    // Find some documents
                    let codeToEval = "collection." + this.properties.query + ".toArray(cb)";
                    try {

                        node.evalQuery(data, codeToEval, collection, cb);

                    } catch (ex) {
                        dblogger.error('error in Mongo query evaluation  ' + node.summary(tick), ex);
                        node.waitCode(tick, b3.ERROR());

                    }
                });
            } catch (ex) {
                dblogger.error('Error ' + node.summary(tick), ex);
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


module.exports = MongoQuery;