const admin = require("../config/firebase");
const client = require("../config/db");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
  const { uid, email } = req.body;

  try {
    if (!uid || !email) {
      throw new Error("UID and email are required");
    }

    const db = client.db("collectionDB");
    const result = await db.collection("users").insertOne({
      uid,
      email,
      role: "user",
      isActive: true, 
    });

    res
      .status(201)
      .json({ message: "User registered successfully", user: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const loginUser = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await admin.auth().getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const db = client.db('collectionDB');
    const dbUser = await db.collection('users').findOne({ uid: user.uid });

    if (!dbUser) {
      return res.status(400).json({ message: 'User not found in DB' });
    }

    if (!dbUser.isActive) {
      return res.status(403).json({ message: 'You have been blocked by the admins.' });
    }

    const payload = {
      uid: user.uid,
      email: user.email,
      role: dbUser.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: '1h',
    });

    res.status(200).json({ token, user: payload });
  } catch (error) {
    console.error('Error during login:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};


module.exports = { registerUser, loginUser };
