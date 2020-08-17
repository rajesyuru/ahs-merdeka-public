const express = require('express');
const { jwtAuth } = require('../mwares/jwt-auth');

const router = express.Router();
const gallonController = require('../controllers/gallon');
const { haveAccess, addAccess } = require('../permissions/gallon');

router.use(jwtAuth);

router.use((req, res, next) => {
    if (!haveAccess(req.authUser)) {
        return res.status(403).send('Forbidden');
    }

    next();
});

const mwareAdd = (req, res, next) => {
    if (!addAccess(req.authUser)) {
        return res.status(403).send('Forbidden');
    }

    next();
};

router.get('/', gallonController.fetch);
router.post('/', mwareAdd, gallonController.add);
router.put('/:gallon_id(\\d+)', mwareAdd, gallonController.edit);
router.delete('/:gallon_id(\\d+)', mwareAdd, gallonController.delete);

module.exports = router;
