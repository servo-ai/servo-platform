var b3 = require('FSM/core/b3');
var Condition = require('FSM/core/condition');
var utils = require('utils/utils');
var statsManager = require('FSM/statsManager')
var dblogger = require('utils/dblogger');

class DailyQuotaCondition extends Condition {

  constructor(settings) {
    super();
    this.title = this.name = 'DailyQuotaCondition';


    this.parameters = {
      'convoId': '',
      'maxCount': 0
    };
    this.description = "Return SUCCESS if count of conversations today (starting 12AM, user time)," +
      " for convo whose Tree node has convoId (that is under first ScoreSelector ancestor) equal to or greater than maxCount, FAILURE otherwise.";
    settings = settings || {};
    if (!settings || (settings && utils.isEmpty(settings.state))) {
      console.error("state parameter in State condition is an obligatory parameter");
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

    var ctxObj = this.findScoreSelector(this, tick);

    if (ctxObj) {
      var myScoreSelector = ctxObj.context;
      var myScorerRoot = ctxObj.scorer;
      dblogger.assert(myScorerRoot.child && myScorerRoot.child.id, "Scorer must have a child since its a treeNode ");

      var eventsToday = statsManager.eventsToday(tick, this.properties.convoId, myScoreSelector)
      return eventsToday.length >= this.properties.maxCount ? b3.FAILURE() : b3.SUCCESS();
    } else return b3.FAILURE();

  }
}

module.exports = DailyQuotaCondition;
