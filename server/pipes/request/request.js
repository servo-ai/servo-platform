var origRequest = require('request');
var _test;
var _cb = {};
var _waitForCB = {};
var _responses = {};

/**
 * requestPipe supports testing for simple, callack-based GET requests
 * TODO: support all request verbs
 */
var requestPipe = function() {
    if (!_test) {
        return origRequest.apply(this,arguments);
    } else {
        var requestId = arguments[0];
        // store the callback
        _cb[requestId] = arguments[1];
        // if we flushed and are waiting for CB
        if ( _waitForCB[requestId] ) {
            setTimeout(function() {
                // call this callback now with the right response
                _cb[requestId](null,null,_responses[requestId]);
                // reset it for subsequent callbacks
                 _cb[requestId] = _waitForCB[requestId] = false;
            },100);
           
            
        }    
    }
   
}

/**
 * save the test condition
 */
requestPipe.init = function(options) {
    _test = options && options.test;
}

/**
 * set the response
 */
requestPipe.setResponse = function(response,requestId) {
    _responses[requestId] = response;
    
}

/**
 * now flush it
 */
requestPipe.flush = function(requestId) {
    if (!_test) 
        throw "flush can only be called on test mode";
    
    // if a call backfor this url hasnt been set yet
    if (!_cb[requestId]) {
        // raise a flag to wait for it
        _waitForCB[requestId] = true;
    } else {
        setTimeout(function() {
            // call the callback for this url
            _cb[requestId](null,null,_responses[requestId]);
             // make sure subsequent flush doesnt use this callback. we need to have a request before calling _cb again
              _waitForCB[requestId] = _cb[requestId] = null; 
      },100)
      
    }   
}

module.exports = requestPipe;

