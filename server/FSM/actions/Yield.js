var b3 = require('FSM/core/b3');
var _ = require('underscore');
var Action = require('FSM/core/action');
var utils = require('utils/utils');
var Tick = require('FSM/core/tick');
var dblogger = require('utils/dblogger');

class Yield extends Action {

  constructor(settings) {
    super();
    this.title = this.name = 'Yield';

    this.parameters = {};
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
      newTick.depth = tick.depth;
      parent = newTick.tree.nodes[parentId];
      grandParentId = parent.parentId;
      tick = newTick;
    } else {
      grandParentId = parent.parentId;
    }

    //var isChildAScorer = parent.name==='ScoreSelector' && parent.isScorer(tick,node);
    // if parent is a (first) scoreSelector 
    // or the parent is the root
    if (parent.name === 'ScoreSelector' || !grandParentId) {
      // found! 
      return {
        context: parent,
        scorer: node,
        tree: tree,
        tick: tick
      };
    } else {
      return this.findScoreSelector(parent, tick);
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
    try {

      // find last context and pop context, allowing for different controller to take place
      var context = this.findScoreSelector(this, tick);

      var ScoreSelectorNode = context.context;
      ScoreSelectorNode.popContext(context.tick, context.index);
      return b3.SUCCESS();
    } catch (err) {
      dblogger.error(err);
      return b3.FAILURE();
    }
  }
}

module.exports = Yield;
