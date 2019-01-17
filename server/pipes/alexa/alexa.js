var Promise = require("bluebird");
var NLUPipeInterface = require("../nlu-pipe-interface.js");
const _intentsCodes = {
    "AMAZON.YesIntent": "yes",
    "AMAZON.NoIntent": "no",
    "AMAZON.CancelIntent": "cancel",
    "AMAZON.FOUR_DIGIT_NUMBER": "number",
    "AMAZON.StartOverIntent": "startover",
    "AMAZON.StopIntent": "stop"
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

        if (intent) {
            return { intent: intent, score: 1 };
        } else {
            return this.noIntent();
        }
    }

    extractEntities(messageObj) {
        var entities = {};
        _.each(messageObj.request.intent && messageObj.request.intent.slots, (slot) => {
            entities[slot.name] = slot.value;
        });
        return entities;
    }
}
module.exports = Alexa;