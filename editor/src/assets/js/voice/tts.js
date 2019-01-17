function Tts() {}
var _mid = 0;
Tts.init = function (manager) {

	this.manager = manager;
	this.messages = [];
	var _this = this;
	return new Promise(function (resolve) {
		_this.voices = window.speechSynthesis.getVoices();
		console.log(_this.voices);

		function tryVoices() {
			_this.voices = window.speechSynthesis.getVoices();
			if (_this.voices.length) {
				resolve();
			} else {
				setTimeout(tryVoices, 200);
			}
			console.log(_this.voices)
		}
		setTimeout(tryVoices, 200);
	});

}
/***
 * handle one message
 */
Tts.handleMessage = function () {
	var _this = this;
	// take last message
	var msg = this.messages[this.messages.length - 1];
	// if no more, return
	if (!msg) {
		_this.manager.speechEnded();
		return;
	}
	var isAQuestion = msg.isAQuestion
	/**
	 * on error
	 * @param {*} msg 
	 */
	var onerror = function (msg) {
		console.error(msg)
	}
	/**
	 * var end of message
	 */
	var onend = function () {
		console.log('end', msg.mid, msg.text, Date.now() - msg.timeStart, 'isAQuestion:' + isAQuestion);

		let msg1 = _this.messages.shift();
		// debug
		console.log('end1 should equal end', msg1);

		setTimeout(function () {
			if (isAQuestion) {
				_this.manager.startListen();
			} else { // on isAQuestion we need to wait until a response is 
				_this.handleMessage();
			}

		}, 50);
	}

	msg.onend = onend;
	msg.timeStart = Date.now();
	msg.mid = _mid++;
	msg.onerror = onerror;
	console.log('start', msg.mid, msg.text);
	window.speechSynthesis.speak(msg);
}




/**
 * 
 */
Tts.startSpeaking = function () {
	var _this = this;

	// Queue this utterance
	let msg = _this.messages.pop()
	if (msg) {
		this.handleMessage(msg);
	}
}


/***
 * 
 */
Tts.speak = function (text, isAQuestion) {

	// close listening so it wont hear us
	this.manager.stopListen();

	var msg = new SpeechSynthesisUtterance();

	var voices = this.voices.filter(function (voice) {
		return voice.name === 'Google UK English Female';
	});
	msg.voice = voices[0];
	// Set the text.
	msg.text = text;

	// Set the attributes.
	msg.volume = 1.0;
	msg.rate = 1.0;
	msg.pitch = 1.0;
	msg.isAQuestion = isAQuestion;
	var _this = this;
	this.messages.push(msg);
	//this.startSpeaking();
	this.handleMessage();

}




Tts.deinit = function () {
	this.messages = [];
}