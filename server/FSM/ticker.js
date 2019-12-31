var cacheFactory = require('models/cache-factory');
var _ = require('underscore');
var dblogger = require('utils/dblogger');

const MAX_CYCLE = 1200000;
const MIN_CYCLE = 200;
const DECELERATION = 1.10;

// singleton 
var _tickerInst;


/**
 * manages the ticks per process
 */
class Ticker {

  constructor() {
    /**
     * cache for cycles
     * @member Ticker#
     */
    this.cycleCache = cacheFactory.createCache({
      stdTTL: 0
    });

    this.timeoutCache = cacheFactory.createCache({
      stdTTL: 0
    });

  }
  /**
   * sets a cycle to this process id
   * @param {string} pid 
   * @param {number} val 
   */
  start(pid, val = MIN_CYCLE) {
    this.cycle(pid, val);

    return this.cycle(pid, val);
  }

  /**
   * stops a pid cycle now
   * @param {string} pid 
   */
  stop(pid) {
    this.cycleCache.del(pid);
    var timeout = this.timeoutCache.get(pid);
    dblogger.assert(timeout, "no timeout object for pid " + pid);
    timeout && clearTimeout(timeout.tid);
    this.timeoutCache.del(pid);
    return !!timeout;
  }

  /**
   * is this process ticking
   * @param {*} pid 
   */
  isTicking(pid) {
    return !!this.timeoutCache.get(pid);
  }

  /**
   * gets/sets a cycle length
   * @param {string} pid 
   * @param {number=} val 
   */
  cycle(pid, val) {
    if (val) {
      this.cycleCache.set(pid, val);
    } else {
      return this.cycleCache.get(pid);
    }
  }

  /**
   * change a cycle length
   * @param {string} pid 
   */
  adjust(pid) {

    var cycle = this.cycle(pid);
    cycle *= DECELERATION;
    cycle = cycle > MAX_CYCLE ? MAX_CYCLE : cycle;
    cycle = cycle < MIN_CYCLE ? MIN_CYCLE : cycle;
    dblogger.assert(cycle >= MIN_CYCLE, "timeout too small for pid " + pid);
    // Change the cycle now
    this.cycle(pid, cycle);

  }

  setTimeoutCache(pid, nextCycle, tid, cb) {
    this.timeoutCache.set(pid, {
      cycle: nextCycle,
      tid: tid,
      at: Date.now() + nextCycle,
      cb: cb
    });
  }

  /**
   * starts a timeout for a callback function
   * @param {string} pid 
   * @param {Function} cb 
   */
  timeout(pid, cb, breakIn = false) {
    // get the next cycle
    var nextCycle1 = this.cycle(pid);
    var timeout = this.timeoutCache.get(pid);
    if (timeout) {
      var nextCycle = timeout.at - Date.now();
    }

    // set it only if it's there
    if (nextCycle1) {
      var tid = setTimeout(cb, nextCycle || nextCycle1, breakIn);
      if (!breakIn) {
        this.setTimeoutCache(pid, nextCycle1, tid, cb);
      }

    }
  }

  /**
   * executes the timeout for pid now
   * @param {string} pid 
   */
  breakIn(pid) {
    var timeout = this.timeoutCache.get(pid);

    if (timeout) {
      // timeout cleared. it is expected that timeout.cb() will re-initiate timeout execution
      clearTimeout(timeout.tid);
      // sets a minimum default value
      this.start(pid);
      // and timeout again
      this.timeout(pid, timeout.cb, true);
    }


  }

  static getInst() {
    if (!_tickerInst) {
      _tickerInst = new Ticker();
    }
    return _tickerInst;
  }
}
module.exports = Ticker;