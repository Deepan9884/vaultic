const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
  },
  { timestamps: true }
);

bookmarkSchema.index({ userId: 1, documentId: 1 }, { unique: true });

module.exports = mongoose.model('Bookmark', bookmarkSchema);
