function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/***
 * DepenedecyInjector
 */
class Injector 
{
    constructor() {
        this._injectables = {};
        // add initial needed modules
        this.add('viewModel' ,"../models/view-model.js");
        this.add('htmlModel' ,"../models/html-model.js");
        this.add('dblogger' ,"../utils/dblogger.js");
        this.add('FsmManager' ,"./fsm-manager.js");
        this.add('fsmEventEmitter' ,'./fsm-event-emitter.js');
        this.add('Promise' ,'promise');
        this.add('PipeManager' ,'../pipes/pipemanager');
        this.add('_' ,'underscore');
        this._injectables['Injector'] = this;
    }

    add(moduleName,modulePath) {
        var module1 = require(modulePath);
        this._injectables[capitalizeFirstLetter(moduleName)] = module1;
    }

    get(moduleName,process,tree,node,body) {
        if (moduleName==='behaviorTree' || moduleName==='tree') {
              return tree;    
        }
        else if (moduleName==='process') {
            return process;
        }
        else if (moduleName==='body') {
            return body;
        }
        else if (moduleName==='node') {
            return node;
        }
        else if (!this._injectables[moduleName])
            this.get('Dblogger').error('no module found: ',moduleName)
        return this._injectables[moduleName];
    }

}

module.exports = new Injector();