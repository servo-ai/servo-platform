var b3 = require('FSM/core/b3');
var Action = require('FSM/core/action');
var _ = require('underscore');
var dblogger = require('utils/dblogger');
/**
 * Posts a JSON payload to a URL, and sets fieldName to the returned object
 *  @memberof module:Actions
 */
class PostAction extends Action {
  constructor(settings) {
    super();
    this.title = this.name = 'PostAction';
    this.description = "posts JSON payload object to the url, setting fieldName with the result";
    /**
     * Node parameters
     * @property parameters
     * @type {Object}
     * @property {ExpressionString} parameters.url - post URL. will be evalated
     * @property {ExpressionString|Object} parameters.payload - string or JSON object. if a string, this will be evaluated as a template and parsed to a JSON object
     * @property {Boolean} parameters.json - set true to indicate application/json post action. if not, payload is stringified and contentType is used
     * @property {ExpressionString|Object}  parameters.headers POST headers
     * @property {ExpressionString|Object}  parameters.options other POST options
     * @property {MemoryField}  parameters.fieldName dot-notated field name
     * @property {string} contentType of the post. ignored if json is treu
     */
    this.parameters = _.extend(this.parameters, {
      'url': '',
      'payload': {},
      'fieldName': '',
      'json': true,
      'headers': '',
      'contentType': ''
    });
    settings = settings || {};

  }

  /**
   * open lifecycle hook
   */
  open(tick) {
    tick.process.set('step', 0, tick.tree.id, this.id);
  }

  postJSON(tick) {
    var step = this.local(tick, 'step');
    // ' tick.process.get('step', tick.tree.id, this.id);

    var node = this;
    //console.log("0 - begin: " + node.waitCode(tick), tick.tree.id, node.id);

    if (step === 0) {
      //RequestJSON
      tick.process.set('step', 1, tick.tree.id, this.id);
      node.waitCode(tick, b3.RUNNING());
      var data = this.alldata(tick);

      //TODO: Implement use for method, params
      //var request = PipeManager.getPipe('request');
      var request = require("request");
      try {
        var payload = this.properties.payload && ((typeof this.properties.payload === 'string') ?
          JSON.parse(_.template(this.properties.payload)(data)) :
          JSON.parse(_.template(JSON.stringify(this.properties.payload))(data)));
        var url = _.template(this.properties.url)(data);
        var options = this.properties.json ? {
          url: url,
          method: "POST",
          json: payload,
          followAllRedirects: false,

        } : {
          url: url,
          method: "POST",
          form: payload,
          followAllRedirects: false

        };

        options.headers = this.properties.headers && ((typeof this.properties.headers === 'string') ?
          JSON.parse(_.template(this.properties.headers)(data)) :
          JSON.parse(_.template(JSON.stringify(this.properties.headers))(data)));
        // if its a form data, make it 
        if (!options.headers && options.form) {
          var formData = JSON.stringify(options.form);
          options.form = options.form;
          options.headers = {
            'Postman-Token': '5b0ea1ca-4ecb-4f39-8e1b-6bfc15e9afdc',
            'cache-control': 'no-cache',
            'Content-Type': this.properties.contentType || 'application/x-www-form-urlencoded'
          };
        }
        // extend with other options if needed
        _.extend(options, this.properties.options && ((typeof this.properties.options === 'string') ?
          JSON.parse(_.template(this.properties.options)(data)) :
          JSON.parse(_.template(JSON.stringify(this.properties.options))(data))));
      } catch (ex) {
        dblogger.error(tick, 'possibly parse problem in PostAction:' + ex.message + " at " + this.summary(tick));
      }
      // options = {
      //   url: 'https://www.poliklik.com/poliklik/api/ministry_of_finance/',
      //   headers: {
      //     'Postman-Token': '5b0ea1ca-4ecb-4f39-8e1b-6bfc15e9afdc',
      //     'cache-control': 'no-cache',
      //     'Content-Type': 'application/x-www-form-urlencoded'
      //   },
      //   form: {
      //     name: 'lkjl',
      //     phone: '1234567890',
      //     issue_date: '17/10/1990',
      //     id_number: '059560938',
      //     email: 'liormessinger@gmail.com',
      //     undefined: undefined
      //   }
      // };
      request(options, (err, res, body) => {
        try {
          var _thisnode = this;
          console.log(options, body);
          var json = (typeof body === 'string') ? JSON.parse(body) : body;
        } catch (err) {
          dblogger.error(err.message + _thisnode.summary(tick));
          node.waitCode(tick, b3.FAILURE());
          return;
        }

        node.alldata(tick, node.properties.fieldName, json);

        // move to next step
        node.waitCode(tick, b3.SUCCESS());
      });
    }
    var status = node.waitCode(tick);
    //console.log("3 - returned: " + status, tick.tree.id, node.id);
    return status;
  }

  tick(tick) {
    return this.postJSON(tick);
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
      text: "Node must have a URL"
    }, {
      condition: validCompositeField(node.properties.fieldName),
      text: "fieldName should start with message., context., global., fsm. or volatile."
    }, {
      condition: node.properties.payload && Object.keys(node.properties.payload).length,
      text: "payload should be a non-empty object"
    }];
  }
}


module.exports = PostAction;