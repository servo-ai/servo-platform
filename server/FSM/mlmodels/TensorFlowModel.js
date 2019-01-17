var MLModel = require('FSM/core/mlModel');
var _ = require('underscore');

class TensorFlowModel extends MLModel {
  /**
   * ctor
   */
  constructor() {
    super();
    this.title = "TensorFlow";
    this.description = 'Use object on properties to define the URL';
    this.title = this.name = 'TensorFlowModel';

    _.extend(this.parameters, {
      object: {
        'en': {
          "engine": "tensorflow",
          "url": ''
        }
      }
    });
  }
}

module.exports = TensorFlowModel;
