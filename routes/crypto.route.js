const express = require("express");
const cryptoController = require("../controllers/crypto.controller");
const { signup, verifyOtp, setPassword, login, forgotPassword, resetPassword, changePassword, logoutHandler } = require("../controllers/user");
const { updateWishlist, deleteWishlistSymbol, getUserWishlist } = require("../controllers/watchlist");

const router = express.Router();

router.get("/fetch-crypto", cryptoController.fetchCrypto);
router.get(
  "/fetch/graph/:timeframe/:cryptoId/:currency",
  cryptoController.fetchCryptoGraphdata
);

router.get("/fetch/image/data/logos/:imageName", cryptoController.fetchCryptoImage);
router.get("/fetch/news/:symbol", cryptoController.fetchNewsWithOriginalUrl)
router.get("/fetch/aiimage/:imageName", cryptoController.fetchAiImage);


router.get("/fetch/performance/:symbol", cryptoController.fetchPerformanceData);

// Route for Step 1: Initiate Signup and Send OTP
router.post('/signup', signup);

// Route for Step 2: Verify OTP
router.post('/signup/verify-otp', verifyOtp);

// Route for Step 3: Set Password and Complete Signup
router.post('/signup/set-password', setPassword);
router.post("/login", login)
router.post("/login/forgot-password", forgotPassword)
router.post("/login/reset-password", resetPassword)
router.post("/login/change-password", changePassword)
router.get("/logout",logoutHandler)
router.post("/updateWishlist",updateWishlist)
router.delete("/deleteWishlist",deleteWishlistSymbol)
router.get("/getUserWishlist", getUserWishlist)



module.exports = router;
