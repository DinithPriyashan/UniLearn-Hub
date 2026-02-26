const User = require("../models/User");
const ModerationLog = require("../models/ModerationLog");

exports.listUsers = async (req, res) => {
  const { q = "", role, banned } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (banned === "true") filter.isBanned = true;
  if (banned === "false") filter.isBanned = false;

  if (q) {
    filter.$or = [
      { fullName: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
    ];
  }

  const users = await User.find(filter).sort({ createdAt: -1 }).select("-passwordHash");
  res.json(users);
};

exports.changeUserRole = async (req, res) => {
  const { userId } = req.params;
  const { role, note = "" } = req.body;

  const allowed = ["student", "contributor", "moderator", "admin"];
  if (!allowed.includes(role)) return res.status(400).json({ message: "Invalid role" });

  const user = await User.findByIdAndUpdate(userId, { role }, { new: true }).select("-passwordHash");
  if (!user) return res.status(404).json({ message: "User not found" });

  await ModerationLog.create({
    actor: req.user._id,
    entityType: "user",
    entityId: user._id,
    action: "change_role",
    note: note || `Role changed to ${role}`,
  });

  res.json(user);
};

exports.banUser = async (req, res) => {
  const { userId } = req.params;
  const { reason = "Violation of platform rules" } = req.body;

  const user = await User.findByIdAndUpdate(
    userId,
    { isBanned: true, bannedReason: reason },
    { new: true }
  ).select("-passwordHash");

  if (!user) return res.status(404).json({ message: "User not found" });

  await ModerationLog.create({
    actor: req.user._id,
    entityType: "user",
    entityId: user._id,
    action: "ban_user",
    note: reason,
  });

  res.json(user);
};

exports.unbanUser = async (req, res) => {
  const { userId } = req.params;
  const { note = "" } = req.body;

  const user = await User.findByIdAndUpdate(
    userId,
    { isBanned: false, bannedReason: "" },
    { new: true }
  ).select("-passwordHash");

  if (!user) return res.status(404).json({ message: "User not found" });

  await ModerationLog.create({
    actor: req.user._id,
    entityType: "user",
    entityId: user._id,
    action: "unban_user",
    note,
  });

  res.json(user);
};