const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true },
    tags: { type: [String], default: [] },
    team: { type: String, default: 'general', index: true },
    visibility: { type: String, enum: ['public', 'team', 'private'], default: 'team' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved', index: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

faqSchema.index({ question: 'text', answer: 'text', tags: 'text' });

module.exports = mongoose.model('Faq', faqSchema);
