const express = require("express")
const { googleAuth, googleAuthRedirect, googleAuthCallback } = require("../utils/googleStrategy")

 const OauthRouter = express.Router()

OauthRouter.route("/auth/google").get(googleAuth)
OauthRouter.get("/auth/google/callback", googleAuthCallback, googleAuthRedirect)


module.exports =OauthRouter