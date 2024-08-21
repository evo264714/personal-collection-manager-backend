const client = require('../config/db');
const { ObjectId } = require('mongodb');

const getUsers = async (req, res) => {
    try {
      const db = client.db('collectionDB');
      const users = await db.collection('users').find({}).toArray();
      res.status(200).json(users);
    } catch (error) {
      console.error("Error fetching users:", error); 
      res.status(500).json({ error: error.message });
    }
  };
  
const updateUserRole = async (req, res) => {
  try {
    const db = client.db('collectionDB');
    const { role } = req.body;
    const userId = req.params.id;
    
    await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $set: { role } });
    res.status(200).json({ message: 'User role updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const db = client.db('collectionDB');
    const { isActive } = req.body;
    const userId = req.params.id;
    
    await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $set: { isActive } });
    res.status(200).json({ message: `User ${isActive ? 'unblocked' : 'blocked'} successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const removeAdminPrivileges = async (req, res) => {
    try {
      const db = client.db("collectionDB");
      const userId = req.params.id; 
  
      const result = await db.collection("users").updateOne(
        { uid: userId }, 
        { $set: { role: "user" } } 
      );
  
      if (result.modifiedCount === 0) {
        return res.status(404).json({ message: "User not found or already not an admin" });
      }
  
      res.status(200).json({ message: "Admin privileges removed" });
    } catch (error) {
      console.error("Error in removeAdminPrivileges:", error.message);
      res.status(500).json({ error: error.message });
    }
  };

module.exports = { getUsers, updateUserRole, updateUserStatus, removeAdminPrivileges };
