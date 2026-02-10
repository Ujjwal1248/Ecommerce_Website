/**
 * Authentication Routes
 * Handles login, register, logout
 */

const express = require("express");
const passport = require("passport");
const router = express.Router();
const userModel = require("./users");

// Login page
router.get("/login", (req, res) => {
  res.render("login", { footer: false });
});

// Login POST
router.post("/login", passport.authenticate("local", {
  successRedirect: "/shop",
  failureRedirect: "/login",
}));

// Register page
router.get("/register", (req, res) => {
  res.render("register");
});

// Register POST
router.post("/register", async (req, res) => {
  try {
    const user = new userModel({
      fullName: req.body.fullName,
      username: req.body.username,
      email: req.body.email,
    });
    
    await userModel.register(user, req.body.password);
    passport.authenticate("local")(req, res, () => {
      res.redirect("/shop");
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.redirect("/register");
  }
});

// Logout
router.get("/logout", (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect("/login");
  });
});

module.exports = router;
