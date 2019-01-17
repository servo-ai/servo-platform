var PipeInterface = require("./pipe-interface");
var _ = require('underscore');
var dblogger = require('utils/dblogger');
/***
 * @typedef IntentEntitiesObject
 * @property {Array} entities - an object with the message entities from NLU
 * @property {string} intent
 * @property {number} score - of the intent, or average entities score if no intent
 */
/**
 *  NLUPipeInterface is the base object for any NLU API
 * 
 */
class NLUPipeInterface extends PipeInterface {
  /**
   * 
   * @param {*} text 
   * @return {IntentEntitiesObject}
   */
  process(text) {
    var self = this;
    return new Promise(function (resolve, reject) {
      self.run(text).then(function (response) {
        var intentObj = self.extractIntent(response);
        var entitiesObj = self.extractEntities(response);

        var score = intentObj && intentObj.score;
        if (_.isUndefined(score)) {
          score = entitiesObj && entitiesObj.score;
        }

        dblogger.flow("Intent/entities:", intentObj && intentObj.intent, entitiesObj && entitiesObj.entities, 'score', score);
        resolve({
          intent: intentObj && intentObj.intent,
          score: score,
          entities: entitiesObj.entities
        });
      }).catch(function (err) {
        dblogger.error(err, text);
        reject(err);
      });
    });
  }
  /**
   * train the engine with a new intent/entity
   * @param   {{   text:,
                  entities: [
                  {
                      entity: 'intent',
                      value,
                  },
                  ],
              }) sample 
   */
  train(sample) {
    throw "stub!";

  }
  /**
   * overridable
   * @param {*} text 
   * @return {*}
   */
  run(text) {
    throw 'stub!';
  }
  /**
   * overridable
   * @param {*} response 
   * @return {*}
   */
  extractIntent(response) {
    throw 'stub!';
  }

  /**
   * overridable
   * @param {*} response 
   * @return {*}
   */
  extractEntities(response) {
    //should return dictionary of array with values
    throw 'stub!';
  }
  /**
   * None intent
   * @return {{intent:'None',score:1}}
   */
  noIntent() {
    return {
      intent: "None",
      score: 1
    };
  }
}

module.exports = NLUPipeInterface;
