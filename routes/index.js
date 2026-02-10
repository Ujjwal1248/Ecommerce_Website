/**
 * Main Router
 * Coordinates all route modules for the e-commerce application
 * Follows enterprise-level modular architecture
 */

const express = require("express");
const router = express.Router();
const userModel = require("./users");
const { isLoggedIn } = require("../middleware/auth");

// Import route modules
const authRoutes = require("./auth");
const shopRoutes = require("./shop");
const paymentRoutes = require("./payment");
const bargainRoutes = require("./bargain-routes");
const adminRoutes = require("./admin");
const profileRoutes = require("./profile");

// ============ Public Routes ============
router.get("/", (req, res) => {
  res.render("index", { footer: false });
});

router.get("/contact", (req, res) => {
  res.render("contact");
});

// ============ Mount Route Modules ============

// Authentication routes (/login, /register, /logout)
router.use("/", authRoutes);

// Profile routes (/profile)
router.use("/profile", profileRoutes);

// Shop routes (/shop)
router.use("/shop", shopRoutes);

// Payment routes (wallet, checkout, direct pay)
router.use("/", paymentRoutes);

// Bargain routes - mount on /bargain prefix
router.use("/bargain", bargainRoutes);

// Admin routes - mount on /admin prefix
router.use("/admin", adminRoutes);

// ============ Cart Routes ============
// View cart
router.get("/cart", isLoggedIn, async (req, res) => {
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
router.get("/addtocart/:productID", isLoggedIn, async (req, res) => {
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
router.post("/addtocart/:productID", isLoggedIn, async (req, res) => {
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
router.post("/removeFromCart/:productID", isLoggedIn, async (req, res) => {
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

// ============ Legacy Routes for Backward Compatibility ============

// Bargain requests (legacy route)
router.get("/bargains", isLoggedIn, async (req, res, next) => {
  const bargainModel = require("./bargain");
  try {
    const bargains = await bargainModel
      .find({ vendorId: req.user._id, status: "pending" })
      .populate("productId buyerId");
    
    res.render("bargain-requests", { bargains });
  } catch (error) {
    console.error("Error fetching bargains:", error);
    res.status(500).send("Error fetching bargain requests");
  }
});

// Admin products (legacy route)
router.get("/admin-products", isLoggedIn, async (req, res) => {
  const productModel = require("./products");
  const saleModel = require("./sale");
  
  try {
    const products = await productModel.find({ userId: req.user._id });
    const productIds = products.map((p) => p._id);

    const sales = await saleModel.find({ productId: { $in: productIds } })
      .populate("productId userId");

    const totalEarnings = sales.reduce((acc, sale) => acc + sale.totalEarnings, 0);
    
    res.render("admin-products", { products, sales, totalEarnings });
  } catch (err) {
    console.error("Error fetching admin products:", err);
    res.status(500).send("Error fetching admin products");
  }
});

// Delete product (legacy route)
router.post("/delete-product/:productId", isLoggedIn, async (req, res) => {
  const productModel = require("./products");
  
  try {
    await productModel.findOneAndDelete({
      _id: req.params.productId,
      userId: req.user._id,
    });
    res.redirect("/admin-products");
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).send("Error deleting product");
  }
});

module.exports = router;
