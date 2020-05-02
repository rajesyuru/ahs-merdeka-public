const express = require('express');

const masterRouter = require('./master');
const authRouter = require('./auth');

const router = express.Router();

router.use('/api/v1/master', masterRouter);
router.use('/api/v1/auth', authRouter);

module.exports = router;