const express = require('express');
const jwtAuth = require('../mwares/jwt-auth');

const authController = require('../controllers/auth');

const router = express.Router();

router.post('/login', authController.login);
router.get('/me', jwtAuth);

module.exports = router;
