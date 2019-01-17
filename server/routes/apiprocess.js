var express = require('express');
var router = express.Router();
var processModel = require("../models/processmodel");
var chatManager = require("../chat/chatmanager");
var fsmModel = require("../models/fsmmodel.js");
var dblogger = require('../utils/dblogger')
var config = require('../config');

if (config.noEditorEndpoints) {
  router.post("/", function (req, res) {

    res.status(400).send("noEditorEndpoints is set");
  });
  module.exports = router;
  return;
}
/**
 * get all the processes, ordered by timestamp
 */
router.get("/getLatestProcesses", function (req, res) {
  if (!req.query.pageSize || !req.query.pageIndex) {
    console.error("pagesize/index is required" + req.query);
    return res.status(400).send({
      "status": "error",
      "message": "pagesize/index is required" + req.query
    });
  }
  processModel.getLatest(req.query.pageIndex, req.query.pageSize).then(function (result) {

    res.send(result);
  }).catch(function (error) {
    dblogger.error('gotlatest', error)
    return res.status(400).send({
      message: error
    });
  });
});

router.get("/getLatestMessages", function (req, res) {
  if (!req.query.laterThan || !req.query.processId) {
    console.error("timestamp/processId/pageSize is required" + req.query);
    return res.status(400).send({
      "status": "error",
      "message": "timestamp/processId is required" + req.query
    });
  }

  if (utils.safeIsNaN(req.query.laterThan)) {
    console.error("laterThan timestamp should be a number" + req.query);
    return res.status(400).send({
      "status": "error",
      "message": "laterThan timestamp should be a number" + req.query
    });
  }

  processModel.getLatestMessages(req.query.processId, req.query.laterThan, req.query.pageSize).then(function (result) {

    res.send(result);
  }).catch(function (error) {
    dblogger.error('gotlatest', error)
    return res.status(400).send({
      message: error
    });
  });

});

/**
 * get all the processes, ordered by timestamp
 */
router.post("/sendMessage", function (req, res) {
  if (!req.body.processId || !req.body.fsm_id || !req.body.text) {
    return res.status(400).send({
      "status": "error",
      "message": "requierd: processId fsm_id  message"
    });
  }


  // TODO: use process object that was already retrieved
  processModel.getProcessById(req.body.processId).then(function (processObj) {
    // get the fsm from fsm_id message
    fsmModel.getFSM(req.body.fsm_id, processObj.userId).then(function success(fsm) {

      var process = processObj;
      chatManager.sendMessage({
        text: req.body.text
      }, fsm, process).then(function () {

        processModel.upsert(processObj, req.body).then(function () {
          console.log('saving message at', req.body.processId);
          res.send({
            "message": req.body.text + " sent"
          });
        }).catch(function (err) {
          dblogger.error('err in processModel.upsert:', err);
          return res.status(400).send({
            message: 'err in processModel.upsert:' + err
          });
        });
      }).catch(function (err) {
        dblogger.error('err in fsmModel.getFSM:', err);
        return res.status(400).send({
          message: 'err in fsmModel.getFSM:' + err
        });
      });
    }).catch(function (err) {
      dblogger.error('err in getProcessById:', err);
      reject('err in getProcessById:', err);
    });

  }).catch(function (err) {
    dblogger.error('err in chatManager.sendMessage:', err);
    return res.status(400).send({
      message: 'err in chatManager.sendMessage:' + err
    });
  });

});

router.post("/deleteProcess", function (req, res) {

  if (!req.body.processId) {
    res.send('no processID')
  } else processModel.deleteProcess(req.body.processId).then((result) => {
    res.send(result);
  });
});

module.exports = router;
