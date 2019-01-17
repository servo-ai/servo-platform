var express = require('express');
var router = express.Router();
var dbEntityModel = require("../models/dbentitymodel");
var config = require('../config');

if (config.noEditorEndpoints) {
    router.post("/", function (req, res) {

        res.status(400).send("noEditorEndpoints is set");
    });
    module.exports = router;
    return;
}
/**
 * upsert dbEntity
 */
router.post("/upsertDbEntity", function (req, res) {

    console.log('upsertDbEntity', req.body.type, req.body.entity.id);
    if (!req.body.entity.id || !req.body.type) {
        return res.status(400).send({ "status": "error", "message": "A document id and type is required" });
    }

    dbEntityModel.upsertDbEntity(req.body.type, req.body.entity.id, req.body.entity).then(function (dbEntity) {
        console.log('saving DbEntity', dbEntity);
        res.send(dbEntity);
    }).catch(function (err) {
        dblogger.error('upsertDbEntity:', err);
        return res.status(400).send({ message: "err in upsertDbEntity:" + err });
    });

});


/**
 * get dbEntity
 */
router.get("/getDbEntity", function (req, res) {

    if (!req.query.dbEntity_id || !req.query.type) {
        return res.status(400).send({ "status": "error", "message": "A dbEntity id and type is required" });
    }

    dbEntityModel.getDbEntity(req.query.type, req.query.dbEntity_id).then(function (dbEntity) {
        console.log('sending dbEntity', req.query.dbEntity_id);
        res.send(dbEntity);
    }).catch(function (err) {
        console.error('dbEntity', err);
        return res.status(400).send(err);
    });

});

/**
 * delete dbEntity
 */
router.post("/deleteDbEntity", function (req, res) {

    console.log('deleteDbEntity', req.body.type, req.body.entity.id);
    if (!req.body.entity.id || !req.body.type) {
        return res.status(400).send({ "status": "error", "message": "A document id and type is required" });
    }

    dbEntityModel.deleteDbEntity(req.body.type, req.body.entity.id).then(function (dbEntityId) {
        console.log('deleted DbEntity', dbEntityId);
        res.send(dbEntityId);
    }).catch(function (err) {
        dblogger.error('deleteDbEntity:', req.body.type, req.body.entity.id, err);
        return res.status(400).send({ message: "err in deleteDbEntity: " + err });
    });

});

/**
 * get dbEntity
 */
router.get("/getAllDbEntitys", function (req, res) {

    console.log('getAllDbEntitys', req.query.type);
    if (!req.query.type) {
        return res.status(400).send({ "status": "error", "message": "A dbEntity type is required" });
    }
    dbEntityModel.getAllDbEntitys(req.query.type, req.query.pageIndex, req.query.pageSize,
        req.query.sortBy, req.query.asc).then(function (dbEntitys) {
            res.send(dbEntitys);
        }).catch(function (err) {
            return res.status(400).send("error" + err);
        });

});


router.post("/deleteDbEntity", function (req, res) {
    if (!req.body.dbEntity_id) {
        return res.status(400).send({ "status": "error", "message": "A dbEntity id is required" });
    }
    dbEntityModel.delete(req.body.dbEntity_id, function (error, result) {
        if (error) {
            return res.status(400).send(error);
        }
        res.send(result);
    });
});

module.exports = router;
