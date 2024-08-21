const express = require("express");
const {
  getUsers,
  updateUserRole,
  updateUserStatus,
  removeAdminPrivileges,
} = require("../controllers/adminController");
const {
  ensureAuthenticated,
  ensureAdmin,
} = require("../middlewares/authMiddleware");
const router = express.Router();

router.use(ensureAuthenticated); 

router.get("/users", ensureAdmin, getUsers);
router.put("/users/:id/role", ensureAdmin, updateUserRole);
router.put("/users/:id/status", ensureAdmin, updateUserStatus);
router.put("/users/:id/remove-admin", ensureAdmin, removeAdminPrivileges);

module.exports = router;
