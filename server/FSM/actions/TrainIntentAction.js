// namespace:
var b3 = require('FSM/core/b3');
var Action = require('FSM/core/action')
var _ = require('underscore');
var dblogger = require('utils/dblogger');
var PipeManager = require("pipes/pipemanager");
var utils = require('utils/utils');
/**
 * Trains an intent based on context fields whose name taken from node parameters. 
 * Intent name taken from intentNameField, using trainingTextField. Using current NLU engine
 *  @memberof module:Actions
 **/
class TrainIntentAction extends Action {

  constructor(settings) {
    super();
    this.title = this.name = 'TrainIntentAction';
    /**
     * Node parameters
     * @property parameters
     * @type {Object}
     * @property {ExpressionString} parameters.trainingTextField - the text by which the NLU should be trained
     * @property {ExpressionString} parameters.intentNameField - the intent name to train
     */
    this.parameters = _.extend(this.parameters, {
      'trainingTextField': '',
      'intentNameField': ''
    });
    settings = settings || {};
    if (_.isEmpty(settings.trainingTextField) || _.isEmpty(settings.intentNameField)) {
      console.error("trainingTextField/intentNameField are obligatory parameters");
    }

    this.description = "Train a new intent with name from intentNameField, using trainingTextField, ";
    this.description += "using current NLU engine. intentNameField is templated against all data.";

  }

  open(tick) {
    this.waitCode(tick, undefined);
  }
  /**
   * Tick method.
   *
   * @private tick
   * @param {Tick} tick A tick instance.
   * @return {TickStatus} Always return `b3.FAILURE`.
   **/
  tick(tick) {

    if (!this.waitCode(tick)) {
      this.waitCode(tick, b3.RUNNING());
      var alldata = this.alldata(tick);

      var nlu = PipeManager.getPipe(tick.process.properties().nlu[alldata.fsm.defaultLang].engine, tick.process.properties().nlu[alldata.fsm.defaultLang]);

      var text = this.alldata(tick, this.properties.trainingTextField);
      var intentName = _.template(utils.wrapExpression(this.properties.intentNameField))(alldata);

      // var intent = this.alldata(tick, intentNameField);
      var sample = {
        text: text,
        entities: [{
          entity: 'intent',
          value: intentName
        }, ],
      };
      nlu.train(sample).then((res) => {
        dblogger.log('wit trained with ' + JSON.stringify(sample) + " res: " + res);
        this.context(tick, 'lastIntentTrained', intentName);
        // intent added
        this.waitCode(tick, b3.SUCCESS());
      }).catch((ex) => {
        dblogger.error("Error in training intent " + this.properties.intentNameField + " with text " + this.properties.trainingTextField, ex);
        this.waitCode(tick, b3.ERROR());
      });

    }
    return this.waitCode(tick);
  }
}
module.exports = TrainIntentAction;
