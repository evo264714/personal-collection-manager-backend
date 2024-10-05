const express = require("express");
const { ensureAuthenticated } = require("../middlewares/authMiddleware");
const { getCartItems, addToCart, removeFromCart } = require("../controllers/cartController");

const router = express.Router();

// Get all cart items for the logged-in user
router.get("/", ensureAuthenticated, getCartItems);

// Add item to cart
router.post("/add", ensureAuthenticated, addToCart);

// Remove item from cart
router.delete("/:cartItemId", ensureAuthenticated, removeFromCart);

module.exports = router;
