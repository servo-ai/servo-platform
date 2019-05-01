var Promise = require("bluebird");
var NLUPipeInterface = require("../nlu-pipe-interface.js");
var _ = require('underscore');
const _intentsCodes = {
    "AMAZON.YesIntent": "PositiveIntent",
    "AMAZON.NoIntent": "NegativeIntent",
    "AMAZON.CancelIntent": "CancelIntent",
    "AMAZON.FOUR_DIGIT_NUMBER": "number",
    "AMAZON.StartOverIntent": "StartIntent",
    "AMAZON.StopIntent": "StopIntent",
    "AMAZON.FallbackIntent": "None"
}

class Alexa extends NLUPipeInterface {
    run(messageObj) {
        return Promise.resolve(messageObj);
    }

    extractIntent(messageObj) {
        // convert to intent
        var intent = (messageObj.request && messageObj.request.intent && messageObj.request.intent.name);
        // translate from AMAZON intents to ours
        intent = _intentsCodes[intent] || intent;
        // map launch intent to start
        if (messageObj.request.type === "LaunchRequest") {
            intent = "LaunchIntent";
        }

        if (intent) {
            return {
                intent: intent,
                score: 1
            };
        } else {
            return this.noIntent();
        }
    }

    /**
     * 
     * @param {object} messageObj 
     * @param {string} keyPrefix empty here 
     * @param {object} entities  map
     */
    extractEntities(messageObj, keyPrefix, entities) {
        _.each(messageObj.request.intent && messageObj.request.intent.slots, (slot) => {
            entities[slot.name] = [slot.value];
        });
        return {};
    }
}
module.exports = Alexa;