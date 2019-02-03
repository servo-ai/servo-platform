var config = require('config');
var express = require('express');
var router = express.Router();
var ChatDriverInterface = require("./chat-driver-interface");
var utils = require('../utils/utils');
var clientFunc = require('twilio'); // the node_modules/twilio
var _ = require('underscore');
var dblogger = require('../utils/dblogger');
var MessageModel = require("../models/message-model");
var _clients = {};



let _inst = null;
/**
 * twilio channel
 * 
 */
class TwilioDriver extends ChatDriverInterface {

    /**
     * get instance for singleton operation
     */
    static getInst() {
        if (!_inst) {
            _inst = new TwilioDriver();
        }
        return _inst;
    }

    pidPrefix() {
        return 'twil';
    }

    TwilioDriver() {

    }

    channelName() {
        return "twilio";
    }

    /**
     * return a message object
     * @param {*} data 
     * @param {*} fsmId 
     */
    createMessageObject(data, fsmId) {

        let mo = new MessageModel({
            id: data.To,
            channel: 'twilio'
        }, {
            id: data.From,
            channel: 'twilio'
        }, 'twilio', data.Body, 'twilio', fsmId, data);
        return mo;
    }


    start(fsm) {

        if (fsm.properties && fsm.properties.channels && fsm.properties.channels.includes("twilio")) {
            // fb bot must have access token and validationToken
            var twilioOptions = fsm.properties.twilio;
            if (!twilioOptions) {
                dblogger.error('twilioOptions field is required to work a twilio messenger bot!', fsm.id);
            } else if (_.isEmpty(twilioOptions.ACCOUNT_SID)) {
                dblogger.error('No ACCOUNT_SID for fsm ' + fsm.id);
            } else if (_.isEmpty(twilioOptions.AUTH_TOKEN)) {
                dblogger.error('No access token for twilio messenger. FSM is ' + fsm.id);
            } else {
                _clients[fsm.path] = clientFunc(twilioOptions && twilioOptions.ACCOUNT_SID, twilioOptions && twilioOptions.AUTH_TOKEN);

                this.listenPost(fsm);
            }
        }
    }


    /**
     * 
     * @param {*} message 
     * @param {*} tree 
     * @param {*} node 
     * @param {*} process 
     */
    sendMessage(response, toId, tree, node, process) {

        let fromNumber = process.properties()["twilio"]['fromNumber'];
        let toNumber = process.customer.id;
        let messageData = {};
        response.view = response.view || response.payload || "";
        var promise = new Promise((resolve, reject) => {

            if (!_.isEmpty(response.view)) {
                messageData.view = response.view;
            } else if (node.properties.facebook) {
                messageData = node.properties.facebook;
            }

            if (messageData.view && typeof messageData.view != "object") {
                messageData.view = JSON.parse(messageData.view);
            }
            let mediaUrl = undefined;
            // adhere to Facebook format
            if (messageData.view && messageData.view.payload && messageData.view.payload.elements && messageData.view.payload.elements.length) {
                mediaUrl = messageData.view.payload.elements[0]["image_url"];
            }
            // override with twilio-specific format
            if (messageData.view && messageData.view.mediaUrl) {
                mediaUrl = messageData.view.mediaUrl;
            }

            var text = response.text || "";
            var msg = {
                to: toNumber, // Any number Twilio can deliver to
                from: fromNumber, // A number you bought from Twilio and can use for outbound communication
                body: text
            };
            if (mediaUrl) {
                msg.mediaUrl = mediaUrl;
            }

            //Send an SMS text message
            try {
                _clients[process.fsm_id].sendMessage(msg, (err, responseData) => { //this function is executed when a response is received from Twilio

                    if (!err) { // "err" is an error received during the request, if any

                        // "responseData" is a JavaScript object containing data received from Twilio.
                        // A sample response from sending an SMS message is here (click "JSON" to see how the data appears in JavaScript):
                        // http://www.twilio.com/docs/api/rest/sending-sms#example-1

                        dblogger.log('twilio message sent', responseData.from, responseData.body.substring(0, 10) + '...'); // outputs "+14506667788" 'aslkasdjf'

                        resolve({
                            text: msg
                        });

                    } else {
                        dblogger.error('twilio message err', err.message + ' ' + err.moreInfo, toNumber);
                        reject(err);
                    }
                });
            } catch (err) {
                dblogger.error("twillio.sendMessage", err);
                reject(err);
            }



        });

        return promise;

    }
}
module.exports = TwilioDriver;