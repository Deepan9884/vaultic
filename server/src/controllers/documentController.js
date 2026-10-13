const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');
const DocumentChunk = require('../models/DocumentChunk');
const Activity = require('../models/Activity');
const { buildDocFilter, canAccessDoc } = require('../utils/visibility');
const { extractText } = require('../services/extractor');
const { chunkText } = require('../services/chunker');
const { embedChunks } = require('../services/embedder');

function parseTags(v) {
  if (Array.isArray(v)) return v.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof v === 'string') return v.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

const REVIEW_DAYS = 90;

function stampReview(doc) {
  doc.lastReviewedAt = new Date();
  const next = new Date();
  next.setDate(next.getDate() + REVIEW_DAYS);
  doc.nextReviewAt = next;
}

async function indexDocument(doc) {
  try {
    if (!doc.filePath) return;
    const text = await extractText(doc.filePath, doc.fileType, doc.filePath);
    if (!text || !text.trim()) return;
    const chunks = chunkText(text);
    if (!chunks.length) return;
    const vectors = await embedChunks(chunks);
    await DocumentChunk.deleteMany({ documentId: doc._id });
    const rows = chunks.map((t, i) => ({
      documentId: doc._id,
      chunkIndex: i,
      text: t,
      embedding: vectors[i] || [],
      team: doc.team,
      visibility: doc.visibility,
      status: doc.status,
      category: doc.category,
    }));
    await DocumentChunk.insertMany(rows);
  } catch (e) {
    console.error('[indexDocument]', doc._id, e.message);
  }
}

async function create(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'File is required' });
    const { title, description, category, team, visibility, tags } = req.body || {};
    if (!title) return res.status(400).json({ success: false, message: 'title required' });
    const allowed = ['Project', 'API', 'SOP', 'Manual', 'FAQ'];
    const doc = await Document.create({
      title: String(title).trim(),
      description: description ? String(description) : '',
      category: allowed.includes(category) ? category : 'Project',
      filePath: req.file.path,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      tags: parseTags(tags),
      team: team ? String(team) : (req.user.team || 'general'),
      visibility: ['public', 'team', 'private'].includes(visibility) ? visibility : 'team',
      uploadedBy: req.user.id,
      status: 'pending',
      version: 1,
    });
    await indexDocument(doc);
    await Activity.create({ userId: req.user.id, action: 'upload', documentId: doc._id }).catch(() => {});
    return res.status(201).json({ success: true, data: doc });
  } catch (e) { return next(e); }
}

async function list(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 100);
    const filter = buildDocFilter(req.user);
    const and = [filter];
    if (req.query.category) and.push({ category: req.query.category });
    if (req.query.status && req.user.role === 'admin') and.push({ status: req.query.status });
    if (req.query.team) and.push({ team: req.query.team });
    if (req.query.q) {
      const rx = new RegExp(req.query.q.trim(), 'i');
      and.push({ $or: [{ title: rx }, { description: rx }, { tags: rx }] });
    }
    // Stale docs: review date passed, or never scheduled and older than the review cycle.
    if (req.query.stale === 'true' && (req.user.role === 'manager' || req.user.role === 'admin')) {
      const now = new Date();
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - REVIEW_DAYS);
      and.push({
        status: 'approved',
        $or: [{ nextReviewAt: { $lt: now } }, { nextReviewAt: null, createdAt: { $lt: cutoff } }],
      });
    }
    const finalFilter = and.length > 1 ? { $and: and } : and[0];
    const total = await Document.countDocuments(finalFilter);
    const docs = await Document.find(finalFilter)
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    return res.json({ success: true, data: docs, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (e) { return next(e); }
}

async function getById(req, res, next) {
  try {
    const doc = await Document.findById(req.params.id).populate('uploadedBy', 'name email');
    if (!doc || doc.isDeleted) return res.status(404).json({ success: false, message: 'Not found' });
    if (!canAccessDoc(req.user, doc)) return res.status(403).json({ success: false, message: 'Forbidden' });
    await Activity.create({ userId: req.user.id, action: 'view', documentId: doc._id }).catch(() => {});
    return res.json({ success: true, data: doc });
  } catch (e) { return next(e); }
}

async function update(req, res, next) {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc || doc.isDeleted) return res.status(404).json({ success: false, message: 'Not found' });
    const owner = String(doc.uploadedBy) === String(req.user.id);
    if (req.user.role !== 'admin' && !owner) {
      return res.status(403).json({ success: false, message: 'Only owner or admin can update' });
    }
    const { title, description, tags, visibility, team, category } = req.body || {};
    if (title) doc.title = String(title).trim();
    if (description !== undefined) doc.description = String(description);
    if (tags !== undefined) doc.tags = parseTags(tags);
    if (visibility && ['public', 'team', 'private'].includes(visibility)) doc.visibility = visibility;
    if (team) doc.team = String(team);
    if (category && ['Project', 'API', 'SOP', 'Manual', 'FAQ'].includes(category)) doc.category = category;
    await doc.save();
    await DocumentChunk.updateMany({ documentId: doc._id }, { team: doc.team, visibility: doc.visibility, category: doc.category });
    await Activity.create({ userId: req.user.id, action: 'update', documentId: doc._id }).catch(() => {});
    return res.json({ success: true, data: doc });
  } catch (e) { return next(e); }
}

async function softDelete(req, res, next) {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc || doc.isDeleted) return res.status(404).json({ success: false, message: 'Not found' });
    const owner = String(doc.uploadedBy) === String(req.user.id);
    if (req.user.role !== 'admin' && !owner) {
      return res.status(403).json({ success: false, message: 'Only owner or admin can delete' });
    }
    doc.isDeleted = true;
    await doc.save();
    await DocumentChunk.deleteMany({ documentId: doc._id });
    await Activity.create({ userId: req.user.id, action: 'delete', documentId: doc._id }).catch(() => {});
    return res.json({ success: true, message: 'Deleted' });
  } catch (e) { return next(e); }
}

async function approve(req, res, next) {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc || doc.isDeleted) return res.status(404).json({ success: false, message: 'Not found' });
    doc.status = 'approved';
    stampReview(doc);
    await doc.save();
    await DocumentChunk.updateMany({ documentId: doc._id }, { status: 'approved' });
    await Activity.create({ userId: req.user.id, action: 'approve', documentId: doc._id }).catch(() => {});
    return res.json({ success: true, data: doc });
  } catch (e) { return next(e); }
}

async function reject(req, res, next) {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc || doc.isDeleted) return res.status(404).json({ success: false, message: 'Not found' });
    doc.status = 'rejected';
    await doc.save();
    await DocumentChunk.updateMany({ documentId: doc._id }, { status: 'rejected' });
    await Activity.create({ userId: req.user.id, action: 'reject', documentId: doc._id }).catch(() => {});
    return res.json({ success: true, data: doc });
  } catch (e) { return next(e); }
}

async function share(req, res, next) {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc || doc.isDeleted) return res.status(404).json({ success: false, message: 'Not found' });
    const owner = String(doc.uploadedBy) === String(req.user.id);
    const sameTeamManager = req.user.role === 'manager' && doc.team === req.user.team;
    if (req.user.role !== 'admin' && !owner && !sameTeamManager) {
      return res.status(403).json({ success: false, message: 'Only owner, team manager or admin can share' });
    }
    let ids = req.body.userIds || req.body.allowedUsers || [];
    if (typeof ids === 'string') ids = [ids];
    ids = [...new Set(ids.map(String))].filter((v) => v);
    if (!ids.length) return res.status(400).json({ success: false, message: 'userIds required' });
    await Document.updateOne({ _id: doc._id }, { $addToSet: { allowedUsers: { $each: ids } } });
    await Activity.create({ userId: req.user.id, action: 'share', documentId: doc._id, metadata: { sharedWith: ids } }).catch(() => {});
    const updated = await Document.findById(doc._id);
    return res.json({ success: true, data: updated });
  } catch (e) { return next(e); }
}

function safeFilename(doc) {
  const base = String(doc.title || 'document').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 80) || 'document';
  const ext = path.extname(String(doc.filePath || '')) || '';
  return base + ext;
}

// RBAC-gated file download — the only way to fetch file bytes
// (uploads are NOT served statically, so this check cannot be bypassed).
async function download(req, res, next) {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc || doc.isDeleted) return res.status(404).json({ success: false, message: 'Not found' });
    if (!canAccessDoc(req.user, doc)) return res.status(403).json({ success: false, message: 'Forbidden' });
    if (!doc.filePath || !fs.existsSync(doc.filePath)) {
      return res.status(404).json({ success: false, message: 'No file stored for this document' });
    }
    await Activity.create({ userId: req.user.id, action: 'download', documentId: doc._id }).catch(() => {});
    return res.download(doc.filePath, safeFilename(doc));
  } catch (e) { return next(e); }
}

// Mark an approved doc re-reviewed (owner, same-team manager, or admin).
async function markReviewed(req, res, next) {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc || doc.isDeleted) return res.status(404).json({ success: false, message: 'Not found' });
    const owner = String(doc.uploadedBy) === String(req.user.id);
    const sameTeamManager = req.user.role === 'manager' && doc.team === req.user.team;
    if (req.user.role !== 'admin' && !owner && !sameTeamManager) {
      return res.status(403).json({ success: false, message: 'Only owner, team manager or admin can review' });
    }
    stampReview(doc);
    await doc.save();
    await Activity.create({ userId: req.user.id, action: 'review', documentId: doc._id }).catch(() => {});
    return res.json({ success: true, data: doc });
  } catch (e) { return next(e); }
}

// Replace the attached file: archives the previous file into versions[],
// bumps the version, and re-indexes for semantic search.
async function replaceFile(req, res, next) {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc || doc.isDeleted) return res.status(404).json({ success: false, message: 'Not found' });
    const owner = String(doc.uploadedBy) === String(req.user.id);
    const sameTeamManager = req.user.role === 'manager' && doc.team === req.user.team;
    if (req.user.role !== 'admin' && !owner && !sameTeamManager) {
      return res.status(403).json({ success: false, message: 'Only owner, team manager or admin can replace the file' });
    }
    if (!req.file) return res.status(400).json({ success: false, message: 'File is required' });
    if (doc.filePath) {
      doc.versions.push({
        version: doc.version,
        filePath: doc.filePath,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
      });
      fs.unlink(doc.filePath, () => {});
    }
    doc.version += 1;
    doc.filePath = req.file.path;
    doc.fileType = req.file.mimetype;
    doc.fileSize = req.file.size;
    await doc.save();
    await indexDocument(doc);
    await Activity.create({ userId: req.user.id, action: 'update', documentId: doc._id, metadata: { version: doc.version } }).catch(() => {});
    return res.json({ success: true, data: doc });
  } catch (e) { return next(e); }
}

module.exports = { create, list, getById, update, softDelete, approve, reject, share, download, markReviewed, replaceFile };
