var b3 = require('FSM/core/b3');
var Condition = require('FSM/core/condition');
var Utils = require('utils/utils');

class TimeOfDayCondition extends Condition {

  constructor(settings) {
    super();
    this.title = this.name = 'TimeOfDayCondition';

    /**
     * Node parameters.
     *
     * @property parameters
     * @type {Object}
     **/
    this.parameters = {
      'timeOfDay': ''
    };

    var TIMES_OF_DAY = ["morning", "midmorning", "noon", "afternoon", "evening", "night"];

    settings = settings || {};
    if (Utils.isEmpty(settings.timeOfDay) || TIMES_OF_DAY.indexOf(settings.timeOfDay) == -1) {
      console.error("timeOfDay parameter in Time Of Day condition is an obligatory parameter and can have one of the following options: " + TIMES_OF_DAY.join(", "));
    }
  }

  /**
   * Tick method.
   *
   * @private tick
   * @param {Tick} tick A tick instance.
   * @return {Constant} A state constant.
   **/
  tick(tick) {
    var data = this.data(tick);

    var timeOfDay = "";
    var userTimeMs = Utils.serverToUserTime(tick, 'lastUserTimestamp');
    var hour = new Date(userTimeMs).getHours();
    var min = new Date(userTimeMs).getMinutes();

    var totalTime = hour + min / 60.0;
    if (totalTime >= 4 && totalTime <= 10.5)
      timeOfDay = "morning";
    else if (totalTime > 10.5 && totalTime <= 12.5)
      timeOfDay = "midmorning";
    else if (totalTime >= 12.5 && hour < 15)
      timeOfDay = "noon";
    else if (hour >= 15 && hour < 17)
      timeOfDay = "afternoon";
    else if (hour >= 17 && hour < 22)
      timeOfDay = "evening";
    else if (hour >= 22 && hour < 6)
      timeOfDay = "night";

    if (timeOfDay === this.properties.timeOfDay)
      return b3.SUCCESS();
    else return b3.FAILURE();
  }
}

module.exports = TimeOfDayCondition;
