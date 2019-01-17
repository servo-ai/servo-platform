var b3 = require('FSM/core/b3');
var Condition = require('FSM/core/condition');
var utils = require('utils/utils');
var _ = require('underscore');
var Tick = require('FSM/core/tick');
var statsManager = require('FSM/statsManager')

/**
 * This checks the time from the last run of the 
 *  convo with id
 * If TimeFromConvoLastRun parameter convoId is empty, it will calculate time from most recent convo
 */
class TimeFromConvoLastRun extends Condition {
  /**
   * @param {object} settings 
   */
  constructor(settings) {

    super();
    this.title = this.name = 'TimeFromConvoLastRun';

    this.parameters = {
      'timeInSeconds': 180,
      'convoId': ''
    };

    this.description = "This checks the time from the last run of the " +
      " convo with ID convoId" +
      " If TimeFromConvoLastRun parameter convoId is empty, it will calculate time from most recent convo. " +
      "It returns SUCCESS if time is smaller than timeInSeconds. NOTE: convoId must be in the first ScoreSelector ancestor.";
    settings = settings || {};
    if (utils.isEmpty(settings.timeInSeconds)) {
      console.error("TimeFromConvoLastRun parameter timeInSeconds is an obligatory parameter");
    }
    if (utils.isEmpty(settings.convoId)) {
      console.warn("If TimeFromConvoLastRun parameter convoId is empty, it will calculate time from most recent convo");
    }
  }


  /**
   * find the last ticked convo
   * @param {Tick} tick 
   */
  findLastConvo(tick, parent) {
    var contexts = parent.getContexts(tick);
    var lastTime = -Infinity;
    var mostRecent;
    _.each(contexts, (elem) => {
      if (elem.lastTime > lastTime) {
        mostRecent = elem;
      }
    });

    return mostRecent;
  }
  /**
   * search up the tree, until a score selector, then for the right convo
   */
  findTheConvo(node, tick) {
    var parentId = node.parentId;
    var nodes = tick.tree.nodes;
    var parent = nodes[parentId];
    var grandParentId;
    var tree = tick.tree;
    // if the parent is not here, then we need to use a new tree
    if (!parent) {
      var newTick = new Tick();
      tree = newTick.tree = node.parentTree;
      newTick.process = tick.process;
      newTick.depth = tick.depth;
      parent = newTick.tree.nodes[parentId];
      grandParentId = parent.parentId;
      tick = newTick;
    } else {
      grandParentId = parent.parentId;
    }

    // if parent is a (first) scoreSelector 
    // and this node is a descendent of a scorer,
    // or the parent is the root
    if (parent.name.indexOf('ScoreSelector') > -1 || !grandParentId) {
      // found! 
      var convoObj;
      if (!utils.isEmpty(this.properties.convoId)) {
        convoObj = statsManager.convoStatById(tick, this.properties.convoId, parent);
        if (!convoObj) {
          if (!grandParentId) {
            dblogger.error('convoId ' + this.properties.convoId + " not found at TimeFromConvoLastRun! for " + this.id + ":" + this.title)
            convoObj = {};
          } else {
            convoObj = this.findLastConvo(tick, parent);
          }

        }

      } else {
        convoObj = this.findLastConvo(tick, parent)
      }

      return {
        context: parent,
        convoObj: convoObj,
        tree: tree
      };
    } else {
      return this.findTheConvo(parent, tick);
    }
  }

  /**
   * adds the score after evaluating it
   * @param {object} tick 
   */
  tick(tick) {

    var data = this.data(tick);
    var textStr = this.properties.timeInSeconds.toString();
    var timeInSeconds = _.template(textStr)(data);
    timeInSeconds = parseInt(timeInSeconds);

    // now search up the tree, for the rgiht convo
    var ctxObj = this.findTheConvo(this, tick);
    // now see if its passed 
    var lastTime = ctxObj.context.lastTimeForConvo({
        tree: ctxObj.tree,
        process: tick.process
      } // pseudo-tick
      , ctxObj.convoObj.index);

    lastTime = utils.safeIsNaN(lastTime) ? 0 : lastTime;

    var passed = ((Date.now() - lastTime) / 1000) > timeInSeconds;
    return passed ? b3.SUCCESS() : b3.FAILURE();
  }


}


module.exports = TimeFromConvoLastRun;
