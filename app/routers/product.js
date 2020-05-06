const express = require('express');

const productController = require('../controllers/product');
const {jwtAuth} = require('../mwares/jwt-auth');

const router = express.Router();

router.use(jwtAuth);

router.get('/', productController.fetch);
router.post('/', productController.add);

module.exports = router