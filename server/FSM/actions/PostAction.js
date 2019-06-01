var b3 = require('FSM/core/b3');
var Action = require('FSM/core/action');
var _ = require('underscore');
var dblogger = require('utils/dblogger');
var utils = require('utils/utils');
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
     * @property {ExpressionString|Object} parameters.payload - string or JSON object. if a string, this will be evaluated as a JS code (eval) and parsed to a JSON object
     * @property {Boolean} parameters.json - set true to indicate application/json post action. if not, payload is stringified,  and contentType is used (default: form)
     * @property {ExpressionString|Object}  parameters.headers POST headers. string or JSON object. if a string, this will be evaluated as a JS code (eval) and parsed to a JSON object
     * @property {ExpressionString|Object}  parameters.options other POST options
     * @property {MemoryField}  parameters.fieldName dot-notated field name
     * @property {string} contentType of the post. ignored if json is true
     * @property {Boolean} parameters.followAllRedirects if true, follow all
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

  request(tick, options, node, cb) {
    const http = require('http');
    var Url = require('url');
    var data;
    if (options.json) {
      data = JSON.stringify(options.json);
      options.headers = _.extend(options.headers, {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      });
      delete options.json;
    }

    options.method = 'POST';


    // var url = options.url;


    options.host = Url.parse(options.url).hostname;
    options.port = Url.parse(options.url).port || 80;
    options.path = Url.parse(options.url).pathname;
    delete options.url;

    const req = http.request(options, (res) => {
      node.log(tick, 'post returned ' + `statusCode: ${res.statusCode}`);
      const chunks = [];
      res.on('data', data => chunks.push(data));
      res.on('end', () => {
        let body = Buffer.concat(chunks);
        if (res.headers['content-type'] == 'application/json') {

          body = JSON.parse(body);

        } else {
          node.error(tick, 'no support for non-json response');
        }
        cb(null, res, body);
      });


    });

    req.on('error', (error) => {
      node.error(tick, error);
      cb(error, res, null);
    });

    req.write(data);
    req.end();


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
        var payload;
        if (this.properties.payload) {
          if (typeof this.properties.payload === 'string') {
            payload = utils.evalMemoryField(data, this.properties.payload);
          } else {
            payload = JSON.parse(_.template(JSON.stringify(this.properties.payload))(data))
          }
        }
        var url = _.template(this.properties.url)(data);
        var options = this.properties.json ? {
          url: url,
          json: payload,


        } : {
          url: url,
          form: payload,


        };

        if (this.properties.headers) {
          if ((typeof this.properties.headers === 'string')) {
            options.headers = utils.evalMemoryField(data, this.properties.headers);
          } else {
            options.headers = JSON.parse(_.template(JSON.stringify(this.properties.headers))(data));
          }

        }
        // if its a form data, make it 
        if (options.form) {
          options.headers = _.extend(options.headers, {
            'cache-control': 'no-cache',
            'Content-Type': this.properties.contentType || 'application/x-www-form-urlencoded'
          });
        }
        // extend with other options if needed
        _.extend(options, this.properties.options && ((typeof this.properties.options === 'string') ?
          JSON.parse(_.template(this.properties.options)(data)) :
          JSON.parse(_.template(JSON.stringify(this.properties.options))(data))));
      } catch (ex) {
        dblogger.error(tick, 'possibly parse problem in PostAction:' + ex.message + " at " + this.summary(tick));
      }


      var cb = function (err, res, body) {
        try {
          var json = (typeof body.data === 'string') ? JSON.parse(body.data) : body.data;
        } catch (err) {
          node.error(tick, "no json received. message is:" + body);
          dblogger.warn(err.message + node.summary(tick));
          node.waitCode(tick, b3.FAILURE());
          return;
        }

        node.alldata(tick, node.properties.fieldName, json);

        // move to next step
        node.waitCode(tick, b3.SUCCESS());
      };

      // followAllRedirects and form is supported at request at the moment
      if (node.properties.followAllRedirects || options.form) {
        options.followAllRedirects = node.properties.followAllRedirects;
        options.method = "POST";
        request(url, options, cb);
      } else {
        this.request(tick, options, node, cb);
      }

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