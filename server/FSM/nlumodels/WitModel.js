var NLUModel = require('FSM/core/NLUModel');
var _ = require('underscore');

/**
 * Wit.ai machine learning model - NLU classifier
 * @memberof module:NLUModels
 * @private
 */
class WitModel extends NLUModel {

  constructor() {
    super();
    this.title = "Wit.AI";
    this.description = 'Use nlu on properties to define the access token per language';
    this.title = this.name = 'WitModel';

    /**
     * Node parameters.
     *
     * @property parameters
     * @type {Object}
     * @property {Object} parameters.nlu -this gets added onto the process properties to get used for NLU. 
     * Use language code as a key: {
     * 
     * 'en': {
     *    engine: 'wit',
     * 
     *     accessToken: '<your token>'
     * 
     * }}
     **/
    this.parameters = _.extend(this.parameters, {
      nlu: {
        'en': {
          engine: 'wit',
          accessToken: ''
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
        if (nluObj[lang].engine !== 'wit') {
          return false;
        }
      }

      return true;
    }

    function accessTokenFinder(nluObj) {
      for (var lang in nluObj) {
        if (!(nluObj[lang].accessToken && nluObj[lang].accessToken.length)) {
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
      text: "engine should be wit for all languages"
    }, {
      condition: accessTokenFinder(node.properties.nlu),
      text: "accessToken should not be empty for any language"
    }];
  }
}

module.exports = WitModel;