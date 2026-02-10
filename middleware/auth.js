/**
 * Authentication Middleware
 * Handles user authentication checks
 */

const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
};

module.exports = { isLoggedIn };
