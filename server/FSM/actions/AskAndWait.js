var b3 = require('FSM/core/b3');
var Action = require('FSM/core/action');
var _ = require('underscore');


/**
 *  Sends a message to the user and waits (returns b3.RUNNING()) until there is a response. Once the response arrives, 
 * continue with b3.SUCCESS.
 * @memberof module:Actions
 */
class AskAndWait extends Action {

  constructor(settings) {
    super();
    /**
     * Node parameters
     * @property parameters
     * @type {Object} settings
     * @property {(ExpressionString|Object|Array<ExpressionString>|Array<TextObject>)} settings.prompt - a textual message to the user. can contains an array for random messages. can contain an object with "language" keys.
     * @property {(ExpressionString|Object)} settings.view - a file name of a view, or a view JSON object, to be used instead of the prompt in order to send native json
     * @property {ExpressionString} settings.image - an html string or a file name, that is rendered as an image to send the user
     * @property {CompositeFieldName} settings.imageDataArrayName - composite (message./global./context./volatile./local.) field name for an array object that contains data for the images
     **/
    var parameters = {
      "view": false,
      "prompt": [],
      "cyclePrompts": true,
      "imageHTML": false,
      "imageDataArrayName": ""
    };
    /**
     * Node parameters
     * @property parameters
     * @type {Object} parameters
     * @property {(ExpressionString|Object|Array<ExpressionString>)} parameters.prompt - a textual message to the user. can contains an array for random messages. can contain an object with "language" keys.
     * @property {(ExpressionString|Object)} parameters.view - a file name of a view, or a view JSON object, to be used instead of the prompt in order to send native json
     * @property {ExpressionString} parameters.image - an html string or a file name, that is rendered as an image to send the user
     * @property {string} parameters.imageDataArrayName - composite (message./global./context./volatile./local.) field name for an array object that contains data for the images
     **/
    this.parameters = _.extend(this.parameters, parameters);
    this.name = 'AskAndWait';
    this.title = 'AskAndWait (use with care)';
    settings = settings || {};
    this.description = "Note: this action does NOT hold a context. Use with care. It asks the question as written in prompt (a string) or json-formatted in view (parsed to a json object) properties, " +
      ". Then waits for response from user. " +
      " imageHTML is an html file name under images folder." +
      " view is a view file under views folder. imageDataArrayName is the composite field name for an array object that contains data for the images";
  }

  isQuestion() {
    return true;
  }


  enter(tick) {
    // if we are on wakeup, and this is an opened leaf which is waiting for an answer
    // it could be:
    // 1. leaf was opened, client closed, client opened. if the leaf is AskAndWait, 
    // this means that the leaf was requesting answer that never came
    // so we need to re-play the node on the client upon wakeup
    // 2. leaf was opened on wakeup, asked the question, no ack yet, and now its second tick.
    //  so we dont  need to replay upon wakeup
    // 3. leaf was opened, server closed, server re-opened. client still SHOULD have an open
    // session, we upon server re-run we will come here, node isOpened, waitcode on running, 
    // waiting for an answer. This will NOT work for Alexa. TODO: solve that

    if (tick.target && tick.target.isWakeUp() &&
      this.get(tick, 'wokeupTargetId') !== tick.target.id() &&
      tick.process.get('isOpen', tick.tree.id, this.id)) {

      this._closeMe(tick);

    }

  }
  /**
   * open lifecycle hook
   */
  open(tick) {
    tick.process.set('step', 0, tick.tree.id, this.id);
    if (tick.target && tick.target.isWakeUp()) {
      this.set(tick, 'wokeupTargetId', tick.target.id())
    }
  }


  close(tick) {
    if (tick.target && tick.target.isWakeUp()) {
      this.set(tick, 'wokeupTargetId', undefined);
    }
  }

  /**
   * returns true if target matches one of the expected intents
   * @param {*} curTarget 
   * @private
   */
  matchesIntent(target) {
    if (!target.get()) {
      return false;
    }

    var intentId = target.getIntent();
    var expectedIntents = this.properties.intents ||
      (this.properties.view && this.properties.view.intents) ||
      (this.properties.payload && this.properties.payload.intents);
    if (!expectedIntents || (Array.isArray(expectedIntents) && expectedIntents.length === 0)) {
      return true;
    }

    if (!Array.isArray(expectedIntents)) {
      expectedIntents = [expectedIntents];
    }

    var isIn = expectedIntents.find((elem) => {
      return (elem && intentId && elem.toLowerCase() === intentId.toLowerCase());
    });

    return !!isIn;

  }

  askAndWait(tick) {
    // var data = this.data(tick);
    var step = tick.process.get('step', tick.tree.id, this.id)
    // step 0: output message, then remove target
    if (step === 0) {

      var msgOut = this.tickMessage(tick);
      if (msgOut === b3.SUCCESS()) {

        // move to next step
        tick.process.set('step', 1, tick.tree.id, this.id);
        // continue to return RUNNING/FAILURE
        this.waitCode(tick, b3.RUNNING());
      } else if (msgOut !== b3.RUNNING()) {
        this.waitCode(tick, msgOut);
      }

      // remove this target, which led us here
      tick.target.remove();
    }

    // step 1: wait for new target
    if (step === 1) {
      // // remove everything which does not have an intent (the next intent, if any, can be used for step 1)
      // tick.target.removeUntilIntentFound();

      var curTarget = tick.target.get();

      // make sure this is a new target
      if (this.matchesIntent(tick.target)) {
        // now we can move on
        this.waitCode(tick, b3.SUCCESS());
        // reset for new entry
        tick.process.set('step', 0, tick.tree.id, this.id);
      } else {
        if (curTarget) {

          this.waitCode(tick, 0);

          // reset for new entry
          tick.process.set('step', 0.5, tick.tree.id, this.id);
          step = 0.5; // now we'll enter the help state
        }
      }
    }

    // help step
    if (step === 0.5) {
      var msgOut = this.tickMessage(tick, 'help');
      if (msgOut === b3.SUCCESS()) {

        // // remove everything which does not have an intent (the next intent, if any, can be used for step 1)
        // tick.target.removeUntilIntentFound();
        // remove this target, which led us here
        tick.target.remove();
        // move to wait step
        tick.process.set('step', 1, tick.tree.id, this.id);
        // continue to return RUNNING/FAILURE
        this.waitCode(tick, b3.RUNNING());

      } else if (msgOut !== b3.RUNNING()) { // FAILURE
        this.waitCode(tick, msgOut)

      }

    }

    return this.waitCode(tick);
  }

  /**
   * Tick method.
   *
   * @private tick
   * @param {Tick} tick A tick instance.
   * @return {TickStatus} A state constant.
   * @private
   **/
  tick(tick) {
    return this.askAndWait(tick);
  }


}

module.exports = AskAndWait;
