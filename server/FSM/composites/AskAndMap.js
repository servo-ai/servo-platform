var b3 = require('FSM/core/b3');
var Composite = require('FSM/core/composite');
var _ = require('underscore');
var dblogger = require('utils/dblogger');
var ContextManager = require('FSM/contextManager');
var statsManager = require('FSM/statsManager');

/**
 * Sends the message based on prompt or view properties. image is an html file name under images folder.
 * imageDataArrayName is the composite field name for an array object that contains data for the images.
 * Once sent, waits for a response and then directs the flow to the child found according to the intents/entities map.
 * Selects by message intent & entities the children. A context is created for each child. 
 * Contexts may have an expected intentId (a string or a regex) and entities, or a helper:true that would occur as default, if no matching intent was found 
 * If execution has a context already, it will continue to tick the current child, unless a bottom-up context search 
 *  changes the selected child.
 * If no child is selected, Helper child is entered every tick. 
 * On a timeout (user haven't answered in runningTimeoutSec) the timeout child is entered. If there's no timeout child, resort to default timeout behaviour (see BaseNode).
 * Node is closed when no more children are running. The entities from last child are  mapped to the parent, and all contexts are cleared.
 * The target is mapped to the expected intents and entities.
 * If more than one entity of a certain name, an entity array will be created.
 * @memberof module:Composites
 */
class AskAndMap extends Composite {

  constructor() {

    super();
    // this is a context node for the scoreres sub trees
    this.title = this.name = 'AskAndMap';
    /**
     * An object in the form of {"language code":"string"}. eg {"en":"my name is John"}
     * @typedef TextObject 
     * @property {string} string: language code
     * @property {string} string: text
     */
    /**
     * @typedef ContextItem
     * @property {string} intentId main expected intent for this context. converted internally to an 'intentId' entity name, with expected value of intentId
     * @property {TextObject} description human understandable description for this context
     * @property {boolean} helper use for contextual help. Selected if (1) no sibling context was found and [(2) there was no default or (3) there was another child selected previously]
     * @property {boolean} timeout is used when question timeouts
     * @property {boolean} backtrack if true, this will be the child to enter on backtracking
     * @property {boolean} default use to select default context. Selected if (1) no sibling context was found  (2) there's no other child already selected ",
     * @property {boolean} passThru use when another AskAndMap is expected downwards, that uses same intent/entities. If true, dont use target on context switch
     * @property {boolean} newContext if true, entity map search  will not ascend beyond this point. Make false if this node is a part of a dialog collecting entities, and entities of its parent should be included in the mappings
     * @property {Array<EntitiesToContextMapItem>} entities an array of expected entities
     */
    /**
     * Node parameters
     * @property parameters
     * @type {Object} parameters
     * @property {(ExpressionString|Object|Array<ExpressionString>|Array<TextObject>)} parameters.prompt - a textual message to the user. can contains an array for random messages. can contain an object with "language" keys.
     * @property {boolean} parameters.cyclePrompts - if true, will show the prompts cyclicly. false: will stay on the last prompt forever.
     * @property {(ExpressionString|Object)} parameters.view - a file name of a view, or a view JSON object, to be used instead of the prompt in order to send native json
     * @property {ExpressionString} parameters.image - an html string or a file name, that is rendered as an image to send the user
     * @property {MemoryField} parameters.imageDataArrayName - composite (message./global./context./volatile./local.) field name for an array object that contains data for the images
     * @property {Array<ContextItem>} parameters.contexts  - an array of contexts, each consists of expected entities, intents and more (ContextItem)
     * @property {boolean}  parameters.replayActionOnReturnFromContextSwitch - if false, this node is not closed and re-opened when return from context switch
     **/
    this.parameters = _.extend(this.parameters, {
      "view": false,
      "prompt": [],
      "cyclePrompts": true,
      "imageHTML": false,
      "imageDataArrayName": "",
      "replayActionOnReturnFromContextSwitch": true,
      // newContext if true, entity map search will stop here. Make false if this node is a part of a dialog collecting entities, and entities of its parent should be included in the mappings
      newContext: true,

      "contexts": [{
        //"_intentId": "main expected intent for this context. converted internally to an 'intentId' entity name, with expected value of intentId",
        intentId: '',
        //"_desctiption": "human understandable description for this context",
        description: {
          'en': ''
        },
        //"_passThru": "use when another AskAndMap is expected downwards, that uses same intent/entities. If true, dont use target on context switch.",
        passThru: false,
        // "_helper": "use for contextual help. Selected if (1) no sibling context was found and [(2) there was no default or (3) there was another child selected previously]",
        helper: false,
        // "_timeout": "is used when question timeouts",
        timeout: false,
        //"_default": "use to select default context. Selected if (1) no sibling context was found  (2) there's no other child already selected ",
        default: false,

        //"_entities": "array of expected entities",
        entities: [{
          'contextFieldName': '',
          'entityName': '',
          'expectedValue': '',
          'entityIndex': 0
        }]
      }]
    });

    this.description = "Send the message based on prompt or view properties. image is an html file name under images folder." +
      " imageDataArrayName is the composite field name for an array object that contains data for the images";
    this.description += ". Once sent, waits for a response and then directs the flow to the child found according to the intents/entities map";
    this.parameters = _.extend(this.parameters, {


    });

    this.contextManager = new ContextManager(this);


  }

  isQuestion() {
    return true;
  }

  /**
   *if we are on wakeup, and this is an opened leaf which is waiting for an answer
   * it could be:
   * 1. leaf was opened, client closed, client opened. if the leaf is AskAndWait, 
   * this means that the leaf was requesting answer that never came
   * so we need to re-play the node on the client upon wakeup
   * 2. leaf was opened on wakeup, asked the question, no ack yet, and now its second tick.
   * so we dont  need to replay upon wakeup
   *3. leaf was opened, server closed, server re-opened. client still SHOULD have an open
   *session, we upon server re-run we will come here, node isOpened, waitcode on running, 
   *waiting for an answer. This will NOT work for Alexa. TODO: solve that
   * @param {Tick} tick 
   * @private
   */
  enter(tick) {

    if (tick.target && tick.target.isWakeUp() &&
      this.get(tick, 'wokeupTargetId') !== this.target(tick).id() &&
      tick.process.get('isOpen', tick.tree.id, this.id)) {

      this._closeMe(tick);
    }


    _.each(this.contextProperties(), (ctxParam, index) => {
      if (ctxParam.background) {
        this.backgroundContextIndex = index;
      }
    });

  }

  /**
   * for AskAndMap, return true if entity was used, period, regardless of the direction 
   * (for ContextSelector on downwards direction you can use for mappings even if used )
   * @param {Target} target 
   * @param {*} ett : entity
   * @param {string?} searchDirection  "upwards" or "downwards"
   * @returns {boolean}
   */
  wasEntityUsed(target, ett) {
    return target.wasEntityUsed(ett.entityName, ett.entityIndex);
  }

  searchTarget(tick) {
    return tick.target;
  }

  /**
   * open lifecycle hook
   * @private
   */
  open(tick) {

    dblogger.flow('AskAndMap open', this.summary(tick));
    if (tick.target && tick.target.isWakeUp()) {
      this.set(tick, 'wokeupTargetId', tick.target.id());
    }
    //console.log('target--------))))AIC open', this.target(tick).summary());
    dblogger.assert(this.children[this.children.length - 1] && !this.children[this.children.length - 1].properties.helper, "first child in a AskAndMap must not be a helper");

    // initialize context  
    let foundContexts = this.contextManager.open(tick);
    dblogger.assert(foundContexts.length === 1, 'foundContext minimum is 0, first one is "no context"');
    // if the target caused that we already have an answer, if no need any more to ask the question, dont ask
    this.local(tick, 'step', (foundContexts[0].index >= 0) ? 1 : 0);
    // start running
    this.waitCode(tick, b3.RUNNING());

  }

  /**
   * close
   * @param {*} tick 
   * @private
   */
  close(tick, status) {

    if (tick.target && tick.target.isWakeUp()) {
      this.set(tick, 'wokeupTargetId', undefined);
    }

    // if we ever got a selection
    if (this.currentContextChild(tick) != null) {
      // this will map entities to pARENT
      this.contextManager.close(tick, status);
    }
    this.waitCode(tick, status);

  }

  /**
   * get current context child
   * @param {*} tick 
   */
  currentContextChild(tick) {
    var childIndex = this.local(tick, 'runningChild');
    return this.children[childIndex];
  }

  /**
   * get the properties of all contexts on the contextmanager node
   */
  contextProperties() {
    return this.properties.contexts || this.properties.intents;
  }

  /**
   * map entities and tick down
   * 
   * The context can be searched only below a certain point in the tree. 
   * If the conversation is at a certain context, and the context is switched to a different context, then
   * that switch point is the place to start. otherwise, we dont have a context yet, so we search from the top 
   * 
   * @param {Tick} tick 
   * @param {*} target 
   */
  tick(tick) {

    let status;
    if (this.waitCode(tick) != b3.RUNNING()) {
      return this.waitCode(tick);
    }

    //the currently selected (either from open or from previous tick)
    var selected = this.contextChildren()[this.currentChildIndex(tick)];

    // if no target, always execute background child
    if (!tick.target.exists() && this.backgroundContextIndex !== undefined && selected != this.backgroundContextIndex) {
      status = this.contextChildren()[this.backgroundContextIndex]._execute(tick);
    }

    // now, get to logic
    var step = tick.process.get('step', tick.tree.id, this.id);
    // step 0: output message, then remove target
    if (step === 0) {
      dblogger.flow('tick  step 0 in AskAndMap:' + this.id + ' step 0, runningChild=', this.local(tick, 'runningChild'), this.target(tick).summary());
      // move to next step
      tick.process.set('step', 1, tick.tree.id, this.id);
      //var msgOut = this.tickMessage(tick);
      status = b3.RUNNING();
      this.tickMessagePromise(tick).then(() => {
        // message delivery succeeded, do nothing special
      }).catch((x) => {
        dblogger.error('error in AskAndMap:', x);
        // continue to return RUNNING/FAILURE
        status = b3.ERROR();
      });

    }

    // step 1: wait for new target
    if (step === 1) {
      // get the current child
      let child = this.local(tick, 'runningChild');
      // if hasnt found yet
      if (_.isUndefined(child) || child === null || child < 0) {

        // we have a target and no child
        if (this.target(tick).exists()) {
          // it means there was no child that could be found - neither intent-child nor helper
          // restart node so it would ask the question again
          dblogger.warn('no target ' + this.summary(tick));
          this._close(tick);

          //**  it means we got here from above - it means, we are with the right context for the anscestor context selector
          // the mapping happened already - for the context on which we are. 
          // if we have mappings here, it will need to get mapped to parent to be useful
          // so remark - this.contextManager.mapEntitiesToContext(tick, this.contextProperties());
          this.target(tick, "remove");

        }

        status = this.handleTimeout(tick);
      } else {

        status = selected._execute(tick);

        if (status !== b3.RUNNING()) {
          // if more contextFrames, this selector is still not done
          status = this.contextManager.switchToPrevContext(tick, status);
        }

      }

    }

    return status;

  }

  /**
   * send a message method.
   *
   * output a message asynchrously
   * @param {Tick} tick 
   * @param {string} [fieldName] - to use when building a message. ,instead of prompt
   * @return {Promise} A state constant.
   **/
  tickMessagePromise(tick, fieldName) {

    return new Promise((resolve, reject) => {
      if (!this.prompt() && !this.view()) {
        resolve();
      } else {
        this.wait(this.outputMessage, [tick, fieldName], -1).then(() => {
          tick.process.save(); // save lazyly
          resolve();
        }).catch((x) => {
          tick.resetAll();
          // always save now, so we wont get stuck on running
          tick.process.save();
          reject(x);

        });
      }

    });

  }



  /**
   * selects a timeout child if exists
   * @param {Tick} tick 
   */
  handleTimeout(tick) {

    // check for timeout if we havent yet selected the child
    if (this.currentChildIndex(tick) < 0 && this.isNodeTimeout(tick)) {
      // see if we have a timeout child
      this.incrementRetries(tick);
      let timeoutChild = this.findTimeoutChild();
      // if not found, it will be dealt ON THE BASENODE
      if (timeoutChild > -1) {
        // other wise set it as the context child!
        this.setContextChild(tick, timeoutChild);

      }
    }
    return b3.RUNNING();

  }

  /**
   * find the first child that doesnt have any intent or entities
   */
  findTimeoutChild() {
    return this.contextProperties().findIndex((elem, index) => {
      return this.contextProperties()[index].timeout;
    });
  }


  /**
   * the context children are all the children
   * 
   */
  contextChildren() {
    return this.children;
  }


  setContextChild(tick, selectedConvoIndex) {
    dblogger.assert(selectedConvoIndex < this.children.length, 'index too hight');
    dblogger.assert(selectedConvoIndex !== undefined, 'index undefined at ' + this.title + "/" + this.id);
    this.local(tick, 'runningChild', selectedConvoIndex);
  }

  waitingForAnswer(tick) {
    return this.local(tick, 'step') === 1;
  }
  /**
   * defines validation methods to execute at the editor; if one of them fails, a dashed red border is displayed for the node
   * @return {Array<Validator>}
   */
  validators(node) {
    var contexts = node.properties.intents || node.properties.contexts;
    var _errContext, _errEtt;


    function findNone(node) {
      var isNone = function (value) {
        return value && typeof value === "string" && value.toLowerCase() === 'none';
      };
      var contexts = node.properties.intents || node.properties.contexts;
      if (contexts) {

        for (var i = 0; i < contexts.length; i++) {
          for (var e = 0; contexts[i].entities && e < contexts[i].entities.length; e++) {
            if (contexts[i].entities[e] &&
              contexts[i].entities[e].entityName == "intentId" &&
              isNone(contexts[i].entities[e].expectedValue)) {
              return true;
            }
          }
        }
      }
      return false;
    }

    function wrongEntityVariables(node) {
      if (contexts) {
        for (var i = 0; i < contexts.length; i++) {
          if (contexts[i].helper || contexts[i].timeout || contexts[i].default ||
            contexts[i].backtrack || (contexts[i].intentId && !contexts[i].entities)) {
            continue;
          }
          for (var e = 0; contexts[i].entities && e < contexts[i].entities.length; e++) {
            if (contexts[i] && contexts[i].entities[e] && contexts[i].entities[e].entityName && contexts[i].entities[e].entityName.indexOf('.') > -1) {
              _errContext = i;
              return true;
            }
            if (contexts[i] && contexts[i].entities[e] && contexts[i].entities[e].contextFieldName && contexts[i].entities[e].contextFieldName.indexOf('.') > -1) {
              _errContext = i;
              return true;
            }
          }

        }
      }
    }

    function emptyContext(node) {
      if (contexts) {
        for (var i = 0; i < contexts.length; i++) {
          if (contexts[i].helper || contexts[i].timeout || contexts[i].default ||
            contexts[i].backtrack || (contexts[i].intentId && !contexts[i].entities)) {
            continue;
          }
          if (!contexts[i].entities || !contexts[i].entities.length) {
            _errContext = i;
            return true;
          }
          for (var e = 0; contexts[i].entities && e < contexts[i].entities.length; e++) {
            if (!contexts[i].entities[e] || !contexts[i].entities[e].entityName || isNaN(contexts[i].entities[e].entityIndex)) {
              _errContext = i;
              return true;
            }
          }

        }
      }
    }



    function duplicatesExist(fieldName) {
      var count = 0;
      if (contexts) {
        for (var i = 0; i < contexts.length; i++) {
          count += contexts[i][fieldName];
        }
      }
      return count >= 2;
    }

    return [{
        condition: node.children && node.children.length || (contexts.length == 1 && node.child),
        text: "should have children"
      }, {
        condition: contexts && contexts.length,
        text: "should have at least 1 context "
      }, {
        condition: contexts && ((node.child && contexts.length === 1) || (node.children && contexts.length === node.children.length)),
        text: "count of contexts should be equal to number of children"
      },

      {
        condition: (!((node.properties.prompt && Object.keys(node.properties.prompt).length) &&
          (node.properties.view && Object.keys(node.properties.view).length))),
        text: "Both prompt and view are non empty; view will be ignored"
      }, {
        condition: !findNone(node),
        text: "None is a reserved word and cannot be used as an intentId"
      }, {
        condition: !emptyContext(node),
        text: "Incomplete context at context #" + _errContext + ". Make sure entityName and entityIndex is not empty"
      }, {
        condition: !wrongEntityVariables(node),
        text: "Entity members at context #" + _errEtt + " should not contain a dot ."
      }, {
        condition: !duplicatesExist("background"),
        text: "multiple background contexts"
      },
      {
        condition: !duplicatesExist("default"),
        text: "multiple default contexts"
      },
      {
        condition: !duplicatesExist("helper"),
        text: "multiple helper contexts"
      },
      {
        condition: !duplicatesExist("timeout"),
        text: "multiple timeout contexts"
      }
    ];
  }
}

module.exports = AskAndMap;