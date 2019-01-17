const DAL = require("../dal/router");
const cacheFactory = require('../models/cache-factory');
const UserModel = require('../models/user-model');
const b3Controller = require("./b3");

const SESSION_ID_RANGE = 1e7;
const _sessions = cacheFactory.createCache({
  stdTTL: 0,
  useClones: false
});

const randomSessionID = () => Math.trunc(Math.random() * SESSION_ID_RANGE + SESSION_ID_RANGE);
const generateSessionID = () => {
  let sessionID = randomSessionID();
  while (_sessions.get(sessionID)) {
    sessionID = randomSessionID();
  }
  return sessionID;
};

const createSession = (userObj) => {
  let sessionID = generateSessionID();
  _sessions.set(sessionID, userObj);

  // Remove session after 2 hours
  setTimeout(function () {
    _sessions.del(sessionID);
  }, 24 * 60 * 60 * 1000);

  return sessionID;
};

const fetchUserBySession = (req, res, next) => {
  if (req.headers && req.headers.sessionid) {
    var userObj = _sessions.get(req.headers.sessionid);
    if (userObj) {
      req.user = userObj;
      req.user.id = userObj.facebookID;
    }
  }
  if (req.user) return next();
  return res.status(500).send("sessionID is missing");
};

const login = (req, res) => {
  const user = req.body;
  DAL.User.getByFacebookID(user.facebookID).then(function (userObj) {
    b3Controller.ensureProjectsDir(userObj.projectsDir || UserModel.anonymousFolder());
    var loginDetails = Object.assign({}, userObj);
    loginDetails.sessionID = createSession(userObj);
    res.send(loginDetails);

    userObj.lastLoggedIn = Date.now();
    DAL.User.upsert(userObj);
  }).catch(function (err) {
    if (err === 0) {
      var userObj = new UserModel(user.name, user.email, user.facebookID, null, null, Date.now(), Date.now());
      DAL.User.upsert(userObj).then(function () {
        DAL.User.getByFacebookID(user.facebookID).then(function (userObj) {
          b3Controller.ensureProjectsDir(userObj.projectsDir);
          var loginDetails = Object.assign({}, userObj);
          loginDetails.sessionID = createSession(userObj);
          res.send(loginDetails);
          userObj.lastLoggedIn = Date.now();
          DAL.User.upsert(userObj);
        }).catch(function (err) {
          res.status(500).send(err);
        });
      }).catch(function (err) {
        res.status(500).send(err);
      });
    } else {
      res.status(500).send(err);
    }
  });


};

module.exports = {
  login,
  fetchUserBySession
};
