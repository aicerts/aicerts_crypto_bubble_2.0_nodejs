// isAuthenticated.js

module.exports.isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      console.log("here")
      return next(); // If the user is authenticated, allow access
    }
    res.redirect("/health"); // Otherwise, redirect to login
  };
  