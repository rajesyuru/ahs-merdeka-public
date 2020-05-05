const express = require('express');

const {jwtAuth} = require('../mwares/jwt-auth');
const {canAccess} = require('../permissions/merchant');

const usersController = require('../controllers/user');

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

router.get('/', usersController.users);

module.exports = router;