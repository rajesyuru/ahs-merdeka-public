const express = require('express');

const productController = require('../controllers/product');
const {jwtAuth} = require('../mwares/jwt-auth');

const {canView, canAdd, canFetchStocks} = require('../permissions/product');

const router = express.Router();

router.use(jwtAuth);

const middlewareCanAdd = (req, res, next) => {
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

const middlewareCanFetchStocks = (req, res, next) => {
    if (!canFetchStocks(req.authUser)) {
        res.status(403);
        return res.send('Forbidden');
    }

    next();
}

router.get('/', middlewareCanView, productController.fetch);
router.post('/', middlewareCanAdd, productController.add);
router.put('/:product_id(\\d+)', productController.edit);
router.get('/stocks', middlewareCanFetchStocks, productController.fetchStocks);
router.delete('/:product_id(\\d+)', productController.delete)
router.get('/stocks/:product_id(\\d+)', productController.stock)
router.get('/sales/:week_code(\\d+)', productController.sales)

module.exports = router