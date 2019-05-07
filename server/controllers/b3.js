const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs-extra'));
const FSMManager = require('../FSM/fsm-manager');
const fsmModel = require("../models/fsmmodel");
const dblogger = require('../utils/dblogger');
const _ = require("lodash");
const pathLib = require('path');
const utils = require('utils/utils');

const ensureProjectsDir = (dir) => {
  const userDir = utils.CONVOCODE_DIR + "/" + dir;
  const commonDir = utils.CONVOCODE_DIR + "/common";
  fs.ensureDir(userDir);
  fs.ensureDir(userDir + "/fsms");
  fs.ensureDir(userDir + "/drafts");
  if (!fs.existsSync(userDir + "/drafts/getting-started")) {
    try {
      fs.copySync(commonDir + "/getting-started", userDir + "/drafts/getting-started");
    } catch (ex) {
      dblogger.log('no getting-started folder found');
    }

  }

};

/**
 * list the fsms of the user at req.user
 * @param {*} req 
 * @param {*} res 
 */
const list = (req, res) => {
  dblogger.log('b3.list. start time:', Date.now(), 'req.user.projectsDir=' + req.user.projectsDir);
  try {
    dblogger.assert(req.user.projectsDir, req.user, 'need user id on request');
    fsmModel.getAllFSMs(req.user.projectsDir, true /*drafts*/ ).then(function (fsms) {
      setTimeout(function () {
        try {
          var rootFSMs = {};
          // Filter only user's fsms
          const userFSMs = fsms;
          /*_.pickBy(fsms, (fsm) => {
                      return fsm.path.split(pathLib.posix.sep)[1] == userDir;
                    });*/
          for (let id in userFSMs) {
            const fsm = userFSMs[id];
            if (!fsm.isRoot) {
              continue;
            }
            var clone = JSON.parse(JSON.stringify(fsm));
            fsm.trees = [];
            fsm.trees.push(clone);
            rootFSMs[id] = fsm;
          }
          for (let id in userFSMs) {
            const fsm = userFSMs[id];
            if (fsm.isRoot) {
              continue;
            }
            const pathArr = fsm.path.split(pathLib.posix.sep);
            const rootFSMid = pathArr[0] + pathLib.posix.sep + pathArr[1] + pathLib.posix.sep + pathArr[2] +
              pathLib.posix.sep + pathArr[3] + pathLib.posix.sep + pathArr[3] + '#json';
            if (!rootFSMid || !rootFSMs[rootFSMid]) {
              dblogger.error('problem in path. unsupported folder structure:' + fsm.path);
            } else {

              rootFSMs[rootFSMid].trees.unshift(fsm);
            }
          }
          for (let rootFSMid in rootFSMs) {
            var last = rootFSMs[rootFSMid].trees.pop();
            rootFSMs[rootFSMid].trees.sort((a, b) => a.id.toLowerCase().localeCompare(b.id.toLowerCase()));
            rootFSMs[rootFSMid].trees.push(last);
          }
          dblogger.log('b3.list. end time:', Date.now());
          return res.send(rootFSMs);
        } catch (ex) {
          return res.status(500).send(ex);
        }
      }, 100);
    }).catch(function (err) {
      return res.status(500).send(err);
    });
  } catch (ex) {
    return res.status(500).send(ex);
  }
};

/**
 * loads the fsms
 * @param {*} req 
 * @param {*} res 
 */
const load = (req, res) => {
  try {
    var path = req.query.path;
    var dir = req.user.projectsDir;
    path = utils.CONVOCODE_DIR + "/" + dir + "/" + path;

    if (!fs.existsSync(path)) {
      var err = "file wasnt found: " + path;
      dblogger.error(err);
      return res.status(500).send(err);
    }
    fs.readFile(path, 'utf8', (err, content) => {
      if (err) {
        dblogger.error(err);
        res.status(500).send("error in readfile:" + path + ":" + err.message);
      } else {
        res.send(content);
      }
    });
  } catch (ex) {
    return res.status(500).send(ex);
  }
};

/**
 * save an fsm of req.body.path
 * @param {*} req 
 * @param {*} res 
 */
const save = (req, res) => {
  try {
    dblogger.log('save requested:' + req.body.path);
    const content = req.body.data;
    const projectsDir = req.user.projectsDir;
    const path = utils.getPathInfo(req.body.path, projectsDir);

    const project = JSON.parse(content);
    if (project.data && project.data.trees) {
      dblogger.log('trees number:' + project.data.trees.length);
      const rootDir = utils.getTreeDir(path);
      fs.ensureDirSync(rootDir);

      for (let i = 0; i < project.data.trees.length; i++) {
        let tree = project.data.trees[i];
        if (Object.keys(tree.nodes).length == 0) {
          continue;
        }

        tree = _.omit(tree, ["lastPublishPublished", "lastPublished", "lastSaved", "isRoot", "path", "folderName"]);
        tree.state = "draft";

        const treeString = JSON.stringify(tree, null, '\t');
        // If a subtree or a root tree
        if (tree.id != path.tree) {
          fs.ensureDirSync(rootDir + "/trees/");
          fs.ensureDirSync(rootDir + "/trees/" + tree.id);
          fs.writeFile(rootDir + "/trees/" + tree.id + "/" + tree.id + ".json", treeString, {
            flag: 'w'
          });
        } else {
          fs.writeFile(rootDir + "/" + tree.id + ".json", treeString, {
            flag: 'w'
          });
        }
      }

      // now remove whats not there
      fs.readdir(rootDir + "/trees", function (err, treeDirs) {
        if (err) {
          // No subtrees exists
          return res.send({
            "result": true
          });
        }
        for (let i = 0; i < treeDirs.length; i++) {
          const found = project.data.trees.find((tree) => tree.id === treeDirs[i]);

          // if a file on the folder does not exist on the data to be saved, remove it
          if (!found) {
            fs.removeSync(rootDir + "/trees/" + treeDirs[i]);
          }
        }

        res.send({
          "result": true
        });
      });
    } else {
      // If a simple file
      fs.writeFile(utils.CONVOCODE_DIR + "/" + projectsDir + "/" + path.filename, content, {
        flag: 'w'
      });
      res.send({
        "result": true
      });
    }
  } catch (err) {
    dblogger.error('error in save', err);
    res.status(500).send(err);
  }
};

/**
 * publish an fsm of req.body.name
 * @param {*} req 
 * @param {*} res 
 */
const publish = (req, res) => {
  try {
    dblogger.info('publish start for ' + req.body.name);
    var dir = req.user.projectsDir;
    var path = utils.CONVOCODE_DIR + "/" + dir + "/drafts/" + req.body.name;
    var dst = path.replace("drafts", "fsms");
    fs.removeSync(dst);
    fs.copyAsync(path, dst).then(() => {
      FSMManager.resetBehaviorTrees(req.user.projectsDir, req.body.name).then(() => {
        dblogger.info('publish end for ' + req.body.name);
        res.send({
          "result": true
        });
      }).catch(() => {
        dblogger.error('publish error for ' + req.body.name);
        res.send({
          "result": false
        });
      });

    }).catch((err) => {
      dblogger.error('error in publish', err);
      res.status(500).send(err);
    });
  } catch (ex) {
    dblogger.error('publish error', ex);
    return res.status(500).send(ex);
  }
};
/**
 * remove an fsm of req.body.path
 * @param {*} req 
 * @param {*} res 
 */
const remove = (req, res) => {
  try {
    var projectsDir = req.user.projectsDir;
    const pathObj = {
      convocode: utils.CONVOCODE_DIR,
      projectsDir,
      state: 'drafts',
      tree: req.body.name
    };
    const draftsRootDir = utils.getTreeDir(pathObj);
    fs.ensureDirSync(draftsRootDir);
    fs.remove(draftsRootDir, (err) => {
      if (err) {
        dblogger.error(err);
        res.status(500).send(err);
      } else {
        pathObj.state = "fsms";
        const fsmsRootDir = utils.getTreeDir(pathObj);
        if (fs.existsSync(fsmsRootDir)) {
          fs.remove(fsmsRootDir, (err) => {
            if (err) {
              dblogger.error(err);
              res.status(500).send(err);
            } else {
              FSMManager.resetBehaviorTrees(req.user.projectsDir, req.body.name);
              res.send({
                "result": true
              });
            }

          });
        } else {
          FSMManager.resetBehaviorTrees(req.user.projectsDir, req.body.name);
          res.send({
            "result": true
          });
        }
      }

    });
  } catch (ex) {
    dblogger.error('error in remove', ex);
    return res.status(500).send(ex);
  }
};

module.exports = {
  ensureProjectsDir,
  remove,
  list,
  save,
  load,
  publish
};