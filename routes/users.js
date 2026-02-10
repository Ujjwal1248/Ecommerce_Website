const mongoose = require("mongoose");
const plm = require("passport-local-mongoose");

mongoose.connect(
  "mongodb+srv://ujjwalagrawal1248_db_user:QtTAb3eby05gWeAq@cluster0.kvlfxfo.mongodb.net/"
);

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  quantity: { type: Number, default: 1 },
  bargainedPrice: { type: Number }, // optional custom price from bargain
});


const userSchema = new mongoose.Schema({
  fullName: String,
  username: String,
  email: String,
  password: String,
  date: {
    type: Date,
    default: Date.now,
  },
  cart: [cartItemSchema],
  totalPrice: {
    type: Number,
    default: 0,
  },
  wallet: {
    type: Number,
    default: 0,
  },
  purchasedProducts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
});

userSchema.plugin(plm);

module.exports = mongoose.model("User", userSchema);
