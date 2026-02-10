/**
 * Bargain Routes  
 * Handles bargain requests between buyers and vendors
 */

const express = require("express");
const router = express.Router();
const productModel = require("./products");
const userModel = require("./users");
const bargainModel = require("./bargain");
const { isLoggedIn } = require("../middleware/auth");

// Submit bargain request
router.post("/:productId", isLoggedIn, async (req, res) => {
  try {
    const product = await productModel.findById(req.params.productId);
    const proposedPrice = parseFloat(req.body.proposedPrice);
    
    if (!product || isNaN(proposedPrice)) {
      return res.status(400).send("Invalid product or price");
    }

    await bargainModel.create({
      buyerId: req.user._id,
      vendorId: product.userId,
      productId: product._id,
      proposedPrice
    });

    res.redirect("/shop");
  } catch (error) {
    console.error("Error creating bargain:", error);
    res.status(500).send("Error creating bargain request");
  }
});

// View all bargain requests (vendor side)
router.get("/requests", isLoggedIn, async (req, res) => {
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

// Approve bargain request
router.post("/:id/approve", isLoggedIn, async (req, res) => {
  try {
    const bargain = await bargainModel.findById(req.params.id);
    
    if (!bargain || bargain.vendorId.toString() !== req.user._id.toString()) {
      return res.status(403).send("Unauthorized");
    }

    bargain.status = "approved";
    await bargain.save();

    const buyer = await userModel.findById(bargain.buyerId);
    buyer.cart.push({
      product: bargain.productId,
      quantity: 1,
      bargainedPrice: bargain.proposedPrice,
    });
    await buyer.save();

    res.redirect("/bargain/requests");
  } catch (error) {
    console.error("Error approving bargain:", error);
    res.status(500).send("Error approving bargain");
  }
});

// Reject bargain request
router.post("/:id/reject", isLoggedIn, async (req, res) => {
  try {
    const bargain = await bargainModel.findById(req.params.id);
    
    if (!bargain || bargain.vendorId.toString() !== req.user._id.toString()) {
      return res.status(403).send("Unauthorized");
    }

    bargain.status = "rejected";
    await bargain.save();

    res.redirect("/bargain/requests");
  } catch (error) {
    console.error("Error rejecting bargain:", error);
    res.status(500).send("Error rejecting bargain");
  }
});

module.exports = router;
