const express = require('express');
const { jwtAuth } = require('../mwares/jwt-auth');
const { canView, canAdd } = require('../permissions/customer');

const router = express.Router();

router.use(jwtAuth);

const customerController = require('../controllers/customer');

const middlewareCanView = (req, res, next) => {
    if (!canView(req.authUser)) {
        return res.status(403).send('Forbidden');
    }

    next();
};

const middlewareCanAdd = (req, res, next) => {
    if (!canAdd(req.authUser)) {
        return res.status(403).send('Forbidden');
    }

    next();
}

router.get('/', middlewareCanView, customerController.fetch);
router.post('/', middlewareCanAdd, customerController.add);
router.put('/:customer_id(\\d+)', customerController.edit);
router.delete('/:customer_id(\\d+)', customerController.delete)

module.exports = router;