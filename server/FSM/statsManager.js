var b3 = require('FSM/core/b3');
var utils = require('utils/utils');
var dblogger = require('utils/dblogger');

const MAX_EVENTS = 99;

class StatsManager {

  /**
   * convoEvents is an object with an entry per scoreSelector, which is an object with  an entry per convo id
   * @param {Tick} tick 
   * @param {BaseNode} node
   */
  nodeConvoEvents(tick, node) {
    convoEvents = node.global(tick, 'convoEvents');
    convoEvents = convoEvents || {};
    convoEvents[node.id] = convoEvents[node.id] || {};
    return convoEvents[node.id];
  }

  /**
   * save openTime
   * @param {Tick} tick 
   * @param {BaseNode} ctxManagerNode 
   */
  openContext(tick, ctxManagerNode) {
    // fill in a convoStats if never did
    var convoStats = ctxManagerNode.local(tick, 'convoStats') || [];
    if (!convoStats.length) {
      for (var i = 0; i < ctxManagerNode.contextChildren().length; i++) {
        if (!ctxManagerNode.contextChildren()[i]) {
          dblogger.error('no contextChildren() here', i, ctxManagerNode.summary(tick));
        }
        convoStats.push({
          index: i,
          name: ctxManagerNode.contextChildren()[i].name,
          id: ctxManagerNode.contextChildren()[i].id,
          lastTime: 0
        })
      }
      ctxManagerNode.local(tick, 'convoStats', convoStats);
    }

    var executors = ctxManagerNode.contextChildren();
    var convoEvents = ctxManagerNode.global(tick, 'convoEvents');
    convoEvents = convoEvents || {};

    if (!convoEvents[ctxManagerNode.id]) {
      convoEvents[ctxManagerNode.id] = {};

      for (var i = 0; i < executors.length; i++) {
        convoEvents[ctxManagerNode.id][executors[i].id] = {
          openTime: Date.now(),
          accessTime: Date.now(),
          events: []
        }
      }
    } else {
      for (var i = 0; i < executors.length; i++) {
        if (convoEvents[ctxManagerNode.id][executors[i].id]) {
          convoEvents[ctxManagerNode.id][executors[i].id].accessTime =
            convoEvents[ctxManagerNode.id][executors[i].id].openTime = Date.now();
        }
      }
    }

    ctxManagerNode.global(tick, 'convoEvents', convoEvents);

  }

  /**
   * closes context
   * @param {Tick} tick 
   * @param {BaseNode} ctxManagerNode 
   */
  closeContext(tick, ctxManagerNode) {

  }

  /**
   * set the last run
   */
  setLastRun(tick, selectedConvoIndex, node) {
    var convo = this.convoStat(tick, selectedConvoIndex, node);
    convo = convo || {};
    convo.lastTime = Date.now();
    // update both global and context (ScoreSelector's context itself)
    node.local(tick, 'lastConvoRan', convo);
    node.global(tick, 'lastConvoRan', convo);
  }


  /**
   * get the object by name
   */
  convoStatById(tick, convoId, node) {
    var convoTreeIndex = node.contextChildren().findIndex((elem) => {
      elem.id === convoId;
    });

    if (!convoTreeIndex) {
      return undefined;
    }

    var convo = this.convoStat(tick, convoTreeIndex, node)

    return {
      convo: convo,
      index: convoTreeIndex
    };
  }

  /**
   * get the object by name
   */
  convoStatByName(tick, convoName, node) {
    var convoTreeIndex = node.contextChildren().findIndex((elem) => {
      elem.name === convoName;
    });

    if (!convoTreeIndex) {
      return undefined;
    }

    var convo = this.convoStat(tick, convoTreeIndex, node)

    return {
      convo: convo,
      index: convoTreeIndex
    };
  }
  /**
   * 
   * @param {Tick} tick 
   * @param {*} convoIndex 
   */
  convoStat(tick, convoIndex, node) {
    var convos = this.getConvoStats(tick, node);
    var convo = convos && convos.find((elem) => {
      return (elem.index === convoIndex);
    });
    return convo;
  }

  getConvoStats(tick, node) {
    return tick.process.get('convoStats', tick.tree.id, node.id);
  }

  /**
   * return the last time a convo with index was ticked
   * @param {Tick} tick 
   * @param {*} index 
   */
  lastTimeForConvo(tick, index, node) {
    var convo = this.convoStat(tick, index, node);
    return (convo && convo.lastTime) || 0;
  }

  /**
   * log  about the last conversation
   */
  addConversationStart(tick, convoIndex, node) {
    try {
      // save this event 
      var prevCount = (node.global(tick, 'lastConversationStart') &&
        node.global(tick, 'lastConversationStart').count) || 0;
      var thisEntry = {
        time: Date.now(),
        count: prevCount + 1,
        conversationId: (node.contextChildren()[convoIndex])["id"]
      }

      node.global(tick, 'lastConversationStart', thisEntry);

      // Now add it into a list of events
      // TODO: save all separately in the DB
      // TODO: read get only last X days into the process
      var convoEvents = node.global(tick, 'convoEvents');
      dblogger.assert(convoEvents, "need to call openContext to initiate convoEvents");

      // if a child was added, we need to re-open
      if (!convoEvents[node.id][node.contextChildren()[convoIndex].id]) {
        convoEvents[node.id][node.contextChildren()[convoIndex].id] = {
          openTime: Date.now(),
          accessTime: Date.now(),
          events: []
        };
      }

      convoEvents[node.id][node.contextChildren()[convoIndex].id].events.push({
        startTime: Date.now()
      });
      if (convoEvents[node.id][node.contextChildren()[convoIndex].id].events.length > MAX_EVENTS) {
        convoEvents[node.id][node.contextChildren()[convoIndex].id].events.unshift();
      }

      node.global(tick, 'convoEvents', convoEvents);

    } catch (ex) {
      dblogger.error("addConversationStart" + ex.message);
    }
  }

  /*
      get the convo events of today
  */
  eventsToday(tick, convoName, scoreSelector) {

    var nodeConvoEvents = scoreSelector.global(tick, 'convoEvents')[scoreSelector.id];

    if (!nodeConvoEvents || !nodeConvoEvents[convoName]) {
      return 0;
    }
    //var lastWakeup = node.global(tick,'lastWakeup');
    //var timeOffsetMs = lastWakeup.time_zone_offset_ms;

    // now loop until the last not-today entry
    var userTimeNow = new Date(utils.serverToUserTime(tick));
    //var userMsSinceMidnight = Utils.getMsSinceMidnight(userTimeNow)
    var userMidnightMs = userTimeNow.setHours(0, 0, 0, 0);
    //midnightMs = userMidnightMs + timeOffsetMs;
    //var msSinceMidnight = userMsSinceMidnight - timeOffsetMs;

    var eventsToday = [];
    for (var i = nodeConvoEvents[convoName].events.length; i >= 1; i--) {
      var event = nodeConvoEvents[convoName].events[i - 1];

      var userStartTimeMs = utils.serverToUserTime(tick, event.startTime);

      if (userMidnightMs < userStartTimeMs) {
        eventsToday.push(event);
      }
    }

    return eventsToday;
  }

}

module.exports = new StatsManager();
