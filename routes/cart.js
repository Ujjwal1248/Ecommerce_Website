/**
 * Cart Routes
 * Handles shopping cart operations
 */

const express = require("express");
const router = express.Router();
const userModel = require("./users");
const { isLoggedIn } = require("../middleware/auth");

// View cart
router.get("/", isLoggedIn, async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.user.email }).populate("cart.product");
    let totalPrice = 0;
    
    user.cart.forEach(item => {
      const price = item.bargainedPrice || item.product.pPrice;
      totalPrice += price * item.quantity;
    });
    
    res.render("cart", { user, cartItems: user.cart, totalPrice });
  } catch (error) {
    console.error("Error loading cart:", error);
    res.status(500).send("Error loading cart");
  }
});

// Add to cart (GET - quick add from shop)
router.get("/add/:productID", isLoggedIn, async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.user.email });
    const cartItem = user.cart.find(item => item.product.toString() === req.params.productID);
    
    if (cartItem) {
      cartItem.quantity++;
    } else {
      user.cart.push({ product: req.params.productID });
    }
    
    await user.save();
    res.redirect("/shop");
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).send("Error adding to cart");
  }
});

// Add to cart (POST - with custom quantity)
router.post("/add/:productID", isLoggedIn, async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.user.email });
    const quantity = parseInt(req.body.quantity) || 1;
    const cartItem = user.cart.find(item => item.product.toString() === req.params.productID);
    
    if (cartItem) {
      cartItem.quantity += quantity;
    } else {
      user.cart.push({ product: req.params.productID, quantity: quantity });
    }
    
    await user.save();
    res.json({ success: true, message: "Added to cart successfully!" });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ success: false, message: "Error adding to cart" });
  }
});

// Remove from cart
router.post("/remove/:productID", isLoggedIn, async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.user.email });
    const index = user.cart.findIndex(item => item.product.toString() === req.params.productID);
    
    if (index !== -1) {
      if (user.cart[index].quantity > 1) {
        user.cart[index].quantity--;
      } else {
        user.cart.splice(index, 1);
      }
    }
    
    await user.save();
    res.redirect("/cart");
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).send("Error removing from cart");
  }
});

module.exports = router;
