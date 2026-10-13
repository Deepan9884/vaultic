require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('./db');
const User = require('../models/User');
const Document = require('../models/Document');
const Faq = require('../models/Faq');

async function run() {
  await connectDB();
  const count = await User.countDocuments();
  if (count === 0) {
    const mk = async (name, email, role, team) => ({
      name,
      email,
      passwordHash: await bcrypt.hash('password123', 12),
      role,
      team,
    });
    await User.create([
      await mk('Admin', 'admin@vaultic.local', 'admin', 'general'),
      await mk('Manager', 'manager@vaultic.local', 'manager', 'engineering'),
      await mk('Employee', 'employee@vaultic.local', 'employee', 'engineering'),
    ]);
    console.log('Seeded users: admin/manager/employee @vaultic.local / password123');
  } else {
    console.log(`Users exist (${count}), skipping user seed`);
  }

  const admin = await User.findOne({ role: 'admin' });
  if (admin) {
    const docs = await Document.countDocuments();
    if (docs === 0) {
      await Document.create([
        {
          title: 'API Onboarding Guide', description: 'How to use the Vaultic API', category: 'API',
          tags: ['api', 'onboarding'], team: 'engineering', visibility: 'public',
          status: 'approved', uploadedBy: admin._id,
        },
        {
          title: 'SOP — Incident Response', description: 'Steps for incident triage', category: 'SOP',
          tags: ['sop', 'incident'], team: 'general', visibility: 'public',
          status: 'approved', uploadedBy: admin._id,
        },
      ]);
      console.log('Seeded sample documents');
    }
    if ((await Faq.countDocuments()) === 0) {
      await Faq.create([
        { question: 'How do I upload a document?', answer: 'Go to Documents > Upload, pick pdf/docx/txt/md (max 10MB).', tags: ['upload'], team: 'general', visibility: 'public', status: 'approved', uploadedBy: admin._id },
        { question: 'How does search work?', answer: 'Semantic search embeds your query (MiniLM-L6-v2) and ranks chunks by cosine similarity.', tags: ['search'], team: 'general', visibility: 'public', status: 'approved', uploadedBy: admin._id },
      ]);
      console.log('Seeded sample FAQs');
    }
  }
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
