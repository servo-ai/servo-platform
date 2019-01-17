var config = require("../config");
var Promise = require('promise');
var dblogger = require("../utils/dblogger.js");
var fs = require('fs');
var utils = require('../utils/utils')
var _ = require('underscore')
var cacheFactory = require('models/cache-factory');


// use a cache with 10 min expiration so we dont have to read from the disk
var _htmlCache = cacheFactory.createCache({
  stdTTL: 600
});


function htmlModel() {};
module.exports = htmlModel;

htmlModel.get = function (filename, folderName) {

  var promise = new Promise(function (resolve, reject) {
    var file = (folderName.indexOf("convocode") > -1 ?
        "" :
        "convocode/" + config.convocode.id + "/fsms/") +
      folderName + '/images/' + filename;

    let value = _htmlCache.get(file, true);
    if (value) {
      resolve(value);
    } else {

      // ENOTFOUND: Key not found
      fs.readFile(file, function (err, data) {
        if (err) {
          var error = 'error in reading from file ' + file + ' folder ' + folderName + ': ' + err;


          dblogger.error(error);
          reject(error);
        } else {
          data = data.toString();

          _htmlCache.set(file, data);
          resolve(data);
        }
      });
    }

  });

  return promise;
}


/***
 * render the image
 * @param process
 * @param ret
 * @return {Promise}
 */
htmlModel.renderImage = function (tick, key, html, node) {

  var data = node.alldata(tick);
  var promise = new Promise(function (resolve, reject) {
    // if we have a data collection object, iterate it
    var imageDataArray = node.imageDataArrayName() ? node.alldata(tick, node.imageDataArrayName()) : [{}];
    dblogger.assert(imageDataArray, "no image data array for " + node.imageDataArrayName());
    var countImages = 0;
    var images = data.context.images || {};

    _.each(imageDataArray, (imgData) => {
      data = _.extend(data, imgData)
      // compile
      var htmlCompiled = _.template(html)(data);
      // cnvert
      utils.htmlToImg(htmlCompiled).then(function (img) {
        // put in process images object
        let imgUrl = "https://" + config.serverBaseDomain + "/" +
          config.html2img.generated_url_path + img;

        // key is the index in the image collection
        var key = imageDataArray.length > 1 ? countImages : key;

        images[key] = imgUrl;
        if (++countImages >= imageDataArray.length) {
          node.context(tick, 'images', images);
          resolve();
        }
      }).catch(function (err) {
        dblogger.error('Error in converting html to image. html=' + key +
          ' ' + tick.process.summary() + ' ' + err);
        reject('Error in converting html to image. html=' + key +
          ' ' + tick.process.summary() + ' ' + err);
      });

    })
  });
  return promise;
}
