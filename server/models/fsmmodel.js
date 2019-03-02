const bluebird = require('bluebird');
var dblogger = require("../utils/dblogger.js");
var _ = require('underscore');
var baseModel = require("./base-model");
const fs = bluebird.promisifyAll(require('fs-extra'));
const cacheFactory = require('./cache-factory');
const Fsm = require('./fsm');
const path = require('path');

const glob = require('glob');
const pathLib = require('path');

function fsmModel() {}
_.extend(fsmModel, baseModel);

const CONVOCODE_DIR = "./convocode";

let _userFsms = cacheFactory.createCache({
  stdTTL: 0,
  useClones: false
});

let _draftsFsmsCache = cacheFactory.createCache({
  stdTTL: 0,
  useClones: false
});

module.exports = fsmModel;


/**
 * get an fsm by id synchrnously
 * @param {string} fsm_id
 * @param {string} userId
 * @param {string} [parentFolderName] - unique id of parent
 * @return {Fsm}
 */
fsmModel.getFSMSync = function (fsm_id, userId, parentFolderName) {
  let fsmObj = fsmCacheKey(userId, fsm_id, parentFolderName);
  var fsm = _userFsms.get(fsmObj.userId).get(fsmObj.fsmId);
  return fsm;
};

/***
 * get by id
 * @param {string} fsm_id
 * @param {string} user_id
 * @return {Fsm}
 */
fsmModel.get = fsmModel.getFSM = function (fsm_id, userId, parentFolderName) {
  let resultFSM;
  // @ts-ignore
  return new Promise(function (resolve, reject) {
    fsmModel.getAllFSMs(userId, /*loadDrafts =*/ false).then(function () {
      resultFSM = fsmModel.getFSMSync(fsm_id, userId, parentFolderName);
      if (!resultFSM) {
        reject({
          errorFsmId: fsm_id,
          message: "FSM " + fsm_id + " not found!"
        });
      } else {
        resolve(resultFSM);
      }
    }).catch((ex) => {
      dblogger.error(ex.message);
    });
  });
};

function finalizeFsmLoad(errors) {
  // const fsmCount = Object.keys(fsms).length;
  // dblogger.log(`getAllFSMs() - successfully read: ${fsmCount} out of ${fsmCount + errors.length} trees`);
  if (errors.length != 0) {
    dblogger.error("FSMModel/getAllFSMs() - error loading FSM files:", errors);
    // We do want to continue to support all valid existing FSMs.
  }

}

const getModifiedDate = (path) => {
  if (fs.existsSync(path)) {
    const stats = fs.statSync(path);
    return stats.mtime;
  } else {
    return "Never";
  }
};

/**
 * given a file name an other information, create and Fsm object 
 * @param {*} file 
 * @param {*} fsmInfo 
 * @returns {Promise} Fsm object
 */
fsmModel.readFSM = (file, fsmInfo) => {

  return new Promise((resolve, reject) => {
    fs.readFile(file, 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        try {
          let json = JSON.parse(data);
          fsmInfo.lastSaved = fsmInfo.lastPublished = getModifiedDate(file);
          if (fsmInfo.isDraft) {
            const publishedPath = file.replace(`${pathLib.posix.sep}drafts${pathLib.posix.sep}`, `${pathLib.posix.sep}fsms${pathLib.posix.sep}`);
            fsmInfo.lastPublished = getModifiedDate(publishedPath);
          } else {
            const draftPath = file.replace(`${pathLib.posix.sep}fsms${pathLib.posix.sep}`, `${pathLib.posix.sep}drafts${pathLib.posix.sep}`);
            fsmInfo.lastSaved = getModifiedDate(draftPath);
          }
          Object.assign(json, fsmInfo);
          let fsm = new Fsm(json);
          resolve(fsm);
        } catch (err) {
          reject(err);
        }
      }
    });
  });
};

/**
 * service function - add the fsms
 * @param {Array<any>} resFsms
 * @param {boolean} loadDrafts
 * @return {*}
 */
function addFsms(resFsms, loadDrafts) {
  let userFsmsCache = loadDrafts ? _draftsFsmsCache : _userFsms;
  // add one by one to global tree cache
  for (var i = 0; i < resFsms.length; i++) {
    var fsm = resFsms[i];
    let userCache = userFsmsCache.get(fsm.userId);
    if (!userCache) {
      userCache = cacheFactory.createCache({
        stdTTL: 0,
        useClones: false
      });
      userFsmsCache.set(fsm.userId, userCache);
    }
    // tree shouldnt exist already 
    dblogger.assert(!userFsmsCache.get(fsm.userFsmId()), fsm.id + " fsm already in userCache for user: " + fsm.userId);
    userCache.set(fsm.userFsmId(), fsm);

  }
}

/**
 * add an fsm to the cache
 * @param {Fsm} fsm
 * @param {boolean} loadDrafts
 
 */
fsmModel.addFsm = function (fsm, loadDrafts) {
  addFsms([fsm], loadDrafts);
};


/**
 * calculates fsm info based on path
 * @param {string} file  file name including path
 * @returns {Object} fileInfo
 */
fsmModel.calcFsmInfo = function (file) {
  let path = file;
  path = path.substring(path.indexOf(CONVOCODE_DIR.substring(2)));
  path = normalizePath(path);

  const sections = path.split("/");
  const fsmInfo = {};
  fsmInfo.path = path;
  fsmInfo.userId = sections[1];
  fsmInfo.isDraft = sections[2] == "drafts";
  fsmInfo.isRoot = sections.length == 5;
  fsmInfo.folderName = pathLib.dirname(fsmInfo.path);
  fsmInfo.rootFolderName = sections[0] + "/" + sections[1] + "/" + sections[2] + "/" + sections[3];

  return fsmInfo;
};

/**
 * return posix - version of the path
 * @param {string} path 
 */
const normalizePath = (path) => {

  let re = new RegExp("\\" + pathLib.win32.sep, 'g');
  let normalized = path.replace(re, pathLib.posix.sep);
  if (normalized.indexOf(":") == 1) {
    normalized = normalized.substring(2);
  }
  return normalized;
};

/**
 * converts the hirerchical cache to a flat object
 * @param {string} userId 
 */
const cacheToObj = function (userId, loadDrafts) {
  let userFsmsCache = loadDrafts ? _draftsFsmsCache : _userFsms;
  if (userId) {
    return userFsmsCache.get(userId).getObject();
  } else {
    let retObj = {};
    let userKeys = userFsmsCache.keys();
    userKeys.forEach((userId) => {
      Object.assign(retObj, userFsmsCache.get(userId).getObject());
    });
    return retObj;
  }

};

/**
 * create the fsm cache key
 * @param {string} userId 
 * @param {string} fsmId 
 * @param {string} parentId 
 */
const fsmCacheKey = fsmModel.fsmCacheKey = function (userId, fsmId, parentId) {
  let fsmSections = fsmId.split(pathLib.posix.sep);
  parentId = parentId || '';

  // if its the bare fsm id
  if (fsmSections.length === 1) {
    fsmId = fsmSections[0];
    let fsmId1 = CONVOCODE_DIR.substr(2) + "/" + userId + "/fsms/" +
      fsmId +
      "/" + fsmId + ".json";

    if (parentId) {
      fsmId1 = parentId + "/trees/" + fsmId + "/" + fsmId + ".json";
    }
    return {
      fsmId: fsmId1,
      userId: userId
    };
  }
  return {
    fsmId,
    userId
  };
};


/***
 * get all FSMs for a certain userId.
 * The assumption is the user has a folder named fsms,
 * under it there are ONLY subdirectories which named after FSM ID,
 * under each one there is a filed named after the FSM ID with a .js extension.
 * If folder named with .deleted - it won't load its FSM.
 * @param {string} userId
 * @param {boolean} loadDrafts
 * @return {Promise}
 */
fsmModel.getAllFSMs = function (userId, loadDrafts) {
  const excludeList = ["deleted", "actions", "conditions", "views", "common"];
  excludeList.forEach(item => `/${item}/`);
  excludeList.push(".DS", "settings.json");

  const hasExcluded = (filepath) => {
    return excludeList.reduce((has, item) => {
      if (!has) {
        let hasIt = filepath.substr(0, filepath.indexOf(path.basename(filepath))).indexOf(item) > -1;
        return hasIt;
      } else {
        return true;
      }
    }, false);
  };

  return new Promise(function (resolve, reject) {

    if (_userFsms.get(userId) && _userFsms.get(userId).keys().length && !loadDrafts) {
      resolve(_userFsms.get(userId).getObject());
      return;
    }

    userId = userId || '';
    // allow global,non-user fsms load, and specific fsm load
    glob(CONVOCODE_DIR + "/" + (userId || '**') + "/" + (loadDrafts ? 'drafts/' : 'fsms/') + "**/*.json", function (er, files) {
      if (er) {
        dblogger.error('error in reading ' + CONVOCODE_DIR, er);
        reject(er);
      } else {
        const sorted = files.sort((a, b) => a.localeCompare(b));
        let filtered = sorted.filter(file => !hasExcluded(file));
        filtered = filtered.filter(file => file.includes(".json"));
        const errors = [];
        dblogger.log(`getAllFSMs() - reading: ${filtered.length} trees`);
        filtered.forEach((file, i) => {

          let fsmInfo = fsmModel.calcFsmInfo(file);
          fsmModel.readFSM(file, fsmInfo).then(fsm => {

            fsmModel.addFsm(fsm, loadDrafts);
            if (i == filtered.length - 1) {
              finalizeFsmLoad(errors);
              resolve(cacheToObj(userId, loadDrafts));
            }
          }).catch(err => {
            errors.push(err + ": fsm:" + fsmInfo.path);
            if (i == filtered.length - 1) {
              finalizeFsmLoad(errors);
              resolve(cacheToObj(userId, loadDrafts));
            }
          });
        });
      }
    });
  });
};


/**
 * purge the cache and reload ALL FSMs for userId
 * @param {string} userId
 */
fsmModel.reload = function (userId) {
  // TODO: remove only specific needed fsms
  _userFsms.get(userId) && _userFsms.get(userId).flushAll();
  _draftsFsmsCache.get(userId) && _draftsFsmsCache.get(userId).flushAll();
  // reload and reset
  return fsmModel.getAllFSMs(userId, false /*fsms*/ ).then((fsms) => {
    var chatManager = require('../chat/chatmanager');
    var express = require('express');

    var app = express();
    chatManager.startAll(app, fsms);
  });
  // TODO: RESET PROCESS NODE MEMORY (BUT NOT CONTEXT AND GLOBAL MEMORIES)
};