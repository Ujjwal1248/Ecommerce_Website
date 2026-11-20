/**
 * Payment Routes
 * Handles wallet operations, stripe payments, and checkout
 */

const express = require("express");
const router = express.Router();
const userModel = require("./users");
const saleModel = require("./sale");
const { isLoggedIn } = require("../middleware/auth");
const stripe = process.env.STRIPE_SECRET_KEY
  ? require("stripe")(process.env.STRIPE_SECRET_KEY)
  : null;

const requireStripe = (res) => {
  if (!stripe) {
    res.status(503).json({ error: "Stripe is not configured" });
    return false;
  }
  return true;
};

// ============ Wallet Routes ============

// Wallet page
router.get("/wallet", isLoggedIn, async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id);
    res.render("wallet", {
      walletBalance: user.wallet,
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  } catch (error) {
    console.error("Error loading wallet:", error);
    res.status(500).send("Error loading wallet");
  }
});

// Create payment intent for wallet top-up
router.post("/wallet/create-payment-intent", isLoggedIn, async (req, res) => {
  try {
    if (!requireStripe(res)) return;
    const amount = req.body.amount;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const amountInPaise = Math.round(amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPaise,
      currency: "inr",
      metadata: {
        userId: req.user._id.toString(),
        username: req.user.username,
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({ error: "Failed to create payment intent" });
  }
});

// Confirm wallet payment
router.post("/wallet/confirm-payment", isLoggedIn, async (req, res) => {
  try {
    if (!requireStripe(res)) return;
    const { paymentIntentId, amount } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({ error: "Payment was not successful" });
    }

    const user = await userModel.findById(req.user._id);
    user.wallet += amount;
    await user.save();

    res.json({ success: true, message: "Wallet updated successfully" });
  } catch (error) {
    console.error("Error confirming payment:", error);
    res.status(500).json({ error: "Failed to confirm payment" });
  }
});

// ============ Wallet Payment (Pay from existing balance) ============

router.get("/pay-now/:userID", isLoggedIn, async (req, res) => {
  try {
    const totalPrice = parseFloat(req.query.totalPrice);
    const buyer = await userModel.findById(req.params.userID).populate("cart.product");
    
    if (buyer.wallet < totalPrice) {
      return res.status(400).send("Insufficient wallet balance");
    }

    buyer.wallet -= totalPrice;
    buyer.totalPrice += totalPrice;

    const newSales = [];

    for (const item of buyer.cart) {
      const product = item.product;
      const vendorId = product.userId;
      const price = item.bargainedPrice || product.pPrice;
      const earnings = item.quantity * price;

      newSales.push({
        productId: product._id,
        userId: buyer._id,
        quantity: item.quantity,
        consumerName: buyer.fullName,
        totalEarnings: earnings,
      });

      const vendor = await userModel.findById(vendorId);
      if (vendor) {
        vendor.wallet += earnings;
        await vendor.save();
      }
    }

    await saleModel.create(newSales);
    buyer.purchasedProducts.push(...buyer.cart.map((item) => item.product._id));
    buyer.cart = [];
    await buyer.save();

    res.redirect("/shop");
  } catch (err) {
    console.error("Error processing payment:", err);
    res.status(500).send("Error processing payment");
  }
});

// ============ Direct Payment (Stripe Checkout) ============

// Checkout page
router.get("/checkout", isLoggedIn, async (req, res) => {
  try {
    const totalPrice = parseFloat(req.query.totalPrice) || 0;
    const user = await userModel.findById(req.user._id);
    
    if (totalPrice <= 0) {
      return res.status(400).send("Invalid amount");
    }

    const stripePublicKey = process.env.STRIPE_PUBLISHABLE_KEY;
    res.render("checkout", { user, totalPrice, stripePublicKey });
  } catch (err) {
    console.error("Error loading checkout page:", err);
    res.status(500).send("Error loading checkout page");
  }
});

// Create payment intent for direct checkout
router.post("/create-payment-intent", isLoggedIn, async (req, res) => {
  try {
    if (!requireStripe(res)) return;
    const { totalPrice, userId, email } = req.body;
    
    if (!totalPrice || totalPrice <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const amountInPaise = Math.round(totalPrice * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPaise,
      currency: "inr",
      metadata: {
        userId: userId,
        email: email,
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({ error: "Failed to create payment intent" });
  }
});

// Confirm direct payment and process order
router.post("/confirm-direct-payment", isLoggedIn, async (req, res) => {
  try {
    if (!requireStripe(res)) return;
    const { paymentIntentId, totalPrice, userId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({ error: "Payment was not successful" });
    }

    const buyer = await userModel.findById(userId).populate("cart.product");
    
    if (!buyer) {
      return res.status(404).json({ error: "User not found" });
    }

    const newSales = [];
    for (const item of buyer.cart) {
      const product = item.product;
      const vendorId = product.userId;
      const price = item.bargainedPrice || product.pPrice;
      const earnings = item.quantity * price;

      newSales.push({
        productId: product._id,
        userId: buyer._id,
        quantity: item.quantity,
        consumerName: buyer.fullName,
        totalEarnings: earnings,
      });

      const vendor = await userModel.findById(vendorId);
      if (vendor) {
        vendor.wallet += earnings;
        await vendor.save();
      }
    }

    await saleModel.create(newSales);
    buyer.purchasedProducts.push(...buyer.cart.map((item) => item.product._id));
    buyer.cart = [];
    await buyer.save();

    res.json({ success: true, message: "Payment processed successfully" });
  } catch (error) {
    console.error("Error confirming payment:", error);
    res.status(500).json({ error: "Failed to process payment" });
  }
});

module.exports = router;
