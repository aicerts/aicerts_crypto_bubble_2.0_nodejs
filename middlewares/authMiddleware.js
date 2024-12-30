// isAuthenticated.js


module.exports.isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next(); // If the user is authenticated, allow access
    }
    res.redirect("/api/health"); // Otherwise, redirect to login
  };
  