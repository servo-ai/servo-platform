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
  id: "2bf14285-b679-46f4-bdef-eabfb4448a05",
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
  id: "ef75c3f9-d3d6-41ad-ad1b-bfb3dbf9fe68",
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
  id: "627e9656-f339-46bd-8a7e-a8568b782283",
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
  id: "bd86509c-aae6-4175-ac33-e3faaef98030",
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
  id: "30259184-9a36-434a-b1be-d9475ef94c3a",
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
  id: "69c630b7-4724-4805-b79d-51e69e960126",
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
  id: "f27b8d73-6a2c-4793-bb1b-afbe32bc3c2d",
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
  id: "2ca985ef-10a4-4851-90b4-c92373a051a7",
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
  id: "be1e0d11-dc6d-42d8-b059-a18f2c184c03",
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
  id: "f282397e-ae93-4b18-ac98-ee08056d94ed",
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
  id: "ac527a6a-5ee8-412c-a449-a1ebd095a129",
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
  id: "c77ae527-95cb-4032-b7bb-fad9e66ca133",
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
  id: "a56cc975-57a6-42f5-9d91-1375885f73ce",
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
  id: "1935ff23-10c4-4e24-b2d8-8e046a9ce7d6",
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
  id: "e8619a9e-a3b1-4f7c-aa22-d9718a31fd0a",
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
  id: "f2ee6f6c-aa19-43d7-ac6e-ab06eb865d7f",
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
  id: "0bd56f0b-b087-4b7d-9720-1bd947b32efc",
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
  id: "7ef0d605-bf87-44c7-aae2-753afd9e970f",
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
  id: "170bea8c-27b5-41f7-ba27-f9339436b924",
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
  id: "5b9217d4-bacf-4a41-b903-da3be0c68b01",
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
  id: "52c7e283-1700-4bad-90cc-9bc305c5160b",
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
  id: "864996c8-48e5-48ba-a48c-4d3448cb344a",
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
  description: "Add a new message to the FSM, as if it came from the user. text, entity name, value and intentId are strings - meaning, if a template is needed use <%= %>",
  id: "f60c492b-2871-4cd4-96bb-cf71c18b48ce",
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
  id: "ea44ae02-639d-42c7-9a73-f41c959cee65",
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
  parameters: {"debug-log":"","runningTimeoutSec":600,"maxRetriesNumber":5,"replayActionOnReturnFromContextSwitch":true,"leaveCurrent":false},
  description: "find current context managed node and clear all its contexts. if leaveCurrent is true, leave current context intact",
  id: "24bf4bc5-de91-4267-9ddc-ae784f2d1835",
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
  parameters: {"debug-log":"","runningTimeoutSec":600,"maxRetriesNumber":5,"replayActionOnReturnFromContextSwitch":true,"url":"","payload":{},"fieldName":"","json":true},
  description: "posts JSON payload object to the url, setting fieldName with the result",
  id: "a2bd2717-a1a7-45a9-be00-480f6b265f66",
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
  id: "ca58c955-cec6-45f3-a387-8b78b7360b3a",
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
  id: "c027b74b-f401-4b2d-9993-f740d5dae822",
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
  id: "806a7d80-2ad4-46b2-812d-f18dd77c27cb",
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
  description: "Close current context and all its siblings, effectively reseting all the runningChilds and allowing re-open",
  id: "cf459d9d-2c8a-45f3-b562-65d674d7d975",
  category: "action",
  validators: (function validators(node) {
    return [{
      condition: node.title,
      text: "should have a title"
    }];
  })
});

