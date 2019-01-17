var b3 = require('FSM/core/b3');
var Action = require('FSM/core/action');
var _ = require('underscore');
var LokiJS = require('lokijs');
var dblogger = require('utils/dblogger');
var utils = require('utils/utils');

/**
 * Use mongoDB's find(query) on an array provided in sourceFieldName.
 * May apply sort afterwords and use resultIndex to select one item from the result set.
 * @memberof module:Actions
 */
class ArrayQueryAction extends Action {

  constructor(settings) {
    super();
    this.title = this.name = 'ArrayQueryAction';
    this.description = "Use mongoDB's find(query) on an array provided in sourceFieldName." +
      " May apply sort afterwords and use resultIndex to select one item from the result set.";
    /**
     * Node parameters
     * @property parameters
     * @type {Object}
     * @property {Object} settings 
     * @property {string} settings.sourceFieldName
     * @property {string} settings.targetFieldName
     * @property {number} settings.resultIndex
     * @property {ExpressionString} settings.query - an expression with the query 
     * 
     **/
    this.parameters = _.extend(this.parameters, {
      'sourceFieldName': '',
      'targetFieldName': '',
      'query': '',
      'resultIndex': null

    });
    settings = settings || {};
    if (_.isEmpty(settings.arrayFieldName)) {
      console.error("sourceFieldName/targetFieldName are obligatory parameters");
    }
  }

  /**
   * searches the sourceField
   * @param {*} tick 
   * @private
   */
  tick(tick) {
    try {
      var data = this.alldata(tick);
      var sourceField = this.properties.sourceFieldName;
      var targetField = this.properties.targetFieldName;
      var array = this.alldata(tick, sourceField);
      var results = null;

      var db = new LokiJS("temporaryDB");
      var collection = db.addCollection("temporaryCollection");
      var results = null;

      for (var i = 0; i < array.length; i++) {
        collection.insert(array[i]);
      }

      try {
        //TODO: support json object and not only string
        var query = _.template(this.properties.query)(data);
        results = collection.find(JSON.parse(query));

        //TODO fix if resultIndex is null
        if (!utils.safeIsNaN(this.properties.resultIndex)) {
          results = results[this.properties.resultIndex];
        }

      } catch (ex) {
        dblogger.error('query is non-json object at ' + this.summary(tick), ex);
        results = collection;
      }
      results = results || {};
      if (results.map) {

        results.map((result) => {
          if (result) delete result.$loki
        })
      } else {
        delete results.$loki;
      }
      this.alldata(tick, targetField, results);


      return b3.SUCCESS();
    } catch (ex) {
      dblogger.error('Error ', ex, this.summary(tick));
      return b3.ERROR();
    }

  }

  /**
   * @return {Array<Validator>}
   */
  validators(node) {

    function validCompositeField(field) {

      return field && (field.indexOf('message.') === 0 || field.indexOf('context.') === 0 || field.indexOf('global.') === 0 || field.indexOf('volatile.') === 0 || field.indexOf('fsm.') === 0);
    }



    return [{
      condition: validCompositeField(node.properties.sourceFieldName),
      text: "sourceFieldName should start with message., context., global., fsm. or volatile."
    }, {
      condition: validCompositeField(node.properties.targetFieldName),
      text: "targetFieldName should start with message., context., global., fsm. or volatile."
    }];
  }
}


module.exports = ArrayQueryAction;
