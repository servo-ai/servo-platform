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
  id: "f1bf6a20-e9dc-4d99-9c29-28bcc3f35d9c",
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
  id: "239abfe2-b882-4a31-b70e-e231f8cc0e2b",
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
  id: "a5d255bf-2f1d-409c-872b-bbebac098838",
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
  id: "73b7b742-9648-4667-8a14-93e9d8e6a26e",
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
  id: "01c89b89-6679-494c-8884-399066e4551e",
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
  id: "dc83b8aa-e702-4bdc-a075-097007a237a0",
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
  id: "79e50ee5-7360-4dfe-a904-28555fadc1fd",
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
  id: "70135d42-b246-4d55-adc3-f8d3ba0b75bc",
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
  id: "20f529af-6306-4ad7-8a7e-e021a72e18a3",
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
  id: "54cda9b2-fdf5-404d-8dbe-483ded93c760",
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
  id: "98727a21-d42d-46ce-9e4d-0837d16c4422",
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
  id: "cbe51c1d-545c-414e-846c-565d4e147107",
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
  id: "05c19d58-a6d1-4a60-bb61-19768c0b0799",
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
  id: "b8882df8-7a98-4e87-9a86-d8b709e01e21",
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
  id: "1099d80f-65e7-4d9d-9f5e-6c068c41370b",
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
  id: "47d36cbd-4013-4cf8-a5eb-072626bd4c8a",
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
  id: "2ab33329-34d9-4008-86c7-c7085c9c2aae",
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
  id: "ea006698-a6c7-41fd-a767-d15f20918918",
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
  id: "5cde6d65-f422-4a9c-8fae-e1c3e670fc86",
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
  id: "5ec0530d-1dd8-4001-b94d-fea875a6d073",
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
  id: "dc591aae-18a9-4bf7-92e4-d221067109ad",
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
  id: "f65c339f-f68f-4070-9509-970f9431787f",
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
  id: "50ed7e92-27ae-4f6d-ae72-a0a343f0ea66",
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
  id: "61df1462-d4ed-4277-a823-bfb18c0d4258",
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
  id: "776d3917-1e19-47d0-aa7d-da7cdefb8176",
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
  id: "958d9d4b-1cc0-45ae-b3c6-df2461f6c9e2",
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
  id: "4546b550-13fd-4fb3-83ee-37d2a37b6cd8",
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
  id: "cb55b999-2a29-464a-91f8-62a58efe39cb",
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
  id: "a6f21f1e-5d46-4499-a73c-cf9a51493523",
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
  id: "4ec4fdf4-a356-4e68-89cd-9021728b4057",
  category: "action",
  validators: (function validators(node) {
    return [{
      condition: node.title,
      text: "should have a title"
    }];
  })
});

