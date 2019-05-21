var NLUModel = require('FSM/core/NLUModel');
var _ = require('underscore');
/**
 * Machine Learning models for classifications
 * @module NLUModels
 * @private
 **/
/**
 * LUIS machine learning model - NLU classifier
 * 
 */
class LUISModel extends NLUModel {

  constructor() {
    super();
    this.title = "LUIS";
    this.description = 'Use nlu on properties to define the app id and subscriber key, per language';
    this.title = this.name = 'LUISModel';
    /**
        * Node parameters.
        *
        * @property parameters
        * @type {Object}
        * @property {Object} parameters.nlu -this gets added onto the process properties to get used for NLU. 
        * Use language code as a key: {
        * 
        * 'en': {
               "engine": "luis-strong",
               "app_id": '',
               "subscription_key": ''
        * }}
        **/
    this.parameters = _.extend(this.parameters, {
      nlu: {
        'en': {
          "engine": "luis-strong",
          "app_id": '',
          "subscription_key": ''
        }
      }
    });
  }

  /**
   * defines validation methods to execute at the editor; if one of them fails, a dashed red border is displayed for the node
   * @return {Array<Validator>}
   */
  validators(node) {
    function engineFinder(nluObj) {
      for (var lang in nluObj) {
        if (nluObj[lang].engine !== 'luis-strong') {
          return false;
        }
      }

      return true;
    }

    function accessTokenFinder(nluObj) {
      for (var lang in nluObj) {
        if (!(nluObj[lang].app_id && nluObj[lang].app_id.length)) {
          return false;
        }
        if (!(nluObj[lang].subscription_key && nluObj[lang].subscription_key.length)) {
          return false;
        }
      }

      return true;
    }
    return [{
      condition: node.child,
      text: "should have a child"
    }, {
      condition: node.properties.nlu,
      text: "properties should have an nlu object"
    }, {
      condition: engineFinder(node.properties.nlu),
      text: "engine should be luis-strong for all languages"
    }, {
      condition: accessTokenFinder(node.properties.nlu),
      text: "subscription_key and app_id should not be empty for any language"
    }];
  }
}

module.exports = LUISModel;