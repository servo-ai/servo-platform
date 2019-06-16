var fs = require('fs');
// namespace:
var B3Nodes = [];

// namespace:
var b3 = require('b3');
var utils = require('utils/utils')
var MemPriority = require('MemPriority');
var memPriority = new MemPriority();
B3Nodes.push(memPriority)

var MemSequence = require('MemSequence');
var memSequence = new MemSequence();
B3Nodes.push(memSequence)

var GeneralMessage = require('GeneralMessage');
var generalMessage = new GeneralMessage();
B3Nodes.push(generalMessage)

var Failer = require('Failer');
var Failer_1 = new Failer();
B3Nodes.push(Failer_1)

var Succeeder = require('Succeeder');
var Succeder_1 = new Succeeder();
B3Nodes.push(Succeder_1)

var Runner = require('Runner');
var Runner_1 = new Runner();
B3Nodes.push(Runner_1)

var Error = require('Error');
var Error_1 = new Error();
B3Nodes.push(Error_1)

var Inverter = require('Inverter');
var Inverter_1 = new Inverter();
B3Nodes.push(Inverter_1)

var FieldCompareCondition = require('FieldCompareCondition');
var FieldCompareCondition_1 = new FieldCompareCondition();
B3Nodes.push(FieldCompareCondition_1)

// var GreetingTimeOfDayCondition = require('GreetingTimeOfDayCondition');
// var GreetingTimeOfDayCondition_1 = new GreetingTimeOfDayCondition();
// B3Nodes.push(GreetingTimeOfDayCondition_1)

// var AddScoreAction = require('AddScoreAction');
// var AddScoreAction_1 = new AddScoreAction();
// B3Nodes.push(AddScoreAction_1)


// var ScoreSelector = require('ScoreSelector');
// var ScoreSelector_1 = new ScoreSelector();
// B3Nodes.push(ScoreSelector_1)


var MaxTime = require('MaxTime');
var maxTime = new MaxTime();
B3Nodes.push(maxTime)


var RemoveTargetAction = require('RemoveTargetAction');
var RemoveTargetAction_1 = new RemoveTargetAction();
B3Nodes.push(RemoveTargetAction_1);

// var TimeFromMyLastRun = require('TimeFromMyLastRun');
// var TimeFromMyLastRun_1 = new TimeFromMyLastRun();
// B3Nodes.push(TimeFromMyLastRun_1);

// var TimeFromConvoLastRun = require('TimeFromConvoLastRun');
// var TimeFromConvoLastRun_1 = new TimeFromConvoLastRun();
// B3Nodes.push(TimeFromConvoLastRun_1);

var SetFieldAction = require('SetFieldAction');
var SetFieldAction_1 = new SetFieldAction();
B3Nodes.push(SetFieldAction_1);

var AnyTarget = require('AnyTarget');
var AnyTarget_1 = new AnyTarget();
B3Nodes.push(AnyTarget_1);

// var SetTimeOfDay = require('SetTimeOfDay');
// var SetTimeOfDay_1 = new SetTimeOfDay();
// B3Nodes.push(SetTimeOfDay_1);

var ResetAll = require('ResetAll');
var ResetAll_1 = new ResetAll();
B3Nodes.push(ResetAll_1);


// var DailyQuotaCondition = require('DailyQuotaCondition');
// var DailyQuotaCondition_1 = new DailyQuotaCondition();
// B3Nodes.push(DailyQuotaCondition_1);


// var RunSubtreeAction = require('RunSubtreeAction');
// var RunSubtreeAction_1 = new RunSubtreeAction();
// B3Nodes.push(RunSubtreeAction_1);

var RepeatUntilFailure = require('RepeatUntilFailure');
var RepeatUntilFailure_1 = new RepeatUntilFailure();
B3Nodes.push(RepeatUntilFailure_1);

var RepeatUntilSuccess = require('RepeatUntilSuccess');
var RepeatUntilSuccess_1 = new RepeatUntilSuccess();
B3Nodes.push(RepeatUntilSuccess_1);

var Repeater = require('Repeater');
var Repeater_1 = new Repeater();
B3Nodes.push(Repeater_1);



// treee specifics
function load(path, folder, name) {
  try {
    var cls = require(path + folder + '/' + name.trim());
    var cls1 = new cls();

    B3Nodes.push(cls1);
  } catch (ex) {
    console.log('PROBLEM with ' + path + folder + '/' + name.trim(), ex)
  }

}

path = 'FSM/';
load(path, 'actions', 'MapEntitiesToContextAction');
load(path, 'conditions', 'FieldNotEmptyCondition');
load(path, 'composites', 'BackgroundSequence');
load(path, 'actions', 'MapEntitiesToParentAction');
load(path, 'actions', 'ArrayQueryAction');
load(path, 'actions', 'RetrieveJSONAction');
load(path, 'actions', 'ClearContextAction');
//load(path, 'actions', 'TrainIntentAction');
load(path, 'actions', 'AddTarget');

load(path, 'composites', 'AskAndMap');
load(path, 'actions', 'ClearAllContexts');

load(path, 'actions', 'PostAction');
load(path, 'actions', 'Wait');
load(path, 'actions', 'SetUIAction');
//load(path, 'actions', 'AddEntity');

load(path, 'actions', 'Twilio');
load(path, 'actions', 'CloseAllContexts');
load(path, 'actions', 'CalcDateDiff');
load(path, 'conditions', 'IsValidField');
load(path, 'decorators', 'RepeatUntilCondition');
load(path, 'actions', 'MongoQuery');
load(path, 'nlumodels', 'DictModel');
load(path, 'actions', 'SafeEval');
load(path, 'actions', 'SetProcessLinkId');
load(path, 'actions', 'GetProcessDataByKey');
if (fs.existsSync('../server/convocode/anonymous/drafts/carseat3/actions/ExtractImageNames.js')) {
  load(path, '../convocode/anonymous/drafts/carseat3/actions', 'ExtractImageNames');
} else {
  load(path, '../convocode/servo/drafts/carseat3/actions', 'ExtractImageNames');
}
if (fs.existsSync('../server/convocode/anonymous/drafts/carseat3/actions/AugmentCarData.js')) {
  load(path, '../convocode/anonymous/drafts/carseat3/actions', 'AugmentCarData');
} else {
  load(path, '../convocode/servo/drafts/carseat3/actions', 'AugmentCarData');
}

module.exports = B3Nodes;