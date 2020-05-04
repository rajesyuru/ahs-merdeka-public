const express = require('express');

const masterRouter = require('./master');
const authRouter = require('./auth');
const merchantRouter = require('./merchant');

const router = express.Router();

router.use('/api/v1/master', masterRouter);
router.use('/api/v1/auth', authRouter);
router.use('/api/v1/merchants', merchantRouter);

module.exports = router;