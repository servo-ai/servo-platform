var DAL = require("../dal/router");
var _mid = 0;

/**
 * a model for the message object
 *  @memberof module:Core
 */
class MessageModel {
  constructor(recipient = {}, sender = {}, type = null, text = null, messengerType = null, fsmID = null, raw = null) {
    /***
     * @property fromUser
     * @type {Object}
     */
    this.fromUser = {
      id: sender.id,
      firstName: sender.firstName,
      lastName: sender.lastName,
      channel: sender.channel
    };
    /***
     * @property toUser
     * @type {Object}
     */
    this.toUser = {
      id: recipient.id,
      firstName: recipient.firstName,
      lastName: recipient.lastName,
      channel: recipient.channel
    };
    /***
     * @property type 
     * @type {string}
     */
    this.type = type;
    /***
     * @property raw raw message object 
     * @type {string|Object}
     */
    this.raw = raw;
    /***
     * @property messengerType channel 
     * @type {string}
     */
    this.messengerType = messengerType;
    /***
     * @property raw raw message text 
     * @type {Object}
     */
    this.text = text;
    /***
     * @property fsmId 
     * @type {string}
     */
    this.fsmId = this.fsm_id = fsmID;
    /***
     * @property mid running message id
     * @type {number}
     */
    this.mid = _mid++;
    /***
     * @property intentId 
     * @type {string}
     */
    this.intentId = null;
    /***
     * @property entities
     * @type {Array<KeyValuePair>}
     */
    this.entities = null;



    /***
     * overall normalized score
     *  @property {number} score
     */
    this.score = -1;


  }

  addEntity(entityName, entityValue) {
    this.entities = this.entities || {};
    let ettArray = this.entities[entityName] || [];
    ettArray.push(entityValue);
    this.entities[entityName] = ettArray;
  }

  getEntity(entityName, entityIndex = 0) {
    return this.entities && this.entities[entityName] && this.entities[entityName][entityIndex];
  }

  static create(obj) {
    return new MessageModel(obj.toUser, obj.fromUser, obj.type, obj.text, obj.messengerType, obj.fsmId, obj.raw);
  }

  save() {
    DAL.Message.upsert(this);
  }
}
module.exports = MessageModel;
