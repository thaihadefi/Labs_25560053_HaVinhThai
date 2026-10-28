const slugify = (text) => String(text)
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .replace(/[đĐ]/g, 'd')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

module.exports = slugify;
