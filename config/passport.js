/**
 * Passport Configuration
 * Sets up authentication strategy
 */

const passport = require("passport");
const LocalStrategy = require("passport-local");
const userModel = require("../routes/users");

const configurePassport = () => {
  passport.use(new LocalStrategy(userModel.authenticate()));
  passport.serializeUser(userModel.serializeUser());
  passport.deserializeUser(userModel.deserializeUser());
};

module.exports = configurePassport;
