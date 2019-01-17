var b3 = require('FSM/core/b3');
var _ = require('underscore');
var Action = require('FSM/core/action');
var utils = require('utils/utils');

/**
 * 
 * sets context.timeOfDay field with an approximate time in the day - eg morning, afternoon etc
 * also, sets two global fields - datetimeString and speakTimeOfDay - with an english structure 
 * Language: en
 *  @memberof module:Actions
 */
class SetTimeOfDay extends Action {

  constructor(settings) {
    super();
    this.title = this.name = 'SetTimeOfDay';

    this.description = 'Sets a context.timeOfDay field with the current greeting time of day';
  }

  /**
   * Tick method.
   *
   * @private tick
   * @param {Tick} tick A tick instance.
   * @return {TickStatus} A state constant.
   **/
  tick(tick) {
    try {
      var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];


      var timeOfDay = "";
      var d = new Date();
      var hour = d.getHours();
      var min = d.getMinutes();
      var totalTime = hour + min / 60.0;
      if (totalTime >= 4 && totalTime <= 13.5) timeOfDay = "morning";
      else if (totalTime >= 12.5 && hour < 15) timeOfDay = "noon";
      else if (hour >= 15 && hour < 17) timeOfDay = "afternoon";
      else if (hour >= 17 && hour < 22) timeOfDay = "evening";
      else if (hour >= 22 && hour < 6) timeOfDay = "night";

      this.context(tick, "timeOfDay", timeOfDay);

      // calculate global date

      var day = days[d.getDay()];
      if (min < 10) {
        min = "0" + min;
      }
      var ampm = hour < 12 ? "am" : "pm";
      var date = d.getDate();
      var month = months[d.getMonth()];
      var year = d.getFullYear();

      var dateString = day + ", " + hour + ":" + min + ampm + " " + date + " " + month + " " + year;
      this.alldata(tick, 'global.datetimeString', dateString);
      this.alldata(tick, 'global.speakTimeOfDay', dateString);

      return b3.SUCCESS();
    } catch (err) {
      console.error(err);
      return b3.FAILURE();
    }
  }
}

module.exports = SetTimeOfDay;
