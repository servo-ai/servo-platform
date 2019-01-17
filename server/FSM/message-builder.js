var config = require("../config");
var viewModel = require("../models/view-model.js");
var htmlModel = require("../models/html-model.js");
var Promise = require('promise');
var dblogger = require("../utils/dblogger.js");
var _ = require('underscore');
var utils = require("../utils/utils");
var fsmModel = require('../models/fsmmodel');

function messageBuilder() {};
module.exports = messageBuilder;


/***
 * process the image/html/htmlImages entry
 */
function processImages(tick, node) {
  var process = tick.process;

  var folderName = fsmModel.getFSMSync(process.fsm_id, tick.process.userId).folderName;
  var imgPromise = new Promise(function (imgsResolve, imgsReject) {
    // take all the htmls and convert them to images
    var htmlImages = node.images();
    if (!htmlImages) {
      imgsResolve();
    } else {
      var data = node.alldata(tick);
      var htmls = Array.isArray(htmlImages) ? htmlImages : [{
        "status-0": htmlImages
      }];
      var imagesCount = htmls.length;

      _.each(htmls, function (htmlImage) {
        var arrOfPair = _.pairs(htmlImage);
        if (!arrOfPair[0]) {
          imgsReject("error at htmlImages at state " + node.name);
        };
        var imgKey = arrOfPair[0][0];
        var html = arrOfPair[0][1];

        if (typeof html === 'object') {
          if (data.fsm['defaultLang']) {
            if (html[data.fsm.defaultLang]) {
              html = html[data.fsm.defaultLang];
            } else {
              let firstLang = _.keys(html)[0];
              html = html[firstLang];
              dblogger.warn('WARNING: No images found in user\'s language: ' + data.fsm.defaultLang + ". showing: " + firstLang + ". -" + node.id + "-" + tick.process.summary());
            }
          }
        }
        // if its a file, load it
        if (html.charAt(0) !== '<') {
          htmlModel.get(html, folderName).then(function (htmlContents) {

            htmlModel.renderImage(tick, imgKey, htmlContents, node).then(function () {
              if (--imagesCount <= 0) {
                imgsResolve();
              }
            }).catch(function (ex) {
              dblogger.error('error in render images', ex);
              if (--imagesCount <= 0) {
                imgsResolve();
              }
            });
          }).catch((ex) => {
            dblogger.error('htmlModel.get failed:', ex);
          });
        } else {
          // if the html is inline refer to it by index and state
          htmlModel.renderImage(tick, imgKey, html, node).then(function () {
            imgsResolve();
          }).catch(function (ex) {
            dblogger.error('when rendering', ex);
            if (--imagesCount <= 0) {
              imgsResolve();
            }
          });
        }

      });
    }
  });
  return imgPromise;
}

/**
 * 
 * @param {Tick} tick 
 * @param {string} fieldName 
 * @param {Object} data 
 * @param {BaseNode} node 
 */
messageBuilder.calcPrompt = function (tick, fieldName, data, node) {
  // get the prompt from the properties
  var prompt = node.prompt(fieldName);
  let globalLang = tick.process.properties()["defaultLang"];
  // if object of multi-lingual prompt, choose the correct lang
  if (typeof prompt === 'object' && !_.isArray(prompt)) {

    if (globalLang) {
      if (prompt[globalLang]) {
        prompt = prompt[globalLang];
      } else {
        let firstLang = _.keys(prompt)[0];
        prompt = prompt[firstLang];
        dblogger.warn('WARNING: No prompt found in user\'s language: ' + globalLang + ". showing: " + firstLang + ". -" + node.id + "-" + tick.process.summary());
      }
    }
  }

  // if array of prompts, choose a cyclic prompt
  if (prompt && _.isArray(prompt)) {
    let promptCounter = node.local(tick, 'promptCounter');
    if (promptCounter === undefined) {
      promptCounter = 0;
    }
    let length = prompt.length;
    prompt = prompt[promptCounter];
    if (node.properties.cyclePrompts) {
      promptCounter = (promptCounter + 1) % length;
    } else {
      promptCounter = Math.min((promptCounter + 1), length - 1);
    }
    node.local(tick, 'promptCounter', promptCounter);
  }
  // if the prompt() is an object, fine, stringify it
  if (typeof prompt === 'object' && prompt !== null) {
    prompt = JSON.stringify(prompt);
  }

  return prompt;

};

/**
 * evaluate the template
 * @param {Tick} tick
 * @param {string} fieldName
 * @param {BaseNode} node
 * @return {Promise}
 */
messageBuilder.build = function (tick, fieldName, node) {
  var process = tick.process;
  var folderName = fsmModel.getFSMSync(process.fsm_id, process.userId).folderName;

  var data = node.alldata(tick);
  var ret = {};

  var promise = new Promise(function (resolve, reject) {
    try {

      // if there's a message
      if (node.prompt(fieldName) && node.prompt(fieldName).length !== 0) {
        // if the prompt() is an object, fine, stringify it
        let prompt = messageBuilder.calcPrompt(tick, fieldName, data, node);

        try {
          ret.text = _.template(prompt)(data);
        } catch (err) {
          dblogger.error('ERROR IN prompt template  ' + node.id + "-" + tick.process.summary(), err);
          reject('ERROR IN prompt template  ' + node.id + "-" + tick.process.summary() + err);
        }
        if (ret.text) {
          ret.text = ret.text.trim();
        } else {
          ret.text = "";
        }
        // and then re-parse
        if (typeof prompt === 'object' && prompt !== null) {
          ret.text = JSON.parse(ret.text);
        }
      }

      // once images are there in the process, compile the view
      processImages(tick, node).then(function () {
        var payload = node.volatile(tick, "payload");
        node.volatile(tick, "payload", null);
        var updatedData = node.alldata(tick);

        var viewObj = node.view();
        if (payload && (typeof payload !== 'object')) {
          var payloadData = payload;
          try {
            payloadData = _.template(payload)(data);
          } catch (err) {
            dblogger.error('ERROR IN payload template  ' + node.id + "-" + tick.process.summary(), err);
            reject('ERROR IN payload template  ' + node.id + "-" + tick.process.summary() + err);
          }
          ret.payload = payloadData;
          resolve(ret);
        } else if (viewObj) {
          var viewFilename = "";
          if (_.isObject(viewObj)) {
            if (data.fsm.defaultLang) {
              if (viewObj[data.fsm.defaultLang]) {
                viewFilename = viewObj[data.fsm.defaultLang];
              } else {
                let firstLang = _.keys(viewObj)[0];
                viewFilename = viewObj[firstLang];
                dblogger.warn('WARNING: No view found in user\'s language: ' + data.fsm.defaultLang + ". showing: " + firstLang + ". -" + node.id + "-" + tick.process.summary());
              }

            }
          } else if (_.isString(viewObj)) {
            viewFilename = viewObj;
          } else {
            dblogger.error('ERROR: View field is not well formmatted  ' + node.id + "-" + tick.process.summary());
            return reject('ERROR: View field is not well formmatted  ' + node.id + "-" + tick.process.summary());
          }
          if (typeof viewFilename === 'string') {
            viewModel.get(viewFilename, folderName).then(function (viewData) {
              try {
                viewData = _.template(viewData)(updatedData);
                //viewData = viewData.replace(/"/g,"'");
              } catch (err) {
                dblogger.error('ERROR IN view template  ' + node.id + "-" + tick.process.summary(), err);
                reject('ERROR IN view template  ' + node.id + "-" + tick.process.summary() + err);
              }

              ret.payload = viewData;
              resolve(ret);

            }).catch((ex) => {
              dblogger.error('viewModel.get failed:', ex);
            });
          } else {
            try {
              var viewData = JSON.stringify(viewFilename);

              viewData = _.template(viewData)(updatedData);
              //viewData = viewData.replace(/"/g,"'");
            } catch (err) {
              dblogger.error('ERROR IN view template  ' + node.id + "-" + tick.process.summary(), err);
              reject('ERROR IN view template  ' + node.id + "-" + tick.process.summary() + err);
            }

            ret.payload = viewData;
            resolve(ret);
          }

        }
        // else if (node.payload()) {
        //     var payloadData = node.payload();
        //     try {
        //         payloadData = _.template(node.payload())(data);
        //     } catch (err) {
        //         dblogger.error('ERROR IN payload template  ' + node.id + "-" + tick.process.summary(), err);
        //         return reject('ERROR IN payload template  ' + node.id + "-" + tick.process.summary() + err);
        //     }
        //     ret.payload = payloadData;
        //     resolve(ret);
        // } 
        else {
          resolve(ret);
        }

      }).catch(function (e) {
        dblogger.error('ERROR IN processImages  ' + node.id + "-" + tick.process.summary(), e);
        reject('ERROR IN processImages  ' + node.id + ":" + e + "-" + tick.process.summary());
      });;

    } catch (e) {
      dblogger.error('ERROR IN PROMPT for node ' + node.id + "-" + tick.process.summary(), e);
      reject('ERROR IN PROMPT:' + node.id + "-" + tick.process.summary() + e);
    }




  });

  return promise;
}
