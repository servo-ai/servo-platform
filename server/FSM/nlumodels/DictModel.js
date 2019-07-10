var NLUModel = require('FSM/core/NLUModel');
var _ = require('underscore');

/**
 * dictionary model - entity classifier
 * @memberof module:NLUModels
 * @private
 */
class DictModel extends NLUModel {

    constructor() {
        super();
        this.title = "Dictionary";
        this.description = 'Use a dictionary from properties to find entities in message text';
        this.title = this.name = 'DictModel';

        /**
         * Node parameters.
         *
         * @property parameters
         * @type {Object}
         * @property {Object} parameters.nlu -this gets added onto the process properties to get used for NLU. 
         * Use language code as a key: {
         * 
         * 'en': {
         *    engine: 'wit',
         * 
         *     accessToken: '<your token>'
         * 
         * }}
         **/
        this.parameters = _.extend(this.parameters, {
            dictionary: {
                'en': {
                    filename: ''
                }
            }
        });


    }

    /**
     * defines validation methods to execute at the editor; if one of them fails, a dashed red border is displayed for the node
     * @return {Array<Validator>}
     */
    validators(node) {
        function engineFinder(nluObj) {
            for (var lang in nluObj) {
                if (nluObj[lang].filename === '') {
                    return false;
                }
            }

            return true;
        }


        return [{
            condition: node.child,
            text: "should have a child"
        }, {
            condition: node.properties.dictionary,
            text: "properties should have a dictionary"
        }, {
            condition: engineFinder(node.properties.dictionary),
            text: "a filename should exist for all languages"
        }];
    }


    /**
     * Tick method.
     *
     * @private
     * @param {Tick} tick A tick instance.
     * @return {TickStatus} A status constant.
     **/
    tick(tick) {
        try {
            let dict = require(this.properties.dictionary[tick.process.properties()['defaultLang']].filename);
            if (tick.target.getMessageObj()) {
                let text = " " + tick.target.getMessageObj().text + " ";
                // let entities = {};
                for (let valuekey in dict.data.values) {
                    let value = dict.data.values[valuekey];

                    for (let expkey in value.expressions) {
                        let exp = " " + value.expressions[expkey] + " ";
                        if (value.expressions[expkey] && text.toLowerCase().indexOf(exp.toLowerCase()) > -1) {
                            // entities[dict.data.id] = [value.value];
                            // entities[dict.data.id + "#confidence"] = 1.0;

                            // dont use addEntity - override previous NLU engines
                            tick.target.getMessageObj().entities[dict.data.id] = [value.value];
                            //tick.target.getMessageObj().addEntity(dict.data.id + "#confidence", 100.0);
                            // huge confidence factor to prevent context switching if this entity was identified as another one
                            tick.target.getMessageObj().entities[dict.data.id + "#confidence"] = [1000.0];

                        }
                    }
                }
            }

            // continue on
            return this.child._execute(tick);

        } catch (ex) {
            this.error(tick, "DictModel of " + this.properties.dictionary, ex);
        }

    }
}

module.exports = DictModel;