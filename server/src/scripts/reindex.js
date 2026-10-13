require('dotenv').config();
const connectDB = require('../config/db');
const Document = require('../models/Document');
const DocumentChunk = require('../models/DocumentChunk');
const { extractText } = require('../services/extractor');
const { chunkText } = require('../services/chunker');
const { embedChunks } = require('../services/embedder');

async function run() {
  await connectDB();
  const docs = await Document.find({ isDeleted: false, filePath: { $ne: null } });
  console.log(`Reindexing ${docs.length} documents...`);
  for (const doc of docs) {
    try {
      const text = await extractText(doc.filePath, doc.fileType, doc.filePath);
      const chunks = chunkText(text);
      const vectors = await embedChunks(chunks);
      await DocumentChunk.deleteMany({ documentId: doc._id });
      if (chunks.length) {
        await DocumentChunk.insertMany(
          chunks.map((t, i) => ({
            documentId: doc._id,
            chunkIndex: i,
            text: t,
            embedding: vectors[i] || [],
            team: doc.team,
            visibility: doc.visibility,
            status: doc.status,
            category: doc.category,
          }))
        );
      }
      console.log(` - ${doc.title}: ${chunks.length} chunks`);
    } catch (e) {
      console.error(` - ${doc.title} FAILED:`, e.message);
    }
  }
  console.log('Done');
  process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
