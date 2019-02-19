var b3 = require('FSM/core/b3');
var _ = require('underscore');
var Action = require('FSM/core/action');
var utils = require('utils/utils');
var dblogger = require('utils/dblogger');
/**
 * Set fields across composite (global,context, volatile, local and message) memories. 
 * fieldName and fieldValue should have a dot notation with the object name. Eg: message.text, context.amount etc ';
 *  @memberof module:Actions
 */
class SafeEval extends Action {
    /**
     * @typedef MemoryField
     * @property {string}  string: (message./global./context./volatile./local./fsm.)fieldname string should have a dot notation with the memory and field names. Eg: message.text, context.amount etc
     *
     */
    /**
     * 
     * constructor
     */
    constructor(settings) {
        super();
        this.title = this.name = 'SafeEval';

        /**
         * Node parameters.
         *
         * @property parameters
         * @type {Object}
         * @property {string} parameters.codeLine - JavaScript code'
         **/
        this.parameters = _.extend(this.parameters, {
            'codeLine': ''

        });
        this.description = 'Evaluates codeLine as JavaScript against all memory fields (message, global, context, fsm, volatile,local). uses several basic mechanisms to protect against file system use. codeLine length limited to 255 characters';
        settings = settings || {};

    }

    /**
     * Tick method.
     *
     * @private
     * @param {Tick} tick A tick instance.
     * @return {TickStatus} A status constant.
     **/
    tick(tick) {
        try {
            var data = this.alldata(tick);

            if (this.properties.codeLine && this.properties.codeLine.indexOf('eval') > -1) {
                throw 'naked evil eval';
            }
            utils.evalMemoryField(data, this.properties.codeLine.substr(0, 255));

            return b3.SUCCESS();
        } catch (err) {
            dblogger.error("Error at SafeEval: " + this.summary(tick), err);
            return b3.FAILURE();
        }
    }


    /**
     * defines validation methods to execute at the editor; if one of them fails, a dashed red border is displayed for the node
     * @return {Array<Validator>}
     */
    validators(node) {

        return [{
            condition: node.properties.codeLine,
            text: "codeLine should be non-empty"
        }, {
            condition: node.properties.codeLine && node.properties.codeLine.length <= 255,
            text: "codeLine should be shorter than 255"
        }];
    }
}

module.exports = SafeEval;