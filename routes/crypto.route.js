const express = require("express");
const cryptoController = require("../controllers/crypto.controller");

const router = express.Router();

router.get("/fetch-crypto", cryptoController.fetchCrypto);
router.get("/fetch-image/data/logos/:imageName", cryptoController.fetchImage);
router.get(
  "/fetch-cryptoGraphData/:timeframe/:cryptoId/:currency",
  cryptoController.fetchCryptoGraphdata
);

module.exports = router;
