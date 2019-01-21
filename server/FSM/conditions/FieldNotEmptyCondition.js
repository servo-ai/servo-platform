var b3 = require('FSM/core/b3');
var Condition = require('FSM/core/condition');
var _ = require('underscore');
var utils = require('utils/utils');
var dblogger = require('utils/dblogger');

/**
 * @typedef CompositeFieldName - a string denoting a memory field name, in the form of (global/context/message/volatile/local/fsm).fieldName. message is most recent message received from user. fsm refers to properties
 */
/**
 *  Succeeds if (global/context/message/volatile/local).fieldName is not empty
 * @memberof module:Conditions
 */
class FieldNotEmptyCondition extends Condition {

  constructor(settings) {
    super();
    this.title = this.name = 'FieldNotEmptyCondition';
    this.description = 'Succeeds if global, context, message or volatile fieldName is not empty';
    /**
     * Node parameters.
     *
     * @property parameters
     * @type {Object}
     * @property {MemoryField} parameters.fieldName
     **/
    this.parameters = {
      'fieldName': ''
    };

    settings = settings || {};
    if (utils.isEmpty(settings.fieldName)) {
      console.error("fieldName parameteris an obligatory parameter");
    }
  }

  /**
   * Tick method.
   *
   * @private
   * @param {Tick} tick A tick instance.
   * @return {Constant} A state constant.
   **/
  tick(tick) {
    let alldata = this.alldata(tick);
    var left = utils.wrapExpression(this.properties.fieldName);
    try {
      var value = _.template(left)(alldata);
    } catch (ex) {
      dblogger.error('problem in templating fieldName param at EntityCondition:', left)
      value = 0;
    }

    var empty = _.isEmpty(value) || _.isUndefined(value) || value === "";

    if (!empty) {
      return b3.SUCCESS();
    } else {
      return b3.FAILURE();
    }
  }

  /**
   * defines validation methods to execute at the editor; if one of them fails, a dashed red border is displayed for the node
   * @return {Array<Validator>}
   */
  validators(node) {

    function validCompositeField(field) {

      return field && (field.indexOf('message.') === 0 || field.indexOf('context.') === 0 || field.indexOf('global.') === 0 || field.indexOf('volatile.') === 0 || field.indexOf('fsm.') === 0);
    }

    function validOperator(oper) {
      oper = oper.trim();
      return oper === '===' || oper === '==' || oper === '<' || oper === '>' || oper === '<=' || oper === '=>' || oper === '!==' || oper === '!=';
    }


    return [{
      condition: validCompositeField(node.properties.fieldName),
      text: "fieldName should start with message., context., global., fsm. or volatile."
    }];
  }
}

module.exports = FieldNotEmptyCondition;