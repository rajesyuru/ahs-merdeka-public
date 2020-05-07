const express = require('express');

const masterController = require('../controllers/master');
const {jwtAuth} = require('../mwares/jwt-auth');

const router = express.Router();

router.get('/groups', masterController.groups);

module.exports = router;