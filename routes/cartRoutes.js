const express = require("express");
const { ensureAuthenticated } = require("../middlewares/authMiddleware");
const { 
  getCartItems, 
  addToCart, 
  removeFromCart,
  clearCart
} = require("../controllers/cartController");

const router = express.Router();

router.get("/", ensureAuthenticated, getCartItems);
router.post("/add", ensureAuthenticated, addToCart);
router.delete("/clear", ensureAuthenticated, clearCart);
router.delete("/:cartItemId", ensureAuthenticated, removeFromCart);

module.exports = router;