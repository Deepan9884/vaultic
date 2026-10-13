const Bookmark = require('../models/Bookmark');
const Activity = require('../models/Activity');

async function list(req, res, next) {
  try {
    const marks = await Bookmark.find({ userId: req.user.id }).populate('documentId').sort({ createdAt: -1 });
    return res.json({ success: true, data: marks });
  } catch (e) { return next(e); }
}

async function add(req, res, next) {
  try {
    const documentId = req.body.documentId || req.params.documentId;
    if (!documentId) return res.status(400).json({ success: false, message: 'documentId required' });
    const mark = await Bookmark.findOneAndUpdate(
      { userId: req.user.id, documentId },
      { $setOnInsert: { userId: req.user.id, documentId } },
      { new: true, upsert: true }
    );
    await Activity.create({ userId: req.user.id, action: 'bookmark', documentId }).catch(() => {});
    return res.status(201).json({ success: true, data: mark });
  } catch (e) {
    if (e.code === 11000) return res.status(200).json({ success: true, message: 'Already bookmarked' });
    return next(e);
  }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params; // bookmark id OR document id
    let r = await Bookmark.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!r) r = await Bookmark.findOneAndDelete({ documentId: id, userId: req.user.id });
    if (!r) return res.status(404).json({ success: false, message: 'Not found' });
    return res.json({ success: true, message: 'Removed' });
  } catch (e) { return next(e); }
}

module.exports = { list, add, remove };
