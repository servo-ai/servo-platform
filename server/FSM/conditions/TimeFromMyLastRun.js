var b3 = require('FSM/core/b3');
var Condition = require('FSM/core/condition');
var utils = require('utils/utils');
var _ = require('underscore');
var Tick = require('FSM/core/tick');
/**
 * This checks the time from the last run of the 
 * controller or convo this node is in
 */
class TimeFromMyLastRun extends Condition {
  /**
   * @param {object} settings 
   */
  constructor(settings) {

    super();
    this.title = this.name = 'TimeFromMyLastRun';

    this.parameters = {
      'timeInSeconds': 180
    };

    this.description = "Works with a scoreSelector parents, and checks the time from the last run of the convo this node is in. " +
      "If this node is in a controller, it will check the time from the last run of its appropriate convo. " +
      "It returns SUCCESS if time is smaller than timeInSeconds. ";
    settings = settings || {};
    if (utils.isEmpty(settings.timeInSeconds)) {
      console.error("TimeFromMyLastRun parameter timeInSeconds is an obligatory parameter");
    }
  }

  /**
   * search the tree up for a contextId
   */
  findScoreSelector(node, tick) {
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
      // return the conversation index
      var isChildAScorer = parent.isScorer(tick, node);
      let convoIndex = parent.childIndex(node.id);
      if (isChildAScorer) {
        convoIndex += parent.children.length / 2;
      }
      return {
        context: parent,
        index: convoIndex,
        tree: tree
      };
    } else {
      return this.findScoreSelector(parent, tick);
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

    // now search up the tree
    var ctxObj = this.findScoreSelector(this, tick);
    // now see if its passed 
    var lastTime = ctxObj.context.lastTimeForConvo({
      tree: ctxObj.tree,
      process: tick.process
    }, ctxObj.index);
    var passed = ((Date.now() - lastTime) / 1000) > timeInSeconds;
    return passed ? b3.SUCCESS() : b3.FAILURE();
  }


}


module.exports = TimeFromMyLastRun;
