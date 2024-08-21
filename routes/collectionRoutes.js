const express = require("express");
const router = express.Router();
const {
  ensureAuthenticated,
  ensureAdmin,
} = require("../middlewares/authMiddleware");
const {
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
} = require("../controllers/collectionController");

router.get("/", getCollections);
router.get("/search", searchCollections);
router.get("/top", getTopCollections);
router.get("/:id", getCollection);
router.get("/items/recent", getRecentItems);
router.get("/user/:userId", ensureAuthenticated, getUserCollections);
router.get('/:collectionId/items/:itemId', getItem);


router.post("/", ensureAuthenticated, createCollection);

router.put("/:id", ensureAuthenticated, updateCollection);
router.delete("/:id", ensureAuthenticated, deleteCollection);

router.post("/:id/items", ensureAuthenticated, addItem);
router.put("/:collectionId/items/:itemId", ensureAuthenticated, updateItem);
router.delete("/:id/items/:itemId", ensureAuthenticated, removeItem);

router.post("/:collectionId/items/:itemId/like", ensureAuthenticated, likeItem);
router.post(
  "/:collectionId/items/:itemId/comment",
  ensureAuthenticated,
  addComment
);

module.exports = router;
