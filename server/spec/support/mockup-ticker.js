var Ticker = require('FSM/ticker');
var _tickerInst = null;
class MockupTicker extends Ticker {


  constructor() {
    super();
  }

  timeout(pid, cb) {
    var tid = setTimeout(cb);
    this.setTimeoutCache(pid, 0, tid, cb);
  }

  static getInst() {
    if (!_tickerInst) {
      _tickerInst = new MockupTicker();
    }
    return _tickerInst;
  }

}

module.exports = MockupTicker;
