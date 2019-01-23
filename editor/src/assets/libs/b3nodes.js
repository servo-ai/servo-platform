// create a b3 namespace
var b3 = [];
/**
 * 
 */
b3.createUUID = function () {
  var s = [];
  var hexDigits = "0123456789abcdef";
  for (var i = 0; i < 36; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
  }
  // bits 12-15 of the time_hi_and_version field to 0010
  s[14] = "4";

  // bits 6-7 of the clock_seq_hi_and_reserved to 01
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);

  s[8] = s[13] = s[18] = s[23] = "-";

  var uuid = s.join("");
  return uuid;
}


b3.push({
  name: "MemPriority",
  title: "MemPriority",
  parameters: {"debug-log":"","runningTimeoutSec":600,"maxRetriesNumber":5},
  description: "",
  id: "e63e4305-6e09-4d30-9f1d-c2cd407c3c49",
  category: "composite",
  validators: (function validators(node) {
    return [{
      condition: node.children && node.children.length,
      text: "should have children"
    }];
  })
});

b3.push({
  name: "MemSequence",
  title: "MemSequence",
  parameters: {"debug-log":"","runningTimeoutSec":600,"maxRetriesNumber":5},
  description: "",
  id: "d4a81130-5bec-4333-a79e-a72cc02752ae",
  category: "composite",
  validators: (function validators(node) {
    return [{
      condition: node.children && node.children.length,
      text: "should have children"
    }];
  })
});

b3.push({
  name: "GeneralMessage",
  title: "GeneralMessage",
  parameters: {"debug-log":"","runningTimeoutSec":600,"maxRetriesNumber":5,"replayActionOnReturnFromContextSwitch":true,"view":false,"prompt":[],"cyclePrompts":true,"pushMessageOut":false,"imageHTML":false,"imageDataArrayName":""},
  description: "Send the message from prompt (a string) or json-formatted in view (parsed to a json object) properties, with <%= %> global, member, volatile and message fields. if pushMessageOut is set, the message will be pushed immediately on drivers that expect answers on the response object, instead of waiting for the timeout - eg Alexa driver. image is an html file name under images folder.view is a view file under views folder. imageDataArrayName is the composite field name for an array object that contains data for the images",
  id: "2eb6f07d-baf9-4a45-a5e9-74ddf3251299",
  category: "action",
  validators: (function validators(node) {
    return [{
        condition: (node.properties.prompt && Object.keys(node.properties.prompt).length) ||
          (node.properties.view && Object.keys(node.properties.view).length),
        text: "Either prompt or view should be non empty"
      },
      {
        condition: (!((node.properties.prompt && Object.keys(node.properties.prompt).length) &&
          (node.properties.view && Object.keys(node.properties.view).length))),
        text: "Both prompt and view are non empty; view will be ignored"
      }
    ];
  })
});

b3.push({
  name: "Failer",
  title: "Failer",
  parameters: {"debug-log":"","runningTimeoutSec":600,"maxRetriesNumber":5,"replayActionOnReturnFromContextSwitch":true},
  description: "",
  id: "796551f8-bb8c-4c3f-a13d-8422e43d182e",
  category: "action",
  validators: (function validators(node) {
    return [{
      condition: node.title,
      text: "should have a title"
    }];
  })
});

b3.push({
  name: "Succeeder",
  title: "Succeeder",
  parameters: {"debug-log":"","runningTimeoutSec":600,"maxRetriesNumber":5,"replayActionOnReturnFromContextSwitch":true},
  description: "",
  id: "a9938e9b-daa7-4280-b0d0-6b92ab9446d1",
  category: "action",
  validators: (function validators(node) {
    return [{
      condition: node.title,
      text: "should have a title"
    }];
  })
});

b3.push({
  name: "Runner",
  title: "Runner",
  parameters: {"debug-log":"","runningTimeoutSec":600,"maxRetriesNumber":5,"replayActionOnReturnFromContextSwitch":true},
  description: "",
  id: "199e659c-d934-48b6-b9ab-b2ece7e06109",
  category: "action",
  validators: (function validators(node) {
    return [{
      condition: node.title,
      text: "should have a title"
    }];
  })
});

b3.push({
  name: "Error",
  title: "Error",
  parameters: {"debug-log":"","runningTimeoutSec":600,"maxRetriesNumber":5,"replayActionOnReturnFromContextSwitch":true},
  description: "",
  id: "d7547362-b827-43ac-aaca-856d849fcc41",
  category: "action",
  validators: (function validators(node) {
    return [{
      condition: node.title,
      text: "should have a title"
    }];
  })
});

b3.push({
  name: "Inverter",
  title: "Inverter",
  parameters: {"debug-log":"","runningTimeoutSec":600,"maxRetriesNumber":5},
  description: "",
  id: "90b821c5-54b7-4b5c-98f2-1ab3d56c8da2",
  category: "decorator",
  validators: (function validators(node) {
    return [{
      condition: node.child,
      text: "should have a child"
    }];
  })
});

b3.push({
  name: "FieldCompareCondition",
  title: "FieldCompareCondition",
  parameters: {"debug-log":"","runningTimeoutSec":600,"maxRetriesNumber":5,"left":"","operator":"","right":""},
  description: "Compare fields across global,context, volatile and message memories. left and right operands should have a dot notation with the object name. Eg: message.chat_message, context.amount etc. Operator could be any logical operator like ===, <, <==, !==, ==> etc. ",
  id: "d6b5bcf7-3fbc-4b38-910f-bc8bb79c1ff2",
  category: "condition",
  validators: (function validators(node) {

    function validOperator(oper) {
      oper = oper.trim();
      return oper === '===' || oper === '==' || oper === '<' || oper === '>' || oper === '<=' || oper === '>=' || oper === '!==' || oper === '!=';
    }

    return [{
      condition: validOperator(node.properties.operator),
      text: "operator should be a ==, ===, !==, !=, <, >, >= or <="
    }];
  })
});

b3.push({
  name: "MaxTime",
  title: "Max <maxTime>ms",
  parameters: {"debug-log":"","runningTimeoutSec":600,"maxRetriesNumber":5,"maxTime":0},
  description: "Sets a maximum milliseconds time, after which it returns failure.",
  id: "f10fb87c-7bb4-40ee-9200-d79f6c74686e",
  category: "decorator",
  validators: (function validators(node) {
    return [{
      condition: node.child,
      text: "should have a child"
    }, {
      condition: !isNaN(node.properties.maxLoop),
      text: "maxTime should be a number"
    }];
  })
});

b3.push({
  name: "RemoveTargetAction",
  title: "RemoveTargetAction",
  parameters: {},
  description: "",
  id: "647a3015-353c-47d2-96bb-502d35171516",
  category: "action",
  validators: (function validators(node) {
    return [{
      condition: node.title,
      text: "should have a title"
    }];
  })
});

b3.push({
  name: "SetFieldAction",
  title: "SetFieldAction",
  parameters: {"debug-log":"","runningTimeoutSec":600,"maxRetriesNumber":5,"replayActionOnReturnFromContextSwitch":true,"fieldName":"","fieldValue":""},
  description: "Set fields across global,context, volatile and message memories. fieldName and fieldValue should have a dot notation with the object name. Eg: message.chat_message, context.amount etc ",
  id: "4ec297f6-d735-4f2d-8a9b-a723f11fbe2c",
  category: "action",
  validators: (function validators(node) {

    function validCompositeField(field) {

      return field && (field.indexOf('context.') === 0 || field.indexOf('global.') === 0 || field.indexOf('volatile.') === 0 || field.indexOf('fsm.') === 0);
    }

    return [{
      condition: node.properties.fieldName && node.properties.fieldName.indexOf('message.') !== 0,
      text: "fieldName should not start with message. message is a read-only entity"
    }, {
      condition: validCompositeField(node.properties.fieldName),
      text: "fieldName should start with context., global., fsm. or volatile."
    }];
  })
});

b3.push({
  name: "AnyTarget",
  title: "AnyTarget",
  parameters: {"debug-log":"","runningTimeoutSec":600,"maxRetriesNumber":5},
  description: "return SUCCESS if any intent is present on the target",
  id: "6d90050f-df7a-4efb-a839-87c845ed099f",
  category: "condition",
  validators: (function validators(node) {
    return [{
      condition: node.title,
      text: "should have a title"
    }];
  })
});

b3.push({
  name: "ResetAll",
  title: "ResetAll",
  parameters: {"debug-log":"","runningTimeoutSec":600,"maxRetriesNumber":5,"replayActionOnReturnFromContextSwitch":true,"dontEndSession":false,"dontRemoveTarget":false,"emptyGlobalMemory":false},
  description: "",
  id: "8df8c410-a499-48f9-b2d8-361399ee3b34",
  category: "action",
  validators: (function validators(node) {
    return [{
      condition: node.title,
      text: "should have a title"
    }];
  })
});

b3.push({
  name: "RepeatUntilFailure",
  title: "Repeat Until Failure",
  parameters: {"maxLoop":-1},
  description: "Repeats the child node maxLoop times, or until failure, excluding RUNNING ticks. Updates context.repeatCount",
  id: "58a8bdab-41b6-4933-96dc-92f05a7066ec",
  category: "decorator",
  validators: (function validators(node) {
    return [{
      condition: node.child,
      text: "should have a child"
    }, {
      condition: !isNaN(node.properties.maxLoop),
      text: "maxLoop should be a number"
    }];
  })
});

b3.push({
  name: "RepeatUntilSuccess",
  title: "Repeat Until Success",
  parameters: {"maxLoop":-1},
  description: "Repeat the child until a success, or maxLoop count has been reached. If child returns running, it does not count.. Updates context.repeatCount",
  id: "2de7e4ca-33dc-425d-bfb0-734ee9144e21",
  category: "decorator",
  validators: (function validators(node) {
    return [{
      condition: node.child,
      text: "should have a child"
    }, {
      condition: !isNaN(node.properties.maxLoop),
      text: "maxLoop should be a number"
    }];
  })
});

b3.push({
  name: "Repeater",
  title: "Repeat <maxLoop>x",
  parameters: {"debug-log":"","runningTimeoutSec":600,"maxRetriesNumber":5,"maxLoop":-1},
  description: "Repeats the child node maxLoop times, excluding RUNNING ticks. Updates context.repeatCount",
  id: "eef9f3c3-a91b-47b9-8e09-b0e9411db5e8",
  category: "decorator",
  validators: (function validators(node) {
    return [{
      condition: node.child,
      text: "should have a child"
    }, {
      condition: !isNaN(node.properties.maxLoop),
      text: "maxLoop should be a number"
    }];
  })
});

b3.push({
  name: "MapEntitiesToContextAction",
  title: "MapEntitiesToContextAction",
  parameters: {"map":[{"contextFieldName":"","entityName":"","entityIndex":0}]},
  description: "Define here a map from message entities to context entities. If more than one entity of a certain name, an entity array will be created. ",
  id: "bbc3f7a4-e2b5-431a-933c-d36ba21d2fd9",
  category: "action",
  validators: (function validators(node) {
    return [{
      condition: node.title,
      text: "should have a title"
    }];
  })
});

b3.push({
  name: "FieldNotEmptyCondition",
  title: "FieldNotEmptyCondition",
  parameters: {"fieldName":""},
  description: "Succeeds if global, context, message or volatile fieldName is not empty",
  id: "3b4a10fb-d688-4c12-8458-e521d63b37b9",
  category: "condition",
  validators: (function validators(node) {

    function validCompositeField(field) {

      return field && (field.indexOf('message.') === 0 || field.indexOf('context.') === 0 || field.indexOf('global.') === 0 || field.indexOf('volatile.') === 0 || field.indexOf('fsm.') === 0);
    }

    function validOperator(oper) {
      oper = oper.trim();
      return oper === '===' || oper === '==' || oper === '<' || oper === '>' || oper === '<=' || oper === '=>' || oper === '!==' || oper === '!=';
    }


    return [{
      condition: validCompositeField(node.properties.fieldName),
      text: "fieldName should start with message., context., global., fsm. or volatile."
    }];
  })
});

b3.push({
  name: "BackgroundSequence",
  title: "BackgroundSequence",
  parameters: {"debug-log":"","runningTimeoutSec":600,"maxRetriesNumber":5},
  description: "Runs all children synchronuously, always starting from first child",
  id: "a14d8e26-1782-4f10-bc43-650e459e1243",
  category: "composite",
  validators: (function validators(node) {
    return [{
      condition: node.children && node.children.length,
      text: "should have children"
    }];
  })
});

b3.push({
  name: "MapEntitiesToParentAction",
  title: "MapEntitiesToParentAction",
  parameters: {"map":[{"contextFieldName":""}]},
  description: "Define a map from current context to fitst parent context fields.",
  id: "bd480dbc-e414-4fc2-a1d0-95876499f39a",
  category: "action",
  validators: (function validators(node) {
    return [{
      condition: node.title,
      text: "should have a title"
    }];
  })
});

b3.push({
  name: "ArrayQueryAction",
  title: "ArrayQueryAction",
  parameters: {"debug-log":"","runningTimeoutSec":600,"maxRetriesNumber":5,"replayActionOnReturnFromContextSwitch":true,"sourceFieldName":"","targetFieldName":"","query":"","resultIndex":null},
  description: "Use mongoDB's find(query) on an array provided in sourceFieldName. May apply sort afterwords and use resultIndex to select one item from the result set.",
  id: "f43effe3-0c16-4fa2-b2e2-25c7e0097abd",
  category: "action",
  validators: (function validators(node) {

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
  })
});

b3.push({
  name: "RetrieveJSONAction",
  title: "RetrieveJSONAction",
  parameters: {"debug-log":"","runningTimeoutSec":600,"maxRetriesNumber":5,"replayActionOnReturnFromContextSwitch":true,"url":"","fieldName":"","headers":""},
  description: "This sets fieldName to object of the returned json.",
  id: "d7476271-8fd1-4e52-8c31-1af70f2f6b43",
  category: "action",
  validators: (function validators(node) {
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
  })
});

b3.push({
  name: "ClearContextAction",
  title: "ClearContextAction",
  parameters: {"debug-log":"","runningTimeoutSec":600,"maxRetriesNumber":5,"replayActionOnReturnFromContextSwitch":true},
  description: "Clears the memory of current context",
  id: "6f42dc77-68d9-4808-a101-7063bf6a0797",
  category: "action",
  validators: (function validators(node) {
    return [{
      condition: node.title,
      text: "should have a title"
    }];
  })
});

b3.push({
  name: "AddTarget",
  title: "AddTarget",
  parameters: {"debug-log":"","runningTimeoutSec":600,"maxRetriesNumber":5,"replayActionOnReturnFromContextSwitch":true,"text":"","intentId":"","entities":{"name":"value"}},
  description: "Add a new message to the FSM, as if it came from the user. text, entity name, value and intentId are Expression Strings - meaning, if a template is needed use <%= %>",
  id: "a5cd4f54-cae1-4b84-b633-2c6862161b9a",
  category: "action",
  validators: (function validators(node) {
    return [{
      condition: node.title,
      text: "should have a title"
    }];
  })
});

b3.push({
  name: "AskAndMap",
  title: "AskAndMap",
  parameters: {"debug-log":"","runningTimeoutSec":600,"maxRetriesNumber":5,"view":false,"prompt":[],"cyclePrompts":true,"imageHTML":false,"imageDataArrayName":"","replayActionOnReturnFromContextSwitch":true,"contexts":[{"intentId":"","description":{"en":""},"passThru":false,"helper":false,"timeout":false,"default":false,"entities":[{"contextFieldName":"","entityName":"","expectedValue":"","entityIndex":0}]}]},
  description: "Send the message based on prompt or view properties. image is an html file name under images folder. imageDataArrayName is the composite field name for an array object that contains data for the images. Once sent, waits for a response and then directs the flow to the child found according to the intents/entities map",
  id: "328e58e0-a257-4b74-87a2-d830d4a393a9",
  category: "composite",
  validators: (function validators(node) {
    var contexts = node.properties.intents || node.properties.contexts;
    var _errContext;


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
        text: "intents number should be equal to number of children"
      },
      /*{
             condition: (contexts &&
               ((contexts.length > 1 && node.children) || (contexts.length == 1 && node.child && contexts[0].default))),
             text: "a single intent must be set to be a default"
           },*/
      {
        condition: (!((node.properties.prompt && Object.keys(node.properties.prompt).length) &&
          (node.properties.view && Object.keys(node.properties.view).length))),
        text: "Both prompt and view are non empty; view will be ignored"
      }, {
        condition: !findNone(node),
        text: "None is a reserved word and cannot be used as an intentId"
      }, {
        condition: !emptyContext(node),
        text: "An empty or incomplete context exists at context #" + _errContext
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
  })
});

b3.push({
  name: "ClearAllContexts",
  title: "ClearAllContexts",
  parameters: {"debug-log":"","runningTimeoutSec":600,"maxRetriesNumber":5,"replayActionOnReturnFromContextSwitch":true},
  description: "find closest context managed ancestor and clear all its contexts. ",
  id: "10c43170-f4ac-41a5-bbe7-b500876a4562",
  category: "action",
  validators: (function validators(node) {
    return [{
      condition: node.title,
      text: "should have a title"
    }];
  })
});

b3.push({
  name: "PostAction",
  title: "PostAction",
  parameters: {"debug-log":"","runningTimeoutSec":600,"maxRetriesNumber":5,"replayActionOnReturnFromContextSwitch":true,"url":"","payload":{},"fieldName":"","json":true,"headers":""},
  description: "posts JSON payload object to the url, setting fieldName with the result",
  id: "b5698521-341d-4346-93ba-bbd467c30937",
  category: "action",
  validators: (function validators(node) {
    function validCompositeField(field) {
      return field && (field.indexOf('message.') === 0 || field.indexOf('context.') === 0 || field.indexOf('global.') === 0 || field.indexOf('volatile.') === 0 || field.indexOf('fsm.') === 0);
    }
    return [{
      condition: node.properties && node.properties.url,
      text: "should have a URL"
    }, {
      condition: validCompositeField(node.properties.fieldName),
      text: "fieldName should start with message., context., global., fsm. or volatile."
    }, {
      condition: node.properties.payload && Object.keys(node.properties.payload).length,
      text: "payload should be a non-empty object"
    }];
  })
});

b3.push({
  name: "Wait",
  title: "Wait <milliseconds> ms",
  parameters: {"debug-log":"","runningTimeoutSec":600,"maxRetriesNumber":5,"replayActionOnReturnFromContextSwitch":true,"milliseconds":0},
  description: "",
  id: "69426179-99ea-488e-86d5-acea7287dc43",
  category: "action",
  validators: (function validators(node) {
    return [{
      condition: node.title,
      text: "should have a title"
    }];
  })
});

b3.push({
  name: "SetUIAction",
  title: "SetUIAction",
  parameters: {"debug-log":"","runningTimeoutSec":600,"maxRetriesNumber":5,"replayActionOnReturnFromContextSwitch":true,"view":{"en":{"event":"","entity":"","value":""}}},
  description: "Send an event to a UI client with a value to set in a UI field. If UI has a data binding mechanism, data changes would trigger view changes, too.",
  id: "3e252802-ea4f-49e7-ab84-21589cbfe805",
  category: "action",
  validators: (function validators(node) {


    return [{
      condition: (node.properties.view && node.properties.view.en),
      text: "Node properties must include view.en"
    }, {
      condition: (node.properties.view && node.properties.view.en && node.properties.view.en.value && node.properties.view.en.event),
      text: "Event and value should be non-empty"
    }];
  })
});

b3.push({
  name: "AddEntity",
  title: "AddEntity",
  parameters: {"entityName":"","fieldValue":""},
  description: "Add an entity to message object from global, context, volatile and message memories",
  id: "e7b51891-49ed-4e26-a5c9-02ea455edf62",
  category: "action",
  validators: (function validators(node) {

    function validCompositeField(field) {

      return field && !(field.indexOf('message.') === 0 || field.indexOf('fsm.') === 0 || field.indexOf('context.') === 0 || field.indexOf('global.') === 0 || field.indexOf('volatile.') === 0);
    }

    return [{
      condition: validCompositeField(node.properties.entityName),
      text: "entityName should NOT start with message., context., global. fsm. or volatile."
    }];
  })
});

b3.push({
  name: "CloseAllContexts",
  title: "CloseAllContexts",
  parameters: {"debug-log":"","runningTimeoutSec":600,"maxRetriesNumber":5,"replayActionOnReturnFromContextSwitch":true},
  description: "Close current context and all its children, effectively reseting all the runningChilds and allowing re-open",
  id: "ecdd93e8-5847-450f-adb1-49b55987b4a7",
  category: "action",
  validators: (function validators(node) {
    return [{
      condition: node.title,
      text: "should have a title"
    }];
  })
});

