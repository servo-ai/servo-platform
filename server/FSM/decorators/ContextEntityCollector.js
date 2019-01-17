var b3 = require('FSM/core/b3')
var Decorator = require('FSM/core/decorator');
var _ = require('underscore');
var dblogger = require('utils/dblogger');
var statsManager = require('FSM/statsManager');
var ContextManager = require('FSM/contextManager');
var Utils = require('utils/utils');
/**
 * One-child modifiers 
 * @module Decorators
 */
/**
 * Holds a context manager for its single child context. Its only feature is to collect entities from target,
 * based on the map defined in the parameters. could be used to pre-process messages by a  
 * 
 */
class ContextEntityCollector extends Decorator {
  constructor() {
    super();
    this.title = this.name = 'ContextEntityCollector';
    this.contextNode = true; // this node has the context data
    this.description = 'Holds a context manager for its single child context';
    this.contextManager = new ContextManager(this);
    /**
     * Node parameters
     * @property parameters
     * @type {Object}
     * @property {Array<EntitiesToContextMapItem>} parameters.entities - entities map. Each item carries an additional member -  mandatory boolean field
     * @property {boolean} parameters.returnWhenAllEntitiesCollected - return success when all entities collected, regardless of the child status
     * 
     */
    this.parameters = _.extend(this.parameters, {
      returnWhenAllEntitiesCollected: false,
      entities: [{
        'contextFieldName': '',
        'entityName': '',
        'entityIndex': 0,
        "mandatory": true
      }]
    });


  }

  /**
   * 
   * @param {Tick} tick 
   */
  open(tick) {

    this.contextManager.open(tick);
  }

  currentChildIndex() {
    // we always switch to this 0 context!
    return 0;
  }

  setContextChild(tick, selectedConvoIndex) {
    dblogger.assert(selectedConvoIndex == 0, 'cant have more than one convo index in ContextEntityCollector');
    // do nothing, one index
  }

  /**
   * close this node and context 
   * @param {Tick} tick 
   */
  close(tick, status) {
    // move to the first context up    
    this.contextManager.close(tick, status);
  }

  currentContextIndex(tick) {
    return 0;
  }

  currentContextChild(tick) {
    return this.child;
  }


  contextChildren() {
    return [this.currentContextChild()];
  }

  allEntitiesCollected(tick) {
    for (let prop of this.contextProperties()[0].entities) {
      let contextField = this.context(tick, prop.contextFieldName);
      if (prop.mandatory && Utils.isEmpty(contextField)) {
        return false;
      }
    }
    return true;
  }

  tick(tick) {
    if (!this.child) {
      return b3.ERROR();
    }

    var status = this.child._execute(tick);
    if (status === b3.RUNNING()) {
      if (this.properties.returnWhenAllEntitiesCollected &&
        this.allEntitiesCollected(tick)) {
        status = b3.SUCCESS();
      }
    }

    return status;
  }

  contextProperties() {
    return [{
      entities: this.properties.entities
    }];
  }

  nonContextChild() {
    return true;
  }

}

module.exports = ContextEntityCollector;
