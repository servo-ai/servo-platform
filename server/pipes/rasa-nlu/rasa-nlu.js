var config = require('../../config');
var Promise = require("bluebird");
var request = require('request');
var querystring = require('querystring');
var NLUPipeInterface = require("../nlu-pipe-interface.js");
var dblogger = require('utils/dblogger');

const API_URL = "http://localhost:5000";
const MIN_SCORE = 0.35;
class RasaNLU extends NLUPipeInterface {
  constructor(options) {
    super();

    this.rasaURL = (options && options.nluURL) || API_URL;
    this.minScore = (options && options.minScore) || MIN_SCORE;
  }

  run(text) {
    var data = JSON.stringify({
      q: text
    });

    return new Promise((resolve, reject) => {

      request.post({
        headers: {
          'content-type': 'application/json'
        },
        url: this.rasaURL + "/parse",
        body: data
      }, (error, response, body) => {
        if (error) {
          dblogger.error('Problem getting intent from Rasa. ERROR: ', error);
          reject(error);
        } else {
          var json = JSON.parse(body);
          resolve(json);
        }
      });
    });

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
    if (response.intent.confidence > this.minScore) {
      return {
        intent: response.intent.name,
        score: response.intent.confidence
      };
    } else {
      return {
        intent: undefined,
        score: 1 - response.intent.confidence
      }
    }
  }

  extractEntities(response) {
    var entities = {};
    for (let i = 0; i < response.entities.length; i++) {

      var entity = response.entities[i];
      var values = [];
      var avgscore = 0;

      if (entities[entity.entity]) {
        entities[entity.entity].push(entity.value);
      } else {
        entities[entity.entity] = [entity.value];
      }

    }
    return {
      entities: entities,
      score: 1.0
    };

  }
}
module.exports = RasaNLU;
