var config = require('../../config');
var Promise = require('promise');
var querystring = require('querystring');
var request = require('request');

var LUIS = {};
module.exports = LUIS;

LUIS.init = function (options) {
    if (!options.app_id || !options.subscription_key === 'undefined') {
        throw ('"app_id" and/or "subscription_key" missing.');
    }

    LUIS.app_id = options.app_id;
    LUIS.subscription_key = options.subscription_key;
};

LUIS.getIntent = function (phrase) {
    console.log('In GET INTENT', phrase);

    var promise = new Promise(function (resolve, reject) {

        console.log('Sending request with phrase', phrase);

        sendRequest(phrase).then(function (response) {
            console.log('Got response from LUIS', response);
            try {
                var json = JSON.parse(response);
                var intent = '';
                var entities = [];
                var score = null;

                //Get the highest scored Intent
                for (var i in json.intents) {
                    if (score && json.intents[i].score < score) {
                        continue;
                    }

                    score = json.intents[i].score;
                    intent = json.intents[i].intent;
                }

                //Get the entities
                for (var i in json.entities) {
                    var entity = {
                        entity: json.entities[i].entity,
                        type: json.entities[i].type,
                        value: json.entities[i].entity
                    };

                    switch (json.entities[i].type) {
                        case 'builtin.datetime.date':
                            entity.value = json.entities[i].resolution;
                            break;
                        case 'builtin.datetime.time':
                            entity.value = json.entities[i].resolution.time;
                            break;
                        case 'builtin.number':
                            entity.value = json.entities[i].entity;
                            break;
                    }

                    entities.push(entity);
                }

                resolve({intent: intent, entities: entities,score:score});
            } catch (e) {
                console.log("Error retrieving response from LUIS request", e);
                resolve({});
            }
        });

    });

    return promise;
};

function sendRequest(query) {
    var params = {
        id: LUIS.app_id,
        "subscription-key": LUIS.subscription_key,
        q: query
    };

    var reqUrl = config.luis.apiUrl + '?' + querystring.stringify(params);

    var promise = new Promise(function (resolve, reject) {
        console.log('Sending Request for LUIS: ' + reqUrl);

        request(reqUrl, function (error, response, body) {
            if (error) {
                console.log('Problem getting intent from LUIS. ERROR: ', error);
                reject(error);
            } else {
                resolve(body);
            }
        });
    });

    return promise;
}