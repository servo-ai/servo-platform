var ChatDriverInterface = require("./chat-driver-interface");
var utils = require('../utils/utils');
var _ = require('underscore');
var dblogger = require('../utils/dblogger');


// it is a singleton
let _inst = null;
/**
 * Post channel
 * 
 */
class RestPost extends ChatDriverInterface {

    /**
     * ctor
     * @param {string} channelName 
     */
    constructor(channelName = "rest-post") {
        super();
        this.theChannelName = channelName;
    }

    channelName() {
        return this.theChannelName;
    }

    static getInst() {
        if (!_inst) {
            _inst = new RestPost();
        }
        return _inst;
    }
    /**
     * 
     * @param {Object} fsm 
     * @param {string} channelName 
     * @param {string} processLinkId 
     */
    start(fsm) {

        super.listenPost(fsm);
    }


}

module.exports = RestPost;