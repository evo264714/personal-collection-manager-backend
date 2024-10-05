const { ObjectId } = require("mongodb");
const client = require("../config/db");

// Fetch cart items for the logged-in user
const getCartItems = async (req, res) => {
  try {
    const db = client.db("collectionDB");
    const cart = await db.collection("carts").findOne({ userId: req.user.uid });

    if (!cart) {
      return res.status(200).json([]);
    }

    return res.status(200).json(cart.items);
  } catch (error) {
    console.error("Error fetching cart items:", error.message);
    return res.status(500).json({ error: "Failed to fetch cart items" });
  }
};

// Add item to the cart or increment the quantity if it already exists
const addToCart = async (req, res) => {
  const { itemId, collectionId, itemName, imageURL } = req.body;
  const userId = req.user.uid;

  try {
    const db = client.db("collectionDB");
    const cart = await db.collection("carts").findOne({ userId });

    if (cart) {
      // Check if the item is already in the cart
      const existingItem = cart.items.find((item) => item.itemId === itemId);

      if (existingItem) {
        // Increment quantity if the item exists
        await db.collection("carts").updateOne(
          { userId, "items.itemId": itemId },
          { $inc: { "items.$.quantity": 1 } }
        );
      } else {
        // Add a new item to the cart
        const newItem = {
          _id: new ObjectId(),
          itemId,
          collectionId,
          itemName,
          imageURL,
          quantity: 1,
        };

        await db.collection("carts").updateOne(
          { userId },
          { $push: { items: newItem } }
        );
      }
    } else {
      // Create a new cart if none exists
      const newCart = {
        userId,
        items: [
          {
            _id: new ObjectId(),
            itemId,
            collectionId,
            itemName,
            imageURL,
            quantity: 1,
          },
        ],
      };

      await db.collection("carts").insertOne(newCart);
    }

    return res.status(200).json({ message: "Item added to cart" });
  } catch (error) {
    console.error("Error adding item to cart:", error.message);
    return res.status(500).json({ error: "Failed to add item to cart" });
  }
};

// Remove item from the cart
const removeFromCart = async (req, res) => {
  const { cartItemId } = req.params;
  const userId = req.user.uid;

  try {
    const db = client.db("collectionDB");

    const result = await db
      .collection("carts")
      .updateOne(
        { userId },
        { $pull: { items: { _id: new ObjectId(cartItemId) } } }
      );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    return res.status(200).json({ message: "Item removed from cart" });
  } catch (error) {
    console.error("Error removing item from cart:", error.message);
    return res.status(500).json({ error: "Failed to remove item from cart" });
  }
};

module.exports = { getCartItems, addToCart, removeFromCart };
