const fs = require('fs');
const path = require('path');
const User = require('../models/user.model');
const HttpError = require('../utils/http-error');
const { UPLOAD_ROOT } = require('../middlewares/upload.middleware');

const AVATAR_URL_PREFIX = '/uploads/avatars/';

// Removes a previously uploaded avatar file; ignores files that are already gone
async function removeAvatarFile(avatarUrl) {
  if (!avatarUrl || !avatarUrl.startsWith(AVATAR_URL_PREFIX)) return;
  const filePath = path.join(UPLOAD_ROOT, 'avatars', path.basename(avatarUrl));
  await fs.promises.unlink(filePath).catch((err) => {
    if (err.code !== 'ENOENT') console.error('Could not remove old avatar:', err.message);
  });
}

// PUT /api/v1/users/me (protected) – only the profile fields; email and type cannot change here
exports.updateMe = async (req, res) => {
  const { fullName, age, gender } = req.body || {};
  const updates = {};
  if (fullName !== undefined) updates.fullName = fullName;
  if (age !== undefined) updates.age = age;
  if (gender !== undefined) updates.gender = gender;

  const user = await User.findByIdAndUpdate(req.user.id, updates, { returnDocument: 'after', runValidators: true });
  if (!user) throw new HttpError(401, 'This account no longer exists');

  res.json({ success: true, message: 'Profile updated', data: user });
};

// POST /api/v1/users/me/avatar (protected, multipart/form-data, field "avatar")
// The user always comes from the token (req.user.id), so nobody can change another user's avatar.
exports.updateMyAvatar = async (req, res) => {
  if (!req.file) throw new HttpError(400, 'Please choose an image file!');

  const newAvatarUrl = AVATAR_URL_PREFIX + req.file.filename;
  const user = await User.findById(req.user.id);
  if (!user) {
    await removeAvatarFile(newAvatarUrl);
    throw new HttpError(401, 'This account no longer exists');
  }

  const oldAvatarUrl = user.avatarUrl;
  user.avatarUrl = newAvatarUrl;
  await user.save();
  await removeAvatarFile(oldAvatarUrl);

  res.json({ success: true, message: 'Avatar updated', data: user });
};
