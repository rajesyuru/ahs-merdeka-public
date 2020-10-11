const express = require('express');
const { jwtAuth } = require('../mwares/jwt-auth');

const router = express.Router();
const productGroupController = require('../controllers/product_group');
const { haveAccess, addAccess } = require('../permissions/product_group');

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

router.get('/', productGroupController.fetch);
router.post('/', mwareAdd, productGroupController.add);
router.put('/:id(\\d+)', mwareAdd, productGroupController.edit);
router.delete('/:id(\\d+)', mwareAdd, productGroupController.delete);
router.put('/refresh_stocks/:id(\\d+)', mwareAdd, productGroupController.refresh_stocks);

module.exports = router;