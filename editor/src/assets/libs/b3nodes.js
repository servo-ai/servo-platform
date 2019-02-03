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
  id: "a47ecf3a-bbae-4cf4-8bcc-27f5c9eec0c9",
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
  id: "5a29c0b7-2863-4a62-9f91-f8b6f5bad267",
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
  id: "90b8c6d6-6ff8-4c41-b44f-c9e6c297ad3c",
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
  id: "f51a211c-ffcc-4b1f-98a1-bed361fd50d2",
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
  id: "59edf479-2fc2-47bb-b943-3eb72f6988c2",
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
  id: "97a5949f-482c-4a3f-b154-2c5e51b1f433",
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
  id: "0f9ed0ed-b69f-4648-9f81-64a4ad481f37",
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
  id: "77274cdf-bc88-4f1f-9912-5c5b29f9c8fc",
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
  id: "9dc74de4-81ed-48bd-b47d-78836f75adc4",
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
  id: "d193e8d0-a0ff-44cd-b5a8-2384196e744c",
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
  id: "0ec29a12-5ffe-49b6-a79f-ae955f5a2824",
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
  id: "a4635a31-6f20-4a31-9530-3c4618ddd594",
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
  id: "27cbd08a-8c86-4e9f-88db-00be7b01e7e6",
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
  id: "af075710-24eb-4a03-bbbb-e8d38c273cf6",
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
  id: "f4df44b4-6e70-45ac-9262-e4c2391b6f9f",
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
  id: "d5a3a603-c1d7-4030-991b-71c1ee595181",
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
  id: "d44f1c84-9e51-4b16-92bb-15105b932d32",
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
  id: "21891420-3d55-4edf-acf0-7a73f4c2c871",
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
  id: "2ba4a5c3-fc01-4986-9a49-d8ea3af6ad60",
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
  id: "987ed2f4-c3b1-400d-8b4a-7a0cfde3cb1a",
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
  id: "635e0c5c-1f85-4dfb-aef7-dfa64ee3ee7c",
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
  id: "89e2a3d8-cb97-466f-a4c9-2ffa64221014",
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
  id: "a15d0d74-efec-4dc8-9ac2-6bdaab62f7f7",
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
  id: "086907ff-ea11-4191-bbcf-0f5e49a7d8cd",
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
  id: "6595919b-9fd3-4972-9c3f-76877bb127bd",
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
  id: "bd65494b-e79e-4747-9503-7ff0f51cc16f",
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
  id: "c582a461-281f-4e0e-b335-b5a9bd55679b",
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
  id: "a890071f-9f9e-4385-a056-e907e6e90474",
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
  id: "76526f62-943a-4c2f-8e92-8927a56974fa",
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
  id: "c078852a-4829-42aa-b162-538108e9e631",
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
  id: "401ec33d-d550-459a-8206-f0e81423daa9",
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
  name: "Twilio",
  title: "Send SMS via Twilio",
  parameters: {"accountSID":"","authToken":""},
  description: "",
  id: "915a0f40-d8c5-4ed8-a2ed-bd63dfeee273",
  category: "action",
  validators: (function validators(node) {
    return [{
      condition: node.title,
      text: "should have a title"
    }];
  })
});

b3.push({
  name: "CloseAllContexts",
  title: "CloseAllContexts",
  parameters: {"debug-log":"","runningTimeoutSec":600,"maxRetriesNumber":5,"replayActionOnReturnFromContextSwitch":true},
  description: "Close current context and all its children, effectively reseting all the runningChilds and allowing re-open",
  id: "ca421ae3-40a3-489e-82bb-1c6c16682112",
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
  id: "dd66398d-d014-4f7b-bfcf-3af4259ff3e1",
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
  id: "efeb7a83-a960-4f10-a1de-ed20dc2d6635",
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

