const ORDER_STATUSES = ['pending', 'completed', 'cancelled'];

const isPositiveInteger = (value) => Number.isInteger(value) && value > 0;

const badRequest = (res, error) => res.status(400).json({ success: false, error });

const validateIdParam = (req, res, next, id) => {
  if (!/^\d+$/.test(id) || Number(id) <= 0) {
    return badRequest(res, `Invalid ID: ${id}. ID must be a positive integer`);
  }
  next();
};

const validateCreateOrder = (req, res, next) => {
  const { customerId, items } = req.body ?? {};

  if (!isPositiveInteger(customerId)) {
    return badRequest(res, 'customerId must be a positive integer');
  }
  if (!Array.isArray(items) || items.length === 0) {
    return badRequest(res, 'items must be a non-empty array');
  }
  for (const [index, item] of items.entries()) {
    if (!isPositiveInteger(item?.productId)) {
      return badRequest(res, `items[${index}].productId must be a positive integer`);
    }
    if (!isPositiveInteger(item.quantity)) {
      return badRequest(res, `items[${index}].quantity must be a positive integer`);
    }
  }
  next();
};

const validateStatusUpdate = (req, res, next) => {
  const status = req.body?.status;
  if (!ORDER_STATUSES.includes(status)) {
    return badRequest(res, `status must be one of: ${ORDER_STATUSES.join(', ')}`);
  }
  next();
};

const validateOrderListQuery = (req, res, next) => {
  const { status, customerId } = req.query;
  if (status !== undefined && !ORDER_STATUSES.includes(status)) {
    return badRequest(res, `status must be one of: ${ORDER_STATUSES.join(', ')}`);
  }
  if (customerId !== undefined && !isPositiveInteger(Number(customerId))) {
    return badRequest(res, 'customerId must be a positive integer');
  }
  next();
};

module.exports = {
  validateIdParam,
  validateCreateOrder,
  validateStatusUpdate,
  validateOrderListQuery
};
