var config = require('../../config');
var Promise = require("bluebird");

var NLUPipeInterface = require("../nlu-pipe-interface.js");
const {
  Wit
} = require('./node-wit');
var dblogger = require('utils/dblogger');

class WIT extends NLUPipeInterface {
  constructor(options) {
    super();
    if (!options || !options.accessToken) {
      throw ('accessToken for Wit is missing');
    }
    this.client = new Wit({
      accessToken: options.accessToken,
      logger: dblogger,
      witURL: options.witURL
    });
  }

  run(text) {
    return this.client.message(text, {});
  }

  /**
   * 
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
    return new Promise((resolve, reject) => {
      var x = this.client.train([sample]);
      resolve();
    });
  }
  extractIntent(response) {
    if (response.entities && response.entities.intent && response.entities.intent.length != 0) {
      return {
        intent: response.entities.intent[0].value,
        score: response.entities.intent[0].confidence
      };
    } else {
      // on wit, we could get an entity without an intent. 
      return Object.keys(response.entities).length ? undefined : this.noIntent();
    }
  }

  /**
   * 
   * @param {*} response 
   * @param {string} keyPrefix 
   */
  extractEntities(response, keyPrefix, entities) {
    for (var key in response.entities) {
      var entity = response.entities[key];
      if (key == "intent") {
        key = "intentId";
      } else if (!response.entities.hasOwnProperty(key)) {
        continue;
      }


      var values = [];
      var avgscore = 0;
      // entity is really an array
      for (var i = 0; i < entity.length; i++) {
        for (var ettMember in entity[i]) {
          if (ettMember === "value") {
            let value = entity[i].value;
            // if (entity[i].normalized && entity[i].normalized.value) {
            //   value = entity[i].normalized.value;
            // }
            values.push(value);
            avgscore += entity[i].confidence / (i + 1);

          } else if (ettMember === "entities") {
            return this.extractEntities(entity[i], keyPrefix + key + "#", entities);
          }
          // for unit-based duration/quantity
          else {
            entities[key + "#" + ettMember] = [entity[i][ettMember]];
          }

        }

      }
      // some special cases for wit
      if (key === "greetings") {
        entities["intentId"] = [(config.constants && config.constants.HELLOINTENT) || "HelloIntent"];
        entities["intentId#confidence"] = entities["greetings#confidence"];
      }

      entities[keyPrefix + key] = values;

    }

    return {
      score: avgscore // only first level score is in play
    };
  }
}
module.exports = WIT;