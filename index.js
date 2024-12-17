const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const httpStatus = require("http-status");
const config = require("./config/config");
const morgan = require("./config/morgan");
const compression = require("compression");
const { errorConverter, errorHandler } = require("./middlewares/error");
const ApiError = require("./utils/ApiError");
const mongoSanitize = require("express-mongo-sanitize");
const routes = require("./routes");
const passport = require("passport");
const { googleStrategy, googleAuth, googleAuthCallback, googleAuthRedirect } = require("./utils/googleStrategy");
const session = require("express-session");
const OauthRouter = require("./routes/Oauth");
const { isAuthenticated } = require("./middlewares/authMiddleware");
const  generateJwtToken  = require("./utils/authUtil");
const dotenv=require("dotenv");
const { linkedinAuth, linkedinAuthCallback, linkedinAuthRedirect, linkedinStrategy } = require("./utils/linkedinStrategy");


const app = express();
dotenv.config();

app.use(morgan.successHandler);
app.use(morgan.errorHandler);


// passport.use(linkedinStrategy);

app.use(session({
  secret: process.env.SESSION_SECRET || 'default_secret', // Provide a fallback value if SESSION_SECRET is undefined
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Send cookie only over HTTPS in production
    httpOnly: true, // Prevent client-side access to the cookie
    sameSite: 'lax', // Use 'lax' or 'none' depending on your app's requirements
    maxAge: 1000 * 60 * 60 * 24, // Cookie expiry time
  },
}));





// app.use(helmet());

app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

app.use(mongoSanitize());

// app.use(compression())

// enable cors
app.use(cors());
app.options("*", cors());
// Health check route
app.get("/health", (req, res) => {
    res.status(200).json({ status: "Healthy", message: "Server is running properly." });
  });

  // app.use(session({
  //   secret: process.env.SESSION_SECRET || 'your-secret-key',
  //   resave: false,
  //   saveUninitialized: true,
  //   cookie: { secure: false } // For development, set `secure` to false, but set to true in production with HTTPS
  // }));



  app.use(passport.initialize());
  app.use(passport.session());


  passport.use(googleStrategy);
  passport.use(linkedinStrategy)
// v1 api routes
app.use("/v1", routes);
app.get("/api/auth/google",googleAuth)
app.get("/api/auth/linkedin",linkedinAuth)
app.get("/api/auth/google/callback", googleAuthCallback, googleAuthRedirect)
app.get("/api/auth/linkedin/callback", linkedinAuthCallback, linkedinAuthRedirect)

app.get("/", isAuthenticated, async (req, res) => {
  // If user is authenticated, retrieve their email
  const user = req.user // 'req.user' is available after successful login
  const JWTToken = await generateJwtToken();
  if (user) {
    // Format the response according to the frontend team's needs
    const responseData = {
      success: true,
      statusCode: 200,
      code: JWTToken,
      message: "Credential is valid",
      data: {
        id: user.googleId, // User's ID (use user.id if you store it in a different field)
        Useremail: user.email, // User's email
        nickname: user.username, // Assuming 'username' is available in the user object
        firstName: user.firstName || "", // Optional, fill in if available
        lastName: user.lastName || "", // Optional, fill in if available
        displayName: user.username, // Display name for the user
      },
    };
    
      console.log("Authentication successfull...")
     
    res.redirect(`${process.env.CRYPTO_FRONTEND}/?token=${responseData.code}&userEmail=${responseData.data.Useremail}` )
    } else {
      res.status(403).json({
        status: 403,
        success: false,
        message: "User not authenticated",
        details: null,
      });
    }
  });

// send back a 404 error for any unknown api request
// app.use((req, res, next) => {
//     next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
// });

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

module.exports = app;
