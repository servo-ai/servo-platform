var _readOnly;
var config = require("../config");


/***
 * a base model for all models
 * @constructor
 */
function BaseModel() {
  _readOnly = false;
};


/**
 * set the readOnly function
 * @param r
 * @return {*}
 */
BaseModel.readOnly = function (r) {

  if (!arguments.length) {
    return _readOnly;
  } else return _readOnly = r;
};

module.exports = BaseModel;
