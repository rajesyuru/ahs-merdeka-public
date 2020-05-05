const express = require('express');

const productController = require('../controllers/product');
const {jwtAuth} = require('../mwares/jwt-auth');

const router = express.Router();

router.get('/', productController.fetch);
router.post('/', jwtAuth, productController.add);

module.exports = router