const User = require('../models/User');
const Document = require('../models/Document');
const Activity = require('../models/Activity');

async function overview(req, res, next) {
  try {
    const [users, docs, pending, recent] = await Promise.all([
      User.countDocuments(),
      Document.countDocuments({ isDeleted: false }),
      Document.countDocuments({ isDeleted: false, status: 'pending' }),
      Activity.find().sort({ createdAt: -1 }).limit(10).populate('userId', 'name email'),
    ]);
    const storageAgg = await Document.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: null, bytes: { $sum: '$fileSize' } } },
    ]);
    const docsByCategory = await Document.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const docsByVisibility = await Document.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$visibility', count: { $sum: 1 } } },
    ]);
    const since = new Date();
    since.setDate(since.getDate() - 13);
    since.setHours(0, 0, 0, 0);
    const searchesByDay = await Activity.aggregate([
      { $match: { action: 'search', createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    return res.json({
      success: true,
      data: {
        users,
        documents: docs,
        pending,
        storageBytes: (storageAgg[0] && storageAgg[0].bytes) || 0,
        docsByCategory,
        docsByVisibility,
        searchesByDay,
        recentActivity: recent,
      },
    });
  } catch (e) { return next(e); }
}

async function searches(req, res, next) {
  try {
    const rows = await Activity.find({ action: 'search' })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('userId', 'name email');
    return res.json({ success: true, data: rows });
  } catch (e) { return next(e); }
}

async function activity(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
    const filter = {};
    if (req.query.action) filter.action = req.query.action;
    const total = await Activity.countDocuments(filter);
    const rows = await Activity.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    if (req.query.format === 'csv') {
      const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const lines = ['action,user,query,documentId,at'];
      for (const a of rows) {
        lines.push([
          a.action,
          a.userId?.email || a.userId?._id || a.userId || '',
          a.query || '',
          a.documentId || '',
          a.createdAt ? new Date(a.createdAt).toISOString() : '',
        ].map(esc).join(','));
      }
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="vaultic-audit.csv"');
      return res.send(lines.join('\n'));
    }
    return res.json({ success: true, data: rows, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (e) { return next(e); }
}

module.exports = { overview, searches, activity };
