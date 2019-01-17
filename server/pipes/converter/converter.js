var Promise = require("bluebird");
var Ffmpeg = require('fluent-ffmpeg');
var https = require('https');
var fs = require('fs');

const TEMPORARY_DIR = "temporary/";
class Converter {
    static init() {

    }
    static run(fileName) {
        return new Promise((resolve, reject) => {
            var command = new Ffmpeg(TEMPORARY_DIR + fileName);
            command
                //                .on('start', console.log)
                .on('error', (err) => {
                    console.error(err);
                })
                .on('stderr', (err) => {
                    console.error(err);
                })
                .on('end', () => {
                    resolve(TEMPORARY_DIR + fileName + "-");
                }).format("flac").save(TEMPORARY_DIR + fileName + "-");
        });
    }
    static download(url) {
        return new Promise((resolve, reject) => {
            var fileName = randomName();
            var file = fs.createWriteStream(TEMPORARY_DIR + fileName);
            var request = https.get(url, (response) => {
                response.pipe(file);
                resolve(fileName);
            });
        });
    }
}
module.exports = Converter;

function randomName() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}