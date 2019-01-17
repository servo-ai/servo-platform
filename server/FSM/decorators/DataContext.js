
var b3 = require('FSM/core/b3')
var Decorator = require('FSM/core/decorator');

class DataContext extends Decorator {
    constructor() {
        super();
        this.name = 'DataContext';
        this.contextNode = true; // this node has the context data
        this.description = 'Make a data context for downstream ticks, pops it on the way back'
    }

}

module.exports = DataContext;