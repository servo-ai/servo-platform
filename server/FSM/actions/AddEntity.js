var b3 = require('FSM/core/b3');
var _ = require('underscore');
var Action = require('FSM/core/action');
var utils = require('utils/utils');
var dblogger = require('utils/dblogger');

/**
 * Set fields into the current message object. if entityName is intentId then it will set the intentId at the message 
 * fieldValue should have a dot notation with the object name. Eg: message.chat_message, context.amount etc '
 *  @memberof module:Actions
 */
class AddEntity extends Action {

  constructor(settings) {
    super();
    this.title = this.name = 'AddEntity';

    /**
     * Node parameters.
     *
     * @property parameters
     * @type {Object}
     * @property {MemoryField} parameters.fieldValue value to put in
     * @property {string} parameters.entityName entity name
     **/
    this.parameters = _.extend(this.parameters, {
      'entityName': '',
      'fieldValue': ''
    });
    this.description = 'Add an entity to message object from global, context, volatile and message memories';
    settings = settings || {};
    if (utils.isEmpty(settings.entityName)) {
      console.error("entityName parameter in AddEntity is an obligatory parameter");
    } else if (utils.isEmpty(settings.fieldValue)) {
      console.error("fieldValue parameter in AddEntity is an obligatory parameter");
    }
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

      var value = _.template(utils.wrapExpression(this.properties.fieldValue))(data);
      let ContextManager = require('FSM/contextManager');
      if (this.properties.entityName === ContextManager.contextManagerKeys().INTENTID) {
        tick.target.getMessageObj().intentId = value;
      } else {
        tick.target.getMessageObj().entities[this.properties.entityName] = tick.target.getMessageObj().entities[this.properties.entityName] || [];
        tick.target.getMessageObj().entities[this.properties.entityName].push(value);

      }

      return b3.SUCCESS();
    } catch (err) {
      dblogger.error("Error at AddEntity: " + this.summary(tick) + ":" + err.message);
      return b3.FAILURE();
    }
  }


  /**
   * defines validation methods to execute at the editor; if one of them fails, a dashed red border is displayed for the node
   * @return {Array<Validator>}
   */
  validators(node) {

    function validCompositeField(field) {

      return field && !(field.indexOf('message.') === 0 || field.indexOf('fsm.') === 0 || field.indexOf('context.') === 0 || field.indexOf('global.') === 0 || field.indexOf('volatile.') === 0);
    }

    return [{
      condition: validCompositeField(node.properties.entityName),
      text: "entityName should NOT start with message., context., global. fsm. or volatile."
    }];
  }
}

module.exports = AddEntity;