const express = require('express');

const {jwtAuth} = require('../mwares/jwt-auth');
const {canAccess} = require('../permissions/merchant');

const masterController = require('../controllers/master');

const router = express.Router();

router.use(jwtAuth);

// make sure user can access
router.use((req, res, next) => {
    console.log(req.authUser);
    if (!canAccess(req.authUser)) {
        res.status(403);
        return res.send('Forbidden');
    }

    next();
});

router.get('/groups', masterController.groups);
router.get('/users', masterController.users);

module.exports = router;