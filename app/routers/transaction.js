const express = require('express');

const transactionController = require('../controllers/transaction');
const { jwtAuth } = require('../mwares/jwt-auth');
const { haveAccess, addAccess } = require('../permissions/transaction');

const router = express.Router();

router.use(jwtAuth);

router.use((req, res, next) => {
    if (!haveAccess(req.authUser)) {
        return res.status(403).send('Forbidden')
    }

    next();
})

const mwareAdd = (req, res, next) => {
    if (!addAccess(req.authUser)) {
        return res.status(403).send('Forbidden');
    }

    next();
};

router.get('/', transactionController.fetch);
router.post('/', mwareAdd, transactionController.add);
router.put('/:transaction_id(\\d+)', mwareAdd, transactionController.edit);
router.delete('/:transaction_id(\\d+)', mwareAdd, transactionController.delete);
router.get('/revenue', mwareAdd, transactionController.revenue)

module.exports = router;
