const router = require("express").Router();
const auth = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const admin = require("../controllers/admin.controller");

// Admin only
router.use(auth, requireRole("admin"));

router.get("/users", admin.listUsers);
router.patch("/users/:userId/role", admin.changeUserRole);
router.post("/users/:userId/ban", admin.banUser);
router.post("/users/:userId/unban", admin.unbanUser);

module.exports = router;