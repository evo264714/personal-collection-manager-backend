const { ObjectId } = require("mongodb");
const client = require("../config/db");

const getCartItems = async (req, res) => {
  try {
    const db = client.db("collectionDB");
    const cart = await db.collection("carts").findOne({ userId: req.user.uid });
    res.status(200).json(cart ? cart.items : []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const addToCart = async (req, res) => {
  const { itemId, collectionId, itemName, price, imageURL, quantity } = req.body;
  const userId = req.user.uid;

  try {
    const db = client.db("collectionDB");

    // 1. Validate quantity
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: "Invalid quantity" });
    }

    // 2. Check available quantity in collection
    const collection = await db.collection("collections").findOne(
      { _id: new ObjectId(collectionId) },
      { projection: { items: 1 } }
    );

    const collectionItem = collection.items.find(item => 
      item._id.equals(new ObjectId(itemId))
    );

    if (!collectionItem) {
      return res.status(404).json({ error: "Item not found in collection" });
    }

    if (collectionItem.availableQuantity < quantity) {
      return res.status(400).json({ error: "Insufficient stock available" });
    }

    // 3. Update collection available quantity
    await db.collection("collections").updateOne(
      { _id: new ObjectId(collectionId), "items._id": new ObjectId(itemId) },
      { $inc: { "items.$.availableQuantity": -quantity } }
    );

    // 4. Update cart
    const cart = await db.collection("carts").findOne({ userId });

    if (cart) {
      const existingItem = cart.items.find(item => 
        item.itemId === itemId && item.collectionId === collectionId
      );

      if (existingItem) {
        // Increment existing quantity
        await db.collection("carts").updateOne(
          { userId, "items.itemId": itemId },
          { $inc: { "items.$.quantity": quantity } }
        );
      } else {
        // Add new item to cart
        const newItem = {
          _id: new ObjectId(), // Explicitly generate ObjectId
          itemId,
          collectionId,
          itemName,
          imageURL,
          price,
          quantity
        };

        await db.collection("carts").updateOne(
          { userId },
          { $push: { items: newItem } }
        );
      }
    } else {
      // Create new cart
      const newCart = {
        userId,
        items: [{
          _id: new ObjectId(), // Explicitly generate ObjectId
          itemId,
          collectionId,
          itemName,
          imageURL,
          price,
          quantity
        }]
      };

      await db.collection("carts").insertOne(newCart);
    }

    res.status(200).json({ message: "Item added to cart" });
  } catch (error) {
    console.error("Error adding to cart:", error.message);
    res.status(500).json({ error: "Failed to add item to cart" });
  }
};

const removeFromCart = async (req, res) => {
  const { cartItemId } = req.params;
  const userId = req.user.uid;

  try {
    // Validate cartItemId
    if (!ObjectId.isValid(cartItemId)) {
      return res.status(400).json({ error: "Invalid cart item ID" });
    }

    const db = client.db("collectionDB");

    // 1. Get cart item details before removal
    const cart = await db.collection("carts").findOne({ userId });
    const itemToRemove = cart.items.find(item => 
      item._id.equals(new ObjectId(cartItemId))
    );

    if (!itemToRemove) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    // 2. Restore collection available quantity
    await db.collection("collections").updateOne(
      { _id: new ObjectId(itemToRemove.collectionId), "items._id": new ObjectId(itemToRemove.itemId) },
      { $inc: { "items.$.availableQuantity": itemToRemove.quantity } }
    );

    // 3. Remove item from cart
    const result = await db.collection("carts").updateOne(
      { userId },
      { $pull: { items: { _id: new ObjectId(cartItemId) } } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    res.status(200).json({ message: "Item removed from cart" });
  } catch (error) {
    console.error("Error removing from cart:", error.message);
    res.status(500).json({ error: "Failed to remove item from cart" });
  }
};

const clearCart = async (req, res) => {
  try {
    const db = client.db("collectionDB");
    
    // Clear cart items (whether cart exists or not)
    const result = await db.collection("carts").updateOne(
      { userId: req.user.uid },
      { $set: { items: [] } },
      { upsert: true } // Create cart if it doesn't exist
    );

    // Success even if cart was already empty
    res.status(200).json({ message: "Cart cleared successfully" });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getCartItems, addToCart, removeFromCart, clearCart };