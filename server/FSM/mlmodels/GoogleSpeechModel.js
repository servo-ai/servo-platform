var MLModel = require('FSM/core/mlModel');
var _ = require('underscore');

class GoogleSpeechModel extends MLModel {
  /**
   * ctor
   */
  constructor() {
    super();
    this.title = "Google Speech";
    this.description = 'Use object on properties to define the URL';
    this.title = this.name = 'GoogleSpeechModel';

    _.extend(this.parameters, {
      object: {
        'en': {
          "engine": "GoogleSpeech",
          "url": ''
        }
      }
    });
  }
}

module.exports = GoogleSpeechModel;
