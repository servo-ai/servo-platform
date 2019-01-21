var b3 = require('FSM/core/b3');
var Action = require('FSM/core/action');
var _ = require('underscore');
var ParseXML = require('xml2js').parseString;
var dblogger = require('utils/dblogger');
/**
 * Retrieves an XML file from an external URL, parsed it, and sets fieldName to the parsed object
 */
class RetrieveXMLAction extends Action {
  /**
   * Node name. Default to `Sequence`.
   *
   * @property name
   * @type {String}
   * @readonly
   **/
  constructor(settings) {
    super();
    this.title = this.name = 'RetrieveXMLAction';
    this.description = "This sets fieldName to object of the returned json.";
    /**
     * Node parameters
     * @property parameters
     * @type {Object}
     * @property {string} parameters.url
     * @property {string} parameters.fieldName
     */
    this.parameters = {
      'url': '',
      'fieldName': ''
    };
    settings = settings || {};
  }

  /**
   * open lifecycle hook
   * @private
   */
  open(tick) {
    tick.process.set('step', 0, tick.tree.id, this.id)
  }
  /**
   * retrieve
   * @private
   */
  reteriveXML(tick) {
    var step = tick.process.get('step', tick.tree.id, this.id)
    var node = this;

    if (step === 0) {
      //RequestXML
      tick.process.set('step', 1, tick.tree.id, this.id);
      node.waitCode(tick, b3.RUNNING());
      //TODO: Implement use for method, params
      //var request = PipeManager.getPipe('request');
      var request = require("request");
      request(this.properties.url, function (err, res, body) {
        ParseXML(body, function (err, json) {
          if (err) {
            dblogger.error("Couldn't parse to XML: ", err);
            node.waitCode(tick, b3.FAILURE());
            return;
          }
          json = node.flattenArray(json);
          node.alldata(tick, node.properties.fieldName, json);
          // move to next step
          node.waitCode(tick, b3.SUCCESS());
          // reset for new entry
          //tick.process.set('step', 0, tick.tree.id, node.id)
          //console.log("2 - end of request: " + node.waitCode(tick), tick.tree.id, node.id);
        });
      });
    }
    var status = node.waitCode(tick);
    //console.log("3 - returned: " + status, tick.tree.id, node.id);
    return status;
  }
  /**
   * 
   * @param {Array} arr 
   */
  flattenArray(arr) {
    if (_.isArray(arr) && arr.length == 1) {
      arr = arr[0];
    }
    for (var key in arr) {
      if (_.isArray(arr[key]) && arr[key].length == 1) {
        arr[key] = arr[key][0];
      }
      if (_.isObject(arr[key]) || _.isArray(arr[key])) {
        arr[key] = this.flattenArray(arr[key]);
      }
    }
    return arr;
  }

  /**
   * 
   * @param {Tick} tick 
   * @private
   */
  tick(tick) {
    return this.reteriveXML(tick);
  }

  /**
   * defines validation methods to execute at the editor; if one of them fails, a dashed red border is displayed for the node
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


module.exports = RetrieveXMLAction;