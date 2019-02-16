var Condition = require('FSM/core/condition');
var _ = require('underscore');
var utils = require('utils/utils');
var dblogger = require('utils/dblogger');

/**
 * @typedef Operator - any binary logical operator like ===, <, <==, !==, ==>
 */
/**
 * Compare fields across global,context, volatile and message memories. left and right operands should have a dot notation with the object name. Eg: message.text, context.amount etc.
 * Operator could be any logical operator like ===, <, <==, !==, ==> etc. 
 * @memberof module:Conditions
 */
class FieldCompareCondition extends Condition {

  constructor(settings) {
    super();
    this.title = this.name = 'FieldCompareCondition';

    /**
     * Node parameters.
     *
     * @property parameters
     * @type {Object}
     * @property {ExpressionString|MemoryField} parameters.left
     * @property {Operator} parameters.operator - logical operator
     * @property {ExpressionString|MemoryField} parameters.right 
     *  
     **/
    this.parameters = _.extend(this.parameters, {
      'left': '',
      'operator': '',
      'right': ''
    });
    this.description = 'Compare fields across global,context, volatile and message memories. left and right operands should have a dot notation with the object name. Eg: message.text, context.amount etc. ';
    this.description += 'Operator could be any logical operator like ===, <, <==, !==, ==> etc. ';

    settings = settings || {};

  }


  /**
   * Tick method.
   *
   * @private
   * @param {Tick} tick A tick instance.
   * @return {Constant} A state constant.
   **/
  tick(tick) {

    return utils.evalCondition(tick, this);
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

    function validOperator(oper) {
      oper = oper.trim();
      return oper === '===' || oper === '==' || oper === '<' || oper === '>' || oper === '<=' || oper === '>=' || oper === '!==' || oper === '!=';
    }

    return [{
      condition: validOperator(node.properties.operator),
      text: "operator should be a ==, ===, !==, !=, <, >, >= or <="
    }, {
      condition: validCompositeField(node.properties.right),
      text: "right should be a memory field, a number or a string expression"
    }, {
      condition: validCompositeField(node.properties.left),
      text: "right should be a memory field, a number or a string expression"
    }];
  }
}

module.exports = FieldCompareCondition;