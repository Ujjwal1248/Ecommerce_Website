/**
 * Admin Routes
 * Handles product management and sales tracking
 */

const express = require("express");
const router = express.Router();
const productModel = require("./products");
const saleModel = require("./sale");
const upload = require("./multer");
const { isLoggedIn } = require("../middleware/auth");

// Admin dashboard - add new product
router.get("/", isLoggedIn, (req, res) => {
  res.render("admin");
});

// Create new product
router.post("/", upload.single("pPhoto"), isLoggedIn, async (req, res) => {
  try {
    const product = new productModel({
      pName: req.body.pName,
      pPrice: req.body.pPrice,
      pDescription: req.body.pDescription,
      userId: req.user._id,
      pPhoto: req.file.filename,
    });
    
    await product.save();
    res.redirect("/admin");
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).send("Error creating product");
  }
});

// View all products and sales for current user
router.get("/products", isLoggedIn, async (req, res) => {
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

// Delete product
router.post("/delete-product/:productId", isLoggedIn, async (req, res) => {
  try {
    await productModel.findOneAndDelete({
      _id: req.params.productId,
      userId: req.user._id, // Ensure user can only delete their own products
    });
    res.redirect("/admin/products");
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).send("Error deleting product");
  }
});

module.exports = router;
