var events = require('events');
var Rx = require('rxjs/Rx');

function FsmEventEmitter() {
  events.EventEmitter.call(this);
  this.messagePublisher = new Rx.Subject();
  this.messageSent = function (messageObj, process) {
    this.messagePublisher.next(messageObj);

    this.emit('messageSent', messageObj, process);
  }

  this.messageReceived = function (messageObj, process) {
    this.emit('messageReceived', messageObj, process);
  }

  this.processStarted = function (process) {
    this.emit('processStarted', process);
  }
}

FsmEventEmitter.prototype.__proto__ = events.EventEmitter.prototype;

var fsmEventEmitter;
if (!fsmEventEmitter) {
  fsmEventEmitter = new FsmEventEmitter();
}

module.exports = fsmEventEmitter;
