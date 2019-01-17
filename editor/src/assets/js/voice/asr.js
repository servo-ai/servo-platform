function Asr() {}

function formatCurrentTime() {
  var d = new Date();
  return d.toISOString();
}

Asr.init = function (manager) {
  this.recognition = new webkitSpeechRecognition(); //That is the object that will manage our whole recognition process. 
  this.recognition.continuous = false; //Suitable for dictation. 
  this.recognition.interimResults = true; //If we want to start receiving results even if they are not final.
  //Define some more additional parameters for the recognition:
  this.recognition.lang = 'en-US';
  this.recognition.maxAlternatives = 1; //Since from our experience, the highest result is really the best...
  this.manager = manager;
  this.lastStartedAt = this.autorestartCount = 0;
  this.interimTimeoutHandle = undefined;
  this.running = false;
  this.recognition.onaudiostart = function () {
    Asr.sendRecordingStatus(true);
  }
  this.recognition.onaudioend = function () {
    Asr.sendRecordingStatus(false);
  }
}

/***
 * restgarting asr
 */
Asr.restartListen = function (reason) {
  var _this = this;
  console.log('restartListen');
  // play nicely with the browser, and never restart annyang automatically more than once per second
  var timeSinceLastStart = new Date().getTime() - _this.lastStartedAt;
  _this.autorestartCount += 1;
  if (_this.autorestartCount % 10 === 0) {
    console.warn('Speech Recognition is repeatedly stopping and starting.maybe you have two windows with speech recognition open?');
    if (reason === 'network') {
      alert('A network error occured. Please reconnect and refresh the browser');
    }
  }

  if (timeSinceLastStart < 1000) {
    setTimeout(function () {
      Asr.startListen();
    }, 1000 - timeSinceLastStart);
  } else {
    Asr.startListen();
  }
}

/***
 * send to server and stop recognition
 */
Asr.sendTranscript = function (transcript) {
  var _this = this;
  _this.transcript = transcript;
  var message = {
    protocol: 'websocket',
    data: {
      utterance: _this.transcript,
      useNLU: true,
      fsmId: configService.fsmId,
	  userId: configService.userId
    }
  }
  ServoVoice.send(message);
  Asr.stopListen();

  // clear the interim timeout
  clearTimeout(_this.interimTimeoutHandle);
}

/***
 * send transcript for the UI
 */
Asr.sendTranscriptEvent = function (eventType, transcript) {

  var uiEvent = new CustomEvent("uiEvent", {
    detail: {
      event: 'transcript',
      value: transcript,
      entity: eventType
    }
  });
  console.log('transcript ' + eventType, transcript);
  window.dispatchEvent(uiEvent);
}

/**
 * send the recording status for visual
 * @param {*} status 
 */
Asr.sendRecordingStatus = function (status) {
  var uiEvent = new CustomEvent("uiEvent", {
    detail: {
      event: 'recordingStatus',
      value: status
    }
  });

  window.dispatchEvent(uiEvent);
}

/****
 * start running
 */
Asr.startListen = function () {

  var _this = this;
  var autorestart = configService.autoListenRestart;
  if (this.running) {
    Asr.stopListen();
  }
  this.running = true;

  /**
   * get the texts in onresult
   */
  this.recognition.onresult = function (event) { //the event holds the results
    //Yay – we have results! Let’s check if they are defined and if final or not:
    if (typeof (event.results) === 'undefined') { //Something is wrong…
      console.warn('we have an undefined result')
      Asr.restartListen();
      return;
    }

    for (var i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) { //Final results

        Asr.sendTranscript(event.results[i][0].transcript);
        Asr.sendTranscriptEvent('final', event.results[i][0].transcript)

      } else { //i.e. interim...
        _this.transcript = event.results[i][0].transcript;
        Asr.sendTranscriptEvent('interim', event.results[i][0].transcript);

        // restart wait
        clearTimeout(_this.interimTimeoutHandle);
        // wait to make sure we are going to get final
        _this.interimTimeoutHandle = setTimeout(function () {
          if (_this.transcript) {
            Asr.sendTranscript(_this.transcript);
          }
        }, configService.interimTimeout || 7500)
      }
    }

  };


  /**
   * finished something for some reason
   */
  this.recognition.onend = function (ev) {
    console.log(formatCurrentTime(), 'recognition.onend', ev);

    // this is not needed since we get it when we got final results.
    if (_this.running) {
      if (_this.transcript) {
        Asr.sendTranscript(_this.transcript);
      }
      Asr.restartListen();
    }
  }

  /**
   * error on recognition
   */
  this.recognition.onerror = function (event) {
    console.error('recognition error', event);
    switch (event.error) {
      case 'network':
        autorestart = false;
        Asr.restartListen();

        break;
      case 'not-allowed':
      case 'service-not-allowed':
        autorestart = false;
        alert('A permission error occured. Please clean browser cache and restart');
        break;
      case 'no-speech':
        Asr.restartListen();
    }
  }
  // // set timeout
  // var interimTimeoutHandle = setTimeout(function () {
  // 	if (autorestart) {
  // 		// start
  // 		_this.recognition.start();
  // 	} else {

  // 		_this.manager.listenTimeout(_this.transcript);
  // 	}

  // }, configService.listenTimeout)
  // start
  _this.lastStartedAt = new Date().getTime();

  Asr.invokeEvent({
    raw: {
      command: 'startListen'
    }
  });
  try {
    _this.recognition.start();
  } catch (ex) {
    console.warn(ex);
  }

}

/***
 * notify other parts
 */
Asr.invokeEvent = function (message) {
  //console.log(formatCurrentTime(), 'event', message.raw)
  var uiEvent = new CustomEvent("uiEvent", {
    detail: message.raw
  });
  window.dispatchEvent(uiEvent);

}

/**
 * stop the 
 */
Asr.deinit = function () {

}

/**
 * 
 */
Asr.stopListen = function () {
  console.log('stop listen')
  //Asr.sendRecordingStatus(false);
  Asr.invokeEvent({
    raw: {
      command: 'stopListen'
    }
  });
  this.recognition && this.recognition.stop();
  this.running = false;
  this.manager.asrEnded();
  this.transcript = '';
}
