export interface Entity {
    name: string;
    value: string;
    score?: number;
}
export class MessageModel {

    _intentId: string;
    entities: any;
    userId: string;
    originRoute: string;
    _raw: object;
    constructor() {
        this.entities = {};
        this.intentId = '';
    }

    addEntity(entity: Entity) {
        this.entities[entity.name] = this.entities[entity.name] || [];
        this.entities[entity.name].push(entity.value);
    }
    set intentId(v) {
        this._intentId = v;
    }

    get intentId() {
        return this._intentId;
    }

    set raw(value) {
        this._raw = value;
    }

    get raw() {
        return this.raw;
    }

};
