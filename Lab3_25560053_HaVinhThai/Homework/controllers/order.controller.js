const orderService = require('../services/order.service');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');

// 1. POST /api/v1/orders - Create an order (SQL transaction)
exports.createOrder = async (req, res, next) => {
  try {
    const { customerId, items } = req.body;
    const order = await orderService.createOrder(customerId, items);
    res.status(201).json({ success: true, message: 'Order created successfully', data: order });
  } catch (error) {
    next(error);
  }
};

// 2. GET /api/v1/orders - List orders with filtering, pagination & JOIN
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, customerId } = req.query;
    const { page, limit, offset } = getPagination(req.query);

    const { orders, totalOrders } = await orderService.listOrders({
      status,
      customerId: customerId ? Number(customerId) : undefined,
      limit,
      offset
    });

    res.status(200).json({
      success: true,
      count: orders.length,
      pagination: buildPaginationMeta(page, limit, totalOrders, 'totalOrders'),
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// 3. GET /api/v1/orders/:id - Order details with customer and items
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(Number(req.params.id));
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// 4. PATCH /api/v1/orders/:id/status - Update status & restore stock on cancel
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const order = await orderService.updateOrderStatus(Number(req.params.id), req.body.status);
    res.status(200).json({ success: true, message: 'Order status updated successfully', data: order });
  } catch (error) {
    next(error);
  }
};

// 5. DELETE /api/v1/orders/:id - Delete an order
exports.deleteOrder = async (req, res, next) => {
  try {
    const result = await orderService.deleteOrder(Number(req.params.id));
    res.status(200).json({ success: true, message: 'Order deleted successfully', data: result });
  } catch (error) {
    next(error);
  }
};

// 6. GET /api/v1/orders/analytics/sales-summary - Sales revenue analytics
exports.getSalesSummary = async (req, res, next) => {
  try {
    const summary = await orderService.getSalesSummary();
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
};
