// namespace:
var b3 = require('../core/b3');
var Action = require('../core/action');
var _ = require('underscore');
var dblogger = require('utils/dblogger');


/**
 * maps from the context expected entities to the context memory fields, 
 * according to the map defined at the node properties
 *  @memberof module:Actions
 **/
class MapEntitiesToContextAction extends Action {

  constructor() {

    super();
    this.title = this.name = 'MapEntitiesToContextAction';
    /**
     * Node parameters
     * @property parameters
     * @type {Object}
     * @property {Array<EntitiesToContextMapItem>} parameters.map
     */
    this.parameters = {
      'map': [{
        'contextFieldName': '',
        'entityName': '',
        'entityIndex': 0
      }]
    };
    this.description = 'Define here a map from message entities to context entities.' +
      ' If more than one entity of a certain name, an entity array will be created. ';
  }
  /**
   * Tick method
   * @param {Tick} tick A tick instance.
   * @return {TickStatus}  return `b3.SUCCESS` unless no context manager was found
   * @private
   **/
  tick(tick) {

    var ctxMgrEtts = this.findContextManagerEntities(tick);
    dblogger.assert(ctxMgrEtts.node, "cant find contextManager ancestor at " + this.summary(tick));
    if (!ctxMgrEtts.node) {
      dblogger.error('strange, no context manager entities')
      return b3.FAILURE();
    }
    /** @type {Composite} */
    let node2 = ctxMgrEtts.node;
    node2.contextManager.mapEntitiesToContext(ctxMgrEtts.tick, this.properties.map, node2.currentChildIndex(tick));
    return b3.SUCCESS();
  }
}
module.exports = MapEntitiesToContextAction;
