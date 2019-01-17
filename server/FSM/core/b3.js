/**
 * b3
 * 
 * Copyright (c) 2017 Servo Labs Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to 
 * deal in the Software without restriction, including without limitation the 
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is 
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 **/
var uuid = require('uuid');
var dblogger = require('utils/dblogger');


/**
 * A collection of all base classes needed to operate the behavior tree runtime
 * @module Core
 */

/* Servo run-time is a Behavior Tree system written in JavaScript. It provides structures and algorithms that assist you in the task of creating intelligent agents for your AI application. Check it out some features 
 * of Servo:
 * 
 * - Based on the work of (Marzinotto et al., 2014), in which they propose a 
 *   **formal**, **consistent** and **general** definition of Behavior Trees;
 * - **Optimized to control multiple agents**: you can use a single behavior 
 *   tree instance to handle hundreds of agents;
 * - It was **designed to load and save trees in a JSON format**, in order to 
 *   use, edit and test it in multiple environments, tools and languages;
 *
 **/
var b3 = function () {};


/**
 * Version of the library.
 * 
 * @property VERSION
 * @type {string}
 */
b3.VERSION = '0.1.0';


/**
 * 1 returned when a criterion has been met by a condition node or an action node
 * has been completed successfully.
 * @private SUCCESS
 * @return {TickStatus}*/
b3.SUCCESS = function () {
  return 1;
};

/**
 * 2 returned when a criterion has not been met by a condition node or an action 
 * node could not finish its execution for any reason.
 * 
 * @private FAILURE
 * @return {TickStatus}
 * */
b3.FAILURE = function () {
  return 2;
};

/**
 * 3 returned when an action node has been initialized but is still waiting the 
 * its resolution.
 * 
 * @private RUNNING
 * @return {TickStatus}
 * */
b3.RUNNING = function () {
  return 3;
};

/**
 * 4 Returned when some unexpected error happened in the tree, probably by a 
 * programming error (trying to verify an undefined variable). Its use depends 
 * on the final implementation of the leaf nodes.
 * 
 * @private ERROR
 * @return {TickStatus}
 * */
b3.ERROR = function () {
  return 4;
};

/**
 * handshake command
 * 
 * @property HANDSHAKE
 * @type {string}
 */
b3.HANDSHAKE = 'handshake';
/**
 * event string for None
 * 
 * @property NONE
 * @type {string}
 */
b3.NONE = 'None';
/**
 * event string for wakeup
 * 
 * @property WAKEUP
 * @type {string}
 */
b3.WAKEUP = 'WakeUp';
/**
 * Describes the node category as Composite.
 * 
 * @property COMPOSITE
 * @type {string}
 */
b3.COMPOSITE = 'composite';

/**
 * Describes the node category as Decorator.
 * 
 * @property DECORATOR
 * @type {string}
 */
b3.DECORATOR = 'decorator';

/**
 * Describes the node category as Action.
 * 
 * @property ACTION
 * @type {string}
 */
b3.ACTION = 'action';

/**
 * Describes the node category as Condition.
 * 
 * @property CONDITION
 * @type {string}
 */
b3.CONDITION = 'condition';

b3.TREENODE = 'treenode';

b3.MLMODEL = 'mlmodel';

/**
 * List of internal and helper functions in Behavior3JS.
 * 
 * @class b3
 **/


/**
 * This function is used to create unique IDs for trees and nodes.
 * 
 * (consult http://www.ietf.org/rfc/rfc4122.txt).
 *
 * @private createUUID
 * @return {string} A unique ID.
 **/
b3.createUUID = function () {

  return uuid.v4();
}

/**
 * load tree hirerachy from folderName
 * @param {string} [folderName="FSM" ]
 */
b3.load = function (folderName = "FSM") {
  const fs = require('fs');
  var path = require('path');
  return new Promise((resolveAll, rejectAll) => {
    function loadFolder(folder) {
      return new Promise((resolve, reject) => {
        fs.readdir(folderName + '/' + folder, (err, files) => {
          if (files) {
            files.forEach(file => {
              if (file.startsWith(".DS")) {
                return;
              }
              console.log(file)
              var cls = require(folderName + '/' + folder + '/' + file);
              var className = path.basename(file, '.js');
              b3[className] = cls;
            });

          }
          resolve(b3);
        });
      }).catch((ex) => {
        dblogger.error('error in reading files for ' + folderName + ' /' + folder, ex);
      });
    }


    //TODO: optimize reads to be parallel
    loadFolder('composites').then(() => {
      loadFolder('decorators').then(() => {
        loadFolder('actions').then(() => {
          loadFolder('conditions').then(() => {
            loadFolder('mlmodels').then(() => {
              resolveAll(b3);
            });
          });
        });
      });
    });

  })
}
module.exports = b3;
