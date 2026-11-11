const multer = require('multer');
const path = require('path');
const fs = require('fs');
const HttpError = require('../utils/http-error');

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');
const AVATAR_DIR = path.join(UPLOAD_ROOT, 'avatars');
fs.mkdirSync(AVATAR_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AVATAR_DIR),
  // The file name starts with the id from the token, never from the request body
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `user-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
  }
});

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) return cb(null, true);
  cb(new HttpError(400, 'Only image files are accepted (JPG, PNG, WEBP)!'), false);
};

const uploadAvatar = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter
}).single('avatar');

module.exports = { uploadAvatar, UPLOAD_ROOT };
