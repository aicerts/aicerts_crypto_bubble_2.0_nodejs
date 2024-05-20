const express = require('express')
const cryptoController = require('../controllers/crypto.controller');

const router = express.Router()

router.get('/fetch-crypto', cryptoController.fetchCrypto)

module.exports = router