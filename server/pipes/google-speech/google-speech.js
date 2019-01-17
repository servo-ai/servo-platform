var Promise = require("bluebird");
var speech;

class GoogleSpeech {
    static init(options) {
        speech = require('@google-cloud/speech')({
            projectId: 'voice-helper-170610',
            keyFilename: 'googleSpeechKey.json',
            promise: Promise
        });
    }
    static recognize(path, phrases = []) {
        return new Promise((resolve, reject) => {
            speech.recognize(path, {
                encoding: 'FLAC',
                //                sampleRateHertz: 16000,
                languageCode: "en-US",
                speechContexts: {
                    phrases: phrases
                }
            }).then(function (data) {
                var transcript = data[0];
                resolve(transcript);
            }).catch(reject);
        });
    }
}

module.exports = GoogleSpeech;