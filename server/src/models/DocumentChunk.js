const mongoose = require('mongoose');

const chunkSchema = new mongoose.Schema(
  {
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    chunkIndex: { type: Number, required: true },
    text: { type: String, required: true },
    embedding: { type: [Number], index: false, default: [] },
    team: { type: String, default: 'general', index: true },
    visibility: { type: String, enum: ['public', 'team', 'private'], default: 'team' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    category: { type: String, default: 'Project', index: true },
  },
  { timestamps: true }
);

chunkSchema.index({ documentId: 1, chunkIndex: 1 });

module.exports = mongoose.model('DocumentChunk', chunkSchema);
