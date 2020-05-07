const express = require('express');

const productController = require('../controllers/product');
const {jwtAuth} = require('../mwares/jwt-auth');

const {canView, canAdd} = require('../permissions/product');

const router = express.Router();

router.use(jwtAuth);

const middlewareCanAddEdit = (req, res, next) => {
    if (!canAdd(req.authUser)) {
        res.status(403);
        return res.send('Forbidden');
    }

    next();
};

const middlewareCanView = (req, res, next) => {
    if (!canView(req.authUser)) {
        res.status(403);
        return res.send('Forbidden');
    }

    next();
};

router.get('/', middlewareCanView, productController.fetch);
router.post('/', middlewareCanAddEdit, productController.add);
router.put('/:product_id(\\d+)', middlewareCanAddEdit, productController.edit);

module.exports = router