var ServerBridge = (function () {
	var _uniqueId = null;
	var local = {};
	var service = {
		connect: connect,
		send: send,
		disconnect: disconnect,
		isConnected: isConnected,
		register: register,
		setProcessId: setProcessId,
		processId: processId,
		protocolHandshaking: protocolHandshaking,
		protocolConnected: protocolConnected,
		disconnectProtocol: disconnectProtocol,
		reconnect: reconnect
	};
	return service;


	function setProcessId(processId) {
		local.processId = processId;
	}

	function createUUID() {
		var s = [];
		var hexDigits = '0123456789abcdef';
		for (var i = 0; i < 36; i++) {
			s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
		}
		// bits 12-15 of the time_hi_and_version field to 0010
		s[14] = '4';

		// bits 6-7 of the clock_seq_hi_and_reserved to 01
		s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);

		s[8] = s[13] = s[18] = s[23] = '-';

		var uuid = s.join('');
		return uuid;
	}

	function processId() {
		_uniqueId = _uniqueId || 'voice-' + createUUID();
		return _uniqueId;
	}
	/**
	 * send the object (or push in a q until there's a connection)
	 * @param {Object} message 
	 */
	function send(message) {
		if (protocolConnected(message.protocol) ||
			(isConnected() && message.command === 'handshake')) {
			message.data = message.data || {};
			message.data.processId = message.data.processId || processId();
			message.data.userId = message.data.userId  || local.clients[message.protocol].userId;
			message = JSON.stringify(message);
			//console.log('comm send', message);
			local && local.ws && local.ws.send(message);
		} else {
			console.log('push to message q', message)
			local.messageQ = local.messageQ || [];
			local.messageQ.push(message);
		}

	}

	function sendMessageQ(protocol) {
		console.log('send message q')
		local.messageQ = local.messageQ || [];
		var mappedMessageQ = local.messageQ.filter((elem) => {
			if (elem.protocol === protocol) {
				console.log('send from message q', elem)
				send(elem);
				return false;
			} else {
				return true;
			}
		});
		local.messageQ = mappedMessageQ;
	}

	function isConnected() {
		return local.connected;
	}

	function protocolHandshaking(protocol) {
		return local.clients[protocol] && local.clients[protocol].handhsking;
	}

	/**
	 * disconnect
	 */
	function disconnect() {
		_uniqueId = null;
		if (local && local.ws) {
			local.ws.close();
		}
		local.clients = {};
	}

	/**
	 * register callbacks and fsm for protocol
	 * @param {*} fsmId 
	 * @param {*} onOpen 
	 * @param {*} onMessage 
	 * @param {*} onClose 
	 * @param {*} protocol 
	 */
	function register(userId,fsmId, onOpen, onMessage, onClose, protocol) {
		local.clients = local.clients || {};
		local.clients[protocol] = {
			fsmId: fsmId,
			userId: userId,
			onOpen: onOpen,
			onMessage: onMessage,
			onClose: onClose
		}
	}

	/**
	 * disconnect a protocol
	 * @param {*} protocol 
	 */
	function disconnectProtocol(protocol) {
		local.clients[protocol].handshaking = local.clients[protocol].handshook = false;
	}

	/**
	 * is protocol connected
	 * @param {*} protocol 
	 */
	function protocolConnected(protocol) {
		return isConnected() && local.clients[protocol] && local.clients[protocol].handshook;
	}

	/**
	 * start handshake
	 * @param {*} protocol 
	 * @param {*} processId 
	 */
	function startHandshake(protocol, processId) {
		console.log('startHandshake:', protocol, processId)
		setTimeout(function () {
			send({
				command: 'handshake',
				protocol: protocol,
				data: {
					processId: processId,
					fsmId: local.clients[protocol].fsmId,
					userId: local.clients[protocol].userId,
				}
			});
			local.clients[protocol].handshaking = true;
			local.clients[protocol].handshook = false;
		}, 100);
	}

	/**
	 * end handshake
	 * @param {*} protocol 
	 * @param {*} processId 
	 */
	function endHandshake(protocol, processId) {
		var onOpen = local.clients[protocol].onOpen;
		console.log('endHandshake:', protocol, processId)
		// send Message Q
		local.clients[protocol].handshook = true;
		local.clients[protocol].handshaking = false;
		sendMessageQ(protocol);
		onOpen && onOpen();
	}


	/**
	 * reconnect
	 * @param {*} protocol 
	 */
	function reconnect(protocol) {
		function tryConnect() {

			try {
				connect(protocol).then(function () {
					console.log('reconnected')
				}).catch(function (ex) {
					setTimeout(tryConnect, 3000)
				})
			} catch (ex) {
				console.warn(ex)
			}

		}

		// start in 1 second
		setTimeout(tryConnect, 1000)

	}
	/**
	 * connect
	 */
	function connect(protocol) {
		console.log('connect ', protocol)
		if (isConnected()) {
			return new Promise(function (resolve, reject) {
				if (!protocolConnected(protocol)) {
					startHandshake(protocol, processId());
				}
				resolve();
			});
		} else {

			return new Promise(function (resolve, reject) {

				// open socket
				local.ws = new WebSocket(configService.baseUrl, 'servo-protocol');

				/**
				 * open connection
				 */
				local.ws.onopen = function () {
					console.log('Socket has been opened!');
					local.connected = true;
					startHandshake(protocol, processId());
					resolve();
				};

				/**
				 * message received
				 * @param {*} message 
				 */
				local.ws.onmessage = function (message) {
					//console.log('.*', message);
					var data = JSON.parse(message.data);
					if (data.command === 'handshake') {
						endHandshake(data.protocol, data.processId);
					} else {
						var onMessage = local.clients[data.protocol].onMessage;
						onMessage && onMessage(data);
					}

				};

				/**
				 * connection closed
				 * @param {*} message 
				 */
				local.ws.onclose = function (message) {

					console.log('Socket closed');
					local.connected = undefined;
					//stop();
					_.each(local.clients, function (client, protocol) {
						var onClose = client.onClose;
						onClose && onClose(message);
						local.clients[protocol].handshaking = false;
						local.clients[protocol].handshook = false;

					});


				};

			});
		}

	}

})();