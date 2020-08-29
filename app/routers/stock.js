const express = require('express');
const { jwtAuth } = require('../mwares/jwt-auth');

const router = express.Router();
const stockController = require('../controllers/stock');
const { haveAccess, addAccess } = require('../permissions/stock');

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

router.get('/', stockController.fetch);
router.post('/', mwareAdd, stockController.add);
router.put('/:stocks_id(\\d+)', mwareAdd, stockController.edit);
router.delete('/:stocks_id(\\d+)', mwareAdd, stockController.delete)
router.get('/report', mwareAdd, stockController.report);

module.exports = router;
