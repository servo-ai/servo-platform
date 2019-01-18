var config = require('../config');
var utils = require('../utils/utils');
var client = require('twilio')(config.twilio.ACCOUNT_SID, config.twilio.AUTH_TOKEN);
var Promise = require('promise');

var dblogger = require('../utils/dblogger');
var Twilio = function () {
};
module.exports = Twilio;

/**
 * sendMessage
 * @param message
 * @param toNumber
 */
Twilio.sendMessage = function (message, fromNumber, toNumber, htmlSnippet) {
    var promise = new Promise(function (resolve, reject) {
        var textSentOnce = false;
        var sendMessage = function (imgURL) {
            var msg = {
                to: toNumber, // Any number Twilio can deliver to
                from: fromNumber, // A number you bought from Twilio and can use for outbound communication
                // body of the SMS message
                // if sent text dont send again, because we are here only due to several images
                body: textSentOnce?'-':message 
            };

            if (imgURL) {
                msg.mediaUrl = imgURL;
            }
            //Send an SMS text message
            client.sendMessage(msg, function (err, responseData) { //this function is executed when a response is received from Twilio

                if (!err) { // "err" is an error received during the request, if any

                    // "responseData" is a JavaScript object containing data received from Twilio.
                    // A sample response from sending an SMS message is here (click "JSON" to see how the data appears in JavaScript):
                    // http://www.twilio.com/docs/api/rest/sending-sms#example-1

                    dblogger.log('twilio message sent', responseData.from, responseData.body.substring(0, 10) + '...'); // outputs "+14506667788" 'aslkasdjf'

                    resolve({text:message});

                }
                else {
                    dblogger.error('twilio message err', err, toNumber);
                    reject(err);
                }
            });
        };

        if (images) {
            _.each(images,function(imgUrl) {
                sendMessage(imgUrl);
                textSentOnce = true;
            });

        } else {
            sendMessage('');
        }

    });

    return promise;

};