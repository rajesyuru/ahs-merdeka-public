const express = require('express');

const masterRouter = require('./master');

const router = express.Router();

router.use('/api/v1', masterRouter);

module.exports = router;