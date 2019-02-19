var config = require('config');
//Html to image thing using node-webshot
var webshot = require('webshot');
var crypto = require('crypto');
var _ = require('underscore');

function Utils() {}
module.exports = Utils;
/***
 * returns a length for long term memory, after which memory is lost
 * used in various places
 */
Utils.longTermMemoryLength = function () {
  return 7;
};
/**
 * returns true if empty array, empty string, null, undefined or ""
 * returns false on 
 * @param {*} s 5
 */
Utils.isEmpty = function (s) {

  if (s !== null && s !== "" && s !== undefined) {
    if (isNaN(s)) {
      return _.isEmpty(s);
    } else return false;
  } else return true;
};

var someDate = new Date();
/**
 * get the user time from server time
 * second argument is a key name at the process data, or just ms since 1970
 */
Utils.serverToUserTime = function (tick, fieldNameOrNumber) {

  // calculation example: if user on gmt+1 (eg spain)
  // userOffset would be 1
  // serverOffset is 3*60 = 180
  // so 4 server time, in user time would be 4 + 1 - 3 = 2  
  var serverOffset = -someDate.getTimezoneOffset();
  var timeToCalc = fieldNameOrNumber ? (typeof fieldNameOrNumber === "string" ? tick.process.data(fieldNameOrNumber) : fieldNameOrNumber) : Date.now();
  return timeToCalc +
    ((tick.process.data('lastWakeup') && tick.process.data('lastWakeup').time_zone_offset_ms) || 0) -
    serverOffset * 60000;
};

/**
 * user to server time
 * @param {*} tick 
 * @param {*} fieldNameOrNumber 
 */
Utils.userToServerTime = function (tick, fieldNameOrNumber) {
  var serverOffset = -someDate.getTimezoneOffset();
  var timeToCalc = fieldNameOrNumber ? (typeof fieldNameOrNumber === "string" ? tick.process.data(fieldNameOrNumber) : fieldNameOrNumber) : Date.now();
  return timeToCalc + serverOffset * 60000 // bring user time to UTC time
    -
    ((tick.process.data('lastWakeup') && tick.process.data('lastWakeup').time_zone_offset_ms) || 0);

};
/**
 * wrapping before templating
 */
Utils.wrapExpression = function (expression) {
  if (expression === 'undefined') {
    expression = undefined;
  }
  return "<%=" + expression + "%>";
};

/**
 * wrap in quotes if x is a string that is not a number, otherwise returns a number
 * @param {*} x 
 */
Utils.addQuotes = function (x) {
  if (typeof x === 'string' && Utils.safeIsNaN(x)) {
    return "'" + x + "'";
  } else if (!Utils.safeIsNaN(x)) {
    return parseFloat(x);
  } else if (x === "") {
    return "''";
  } else {
    return x;
  }
};

/**
 * converts snake to camel case
 * @param {*} s 
 */
Utils.snakeToCamel = function (s) {
  return s.replace(/(\-\w)/g, function (m) {
    return m[1].toUpperCase();
  });
};

/**
 * returns true if x is NaN, "", undefined, null, or boolean
 * @param {*} x 
 */
Utils.safeIsNaN = function (x) {
  return (isNaN(x) || x === "" || x === null || x === undefined || typeof x === "boolean" || typeof x === "object");
};

/***
 * this will be used in prompt generation
 */
Utils.formatDate = function (dateStr, year, weekday) {
  var date = new Date(dateStr);
  var options = {
    weekday: (!weekday) ? undefined : "long",
    year: (!year) ? undefined : "numeric",
    month: "short",
    day: "numeric"
  };


  return date.toLocaleDateString("en-us", options);
};

/**
 * return true if truthy OR 0
 * @param {*} value 
 */
Utils.isTruthyOr0 = function (value) {
  return value || value === 0;
};

/**
 * normalize phone number
 * @param {*} phone 
 */
Utils.normalizeNumber = function (phone) {

  if (!phone)
    return null;
  phone = phone.replace(/-/g, '');
  phone = phone.replace(/\+/g, '');
  phone = phone.replace(/\s+/g, '');
  if (phone.length === 10 && phone[0] !== '+')
    phone = "1" + phone;
  return "+" + phone;
};

/**
 * get array of argumanet names from function reference
 */
Utils.getArgumentNames = function (func) {
  var l = func.length;
  var strFunc = func.toString();
  strFunc = strFunc.substr(strFunc.indexOf('(') + 1)
  strFunc = strFunc.substr(0, strFunc.indexOf(')'));
  var args = strFunc === "" ? [] : strFunc.split(',');
  return args;
};

/**
 * 
 * @param {string} intent id
 * @return {Boolean} true if this intent represent a none - meaning, no intent was found by the NLU 
 */
Utils.isNone = function (value) {
  return value && value.toLowerCase() === 'none';
};
/**
 * idenify a cyclic object
 * @param {*} obj 
 */
Utils.isCyclic = function (obj) {
  var keys = [];
  var stack = [];
  var stackSet = new Set();
  var detected = false;

  function detect(obj, key) {
    if (obj && typeof obj != 'object') {
      return;
    }

    if (stackSet.has(obj)) { // it's cyclic! Print the object and its locations.
      var oldindex = stack.indexOf(obj);
      var l1 = keys.join('.') + '.' + key;
      var l2 = keys.slice(0, oldindex + 1).join('.');
      console.log('CIRCULAR: ' + l1 + ' = ' + l2 + ' = ', obj);
      console.log(obj);
      detected = true;
      return;
    }

    keys.push(key);
    stack.push(obj);
    stackSet.add(obj);
    for (var k in obj) { //dive on the object's children
      if (obj.hasOwnProperty(k)) {
        detect(obj[k], k);
      }
    }

    keys.pop();
    stack.pop();
    stackSet.delete(obj);
    return;
  }

  detect(obj, 'obj');
  return detected;
};




/**
 * use webshot to produce a jpg
 */
Utils.htmlToImg = function (htmlSnippet) {

  htmlSnippet = '<div id="htmlSnippet" style="width: ' + config.html2img.width + 'px; padding: 10px;">' + htmlSnippet + '</div>';

  var promise = new Promise(function (resolve, reject) {
    var img = crypto.randomBytes(12).toString('hex') + '.jpg';

    webshot(htmlSnippet, './' + config.html2img.generated_path + img, {
      quality: 200,
      //no need - phantomPath:process.cwd() + '/bin/phantomjs',
      captureSelector: '#htmlSnippet',
      defaultWhiteBackground: true,
      customCSS: config.html2img.custom_css,
      siteType: 'html'
    }, function (err) {
      if (!err) {
        console.log('htmlToImg - Image generated - ' + img);
        resolve(img);
      } else {
        reject(err);
      }
    });
  });

  return promise;
};

Utils.safeAdd = function (obj, key, val) {

  if (obj[key]) {
    // throw('key ' + key + ' already exists at object ' + obj);
  } else {
    obj[key] = val;
  }
};

/**
 * get the time of day toString
 * if we need a default
 * 
 */
Utils.timeOfDay = function (tick) {

  var timeOfDay = "";
  var hour = new Date(tick.process.data('lastUserTimestamp')).getHours();
  var min = new Date(tick.process.data('lastUserTimestamp')).getMinutes();
  var totalTime = hour + min / 60.0;
  if (totalTime >= 4 && totalTime <= 10.5) timeOfDay = "morning";
  else if (totalTime > 10.5 && totalTime <= 12.5) timeOfDay = "midmorning";
  else if (totalTime >= 12.5 && hour < 15) timeOfDay = "noon";
  else if (hour >= 15 && hour < 17) timeOfDay = "afternoon";
  else if (hour >= 17 && hour < 22) timeOfDay = "evening";
  else if (hour >= 22 && hour < 6) timeOfDay = "night";
  return timeOfDay;
};

Utils.getMsSinceMidnight = function (d) {
  var e = new Date(d);
  return d - e.setHours(0, 0, 0, 0);
};

/**
 * @param {string} path to fsm - fsm id in the form of <user id>/[drafts|fsms]/fsm name
 * @param {string} projectsDir - user id, project folder
 * @returns {any} an object with the different parts of the path of the fsm
 */
Utils.getPathInfo = (path, projectsDir) => {
  path = path.replace(/\\/g, '/'); //- lior added but could be removed after Netanel 's fixes 09052018
  const sections = path.split('/');
  if (sections.length == 5) {
    sections.splice(0, 2);
  }
  if (sections.length == 3) {
    return {
      convocode: Utils.CONVOCODE_DIR,
      projectsDir,
      state: sections[0],
      tree: sections[1],
      filename: sections[2]
    };
  } else {
    return {
      filename: sections[sections.length - 1]
    };
  }
};

/***
 * @param {any} pathObj
 * @returns {string} complete fsm id with path - in the form of <user id>/[drafts|fsms]/fsm name
 */
Utils.getTreeDir = (pathObj) => {
  const path = [];
  path.push(Utils.CONVOCODE_DIR);
  path.push(pathObj.projectsDir);
  path.push(pathObj.state);
  path.push(pathObj.tree);
  return path.join("/");
};

Utils.CONVOCODE_DIR = "./convocode";

/**
 * @param {Tick} tick
 * @param {BaseNode} node
 */
Utils.evalCondition = (tick, node) => {
  var data = node.alldata(tick);
  var left = node.properties.left;
  var operator = node.properties.operator;
  var right = node.properties.right;

  left = Utils.wrapExpression(left);
  right = Utils.wrapExpression(right);
  try {
    left = _.template(left)(data);
  } catch (ex) {
    left = 0;
  }
  try {
    right = _.template(right)(data);
  } catch (ex) {
    right = 0;
  }

  // fix a common error (especially for non-programmers)
  if (operator === '=') {
    operator = '===';
  }

  var result = false;

  left = Utils.addQuotes(left);
  right = Utils.addQuotes(right);
  result = eval(left + operator + right);

  var b3 = require('FSM/core/b3');
  if (result) {
    return b3.SUCCESS();
  } else {
    return b3.FAILURE();
  }
};

/***
 * evaluates a memory field against process datas
 * @param {Object} data - process data
 * @param {MemoryField} code - the field to evaluate
 */
Utils.evalMemoryField = function (data, code) {
  // eslint-disable-next-line no-unused-vars
  var require = {}; // deter malicious requires
  // eslint-disable-next-line no-unused-vars
  var fs = {}; // or popular file system access
  //  try {
  // eslint-disable-next-line no-unused-vars
  var global = data.global || {};
  // eslint-disable-next-line no-unused-vars
  var context = data.context || {};
  // eslint-disable-next-line no-unused-vars
  var message = data.message || {};
  // eslint-disable-next-line no-unused-vars
  var fsm = data.fsm || {};
  // eslint-disable-next-line no-unused-vars
  var process = data.process || {};
  // eslint-disable-next-line no-unused-vars
  var volatile = data.volatile || {};
  var value = eval("(" + code + ")");

  // } catch (err) {
  //   console.log(data, code);
  //   return;
  // }
  return value;

};