var Promise = require('promise');
var config = require("../config");
var db = null;
if (config.db.name == "loki")
  db = require("./loki-dal");
else
if (config.db.name == "mongo")
  db = require("./mongo-dal");
else
  db = require("./couchbase-dal");

if (config.readOnly) {
  db.Logger.insert = function () {};
}

module.exports = db;
