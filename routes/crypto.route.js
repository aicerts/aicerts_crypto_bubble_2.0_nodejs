const express = require('express')
const cryptoController = require('../controllers/crypto.controller');

const router = express.Router()

router.get('/fetch-crypto', cryptoController.fetchCrypto);
router.get('/fetch-image/data/logos/:imageName', cryptoController.fetchImage);

module.exports = router