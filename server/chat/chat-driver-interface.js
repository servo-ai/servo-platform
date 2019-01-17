class ChatDriverInterface {
  sendMessage(promptHtml, toId, tree, node = undefined) {}
  startAll(app, fsms) {}
  stopAll(app) {}
  static getInst() {

  }
}

module.exports = ChatDriverInterface;
