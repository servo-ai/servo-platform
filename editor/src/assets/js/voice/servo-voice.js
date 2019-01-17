var ServoVoice = (function () {
  var _inited;

  function ServoVoice() {}

  /**
   * 
   */
  ServoVoice.prototype.init = function (localServerBridge) {
    _inited = Promise.pending();
    var _this = this;
    this.bridge = localServerBridge || ServerBridge;
    this.bridge.register && this.bridge.register(configService.userId, configService.fsmId, this.onOpen, this.onMessage, this.onClose, configService.protocol);
    this.bridge.connect(configService.protocol).then(function () {
      Tts.init(_this).then(function () {
        Asr.init(_this);
        _inited.resolve();
      });

    })

  }

  /**
   * 
   */
  ServoVoice.prototype.asrEnded = ServoVoice.prototype.startSpeaking = function () {
    if (!this._voicePaused) {
      Tts.startSpeaking();
    }

  }

  ServoVoice.prototype.speechEnded = function () {}

  ServoVoice.prototype.stopListen = function () {
    Asr.stopListen();
  }
  /**
   * start listen
   */
  ServoVoice.prototype.startListen = function () {
    console.log('start listen');
    Asr.startListen();
  }

  /**
   * 
   */
  ServoVoice.prototype.deinit = function () {
    _inited.promise.then(function () {
      Asr.deinit();
      Tts.deinit();
    })

  }

  /**
   * send stuff from client to server
   * @param {*} message 
   */
  ServoVoice.prototype.send = function (message) {
    // if we are paused, only send uievents
    if (!this._voicePaused || (message.data && message.data.payload && message.data.payload.intentId === 'UIIntent')) {
      if (!this._messages) this._messages = {};
      var messages = this._messages;
      // if utterance message, send as-is
      if (message.data.utterance) {
        this.bridge.send(message);
        return;
      }
      message.data.payload = message.data.payload || {};
      message.payload = message.data.payload;
      // intentId: "UIIntent",
      // event: event.type,
      // entity: event.target.name,
      // value: event.target.value
      if (!message.data.payload) {
        this.bridge.send(message);
        return;
      }
      var prevMsg = this._messages[message.data.payload.event + ":" + message.data.payload.entity]
      if (prevMsg && prevMsg.value === message.data.payload.value) {
        return;
      } else {
        this.bridge.send(message);
        this._messages[message.data.payload.event + ":" + message.data.payload.entity] = message.data.payload.value;
      }
      // var similarMessage = messages.find(msg => (
      // 	message.data.payload.intentId == msg.data.payload.intentId &&
      // 	message.data.payload.event == msg.data.payload.event &&
      // 	message.data.payload.entity == msg.data.payload.entity
      // ));
      // if (!similarMessage) {
      // 	messages.push(message);
      // 	this.bridge.send(message);
      // } else if (similarMessage.data.payload.value !== message.data.payload.value) {
      // 	similarMessage.value = message.value;
      // 	this.bridge.send(message);
      // }
    }


  }

  /**
   * 
   */
  ServoVoice.prototype.onOpen = function () {
    console.log('onOpen', arguments);
  }

  ServoVoice.prototype.createUtteranceMessage = function (utterance) {
    var message = {
      protocol: "websocket",
      data: {
        useNLU: true,
        fsmId: configService.fsmId
      }
    };
    _.extend(message.data, {
      utterance: utterance
    })

    return message;
  }


  /**
   * restart
   */
  ServoVoice.prototype.restart = function () {
    console.log('restart', arguments);
    this._voicePaused = false;
    this.startListen();
    var msg = this.createUtteranceMessage('restart');
    this.send(msg);

  }

  /**
   * play
   */
  ServoVoice.prototype.continue = ServoVoice.prototype.play = function () {
    console.log('play/continue', arguments);
    this._voicePaused = false;
    this.startListen();
    // var msg = this.createUtteranceMessage('continue');
    // this.send(msg);
  }

  /**
   * pause
   */
  ServoVoice.prototype.stop = ServoVoice.prototype.pause = ServoVoice.prototype.paused = function () {
    console.log('pause', arguments);
    this._voicePaused = true;
    // var msg = this.createUtteranceMessage('stop');
    // this.send(msg);
  }

  /**
   * deal with server --> client incoming messages
   * @param {*} message 
   */
  ServoVoice.prototype.onMessage = function (message) {
    // if we are in pause start
    if (_this._voicePaused) {
      return;
    }

    _inited.promise.then(function () {
      switch (message.raw.command) {

        case 'ui':
          var uiEvent = new CustomEvent("uiEvent", {
            detail: message.raw
          });
          window.dispatchEvent(uiEvent);
          break;

        default:
        case 'speak':
          Tts.speak(message.text, message.raw.isAQuestion);
          break;

      }
      //console.log('message arrived for ' + configService.protocol, message);
    });

  }

  /**
   * disconnected
   * @param {*} message 
   */
  ServoVoice.prototype.onClose = function (message) {
    console.warn('server disconnected. reconnecting');
    _this.bridge.reconnect(configService.protocol);
  }

  _this = new ServoVoice();
  return _this;

})();
