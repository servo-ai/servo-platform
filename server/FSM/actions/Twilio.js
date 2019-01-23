// namespace:
var b3 = require('../core/b3');
var Action = require('../core/action');
var config = require('config');
var client = require('twilio');
var _ = require('underscore');
var dblogger = require('utils/dblogger');
var twilioClient;
/**
 * Send an SMS via Twilio
 * @memberof module:Actions
 **/
class Twilio extends Action {

  constructor(settings) {
    settings = settings || {};
    super();
    var accountSID = settings.accountSID || (config.twilio && config.twilio.ACCOUNT_SID);
    var authToken = settings.authToken || (config.twilio && config.twilio.AUTH_TOKEN);
    twilioClient = client(accountSID, authToken);

    this.title = this.name = 'Twilio';

    this.title = 'Send SMS via Twilio';
    /**
     * Node parameters
     * @property parameters
     * @type {Object}
     * @property {string} parameters.accountSID - twilio account credentials. if empty, takes from config.twilio.ACCOUNT_SID
     * @property {string} parameters.authToken- twilio account credentials. if empty, takes from config.twilio.AUTH_TOKEN
     * @prop {string} parameters.toNumber - number to which to send the sms 
     * @prop {string} parameters.fromNumber - number from which to send the sms
     * @prop {ExpressionString} parameters.prompt - message
     */
    this.parameters = {
      'accountSID': "",
      'authToken': ""
    };

  }

  /**
   * Tick method.
   *
   * @private
   * @param {Tick} tick A tick instance.
   * @return {TickStatus} A state constant.
   **/
  tick(tick) {

    if (!this.waitCode(tick)) {
      this.waitCode(tick, b3.RUNNING())
      var data = this.alldata(tick);
      var message = _.template(this.properties.prompt)(data);
      var toNumber = this.properties.toNumber || data.toNumber;
      var fromNumber = this.properties.fromNumber || data.fromNumber;
      var msg = {
        to: toNumber, // Any number Twilio can deliver to
        from: fromNumber, // A number you bought from Twilio and can use for outbound communication
        // body of the SMS message
        // if sent text dont send again, because we are here only due to several images
        body: message
      };

      //Send an SMS text message
      twilioClient.sendMessage(msg, (err, responseData) => { //this function is executed when a response is received from Twilio

        if (!err) { // "err" is an error received during the request, if any

          // "responseData" is a JavaScript object containing data received from Twilio.
          // A sample response from sending an SMS message is here (click "JSON" to see how the data appears in JavaScript):
          // http://www.twilio.com/docs/api/rest/sending-sms#example-1

          dblogger.log('twilio message sent', responseData.from, responseData.body.substring(0, 10) + '...'); // outputs "+14506667788" 'aslkasdjf'

          this.waitCode(tick, b3.SUCCESS())

        } else {
          dblogger.error('twilio message err', err, toNumber);
          this.waitCode(tick, b3.FAILURE())

        }
      });
    };

    return this.waitCode(tick);
  }
}
module.exports = Twilio;