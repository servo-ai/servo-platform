// namespace:
var b3 = require('../core/b3');
var Action = require('../core/action');
var _ = require('underscore');
const EXPIRE_MINUTES = 600

/**
 * map the entities from context to parent, based on the map in properties. Entities 
 * will be mapped to same name on parent context
 *  @memberof module:Actions
 **/
class MapEntitiesToParentAction extends Action {

  constructor() {

    super();
    this.title = this.name = 'MapEntitiesToParentAction';
    /**
     * Node parameters
     * @property parameters
     * @type {Object}
     * @property {Array<{contextFieldName:string}>} parameters.map
     */
    this.parameters = {
      'map': [{
        'contextFieldName': ''
      }]
    };
    this.description = 'Define a map from current context to fitst parent context fields.';
  }
  /**
   * Tick method.
   * @param {Tick} tick A tick instance.
   * @return {TickStatus} 
   * @private
   **/
  tick(tick) {

    var myContextManagerNodeEtts = this.findContextManagerEntities(tick);
    if (!myContextManagerNodeEtts.node) {
      this.error(tick, 'no current context in MapEntitiesToParentAction');
      return b3.ERROR();
    }
    myContextManagerNodeEtts.node.contextManager.mapEntitiesToParent(tick,
      this.properties.map);

    return b3.SUCCESS();
  }
}
module.exports = MapEntitiesToParentAction;
