const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const c = require('../controllers/documentController');
const { authenticate, authorize } = require('../middleware/auth');

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = String(file.originalname || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, Date.now() + '-' + safe);
  },
});

const ALLOWED = ['.pdf', '.docx', '.txt', '.md'];
function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (ALLOWED.includes(ext)) return cb(null, true);
  return cb(new Error('Only pdf, docx, txt, md files allowed'));
}

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter });

router.use(authenticate);
router.get('/', c.list);
router.post('/', upload.single('file'), c.create);
router.get('/:id', c.getById);
router.get('/:id/file', c.download);
router.patch('/:id', c.update);
router.delete('/:id', c.softDelete);
router.post('/:id/approve', authorize('admin'), c.approve);
router.post('/:id/reject', authorize('admin'), c.reject);
router.post('/:id/review', c.markReviewed);
router.post('/:id/share', c.share);

module.exports = router;
