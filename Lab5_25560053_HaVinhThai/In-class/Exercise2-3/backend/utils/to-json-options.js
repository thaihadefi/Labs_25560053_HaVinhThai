// Shared toJSON options: expose `id` instead of `_id`, drop `__v`,
// and remove any field listed in `hidden` (e.g. passwordHash) from every API response.
function toJsonOptions(hidden = []) {
  return {
    virtuals: true,
    versionKey: false,
    transform: (doc, ret) => {
      delete ret._id;
      hidden.forEach((field) => delete ret[field]);
      return ret;
    }
  };
}

module.exports = toJsonOptions;
