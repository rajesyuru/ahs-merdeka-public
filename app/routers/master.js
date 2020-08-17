const express = require('express');

const masterController = require('../controllers/master');
const { jwtAuth } = require('../mwares/jwt-auth');

const router = express.Router();

router.use(jwtAuth);

router.use((req, res, next) => {
    if (req.authUser.merchant_id !== null) {
        return res.status(403).send({
            status: 'Forbidden',
            message: 'Must be super admin to access',
        });
    }

    next();
});

router.get('/groups', masterController.groups);
router.get('/add-merchants', masterController.setMerchantId);

module.exports = router;
