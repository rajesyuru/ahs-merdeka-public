const express = require('express');
const {jwtAuth, jwtRefreshAuth} = require('../mwares/jwt-auth');

const authController = require('../controllers/auth');

const router = express.Router();

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/refresh-token', jwtRefreshAuth, authController.refreshToken);
router.get('/me', jwtAuth, authController.me);

module.exports = router;
