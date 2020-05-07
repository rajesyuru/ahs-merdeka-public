const express = require('express');

const {jwtAuth} = require('../mwares/jwt-auth');
const {canView, canEditAll, canEditMember} = require('../permissions/user');

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

const middlewareEditUser = (req, res, next) => {
    console.log(typeof req.authUser.id, typeof req.params.user_id)
    if (!canEditAll(req.authUser) && !canEditMember(req.authUser) && req.authUser.id != req.params.user_id) {
        return res.status(403)
            .send('Forbidden');
    }

    next();
}

router.get('/', middlewareUserView, usersController.users);
router.put('/:user_id(\\d+)', middlewareEditUser, usersController.edit);

module.exports = router;