var b3 = require('FSM/core/b3');
var Action = require('FSM/core/action');
var _ = require('underscore');

/**
 * Retrieves a JSON file from an external URL, and  sets fieldName to object of the returned json
 *  @memberof module:Actions
 */
class RetrieveJSONAction extends Action {
  constructor(settings) {
    super();
    this.title = this.name = 'RetrieveJSONAction';
    this.description = "This sets fieldName to object of the returned json.";
    /**
     * Node parameters
     * @property parameters
     * @type {Object}
     * @property {string} parameters.url
     * @property {string} parameters.fieldName
     */
    this.parameters = _.extend(this.parameters, {
      'url': '',
      'fieldName': '',
      'headers': ''
    });
    settings = settings || {};

  }

  /**
   * open lifecycle hook
   * @private
   */
  open(tick) {
    tick.process.set('step', 0, tick.tree.id, this.id);
  }

  retrieveJSON(tick) {
    var data = this.alldata(tick);
    var step = tick.process.get('step', tick.tree.id, this.id)
    var node = this;
    //console.log("0 - begin: " + node.waitCode(tick), tick.tree.id, node.id);

    if (step === 0) {
      //RequestJSON
      tick.process.set('step', 1, tick.tree.id, this.id);
      node.waitCode(tick, b3.RUNNING());
      var headers = this.properties.headers;
      if (headers) {
        if (typeof headers !== "string") {
          headers = JSON.stringify(headers);
        }
        headers = JSON.parse(_.template(headers)(data))
      }

      //TODO: Implement use for method, params
      //var request = PipeManager.getPipe('request');
      var request = require("request");
      request({
          url: this.properties.url,
          method: "GET",
          headers: headers
        },
        (err, res, body) => {
          //console.log(err, res, body)
          try {
            var _thisnode = this;
            var json = JSON.parse(body);
          } catch (err) {
            _thisnode.error(tick, "Couldn't parse to JSON: ", err);
            node.waitCode(tick, b3.FAILURE());
            return;
          }

          node.alldata(tick, node.properties.fieldName, json);
          console.log('-------LLLLLLLLLLL', json.url, json.headers);

          // move to next step
          node.waitCode(tick, b3.SUCCESS());
        });
    }
    var status = node.waitCode(tick);
    //console.log("3 - returned: " + status, tick.tree.id, node.id);
    return status;
  }

  tick(tick) {
    return this.retrieveJSON(tick);
  }

  /**
   * @return {Array<Validator>}
   */
  validators(node) {
    function validCompositeField(field) {
      return field && (field.indexOf('message.') === 0 || field.indexOf('context.') === 0 || field.indexOf('global.') === 0 || field.indexOf('volatile.') === 0 || field.indexOf('fsm.') === 0);
    }

    return [{
      condition: node.properties && node.properties.url,
      text: "should have a URL"
    }, {
      condition: validCompositeField(node.properties.fieldName),
      text: "fieldName should start with message., context., global., fsm. or volatile."
    }];
  }
}


module.exports = RetrieveJSONAction;
