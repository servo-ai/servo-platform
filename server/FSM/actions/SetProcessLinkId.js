var b3 = require('FSM/core/b3');
var _ = require('underscore');
var Action = require('FSM/core/action');
var utils = require('utils/utils');
var dblogger = require('utils/dblogger');
var RestPost = require('../../chat/rest-post');
var fsmModel = require('models/fsmmodel');

/**
 * Set/unset a link id between processes. data then can be retrieved in other channels/processes using the Link id'
 *  @memberof module:Actions
 */
class SetProcessLinkId extends Action {

    constructor(settings) {
        super();
        this.title = this.name = 'SetProcessLinkId';

        /**
         * Node parameters.
         *
         * @property parameters
         * @type {Object}
         * @property {MemoryField} parameters.processLinkId a string that the incoming post must bring in order to link the process
         * @property {boolean} parameters.remove set to true to remove this channel
         * 
         **/
        this.parameters = _.extend(this.parameters, {
            'processLinkId': '',
            'remove': false

        });
        this.description = 'Set/unset a link id between processes. data then can be retrieved in other channels/processes using the Link id';
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

            var processLinkId = _.template(utils.wrapExpression(this.properties.processLinkId))(data);
            if (!this.properties.remove) {

                tick.process.addSearchKey('link_id', processLinkId);
                tick.process.save();
            } else {
                tick.process.removeSearchKey('link_id');
                tick.process.save();
            }

            return b3.SUCCESS();
        } catch (err) {
            dblogger.error("Error at SetProcessLinkId: " + this.summary(tick) + ":" + err.message);
            return b3.ERROR();
        }
    }


    /**
     * defines validation methods to execute at the editor; if one of them fails, a dashed red border is displayed for the node
     * @return {Array<Validator>}
     */
    validators(node) {

        function validCompositeField(field) {

            return field && (!isNaN(field) || (field.indexOf('message.') === 0 || field.indexOf('fsm.') === 0 || field.indexOf('context.') === 0 || field.indexOf('global.') === 0 || field.indexOf('volatile.') === 0));
        }

        return [{
            condition: validCompositeField(node.properties.processLinkId),
            text: "processLinkId should start with message., context., global. fsm. or volatile."
        }];
    }
}

module.exports = SetProcessLinkId;