const jwt = require("jsonwebtoken");
const admin = require("../config/firebase");
const client = require("../config/db");

const ensureAuthenticated = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token)
    return res.status(401).json({ message: "Unauthorized: No token provided" });

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);

    const db = client.db("collectionDB");
    const user = await db
      .collection("users")
      .findOne({ uid: decodedToken.uid });

    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Forbidden: User is blocked" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Error decoding token:", error);
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

const ensureAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admins only" });
  }
  next();
};

module.exports = { ensureAuthenticated, ensureAdmin };
