const express = require('express');

const masterRouter = require('./master');

const router = express.Router();

router.use('/api', masterRouter);

module.exports = router;