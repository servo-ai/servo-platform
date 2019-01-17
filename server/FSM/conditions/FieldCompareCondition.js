var b3 = require('FSM/core/b3');
var Condition = require('FSM/core/condition');
var _ = require('underscore');
var utils = require('utils/utils');
var dblogger = require('utils/dblogger');

/**
 * @typedef Operator - any binary logical operator like ===, <, <==, !==, ==>
 */
/**
 * Compare fields across global,context, volatile and message memories. left and right operands should have a dot notation with the object name. Eg: message.chat_message, context.amount etc.
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
     * @prop {ExpressionString} parameters.left
     * @prop {Operator} parameters.operator - logical operator
     * @prop {ExpressionString} parameters.right 
     *  
     **/
    var parameters = {
      'left': '',
      'operator': '',
      'right': ''
    };
    _.extend(this.parameters, parameters);
    this.description = 'Compare fields across global,context, volatile and message memories. left and right operands should have a dot notation with the object name. Eg: message.chat_message, context.amount etc. ';
    this.description += 'Operator could be any logical operator like ===, <, <==, !==, ==> etc. ';

    settings = settings || {};

  }


  /**
   * Tick method.
   *
   * @private tick
   * @param {Tick} tick A tick instance.
   * @return {Constant} A state constant.
   **/
  tick(tick) {

    var data = this.alldata(tick);
    var left = this.properties.left;
    var operator = this.properties.operator;
    var right = this.properties.right;

    left = utils.wrapExpression(left);
    right = utils.wrapExpression(right);
    try {
      left = _.template(left)(data);
    } catch (ex) {
      left = 0;
    }
    try {
      right = _.template(right)(data);
    } catch (ex) {
      right = 0;
    }

    // fix a common error (especially for non-programmers)
    if (operator === '=') {
      operator = '===';
    }

    var result = false;

    left = utils.addQuotes(left);
    right = utils.addQuotes(right);
    result = eval(left + operator + right);

    if (result) {
      return b3.SUCCESS();
    } else {
      return b3.FAILURE();
    }
  }

  /**
   * @return {Array<Validator>}
   */
  validators(node) {

    function validOperator(oper) {
      oper = oper.trim();
      return oper === '===' || oper === '==' || oper === '<' || oper === '>' || oper === '<=' || oper === '>=' || oper === '!==' || oper === '!=';
    }

    return [{
      condition: validOperator(node.properties.operator),
      text: "operator should be a ==, ===, !==, !=, <, >, >= or <="
    }];
  }
}

module.exports = FieldCompareCondition;
