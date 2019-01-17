var express = require('express');
var router = express.Router();
var FSMManager = require('../FSM/fsm-manager');
var fsmModel = require("../models/fsmmodel");
var dblogger = require('../utils/dblogger')
var loggerModel = require('../models/loggermodel');
var processModel = require("../models/processmodel");
var config = require('../config');

var UserModel = require('../models/user-model');
var DAL = require("../dal/router");
var cacheFactory = require('../models/cache-factory');

const loginController = require("../controllers/login");
const b3Controller = require("../controllers/b3");

const CONVOCODE_DIR = "./convocode";

var _ = require( "lodash" );

if (config.noEditorEndpoints) {
  router.post("/", function (req, res) {

    res.status(400).send("noEditorEndpoints is set");
  });
  module.exports = router;
  return;
}

/***
 * log API
 */
router.post("/logEntry", function (req, res) {
  dblogger.log('logEntry', req.body).then(function (data) {
    res.send(data);
  }).catch(function (err) {
    return res.status(400).send(error);
  });
})

router.get("/log/list", function (req, res) {
  loggerModel.list().then(function (files) {
    return res.send(files.reverse());
  }).catch(function (error) {
    return res.status(400).send(error);
  });
});

router.get("/log/file", function (req, res) {
  if (!req.query.name) {
    console.error("name param is required" + req.query);
    return res.status(400).send({
      "status": "error",
      "message": "name param is required" + req.query
    });
  }
  loggerModel.file(req.query.name).then(function (content) {
    var rowsArr = content.split("\n");
    var rows = [];
    for (i in rowsArr) {
      cols = rowsArr[i].split("\t");
      if (cols.length >= 2) rows.push({
        time: cols[0],
        type: cols[1],
        cat: cols[2],
        data: cols[3]
      });
    }
    return res.send(rows.reverse());
  });
});

/**
 * b3 editor API
 */
router.get("/b3/list", loginController.fetchUserBySession, b3Controller.list);
router.get("/b3/load", loginController.fetchUserBySession, b3Controller.load);
router.post("/b3/save", loginController.fetchUserBySession, b3Controller.save);
router.post("/b3/publish", loginController.fetchUserBySession, b3Controller.publish);
router.post("/b3/remove", loginController.fetchUserBySession, b3Controller.remove);
router.post("/login", loginController.login);

/**
 * health api
 */
router.get("/health/check", function (req, resp) {
  try {
    var timeStart = Date.now();
    fsmModel.getAllFSMs().then((fsms) => {
      let fsmNumber = Object.keys(fsms).length;
      FSMManager.getBehaviorTreeStats().then((stats) => {
        processModel.getProcessStats().then((processStats) => {
          var retObj = {
            "fsms": fsmNumber,
            "BehaviorTreeCacheStats": stats,
            "ProcessCacheStats": processStats,
            "fulfilledIn": (Date.now() - timeStart) + "ms"
          };
          resp.json(retObj);
        }).catch((err) => {
          resp.statusCode = 500;
          try {
            if (typeof err === "string") {
              resp.statusMessage = "problem in getProcessStats:" + err;
            } else {
              resp.statusMessage = JSON.stringify(err);
            }

          } catch (ex) {
            resp.statusMessage = "problem in getProcessStats:unknown";
          }
        });


      }).catch((err) => {
        resp.statusCode = 500;
        try {
          if (typeof err === "string") {
            resp.statusMessage = "problem in getBehaviorTreeStats:" + err;
          } else {
            resp.statusMessage = JSON.stringify(err);
          }

        } catch (ex) {
          resp.statusMessage = "problem in getBehaviorTreeStats:unknown";
        }
      });
    }).catch((err) => {
      resp.statusCode = 500;
      try {
        if (typeof err === "string") {
          resp.statusMessage = "problem in getAllFSMs:" + err;
        } else {
          resp.statusMessage = JSON.stringify(err);
        }

      } catch (ex) {
        resp.statusMessage = "problem in getAllFSMs:unknown";
      }
    });
  } catch (ex) {
    return resp.status(500).send(ex);
  }
});

module.exports = router;
