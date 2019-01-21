var b3 = require('FSM/core/b3');
var Condition = require('FSM/core/condition');
var utils = require('utils/utils');
var dblogger = require('utils/dblogger');

/**
 * Returns success if SERVER timezone is equal to the timeOfDay from properties, failure otherwise
 * @memberof module:Conditions
 */
class GreetingTimeOfDayCondition extends Condition {
  /**
   * Node name. Default to ``.
   *
   * @property name
   * @type {String}
   * @readonly
   **/
  constructor(settings) {
    super();
    this.title = this.name = 'GreetingTimeOfDayCondition';
    this.description = "Returns success if SERVER timezone is equal to the timeOfDay from properties, failure otherwise";
    /**
     * Node parameters.
     *
     * @property parameters
     * @type {Object}
     * @property {string} parameters.timeOfDay - ["morning", "afternoon", "evening", "night"]
     **/
    this.parameters = {
      'timeOfDay': ''
    };

    var TIMES_OF_DAY = ["morning", "afternoon", "evening", "night"];

    settings = settings || {};
    if (utils.isEmpty(settings.timeOfDay) || TIMES_OF_DAY.indexOf(settings.timeOfDay) == -1) {
      console.error("timeOfDay parameter in Time Of Day condition is an obligatory parameter and can have one of the following options: " + TIMES_OF_DAY.join(", "));
    }
  }

  /**
   * Tick method.
   *
   * @private
   * @param {Tick} tick A tick instance.
   * @return {Constant} A state constant.
   **/
  tick(tick) {
    var data = this.alldata(tick);
    // time_zone_offset - in minutes
    // TODO: normalize time based on user timezone
    var timeOfDay = "";
    var hour = new Date().getHours();
    var min = new Date().getMinutes();
    var totalTime = hour + min / 60.0;
    if (totalTime >= 4 && totalTime < 12) timeOfDay = "morning";
    else if (totalTime >= 12 && totalTime < 17) timeOfDay = "afternoon";
    else if (hour >= 17 && hour < 21) timeOfDay = "evening";
    else timeOfDay = "night";

    if (timeOfDay.toLowerCase() === this.properties.timeOfDay.toLowerCase())
      return b3.SUCCESS();
    else return b3.FAILURE();
  }
}

module.exports = GreetingTimeOfDayCondition;
