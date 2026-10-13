const Faq = require('../models/Faq');
const Activity = require('../models/Activity');
const { buildFaqFilter, canAccessFaq } = require('../utils/visibility');

async function list(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
    const base = buildFaqFilter(req.user);
    const and = [base];
    if (req.query.q) {
      const rx = new RegExp(req.query.q.trim(), 'i');
      and.push({ $or: [{ question: rx }, { answer: rx }, { tags: rx }] });
    }
    if (req.query.team) and.push({ team: req.query.team });
    const filter = and.length > 1 ? { $and: and } : and[0];
    const total = await Faq.countDocuments(filter);
    const faqs = await Faq.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
    return res.json({ success: true, data: faqs, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (e) { return next(e); }
}

async function getById(req, res, next) {
  try {
    const faq = await Faq.findById(req.params.id);
    if (!faq) return res.status(404).json({ success: false, message: 'Not found' });
    if (!canAccessFaq(req.user, faq)) return res.status(403).json({ success: false, message: 'Forbidden' });
    return res.json({ success: true, data: faq });
  } catch (e) { return next(e); }
}

async function create(req, res, next) {
  try {
    const { question, answer, tags, team, visibility } = req.body || {};
    if (!question || !answer) return res.status(400).json({ success: false, message: 'question, answer required' });
    const faq = await Faq.create({
      question: String(question).trim(),
      answer: String(answer),
      tags: Array.isArray(tags) ? tags : [],
      team: team ? String(team) : (req.user.team || 'general'),
      visibility: ['public', 'team', 'private'].includes(visibility) ? visibility : 'team',
      uploadedBy: req.user.id,
    });
    await Activity.create({ userId: req.user.id, action: 'faq_create' }).catch(() => {});
    return res.status(201).json({ success: true, data: faq });
  } catch (e) { return next(e); }
}

async function update(req, res, next) {
  try {
    const faq = await Faq.findById(req.params.id);
    if (!faq) return res.status(404).json({ success: false, message: 'Not found' });
    const owner = String(faq.uploadedBy) === String(req.user.id);
    const sameTeamManager = req.user.role === 'manager' && faq.team === req.user.team;
    if (req.user.role !== 'admin' && !owner && !sameTeamManager) return res.status(403).json({ success: false, message: 'Forbidden' });
    const { question, answer, tags, team, visibility, status } = req.body || {};
    if (question) faq.question = String(question).trim();
    if (answer) faq.answer = String(answer);
    if (tags) faq.tags = Array.isArray(tags) ? tags : faq.tags;
    if (team) faq.team = String(team);
    if (visibility && ['public', 'team', 'private'].includes(visibility)) faq.visibility = visibility;
    if (status && ['pending', 'approved', 'rejected'].includes(status)) faq.status = status;
    await faq.save();
    await Activity.create({ userId: req.user.id, action: 'faq_update' }).catch(() => {});
    return res.json({ success: true, data: faq });
  } catch (e) { return next(e); }
}

async function remove(req, res, next) {
  try {
    const faq = await Faq.findById(req.params.id);
    if (!faq) return res.status(404).json({ success: false, message: 'Not found' });
    const owner = String(faq.uploadedBy) === String(req.user.id);
    const sameTeamManager = req.user.role === 'manager' && faq.team === req.user.team;
    if (req.user.role !== 'admin' && !owner && !sameTeamManager) return res.status(403).json({ success: false, message: 'Forbidden' });
    await faq.deleteOne();
    return res.json({ success: true, message: 'Deleted' });
  } catch (e) { return next(e); }
}

module.exports = { list, getById, create, update, remove };
