var Action = require('FSM/core/action');
var _ = require('underscore');
/**
 * Sends a UI event and continue. UI event lies on a data binding infrastructure on the UI client. Returns RUNNING until send acknowledged, SUCCESS afterwards
 * Useful for websocket channel
 *  @memberof module:Actions
 */
class SetUIAction extends Action {

  constructor(settings) {
    super();
    this.title = this.name = 'SetUIAction';

    var parameters = {
      view: {
        "en": {
          "event": "",
          "entity": "",
          "value": ""
        }
      }
    };
    /**
     * Node parameters
     * @property parameters
     * @type {Object} parameters
     * @property {ExpressionString} parameters.event - a UI event name (setPage, setField)
     * @property {ExpressionString} parameters.entity - a field or page name
     * @property {ExpressionString} parameters.value - the a value to set
     **/
    this.parameters = _.extend(this.parameters, parameters);
    this.description = "Send an event to a UI client with a value to set in a UI field. If UI has a data binding mechanism, data changes would trigger view changes, too.";
  }

  /**
   * set a wake up flag based on the entry target, for session-based clients
   * @param {Tick} tick 
   */
  open(tick) {
    if (tick.target && tick.target.isWakeUp()) {
      this.set(tick, 'wokeupTargetId', tick.target.id())
    }
  }
  /**
   * reset a wake up flag , for session-based clients
   * @param {Tick} tick 
   */
  close(tick) {
    if (tick.target && tick.target.isWakeUp()) {
      this.set(tick, 'wokeupTargetId', undefined);
    }
  }
  /**
   * Tick method.
   *
   * @private
   * @param {Tick} tick A tick instance.
   * @return {TickStatus} A state constant.
   **/
  tick(tick) {

    return this.tickMessage(tick);

  }


  /**
   * @return {Array<Validator>}
   */
  validators(node) {


    return [{
      condition: (node.properties.view && node.properties.view.en),
      text: "Node properties must include view.en"
    }, {
      condition: (node.properties.view && node.properties.view.en && node.properties.view.en.value && node.properties.view.en.event),
      text: "Event and value should be non-empty"
    }];
  }
}


module.exports = SetUIAction;
