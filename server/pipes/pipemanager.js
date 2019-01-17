var PipeManager = {};
module.exports = PipeManager;

/***
 * get them pipes
 */
PipeManager.getPipe = function (pipe, options) {
  if (!pipe) {
    throw "PipeManager cannot get pipe. wrong language in fsm properties?";
  }
  pipeObj = require('./' + pipe + '/' + pipe);
  if (typeof options !== 'undefined' && options) {
    if (["wit", "luis-strong", "alexa", "rasa-nlu"].indexOf(pipe.toLowerCase()) != -1) {
      return new pipeObj(options);
    } else {
      pipeObj.init(options);
      return pipeObj;
    }
  }
  return pipeObj;
};

/***
 * for testing - arrange the response
 */
PipeManager.setResponse = function (pipe, response, url) {
  pipe = require('./' + pipe + '/' + pipe);
  pipe.setResponse(response, url);

  return pipe;
};

/***
 * for testing - flush the request
 */
PipeManager.flush = function (pipe, requestUrl) {
  pipe = require('./' + pipe + '/' + pipe);
  if (!pipe || !requestUrl) {
    throw " pipe or requestUrl invalid at PipeManager.flush"
  }
  pipe.flush(requestUrl);
}
