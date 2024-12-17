const { Strategy: GoogleStrategy } = require("passport-google-oauth2");
const dotenv = require("dotenv");
const passport = require("passport");
const User = require("../models/user");

const ApiError = require("./ApiError");
const createUser = require("./createUser");

// Load environment variables
dotenv.config();

// Google OAuth strategy
const googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    scope: ["profile", "email"],
    passReqToCallback: true,
    
  },
  async (req, accessToken, refreshToken, profile, done) => {
    const sourceApp = typeof req.query.state === 'string' ? req.query.state : "source app not provided"; // Use "default" if undefined

    const maxRetries = 3; // Define the number of retries
    let attempt = 0;
    let result;

    while (attempt < maxRetries) {
      try {
        result = await createUser(profile, accessToken, sourceApp);
        
        if (result.status) {
         
          return done(null, result);
        } else {
          return done(new ApiError(400, result.message || "Error while creating user"));
        }
      } catch (error) {
        attempt++;
        if (attempt >= maxRetries) {
          console.log(error)
          // Return an internal server error if all attempts fail
          return done(new ApiError(500, "Internal server error")); // Handle any unexpected errors
        }
        // Optionally, you can add a delay before retrying
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
      }
    }
  }
);

// Serialize user ID into session
passport.serializeUser((user, done) => {
  done(null, user.details._id);
});


// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(new ApiError(500, "Failed to deserialize user"));
  }
});

// Initiates Google OAuth login
const googleAuth = (req, res, next) => {
  const sourceApp = req.query.sourceApp; // Extract sourceApp from the query

  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: sourceApp, // Pass sourceApp via the state parameter
    prompt: 'select_account'
  })(req, res, next);
};

// Google OAuth callback
const googleAuthCallback = passport.authenticate("google", {
  failureRedirect: "/health",
});

// Google authentication redirect handler
const googleAuthRedirect = (req, res) => {
  // Successful authentication, redirect home or wherever you want.
  res.redirect("/");
};

// Export the functions
module.exports = {
  googleStrategy,
  googleAuth,
  googleAuthCallback,
  googleAuthRedirect,
};
