const getPagination = (query, defaultLimit = 5) => {
  // Query values are strings: convert them and fall back to safe defaults
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.max(Number(query.limit) || defaultLimit, 1);
  return { page, limit, skip: (page - 1) * limit };
};

const buildPaginationMeta = (page, limit, total, totalKey) => ({
  currentPage: page,
  totalPages: Math.ceil(total / limit),
  [totalKey]: total
});

module.exports = { getPagination, buildPaginationMeta };
