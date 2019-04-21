var ChatDriverInterface = require("./chat-driver-interface");
var utils = require('../utils/utils');
var _ = require('underscore');
var dblogger = require('../utils/dblogger');
var processModel = require('../models/processmodel');


// it is a singleton
let _inst = null;
/**
 * Post channel
 * 
 */
class PostDriver extends ChatDriverInterface {

    /**
     * ctor
     * @param {string} channelName 
     */
    constructor(channelName) {
        super();
        this.theChannelName = channelName;
    }

    channelName() {
        return this.theChannelName;
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

    processRequest(req, res, fsm) {
        var messageObject = this.createMessageObject(req.body, fsm.id);
        messageObject.intentId = req.body.intentId;
        messageObject.processLinkId = req.body.processLinkId;
        for (let ettName in req.body.entities) {
            messageObject.addEntity(ettName, req.body.entities[ettName]);
        }

        // find process with link id
        this.getCreateProcessByLinkId(messageObject, fsm).then(() => {
            res.send('received and processed message with ' + req.body.processLinkId);
        }).catch((err) => {
            res.error(err);
        });
    }

    getCreateProcessByLinkId(messageObj, fsm) {
        return new Promise((resolve, reject) => {
            processModel.getByKey("link_id", messageObj.processLinkId).then((pid) => {
                return super.getCreateProcessAndMessage(messageObj, pid, fsm);
            }).catch((err) => {
                if (err === 0) {
                    dblogger.error('getByKey("link_id"' + messageObj.processLinkId);
                    reject('cannot get a process with this process Link Id:' + messageObj.processLinkId);
                } else {
                    dblogger.error('getByKey("link_id"' + messageObj.processLinkId + err);
                    reject('error when getting process Link Id:' + messageObj.processLinkId + err);

                }
            });

        });
    }
}

module.exports = PostDriver;