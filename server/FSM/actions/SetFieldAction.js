var b3 = require('FSM/core/b3');
var _ = require('underscore');
var Action = require('FSM/core/action');
var utils = require('utils/utils');
var dblogger = require('utils/dblogger');

/**
 * Set fields across composite (global,context, volatile, local and message) memories. 
 * fieldName and fieldValue should have a dot notation with the object name. Eg: message.chat_message, context.amount etc ';
 *  @memberof module:Actions
 */
class SetFieldAction extends Action {

  /**
   * 
   * @param {*} settings 
   */
  constructor(settings) {
    super();
    this.title = this.name = 'SetFieldAction';

    /**
     * Node parameters.
     *
     * @property parameters
     * @type {Object}
     * @prop {string} parameters.fieldValue
     *  @prop {string} parameters.fieldName
     **/
    var parameters = {
      'fieldName': '',
      'fieldValue': ''

    };
    _.extend(this.parameters, parameters);
    this.description = 'Set fields across global,context, volatile and message memories. fieldName and fieldValue should have a dot notation with the object name. Eg: message.chat_message, context.amount etc ';
    settings = settings || {};
    if (utils.isEmpty(settings.fieldName)) {
      console.error("fieldName parameter in SetFieldAction is an obligatory parameter");
    } else if (utils.isEmpty(settings.fieldValue)) {
      console.error("fieldValue parameter in SetFieldAction is an obligatory parameter");
    }
  }

  /**
   * Tick method.
   *
   * @private tick
   * @param {Tick} tick A tick instance.
   * @return {TickStatus} A status constant.
   **/
  tick(tick) {
    try {
      var data = this.alldata(tick);

      var value = _.template(utils.wrapExpression(this.properties.fieldValue))(data);
      // if we need to parse a dot notation field
      // TODO: TEMPLATE BEFORE
      var field = this.properties.fieldName;

      this.alldata(tick, field, value);

      return b3.SUCCESS();
    } catch (err) {
      dblogger.error("Error at SetFieldAction: " + this.summary(tick), err);
      return b3.FAILURE();
    }
  }


  /**
   * @return {Array<Validator>}
   */
  validators(node) {

    function validCompositeField(field) {

      return field && (field.indexOf('context.') === 0 || field.indexOf('global.') === 0 || field.indexOf('volatile.') === 0 || field.indexOf('fsm.') === 0);
    }

    return [{
      condition: node.properties.fieldName && node.properties.fieldName.indexOf('message.') !== 0,
      text: "fieldName should not start with message. message is a read-only entity"
    }, {
      condition: validCompositeField(node.properties.fieldName),
      text: "fieldName should start with context., global., fsm. or volatile."
    }];
  }
}

module.exports = SetFieldAction;
