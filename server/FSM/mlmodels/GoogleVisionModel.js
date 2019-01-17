var MLModel = require('FSM/core/mlModel');
var _ = require('underscore');

class GoogleVisionModel extends MLModel {
  /**
   * ctor
   */
  constructor() {
    super();
    this.title = "Google Vision";
    this.description = 'Use vision on properties to define the app id and subscriber key';
    this.title = this.name = 'GoogleVisionModel';

    _.extend(this.parameters, {
      vision: {
        'en': {
          "engine": "googlevision",
          "app_id": '',
          "subscription_key": ''
        }
      }
    });
  }
}

module.exports = GoogleVisionModel;
