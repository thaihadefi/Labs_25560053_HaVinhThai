const express = require('express');
const { updateMe, updateMyAvatar } = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth.middleware');
const { uploadAvatar } = require('../middlewares/upload.middleware');

const router = express.Router();

// protect runs before Multer, so an unauthenticated request never writes a file
router.put('/me', protect, updateMe);
router.post('/me/avatar', protect, uploadAvatar, updateMyAvatar);

module.exports = router;
