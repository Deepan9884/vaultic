const mongoose = require('mongoose');

function toIdStr(v) {
  if (!v) return null;
  if (typeof v === 'string') return v;
  if (v._id) return String(v._id);
  return String(v);
}

function isOwner(user, doc) {
  const owner = toIdStr(doc.uploadedBy);
  return owner && owner === String(user.id);
}

function isAllowed(user, doc) {
  const list = doc.allowedUsers || [];
  return list.some((u) => toIdStr(u) === String(user.id));
}

// Mongo filter for list endpoints. Admin sees everything (except deleted).
function buildDocFilter(user) {
  const base = { isDeleted: false };
  if (!user || user.role === 'admin') return base;
  const uid = user.id;
  let uidObj = null;
  try {
    if (mongoose.Types.ObjectId.isValid(uid)) uidObj = new mongoose.Types.ObjectId(uid);
  } catch (_) { /* ignore */ }
  const or = [
    { status: 'approved', visibility: 'public' },
    { status: 'approved', visibility: 'team', team: user.team },
    { uploadedBy: uidObj || uid },
  ];
  // private docs shared explicitly
  or.push({ allowedUsers: uidObj || uid });
  return { ...base, $or: or };
}

function canAccessDoc(user, doc) {
  if (!user || !doc) return false;
  if (user.role === 'admin') return !doc.isDeleted;
  if (doc.isDeleted) return false;
  if (isOwner(user, doc)) return true;
  if (isAllowed(user, doc)) return true;
  if (doc.status !== 'approved') return false;
  if (doc.visibility === 'public') return true;
  if (doc.visibility === 'team' && String(doc.team) === String(user.team)) return true;
  return false;
}

function buildFaqFilter(user) {
  if (!user || user.role === 'admin') return {};
  return {
    $or: [
      { status: 'approved', visibility: 'public' },
      { status: 'approved', visibility: 'team', team: user.team },
      { uploadedBy: user.id },
    ],
  };
}

function canAccessFaq(user, faq) {
  if (!user || !faq) return false;
  if (user.role === 'admin') return true;
  if (toIdStr(faq.uploadedBy) === String(user.id)) return true;
  if (faq.status !== 'approved') return false;
  if (faq.visibility === 'public') return true;
  if (faq.visibility === 'team' && String(faq.team) === String(user.team)) return true;
  return false;
}

module.exports = { buildDocFilter, canAccessDoc, buildFaqFilter, canAccessFaq };
