var _mockIt;

function BaseChat() {
  _mockIt = false;
};

/**
 * set the readOnly function
 * @param r
 * @return {*}
 */
BaseChat.mockIt = function (r) {

  if (!arguments.length) {
    return _mockIt;
  } else return _mockIt = r;
};

module.exports = BaseChat;
