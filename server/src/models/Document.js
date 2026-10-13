const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema(
  {
    version: { type: Number, required: true },
    filePath: { type: String },
    fileType: { type: String },
    fileSize: { type: Number },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, enum: ['Project', 'API', 'SOP', 'Manual', 'FAQ'], default: 'Project', index: true },
    filePath: { type: String },
    fileType: { type: String },
    fileSize: { type: Number },
    tags: { type: [String], default: [] },
    team: { type: String, default: 'general', index: true },
    visibility: { type: String, enum: ['public', 'team', 'private'], default: 'team', index: true },
    allowedUsers: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    version: { type: Number, default: 1 },
    versions: { type: [versionSchema], default: [] },
    lastReviewedAt: { type: Date },
    nextReviewAt: { type: Date, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

documentSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Document', documentSchema);
