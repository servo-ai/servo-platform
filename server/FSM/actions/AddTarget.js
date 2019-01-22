// namespace:
var b3 = require('FSM/core/b3');
var Action = require('FSM/core/action')
var _ = require('underscore');
var dblogger = require('utils/dblogger');
var MessageModel = require('models/message-model');
var ContextManager = require('FSM/contextManager');
/**
 * Add a new message to the queue, as if it came from the user. 
 * text, entity name, value and intentId are strings - meaning, if a template is needed use <%= %>"
 *  @memberof module:Actions
 **/
class AddTarget extends Action {

  constructor(settings) {
    super();
    this.title = this.name = 'AddTarget';
    /**
     * Node parameters
     * @property parameters
     * @type {Object}
     * @property {ExpressionString} parameters.text
     * @property {ExpressionString} parameters.intentId
     * @property {Array<KeyValuePair>} parameters.entities
     */
    this.parameters = _.extend(this.parameters, {
      'text': '',
      'intentId': '',
      'entities': {
        "name": "value"
      }
    });
    settings = settings || {};

    this.description = "Add a new message to the FSM, as if it came from the user. " +
      "text, entity name, value and intentId are Expression Strings - meaning, if a template is needed use <%= %>";

  }
  /**
   * Tick method.
   *
   * @private 
   * @param {Tick} tick A tick instance.
   * @return {Constant}  return `b3.SUCCESS`.
   **/
  tick(tick) {

    // manipulate the target object to replace the text and intentId
    // we assume there'a  a target
    var alldata = this.alldata(tick);
    var text = _.template(this.properties.text)(alldata);
    var intentId = _.template(this.properties.intentId)(alldata);

    var messageObj = new MessageModel( /*recipient =*/ {}, /*sender =*/ {}, /*type =*/ null, text, /* messengerType =*/ null, /*fsmID =*/ tick.process.fsmId());
    messageObj.intentId = intentId;
    messageObj.addEntity(
      ContextManager.contextManagerKeys().INTENTID,
      intentId);
    for (let ettkey in this.properties.entities) {
      let ettName = _.template(ettkey)(alldata);
      let ettVal = _.template(this.properties.entities[ettkey])(alldata);
      messageObj.addEntity(
        ettName,
        ettVal);
    }
    tick.target.add({
      messageObj
    });

    return b3.SUCCESS();
  }
}
module.exports = AddTarget;