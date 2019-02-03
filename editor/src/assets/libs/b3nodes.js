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
  id: "03a3bee4-50a3-4adf-855b-f13a2cceccd0",
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
  id: "2dbd5a3a-de5b-4e0a-8bf4-2be4a5b7b139",
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
  id: "cd0a2cd0-e136-483d-b71d-33646e6198ae",
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
  id: "7d7eed88-3b11-4bbc-8dd4-4d8d23f44837",
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
  id: "de0ff311-46a3-47f2-9f8d-8e1f0b36b7dd",
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
  id: "bce5c82e-80a6-46b3-9ac6-4dff53d4d26b",
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
  id: "146cb951-18d0-43f6-ab4c-b795809b5ab8",
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
  id: "3e2fa08f-4228-4ca5-af94-f524a2a5a916",
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
  description: "Compare fields across global,context, volatile and message memories. left and right operands should have a dot notation with the object name. Eg: message.text, context.amount etc. Operator could be any logical operator like ===, <, <==, !==, ==> etc. ",
  id: "b341d071-16bd-48aa-99fb-c917b9be0b84",
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
  id: "8593956d-86c6-4e59-a243-a7dd48c6732e",
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
  id: "dd45fddd-9edc-4930-be68-dbd7d149842e",
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
  description: "Set fields across global,context, volatile and message memories. fieldName and fieldValue should have a dot notation with the object name. Eg: message.text, context.amount etc ",
  id: "7f6f9ef0-9b43-4f48-8006-c3a99307b79e",
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
  id: "730b79a7-b6ea-47f2-a460-d06c64dad817",
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
  id: "701cb384-bf22-4865-87c5-a875e2a2391b",
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
  id: "4997d79e-2a0e-403d-acdd-4a9b4726fa29",
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
  id: "230560ac-7096-4d90-aff6-d557753cb5cf",
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
  id: "ce6281a9-be4d-4229-9f3f-818902b36ac9",
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
  id: "25b625cf-6b78-4851-b896-dfdb3d08f46f",
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
  id: "a7b8cb11-b8b4-4b4c-b986-7a7b1bec274d",
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
  id: "d6568435-0536-4687-95b7-bc014e3fb9ba",
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
  id: "01ef2a7b-33ff-4141-a044-38bcf5a9797a",
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
  id: "2602a7c2-b508-43a3-8381-2c92693a3ba1",
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
  id: "62aba205-b3ce-42c1-8049-6b73df509a0d",
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
  id: "8112b04f-a0e9-49dd-88fa-b8dfb97b31de",
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
  id: "306a1e02-133c-4656-b237-0887593cb984",
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
  id: "5ab86e73-9983-45e5-9880-e4283feabb2a",
  category: "composite",
  validators: (function validators(node) {
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
        text: "intents number should be equal to number of children"
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
  })
});

b3.push({
  name: "ClearAllContexts",
  title: "ClearAllContexts",
  parameters: {"debug-log":"","runningTimeoutSec":600,"maxRetriesNumber":5,"replayActionOnReturnFromContextSwitch":true},
  description: "find closest context managed ancestor and clear all its contexts. ",
  id: "5d37a181-8a71-43db-a747-f839d1e46bd9",
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
  id: "ae904784-05ff-4f61-bd72-6a00a6124998",
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
  id: "e7c1c0a1-8b87-4bee-a932-f2be7074fe90",
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
  id: "f3fd783a-2551-499d-9f6e-2a1a33bf2180",
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
  parameters: {"debug-log":"","runningTimeoutSec":600,"maxRetriesNumber":5,"replayActionOnReturnFromContextSwitch":true,"entityName":"","fieldValue":""},
  description: "Add an entity to message object from global, context, volatile and message memories",
  id: "e93683ff-5643-4dfe-a335-bab7757baede",
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
  id: "23eb3a5a-1978-4db3-867e-8d89a5080b4f",
  category: "action",
  validators: (function validators(node) {
    return [{
      condition: node.title,
      text: "should have a title"
    }];
  })
});

b3.push({
  name: "CalcDateDiff",
  title: "CalcDateDiff",
  parameters: {"debug-log":"","runningTimeoutSec":600,"maxRetriesNumber":5,"replayActionOnReturnFromContextSwitch":true,"dateTo":"","dateFrom":"","fieldName":""},
  description: "",
  id: "f382958c-59f5-4398-ba21-7f1c64c84b01",
  category: "action",
  validators: (function validators(node) {

        function validCompositeField(field) {

            var bool1 = field && (field.indexOf('context.') === 0 || field.indexOf('global.') === 0 || field.indexOf('volatile.') === 0 || field.indexOf('fsm.') === 0);
            var bool2 = field && (field.indexOf('\'') === 0 || field.indexOf('"') === 0 || !isNaN(field));
            return bool1 || bool2;
        }

        return [{
            condition: validCompositeField(node.properties.fieldName),
            text: "fieldName is not a memory field. it should start with \", ', context., global., fsm., volatile. or be a literal number"
        }, {
            condition: validCompositeField(node.properties.dateTo),
            text: "dateTo is not a memory field. it should start with \", ', context., global., fsm., volatile. or be a literal number"
        }, {
            condition: validCompositeField(node.properties.dateFrom),
            text: "dateFrom is not a memory field. it should start with \", ', context., global., fsm., volatile. or be a literal number"
        }];
    })
});

b3.push({
  name: "IsValidField",
  title: "IsValidField",
  parameters: {"debug-log":"","runningTimeoutSec":600,"maxRetriesNumber":5,"fieldName":"","fieldType":"","numberFormat":""},
  description: "returns SUCCESS if the field is valid. field type is either email, credit card, phone number, or a formatted 'number' (format as a mask like XXX-XXX etc) ",
  id: "a365c232-7109-4d96-97ba-cdc852f96bca",
  category: "condition",
  validators: (function validators(node) {

        function validCompositeField(field) {

            var bool1 = field && (field.indexOf('context.') === 0 || field.indexOf('global.') === 0 || field.indexOf('volatile.') === 0 || field.indexOf('fsm.') === 0);
            var bool2 = field && (field.indexOf('\'') === 0 || field.indexOf('"') === 0 || !isNaN(field));
            return bool1 || bool2;
        }

        return [{
            condition: validCompositeField(node.properties.fieldName),
            text: "fieldName is not a memory field. it should start with \", ', context., global., fsm., volatile. or be a literal number"
        }, {
            condition: node.properties.fieldType !== '',
            text: "fieldType cannot be empty"
        }, {
            condition: node.properties.fieldType || (node.properties.fieldType === 'number' && node.properties.formatNumber !== ''),
            text: "if fieldType is  number, formatNumber should contain a format"
        }];
    })
});

