const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    action: {
      type: String,
      enum: ['login', 'upload', 'search', 'view', 'approve', 'reject', 'share', 'bookmark', 'faq_create', 'faq_update', 'delete', 'update', 'download', 'ask', 'review'],
      required: true,
      index: true,
    },
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
    query: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

activitySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
