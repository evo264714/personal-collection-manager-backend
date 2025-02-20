// const jwt = require("jsonwebtoken");
// const admin = require("../config/firebase");
// const client = require("../config/db");

// const ensureAuthenticated = async (req, res, next) => {
//   const token = req.headers.authorization?.split(" ")[1];
//   if (!token)
//     return res.status(401).json({ message: "Unauthorized: No token provided" });

//   try {
//     const decodedToken = await admin.auth().verifyIdToken(token);

//     const db = client.db("collectionDB");
//     const user = await db
//       .collection("users")
//       .findOne({ uid: decodedToken.uid });

//     if (!user) {
//       return res.status(401).json({ message: "Unauthorized: User not found" });
//     }

//     if (!user.isActive) {
//       return res.status(403).json({ message: "Forbidden: User is blocked" });
//     }

//     req.user = user;
//     next();
//   } catch (error) {
//     console.error("Error decoding token:", error);
//     return res.status(401).json({ message: "Unauthorized: Invalid token" });
//   }
// };

// const ensureAdmin = (req, res, next) => {
//   if (req.user.role !== "admin") {
//     return res.status(403).json({ message: "Forbidden: Admins only" });
//   }
//   next();
// };

// module.exports = { ensureAuthenticated, ensureAdmin };





const admin = require("../config/firebase");
const client = require("../config/db");

const ensureAuthenticated = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  // Handle missing authorization header
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: Missing token" });
  }

  const token = authHeader.split(" ")[1];
  const userIdHeader = req.headers["x-user-id"]; // Added security validation

  try {
    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Validate header matches token UID
    if (userIdHeader && userIdHeader !== decodedToken.uid) {
      return res.status(401).json({ message: "Header/token mismatch" });
    }

    // Get user from database
    const db = client.db("collectionDB");
    const user = await db.collection("users").findOne({ 
      uid: decodedToken.uid 
    });

    if (!user) return res.status(401).json({ message: "User not found" });
    if (!user.isActive) return res.status(403).json({ message: "User blocked" });

    // Attach complete user data
    req.user = {
      uid: user.uid,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    };

    next();
  } catch (error) {
    console.error("Auth error:", error);
    const status = error.code === "auth/id-token-expired" ? 401 : 500;
    res.status(status).json({ 
      message: `Authentication failed: ${error.message}` 
    });
  }
};

const ensureAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

module.exports = { ensureAuthenticated, ensureAdmin };