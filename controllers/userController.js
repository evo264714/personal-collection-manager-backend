const { ObjectId } = require("mongodb");
const client = require("../config/db");

const getUserById = async (req, res) => {
  try {
    const db = client.db("collectionDB");
    const user = await db.collection("users").findOne({ uid: req.params.uid }); 

    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error fetching user:", error.message); 
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getUserById };
