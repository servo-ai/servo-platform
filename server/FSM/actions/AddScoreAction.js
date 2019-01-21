var dblogger = require('utils/dblogger');
var b3 = require('FSM/core/b3');
var Action = require('FSM/core/action');
var utils = require('utils/utils');
var _ = require('underscore');
var Tick = require('FSM/core/tick');
/**
 *
 * Actions leaf nodes are were the action happens. 
 * The actions are used for read/write operations and interacting with the user 
 * @module Actions 
 * */

/**
 * AddScoreAction sets a defined score at 
 * the nearest ScoreSelector node ancestor
 * @private
 */
class AddScoreAction extends Action {


  constructor(settings) {

    super();
    this.title = this.name = 'AddScoreAction';
    /** 
     * Node parameters
     * @property parameters
     * @type {Object}
     * @property  {ExpressionString} parameters.score an expression setting the score to add
     *  
     */
    this.parameters = _.extend(this.parameters, {
      'score': 0.5
    });

    settings = settings || {};
    if (settings.score === undefined) {
      console.error("score parameter in AddScore action is an obligatory parameter");
    }

    this.description = "This action sets a pre-determined score at the nearest ScoreSelector ancestor";

  }

  /**
   * search the tree up for a contextId
   * @private
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
      newTick.depth = tick.depth;
      parent = newTick.tree.nodes[parentId];
      grandParentId = parent.parentId;
      tick = newTick;
    } else {
      grandParentId = parent.parentId;
    }

    var isChildAScorer = parent.name.indexOf('ScoreSelector') > -1 && parent.isScorer(tick, node);
    // if parent is a (first) scoreSelector 
    // and this node is a descendent of a scorer,
    // or the parent is the root
    if (isChildAScorer || !grandParentId) {
      // found! 
      return {
        context: parent,
        scorer: node,
        tree: tree
      };
    } else {
      return this.findScoreSelector(parent, tick);
    }
  }

  /**
   * adds the score after evaluating it
   * @param {Tick} tick 
   * @private
   */
  tick(tick) {

    var data = this.alldata(tick);
    var textStr = this.properties.score.toString();
    var scoreValue = _.template(textStr)(data);
    scoreValue = parseFloat(scoreValue);
    // now search up the tree
    var ctxObj = this.findScoreSelector(this, tick);
    // add the score to the right place
    var scoreSelector = ctxObj.context;

    var scoreMap = tick.process.get('scoreMap', ctxObj.tree.id, scoreSelector.id);
    if (scoreSelector.name.indexOf('ScoreSelector') === -1 || !scoreMap) {
      dblogger.error('no ScoreSelector above this ' + this.name + ". Node Id:" + this.id)
      return b3.FAILURE();
    } else {
      // store value by the child id
      scoreMap[ctxObj.scorer.id] = scoreMap[ctxObj.scorer.id] || 0.0;
      scoreMap[ctxObj.scorer.id] += scoreValue;

      return b3.SUCCESS();
    }

  }


}


module.exports = AddScoreAction;