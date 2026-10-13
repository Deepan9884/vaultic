const User = require('../models/User');

async function list(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
    const q = (req.query.q || '').trim();
    const filter = {};
    if (q) filter.$or = [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }];
    if (req.query.role) filter.role = req.query.role;
    if (req.query.team) filter.team = req.query.team;
    const total = await User.countDocuments(filter);
    const users = await User.find(filter).select('-passwordHash').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
    return res.json({ success: true, data: users, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (e) { return next(e); }
}

async function updateRole(req, res, next) {
  try {
    const { role } = req.body || {};
    if (!['admin', 'manager', 'employee'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-passwordHash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, data: user });
  } catch (e) { return next(e); }
}

async function updateStatus(req, res, next) {
  try {
    const { isActive } = req.body || {};
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: !!isActive }, { new: true }).select('-passwordHash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, data: user });
  } catch (e) { return next(e); }
}

module.exports = { list, updateRole, updateStatus };
