/**
 * Shop Routes
 * Handles product browsing and shop page
 */

const express = require("express");
const router = express.Router();
const productModel = require("./products");
const userModel = require("./users");
const { isLoggedIn } = require("../middleware/auth");

// Shop page - browse products
router.get("/", isLoggedIn, async (req, res) => {
  try {
    const products = await productModel.find();
    const user = await userModel.findById(req.user._id);
    res.render("shop", { products, user });
  } catch (error) {
    console.error("Error loading shop:", error);
    res.status(500).send("Error loading shop");
  }
});

module.exports = router;
