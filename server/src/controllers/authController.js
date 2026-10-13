const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Activity = require('../models/Activity');

function sign(user) {
  return jwt.sign(
    { id: String(user._id), role: user.role, team: user.team },
    process.env.JWT_SECRET || 'changeme',
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
}

async function signup(req, res, next) {
  try {
    const { name, email, password, team, role, adminSecret } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'name, email, password required' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ success: false, message: 'password must be >= 6 chars' });
    }
    const exists = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (exists) return res.status(409).json({ success: false, message: 'Email already registered' });

    let finalRole = 'employee';
    if (role === 'manager') finalRole = 'manager';
    if (role === 'admin') {
      if (process.env.ADMIN_SECRET && adminSecret === process.env.ADMIN_SECRET) finalRole = 'admin';
      else return res.status(403).json({ success: false, message: 'Admin signup requires valid adminSecret' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      passwordHash,
      role: finalRole,
      team: team ? String(team).trim() : 'general',
    });
    const token = sign(user);
    return res.status(201).json({
      success: true,
      data: { token, user: { id: user._id, name: user.name, email: user.email, role: user.role, team: user.team } },
    });
  } catch (e) { return next(e); }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ success: false, message: 'email, password required' });
    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Account deactivated' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const token = sign(user);
    await Activity.create({ userId: user._id, action: 'login' }).catch(() => {});
    return res.json({
      success: true,
      data: { token, user: { id: user._id, name: user.name, email: user.email, role: user.role, team: user.team } },
    });
  } catch (e) { return next(e); }
}

async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, data: user });
  } catch (e) { return next(e); }
}

module.exports = { signup, login, me };
