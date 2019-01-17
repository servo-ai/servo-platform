var uuid = require("uuid");
var Promise = require('promise');
var dblogger = require("../utils/dblogger.js");
var baseModel = require("./base-model")
var _ = require('underscore');
var DAL = require("../dal/router");

function dbEntityModel() { };

module.exports = dbEntityModel;
dbEntityModel.getDbEntity = function (dbEntityType, dbEntity_id) {
    return DAL.DbEntity.get(dbEntityType, dbEntity_id);
}

// get all
dbEntityModel.getAllDbEntitys = function (dbEntityType, pageIndex, pageSize, sortBy, asc) {
    return DAL.DbEntity.all(dbEntityType, pageIndex, pageSize, sortBy, asc);
}

// delete by id
dbEntityModel.deleteDbEntity = function (dbEntityType, dbEntityId) {
    return DAL.DbEntity.delete(dbEntityType, dbEntityId);
}
// upsert by id
dbEntityModel.upsertDbEntity = function (dbEntityType, dbEntityId, dbEntityObject) {
    return DAL.DbEntity.upsert(dbEntityType, dbEntityId, dbEntityObject);
}
// get all
dbEntityModel.getAllDbEntitysByPage = function (dbEntityTypei, pageIndex, pageSize) {
    return DAL.DbEntity.allByPage(dbEntityType, dbEntityId);
}
