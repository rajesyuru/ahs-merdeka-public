const express = require('express');

const {jwtAuth} = require('../mwares/jwt-auth');
const {canView} = require('../permissions/user');

const usersController = require('../controllers/user');

const router = express.Router();

router.use(jwtAuth);

const middlewareUserView = (req, res, next) => {
    if (!canView(req.authUser)) {
        return res.status(403)
            .send('Forbidden')
    };

    next();
};

router.get('/', middlewareUserView, usersController.users);
router.put('/:user_id(\\d+)', usersController.edit);

module.exports = router;