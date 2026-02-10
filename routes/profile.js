/**
 * Profile Routes
 * Handles user profile page
 */

const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middleware/auth");

// User profile page
router.get("/", isLoggedIn, (req, res) => {
  res.render("profile", { user: req.user });
});

module.exports = router;
