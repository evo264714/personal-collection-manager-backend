const { ObjectId } = require("mongodb");
const client = require("../config/db");

const getCollections = async (req, res) => {
  try {
    const db = client.db("collectionDB");
    const collections = await db.collection("collections").find({}).toArray();
    res.status(200).json(collections);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCollection = async (req, res) => {
  try {
    const db = client.db("collectionDB");

    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid Collection ID" });
    }

    const collection = await db
      .collection("collections")
      .findOne({ _id: new ObjectId(req.params.id) });
    if (collection) {
      res.status(200).json(collection);
    } else {
      res.status(404).json({ message: "Collection not found" });
    }
  } catch (error) {
    console.error("Error fetching collection:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const createCollection = async (req, res) => {
  try {
    const db = client.db("collectionDB");
    const collection = {
      ...req.body,
      items: [],
      userId: req.body.userId,
    };
    const result = await db.collection("collections").insertOne(collection);

    if (result.acknowledged) {
      res.status(201).json(result);
    } else {
      throw new Error("Failed to create collection");
    }
  } catch (error) {
    console.error("Error creating collection:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const updateCollection = async (req, res) => {
  try {
    const db = client.db("collectionDB");
    const collection = await db
      .collection("collections")
      .findOne({ _id: new ObjectId(req.params.id) });

    if (!collection) {
      console.log("Collection not found");
      return res.status(404).json({ message: "Collection not found" });
    }

    if (collection.userId !== req.user.uid && req.user.role !== "admin") {
      console.log(
        "Forbidden: User does not have permission to update this collection"
      );
      return res.status(403).json({
        message:
          "Forbidden: You do not have permission to edit this collection.",
      });
    }

    const result = await db
      .collection("collections")
      .updateOne({ _id: new ObjectId(req.params.id) }, { $set: req.body });

    res.status(200).json(result);
  } catch (error) {
    console.error("Error updating collection:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const deleteCollection = async (req, res) => {
  try {
    const db = client.db("collectionDB");
    const collection = await db
      .collection("collections")
      .findOne({ _id: new ObjectId(req.params.id) });

    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    if (collection.userId !== req.user.uid && req.user.role !== "admin") {
      return res.status(403).json({
        message:
          "Forbidden: You do not have permission to delete this collection.",
      });
    }

    const result = await db
      .collection("collections")
      .deleteOne({ _id: new ObjectId(req.params.id) });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const addItem = async (req, res) => {
  try {
    const db = client.db("collectionDB");
    const collection = await db
      .collection("collections")
      .findOne({ _id: new ObjectId(req.params.id) });

    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    if (collection.userId !== req.user.uid && req.user.role !== "admin") {
      return res.status(403).json({
        message:
          "Forbidden: You do not have permission to add items to this collection.",
      });
    }

    const newItem = { ...req.body, _id: new ObjectId(), createdAt: new Date() };

    const result = await db
      .collection("collections")
      .updateOne(
        { _id: new ObjectId(req.params.id) },
        { $push: { items: newItem } }
      );

    if (result.modifiedCount > 0) {
      io.emit("newItem", {
        item: newItem,
        collectionName: collection.name,
      });
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const removeItem = async (req, res) => {
  try {
    const db = client.db("collectionDB");

    const collection = await db
      .collection("collections")
      .findOne({ _id: new ObjectId(req.params.id) });

    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    if (collection.userId !== req.user.uid && req.user.role !== "admin") {
      return res.status(403).json({
        message: "Forbidden: You do not have permission to delete this item",
      });
    }

    const result = await db
      .collection("collections")
      .updateOne(
        { _id: new ObjectId(req.params.id) },
        { $pull: { items: { _id: new ObjectId(req.params.itemId) } } }
      );

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateItem = async (req, res) => {
  try {
    const db = client.db("collectionDB");
    const collectionId = new ObjectId(req.params.collectionId);
    const itemId = new ObjectId(req.params.itemId);

    const collection = await db
      .collection("collections")
      .findOne({ _id: collectionId });
    const existingItem = collection.items.find((item) =>
      item._id.equals(itemId)
    );

    if (!existingItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (collection.userId !== req.user.uid && req.user.role !== "admin") {
      return res.status(403).json({
        message: "Forbidden: You do not have permission to update this item.",
      });
    }

    const updatedItem = {
      ...existingItem,
      ...req.body,
      likes: existingItem.likes || [], 
      comments: existingItem.comments || [], 
    };

    const result = await db
      .collection("collections")
      .updateOne(
        { _id: collectionId, "items._id": itemId },
        { $set: { "items.$": updatedItem } }
      );

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const likeItem = async (req, res) => {
  try {
    const db = client.db("collectionDB");
    const collectionId = new ObjectId(req.params.collectionId);
    const itemId = new ObjectId(req.params.itemId);

    const collection = await db
      .collection("collections")
      .findOne({ _id: collectionId });
    const item = collection.items.find((item) => item._id.equals(itemId));

    if (!item.likes) item.likes = [];

    if (!item.likes.includes(req.user.uid)) {
      item.likes.push(req.user.uid);
    } else {
      item.likes = item.likes.filter((id) => id !== req.user.uid);
    }

    await db
      .collection("collections")
      .updateOne(
        { _id: collectionId, "items._id": itemId },
        { $set: { "items.$.likes": item.likes } }
      );

    res.status(200).json(item.likes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const addComment = async (req, res) => {
  try {
    const db = client.db("collectionDB");
    const collectionId = new ObjectId(req.params.collectionId);
    const itemId = new ObjectId(req.params.itemId);
    const { userId, comment } = req.body;

    const newComment = {
      _id: new ObjectId(),
      userId,
      comment,
      createdAt: new Date(),
    };

    await db
      .collection("collections")
      .updateOne(
        { _id: collectionId, "items._id": itemId },
        { $push: { "items.$.comments": newComment } }
      );

    res.status(200).json(newComment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUserCollections = async (req, res) => {
  try {
    const db = client.db("collectionDB");
    const collections = await db
      .collection("collections")
      .find({ userId: req.user.uid })
      .toArray();

    res.status(200).json(collections);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getRecentItems = async (req, res) => {
  try {
    const db = client.db("collectionDB");
    const recentItems = await db
      .collection("collections")
      .aggregate([
        { $unwind: "$items" },
        { $sort: { "items.createdAt": -1 } },
        { $limit: 5 },
        {
          $project: {
            _id: 0,
            item: "$items",
            collectionName: "$name",
          },
        },
      ])
      .toArray();

    if (recentItems.length === 0) {
      return res.status(204).json([]);
    }
    res.status(200).json(recentItems);
  } catch (error) {
    console.error("Error fetching recent items:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const getTopCollections = async (req, res) => {
  try {
    const db = client.db("collectionDB");

    const collections = await db.collection("collections").find({}).toArray();

    const sortedCollections = collections
      .map((collection) => ({
        ...collection,
        itemCount: collection.items.length,
      }))
      .sort((a, b) => b.itemCount - a.itemCount)
      .slice(0, 5);

    if (sortedCollections.length === 0) {
      return res.status(204).json([]); 
    }

    res.status(200).json(sortedCollections);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



const searchCollections = async (req, res) => {
  try {
    const db = client.db("collectionDB");
    const query = req.query.q ? req.query.q.toLowerCase() : ""; // Get the search query from the request and make it lowercase

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    // Fetch all collections to search through
    const collections = await db.collection("collections").find({}).toArray();
    
    const results = [];

    collections.forEach((collection) => {
      let collectionMatched = false;

      // Check if the collection name or description matches the query
      if (
        collection.name.toLowerCase().includes(query) ||
        collection.description.toLowerCase().includes(query)
      ) {
        collectionMatched = true;
      }

      collection.items.forEach((item) => {
        let itemMatched = false;

        // Check if the item name matches the query
        if (item.name.toLowerCase().includes(query)) {
          itemMatched = true;
        }

        // Check if any comments match the query
        const matchingComments = item.comments.filter((comment) =>
          comment.comment.toLowerCase().includes(query)
        );

        if (itemMatched || matchingComments.length > 0) {
          results.push({
            collectionId: collection._id,
            itemId: item._id,
            itemName: item.name,
            collectionName: collection.name,
            comments: matchingComments,
          });
        }
      });

      // If the collection matched but none of the items did, just add the collection
      if (collectionMatched && !results.some((result) => result.collectionId.equals(collection._id))) {
        results.push({
          collectionId: collection._id,
          collectionName: collection.name,
          items: collection.items,
        });
      }
    });

    if (results.length === 0) {
      return res.status(204).json([]); // No content found
    }

    res.status(200).json(results);
  } catch (error) {
    console.error("Error searching collections:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const getItem = async (req, res) => {
  try {
    const { collectionId, itemId } = req.params;

    if (!ObjectId.isValid(collectionId) || !ObjectId.isValid(itemId)) {
      return res.status(400).json({ message: "Invalid Collection ID or Item ID" });
    }

    const db = client.db("collectionDB");
    const collection = await db.collection("collections").findOne({ _id: new ObjectId(collectionId) });

    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    const item = collection.items.find(item => item._id.equals(new ObjectId(itemId)));

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.status(200).json(item);
  } catch (error) {
    console.error("Error fetching item:", error.message);
    res.status(500).json({ error: "Failed to fetch item" });
  }
};

module.exports = {
  getCollections,
  getCollection,
  createCollection,
  updateCollection,
  deleteCollection,
  addItem,
  updateItem,
  removeItem,
  likeItem,
  addComment,
  getUserCollections,
  getRecentItems,
  getTopCollections,
  searchCollections,
  getItem
};
