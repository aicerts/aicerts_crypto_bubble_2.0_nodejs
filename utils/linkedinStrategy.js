const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const dotenv = require('dotenv');
const passport = require("passport");
const User = require("../models/user");

const ApiError = require("./ApiError");
const createUser = require("./createUser");


dotenv.config();

// LinkedIn Authentication Middleware
const linkedinAuth = (req, res, next) => {
  const sourceApp = req.query.sourceApp; // Extract sourceApp from the query
  
  passport.authenticate('linkedin', {
    state: sourceApp,  // Optional, can be used for CSRF protection
    scope: ['openid', 'profile', 'email'],
  })(req, res, next);
};

const linkedinAuthCallback = passport.authenticate('linkedin', {
  failureRedirect: '/health',
});

const linkedinAuthRedirect = (req, res) => {
  // Successful authentication, redirect home or wherever you want.
  res.redirect('/');
};

const linkedinStrategy = new LinkedInStrategy(
  {
    clientID: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    callbackURL: process.env.LINKEDIN_CALLBACK_URL,
    scope: ['openid', 'profile', 'email'],
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
          return done(new ApiError(400,result.message || "Error while creating user" ));
        }
      } catch (error) {
        attempt++;
        if (attempt >= maxRetries) {
          // Return an internal server error if all attempts fail
          return done(new ApiError(500,"Internal server error" ));
        }
        // Optionally, you can add a delay before retrying
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
      }
    }
  }
);

passport.serializeUser((user, done) => {
  done(null, user.details._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id); // Retrieve user by ID
    done(null, user);
  } catch (error) {
    done(new ApiError( 500,"Failed to deserialize user"));
  }
});

module.exports = {
  linkedinAuth,
  linkedinAuthCallback,
  linkedinAuthRedirect,
  linkedinStrategy
};
