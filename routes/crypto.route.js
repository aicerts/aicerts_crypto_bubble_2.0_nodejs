const express = require("express");
const cryptoController = require("../controllers/crypto.controller");

const router = express.Router();

router.get("/fetch-crypto", cryptoController.fetchCrypto);
// router.get("/fetch-image/data/logos/:imageName", cryptoController.fetchImage);
router.get(
  "/fetch/graph/:timeframe/:cryptoId/:currency",
  cryptoController.fetchCryptoGraphdata
);

router.get("/fetch/image/data/logos/:imageName", cryptoController.fetchCryptoImage);

module.exports = router;
