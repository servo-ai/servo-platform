var config = require('../../config');
var Promise = require("bluebird");
var request = require('request');
var querystring = require('querystring');
var NLUPipeInterface = require("../nlu-pipe-interface.js");
var dblogger = require("utils/dblogger");

const API_URL = "https://api.projectoxford.ai/luis/v1/application";
class LUIS extends NLUPipeInterface {
  constructor(options) {
    super();
    if (!options || !options.app_id || !options.subscription_key === 'undefined') {
      throw ('"app_id" and/or "subscription_key" missing.');
    }

    this.app_id = options.app_id;
    this.subscription_key = options.subscription_key;
  }

  run(text) {
    var params = {
      id: this.app_id,
      "subscription-key": this.subscription_key,
      q: text
    };

    var reqUrl = API_URL + '?' + querystring.stringify(params);

    return new Promise(function (resolve, reject) {
      dblogger.log('Sending Request for LUIS: ' + reqUrl);

      request(reqUrl, function (error, response, body) {
        try {
          if (error) {
            dblogger.error('Problem getting intent from LUIS. ERROR: ', error);
            reject(error);
          } else {

            dblogger.log("output from LUIS:*******", body);
            var json = JSON.parse(body);
            resolve(json);
          }
        } catch (ex) {
          console.error('problem in luis pipe', ex);
        }
      });
    });

    return promise;

    return this.client.message(text, {});
  }

  extractIntent(response) {
    var score = null;
    var intent = "";

    //Get the highest scored Intent
    for (var i in response.intents) {
      if (score && response.intents[i].score < score) {
        continue;
      }

      score = response.intents[i].score;
      intent = response.intents[i].intent;
    }
    if (score) {
      return {
        intent: intent,
        score: score
      };
    } else {
      return this.noIntent();
    }
  }

  extractEntities(response) {
    var entities = {};
    let avgscore = 0;
    //Get the entities
    for (var i in response.entities) {
      var entity = response.entities[i];
      avgscore += entity.score;
      var values = [];
      switch (entity.type) {
        case 'builtin.datetime.date':
          values.push(entity.resolution);
          break;
        case 'builtin.datetime.time':
          values.push(entity.resolution.time);
          break;
        default:
          values.push(entity.entity);
          break;
      }
      if (entity.type.indexOf(".") != -1) {
        entity.type = entity.type.split(".")[1];
      }
      entities[entity.type] = values;
    }
    entities["intentId"] = entities["intentId"] || [];
    let intentId = response.intents[0] && response.intents[0].intent;
    intentId && entities["intentId"].push(intentId);
    avgscore += response.intents[0] && response.intents[0].score;
    if (Object.keys(entities).length) {
      avgscore /= Object.keys(entities).length;
    }
    return {
      entities: entities,
      // TODO: explore score on entities
      score: avgscore
    };
  }
}
module.exports = LUIS;
