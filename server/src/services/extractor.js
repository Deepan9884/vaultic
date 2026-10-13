const fs = require('fs');
const path = require('path');

const MAX_CHARS = 200000;

async function extractText(filePath, mimetype, originalname = '') {
  const ext = path.extname(originalname || filePath || '').toLowerCase();
  const mime = String(mimetype || '').toLowerCase();
  let text = '';

  const isPdf = mime.includes('pdf') || ext === '.pdf';
  const isDocx =
    mime.includes('wordprocessingml') || mime.includes('officedocument') || ext === '.docx';
  const isDoc = ext === '.doc';

  if (isPdf) {
    const pdf = require('pdf-parse');
    const buf = fs.readFileSync(filePath);
    const data = await pdf(buf);
    text = data.text || '';
  } else if (isDocx) {
    const mammoth = require('mammoth');
    const out = await mammoth.extractRawText({ path: filePath });
    text = out.value || '';
  } else if (isDoc) {
    throw new Error('Legacy .doc not supported — please upload .docx, .pdf, .txt or .md');
  } else {
    text = fs.readFileSync(filePath, 'utf8');
  }

  text = String(text || '').replace(/\r/g, '').trim();
  if (text.length > MAX_CHARS) text = text.slice(0, MAX_CHARS);
  return text;
}

module.exports = { extractText };
