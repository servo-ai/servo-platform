var Tick = require('FSM/core/tick');
var b3 = require('FSM/core/b3');
var Composite = require('FSM/core/composite');
var _ = require('underscore');
var dblogger = require('utils/dblogger');
var fsmModel = require('models/fsmmodel');
var statsManager = require('FSM/statsManager');
var ContextManager = require('FSM/contextManager');

/**
 * This node runs the left child nodes (Scorers aka Controllers) , getting a score and index 
 * then uses the score to select a corresponing (by same index) on the right children (Executors aka Convos) 
 * It works in conjunction with the AddScore action. The AddScore look (up the tree) for the first ScoreSelector
 *  and update its score there. 
 * This allows nesting of ScoreSelectors - actors can addscores for higher contexts. ONLY SCORERS CAN USE sub-ScoreSelectors 
 * - those include other Scorers, and AddScore-only (usually) Executors
 * @memberof module:Composites
 */
class ScoreSelector extends Composite {

  constructor(settings) {
    settings = settings || {};

    super(settings);
    this.contextNode = true; // TODO: SEPARATE MEMORY PER CONTROLLER-EXECUTER PAIRS
    // this is a context node for the scoreres sub trees
    this.title = this.name = 'ScoreSelector';
    this.description = "This node runs the left child nodes (Scorers aka Controllers) , getting a score and index " +
      "then uses the score to select a corresponing (by same index) on the right children (Executors aka Convos) " +
      "It works in conjunction with the AddScore action. The AddScore look (up the tree) for the first ScoreSelector" +
      "  and update its score there. " +
      " This allows nesting of ScoreSelectors - actors can addscores for higher contexts. ONLY SCORERS CAN USE sub-ScoreSelectors " +
      " - those include other Scorers, and AddScore-only (usually) Executors";

    /**
     * Node parameters
     * @property parameters
     * @type {Object}
     * @property {boolean} parameters.runUntilAllDone - true: dont send success/ fail until all controllers AND convos
     * @property {string} parameters.stickyScore - how much to add to the score for the current context
     */
    this.parameters = _.extend(this.parameters, {
      //runUntilAllDone=true: dont send success/ fail until all controllers AND convos
      runUntilAllDone: false,
      // how much to add to the score for the current context
      stickyScore: 0.5

    });

    this.contextManager = new ContextManager(this);
  }

  /**
   * is this node a scorer
   * @param {Tick} tick 
   * @param {*} node 
   */
  isScorer(tick, node) {
    return this.scorerIndex(node.id) > -1;
  }

  /**
   * contextProperties overridable
   * @return {Array} empty array
   */
  contextProperties() {
    return [{}];
  }

  /**
   * Open method.
   *
   * @private open
   * @param {Tick} tick A tick instance.
   **/
  open(tick) {

    tick.process.set('selectedConvoIndex', -1, tick.tree.id, this.id);

    // default context
    this.contextManager.open(tick);

    this.resetScoring(tick);
  }

  /**
   * overridable
   * @param {Tick} tick 
   * @param {number} selectedConvoIndex 
   */
  setContextChild(tick, selectedConvoIndex) {
    dblogger.assert(selectedConvoIndex < this.children.length, 'index too hight');
    this.local(tick, 'selectedConvoIndex', selectedConvoIndex);
  }


  /**
   * reset all variables that deals with scoring
   * @param {Tick} tick 
   */
  resetScoring(tick) {
    // map to ids so not to save circular objects
    var scorerIds = _.map(this.children.slice(0, this.children.length / 2), function (item) {
      return item.id;
    });
    tick.process.set('scoreMap', {}, tick.tree.id, this.id);
    tick.process.set('scorersLeft', scorerIds, tick.tree.id, this.id);
    //tick.process.set('yieldRequested', false, tick.tree.id, this.id);
  }

  /**
   * returns the index of a scorer id, -1 if no such scorer
   * @param {string} id - a guid
   * @return {(number|-1)}
   */
  scorerIndex(id) {
    var index = -1;
    for (var i = 0; i < this.children.length / 2; i++) {
      if (this.children[i].id === id) {
        index = i;
      }
    }

    return index;
  }

  /**
   * return child index or -1
   * @param {string} id a guid
   * 
   * @return {(number|-1)}
   */
  childIndex(id) {

    var index = this.children.findIndex((elem) => {
      return elem.id === id;
    });

    return index;
  }

  /**
   * return the last time a convo with index was ticked
   * @param {Tick} tick 
   * @param {number} index 
   */
  lastTimeForConvo(tick, index) {
    var convo = statsManager.convoStat(tick, index, this);
    return (convo && convo.lastTime) || 0;
  }

  /**
   * return the scorer node affiliated with the index 
   * @param {number} index - index of a convo 
   */
  scorerFor(index) {
    var maxScorersIndex = this.children.length / 2;
    var indexScorer = index - maxScorersIndex;
    return this.children[indexScorer];
  }

  conversations() {
    return this.children.slice(this.children.length / 2, this.children.length);
  }

  controllers() {
    return this.children.slice(0, this.children.length / 2);
  }

  currentChildIndex(tick) {
    return this.local(tick, 'selectedConvoIndex');
  }

  currentContextChild(tick) {
    return this.children[this.local(tick, 'selectedConvoIndex')];
  }


  /**
   *  scorers are ticked  only 
   * if they are interrupters 
   * otherwise they are ticked only when there's no convo going on 
   * at the moment
   * @param {Object} tick 
   * @private
   */
  scorersLeft(tick) {
    // map from ids to nodes
    var scorersIdsLeft = tick.process.get('scorersLeft', tick.tree.id, this.id);
    var scorersLeft = _.map(scorersIdsLeft, (node_id) => {
      return tick.tree.nodes[node_id];
    })
    var selectedConvoIndex = tick.process.get('selectedConvoIndex', tick.tree.id, this.id);
    //var yieldRequested = tick.process.get('yieldRequested', tick.tree.id, this.id);

    // if a conversation is going on (we have a selected), and its a not a yield request time
    if (selectedConvoIndex > -1 /*&& !yieldRequested*/ ) {
      // only get interrupters that arent going on themselves
      var filteredScorers = scorersLeft.filter((scorer, index) => {
        return scorer && scorer.properties &&
          scorer.properties.interrupter /*&& selectedConvoIndex !== (index + this.children.length / 2)*/ ;
      });
      scorersLeft = filteredScorers;
    }

    return scorersLeft;
  }

  /**
   * Move to a new context - selectedConvoIndex
   * @param {Tick} tick 
   * @param {*} selectedConvoIndex 
   * @param {*} prevSelectedConvoIndex 
   * @private
   */
  switchContext(tick, selectedConvoIndex, prevSelectedConvoIndex, score) {
    var nc = this.contextManager.noContext(tick);
    let foundContexts = [_.extend(nc, {
      index: selectedConvoIndex,
      prevIndex: prevSelectedConvoIndex,
      score: score,
    })];
    return this.contextManager.switchContext(tick, foundContexts);
  }
  /**
   * Tick method.
   *
   * @private tick
   * @param {Tick} tick A tick instance.
   * @return {TickStatus} A state constant.
   * @private
   **/
  _scoreSelectorTick(tick) {
    // select a scorer (if there's a running scorer, it will only check interrupters)
    var selectedConvo = this._selectScorer(tick);
    if (selectedConvo.selectedConvoIndex < 0) {
      return selectedConvo.controllersStatus; // should be b3.running() until selected
    }

    var status = this.tickContextTree(tick, selectedConvo.selectedConvoIndex);
    // we can return success only if all convos and controllers have finished running
    return status;
  }

  /**
   * @return {<Array>} array of convos
   */
  contextChildren() {
    return this.children.map((elem, index) => {
      return index >= this.children.length / 2;
    });
  }


  /**
   * select the highest scorer if any
   * @param {Tick} tick
   * @private 
   */
  _selectScorer(tick) {
    var atLeastOneGood = false,
      status = b3.SUCCESS(); // we never return FAILURE from the controllers. only Error if all are errored
    // if we are on the scoring
    var selectedConvoIndex = tick.process.get('selectedConvoIndex', tick.tree.id, this.id);

    // scorers left brings the only interrupters, if we already chose a maxscorer 
    var scorersLeft = this.scorersLeft(tick);

    var doneIndexes = [];
    _.each(scorersLeft, (scorer) => {
      var state_i = scorer._execute(tick);
      // // its enough that one succeeded 
      // if (state_i===b3.FAILURE()) {
      //     this.set(tick,'status',state_i);
      // }\
      atLeastOneGood = (state_i !== b3.ERROR() && state_i !== b3.FAILURE()) || atLeastOneGood;
      if (state_i === b3.RUNNING()) {
        runningCount++;
        status = b3.RUNNING(); // we return running until no one runs
      } else {
        // save the finished scorers
        var sindex = scorersLeft.indexOf(scorer);
        doneIndexes.push(sindex);
      }
    });
    // remove those done
    var remainScoresIds = scorersLeft.filter(function (item, index) {
      return (doneIndexes.indexOf(index) === -1);
    });

    var remainScores = remainScoresIds.map(function (item, index) {
      return item.id;
    });
    // finish the ones that are done
    tick.process.set('scorersLeft', remainScores, tick.tree.id, this.id);

    status = (atLeastOneGood && b3.SUCCESS()) || status; // if one was ok, give a success, otherwise the last error status (error or fail)

    // do not proceed until all scorers finished
    if (remainScores.length > 0) {
      return {
        selectedConvoIndex: selectedConvoIndex,
        controllersStatus: b3.RUNNING()
      };
    } else { // all finished
      // find max scorer
      var maxScoreNodeId, maxScore = 0; //-Infinity;
      var scoreMap = tick.process.get('scoreMap', tick.tree.id, this.id);

      // now we are suppose to have a score per each scorer
      for (var id in scoreMap) {
        var score = scoreMap[id];
        // console.log('-------------- score', score, id);
        // console.log('selectedConvoIndex:', selectedConvoIndex, selectedConvoIndex > -1 && this.scorerFor(selectedConvoIndex).id);
        // console.log(this.properties.stickyScore)
        if (selectedConvoIndex > -1 && this.scorerFor(selectedConvoIndex).id === id) {
          // add a score if we are the current index
          score += (this.properties.stickyScore || 0.5);
        }

        if (score > maxScore) {
          maxScore = score;
          maxScoreNodeId = id;
        }
      }
      // reset all scoring variables
      this.resetScoring(tick);
      // if no new scorer found
      if (!maxScoreNodeId) {
        // return currect convo / -1
        return {
          selectedConvoIndex: selectedConvoIndex,
          controllersStatus: status
        };
      }
      var maxScorerIndex = this.scorerIndex(maxScoreNodeId);

      // find the convo
      var prevSelectedConvoIndex = tick.process.get('selectedConvoIndex', tick.tree.id, this.id);
      selectedConvoIndex = maxScorerIndex + this.children.length / 2;

      // if we have a context switch
      if (selectedConvoIndex !== prevSelectedConvoIndex) {

        this.switchContext(tick, selectedConvoIndex, prevSelectedConvoIndex, maxScore);
      }

      tick.process.set('selectedConvoIndex', selectedConvoIndex || -1, tick.tree.id, this.id);

      return {
        selectedConvoIndex: selectedConvoIndex,
        controllersStatus: status
      };
    }



  }

  /**
   * try to run a scorer
   * @param {Tick} tick 
   * @param {*} selectedConvoIndex 
   * return 
   */
  _runScorer(tick, selectedConvoIndex, controllersStatus) {
    // we have a max scorer
    if (selectedConvoIndex > -1) {

      var status = this.tickContextTree(tick, selectedConvoIndex);

      // if we have a selection, it means scorers arent running any more 
      dblogger.assert('selectedConvoIndex>-1 should mean that all controllers finished', controllersStatus !== b3.RUNNING());
      // runUntilAllDone - so here we cannot send success/fail until all controllers AND convos
      return this.properties.runUntilAllDone ? b3.RUNNING() : status;
    } else {
      // if no selection of a convo, return the controllers status.
      return controllersStatus;
      // success will return ONLY if no more controllers to run
    }
  }

  /**
   * 
   * @param {Tick} tick
   * @private 
   */
  tick(tick) {
    return this._scoreSelectorTick(tick);
  }

  /**
   * tick the context subtree
   * @param {Tick} tick 
   * @param {*} childIndex 
   */
  tickContextTree(tick, childIndex) {
    var selected = this.contextChildren()[childIndex];

    var status = selected._execute(tick);
    if (status !== b3.RUNNING()) {
      // if more contextFrames, this selector is still not done
      if (this.contextManager.switchToPrevContext(tick)) {
        this._enter(tick); // simulate entry so THIS node wont be closed!
        status = b3.RUNNING();
      } else {
        this.contextManager.returnContextToParent(tick);
      }
    }

    return status;
  }

  /**
   * pop last context, set a new selected convo, close and re-open
   * return true if there are more contexts
   */
  popContext(tick, selectedConvoIndex) {
    return this.contextManager.popContext(tick, selectedConvoIndex);
  }

  /** 
   * set a flag to evaluate another controller but the one running now 
   * @private
   * */
  requestYield(tick, request = true) {
    tick.process.set('yieldRequested', request, tick.tree.id, this.id);
  }

  /**
   * 
   * @param {Tick} tick 
   * @param {TickStatus} status 
   */
  close(tick, status) {
    this.contextManager.close(tick, status);
  }


  /**
   * getter based on scorer for selectconvo
   * @param {*} selectedConvoIndex 
   */
  newContextShouldReplaceOld(selectedConvoIndex) {
    return selectedConvoIndex != -1 ? this.scorerFor(selectedConvoIndex).properties["takeOverContext"] : false;
  }



  /**
   * get the context array
   * @param {Tick} tick 
   */
  getContexts(tick) {
    return this.contextManager.getContexts(tick);
  }


}


module.exports = ScoreSelector;
