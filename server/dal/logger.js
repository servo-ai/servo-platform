var fs = require('graceful-fs')
const path = require('path');

var Promise = require('promise');
var emptyPromise = function () {
    return new Promise(function (resolve, reject) { resolve(null); });
}

var _recording = false;
var _recordFile = "";
var _recordObj = {};

class Logger {

    static insert(type, logObj, cat = "main") {
        return new Promise((resolve, reject) => {
            var now = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
            var date = now.split(" ")[0];
            var time = now.split(" ")[1];
            var row = time + "\t" + type + "\t" + cat + "\t";
            row += logObj;
            row = row.replace("\n", "");
            row += "\n";

            fs.appendFile("log/" + date + ".txt", row, (err) => {
                if (err) reject(err);
                else resolve(true);
            });
        });
    }

    static allByPage(pageIndex, pageSize) {
        return emptyPromise();
    }

    static startRecord() {
        if (_recording) {
            return;
        }
        _recording = true;
        _recordObj = {};
        // var files = fs.readdirSync("log/");
        // array.forEach(function(element) {

        // }, this);
        // set file name
        var now = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
        var date = now.split(" ")[0];
        var time = now.split(" ")[1].replace(":", "-").replace(":", "-");
        _recordFile = path.join("log", date + "-starting-" + time + ".json");

    }


    static stopRecord() {
        _recording = false;
    }

    static record(pid, direction, obj, verb = "POST") {
        if (_recording) {
            _recordObj[pid] = _recordObj[pid] || [];
            _recordObj[pid].push({
                direction: direction,
                payload: obj
            });
            fs.writeFileSync(_recordFile, JSON.stringify(_recordObj, null, 2), 'utf-8');
        }
    }
}

module.exports = Logger;