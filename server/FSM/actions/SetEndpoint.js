var b3 = require('FSM/core/b3');
var _ = require('underscore');
var Action = require('FSM/core/action');
var utils = require('utils/utils');
var dblogger = require('utils/dblogger');
var RestPost = require('../../chat/rest-post');
var fsmModel = require('models/fsmmodel');

/**
 * Set/unset a POST endpoint to listen on. Once set, the endpoint will get incoming POST calls and send them through the root, as an target
 * coming from one of the pre-defined channels like Facebook, Alexa and the like, with the details added here '
 *  @memberof module:Actions
 */
class SetEndpoint extends Action {

  constructor(settings) {
    super();
    this.title = this.name = 'SetEndpoint';

    /**
     * Node parameters.
     *
     * @property parameters
     * @type {Object}
     * @property {string} parameters.channelName a channel name, must be unique
     * @property {MemoryField} parameters.processLinkId a string that the incoming post must bring in order to link the process
     * @property {boolean} parameters.remove set to true to remove this channel
     * 
     **/
    this.parameters = _.extend(this.parameters, {
      'channelName': '',
      'processLinkId': '',
      'remove': false

    });
    this.description = 'Set/unset a POST endpoint to listen on';
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
      var prLinkId = this.global(tick, 'processLinkId');

      if (prLinkId != processLinkId) {
        if (!prLinkId) {

          var postDriver = new RestPost(this.properties.channelName);
          var fsm = fsmModel.getFSMSync(tick.process.fsm_id, tick.process.userId);
          postDriver.start(fsm);
          this.global(tick, 'processLinkId', processLinkId);
          tick.process.addSearchKey('link_id', processLinkId);
          tick.process.save();

        } else {
          // TODO: stop and delete old one
          postDriver.stopAll()
        }

      }

      return b3.SUCCESS();
    } catch (err) {
      dblogger.error("Error at SetEndpoint: " + this.summary(tick) + ":" + err.message);
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

module.exports = SetEndpoint;