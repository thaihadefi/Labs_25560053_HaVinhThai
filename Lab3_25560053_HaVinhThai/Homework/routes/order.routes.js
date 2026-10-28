const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const {
  validateIdParam,
  validateCreateOrder,
  validateStatusUpdate,
  validateOrderListQuery
} = require('../middlewares/order.validator');

/**
 * @swagger
 * tags:
 *   - name: Orders
 *     description: Order management with SQL transactions
 *   - name: Analytics
 *     description: Sales reporting
 *
 * components:
 *   schemas:
 *     OrderItemInput:
 *       type: object
 *       required:
 *         - productId
 *         - quantity
 *       properties:
 *         productId:
 *           type: integer
 *           example: 2
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           example: 2
 *     OrderInput:
 *       type: object
 *       required:
 *         - customerId
 *         - items
 *       properties:
 *         customerId:
 *           type: integer
 *           example: 1
 *         items:
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/OrderItemInput'
 *           example:
 *             - productId: 1
 *               quantity: 1
 *             - productId: 2
 *               quantity: 2
 *     OrderSummary:
 *       type: object
 *       properties:
 *         order_id:
 *           type: integer
 *           example: 1
 *         customer_name:
 *           type: string
 *           example: "Nguyen Van Hung"
 *         email:
 *           type: string
 *           example: "hung.nguyen@example.com"
 *         status:
 *           type: string
 *           enum: [pending, completed, cancelled]
 *           example: "completed"
 *         total_amount:
 *           type: number
 *           example: 35500000
 *         total_items_count:
 *           type: integer
 *           example: 3
 *         created_at:
 *           type: string
 *           format: date-time
 *     OrderDetail:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         status:
 *           type: string
 *           enum: [pending, completed, cancelled]
 *           example: "pending"
 *         total_amount:
 *           type: number
 *           example: 35500000
 *         created_at:
 *           type: string
 *           format: date-time
 *         customer:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               example: 1
 *             full_name:
 *               type: string
 *               example: "Nguyen Van Hung"
 *             email:
 *               type: string
 *               example: "hung.nguyen@example.com"
 *             phone:
 *               type: string
 *               example: "0901234567"
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               product_id:
 *                 type: integer
 *                 example: 1
 *               product_name:
 *                 type: string
 *                 example: "Laptop Dell XPS 15"
 *               quantity:
 *                 type: integer
 *                 example: 1
 *               unit_price:
 *                 type: number
 *                 example: 35000000
 *               subtotal:
 *                 type: number
 *                 example: 35000000
 *     OrderDetailResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Order created successfully"
 *         data:
 *           $ref: '#/components/schemas/OrderDetail'
 */
router.param('id', validateIdParam);

/**
 * @swagger
 * /orders/analytics/sales-summary:
 *   get:
 *     summary: Sales revenue analytics for completed orders
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Sales summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalRevenue:
 *                       type: number
 *                       example: 37300000
 *                     completedOrdersCount:
 *                       type: integer
 *                       example: 2
 *                     averageOrderValue:
 *                       type: number
 *                       example: 18650000
 *                     topSellingProducts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           product_id:
 *                             type: integer
 *                             example: 2
 *                           product_name:
 *                             type: string
 *                             example: "Wireless Mouse"
 *                           total_quantity_sold:
 *                             type: integer
 *                             example: 2
 *                           total_revenue:
 *                             type: number
 *                             example: 500000
 */
router.get('/analytics/sales-summary', orderController.getSalesSummary);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: List orders with filtering and pagination
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, cancelled]
 *         description: Filter by order status
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: integer
 *         description: Filter by customer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Current page (default = 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Orders per page (default = 5)
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 1
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/OrderSummary'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *   post:
 *     summary: Create an order (one atomic SQL transaction)
 *     description: Checks the customer and every product, verifies stock, prices the order from the database, inserts orders and order_items, then deducts stock.
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderInput'
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderDetailResponse'
 *       400:
 *         description: Invalid payload or a product is out of stock
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Customer or product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', validateOrderListQuery, orderController.getAllOrders);
router.post('/', validateCreateOrder, orderController.createOrder);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get order details (customer info and items)
 *     tags: [Orders]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Order found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderDetailResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     summary: Delete an order (restores stock first if it is not cancelled)
 *     tags: [Orders]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Order deleted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 3
 *                     previousStatus:
 *                       type: string
 *                       example: "pending"
 *                     stockRestored:
 *                       type: boolean
 *                       example: true
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', orderController.getOrderById);
router.delete('/:id', orderController.deleteOrder);

/**
 * @swagger
 * /orders/{id}/status:
 *   patch:
 *     summary: Update order status (cancelling restores stock in the same transaction)
 *     tags: [Orders]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, completed, cancelled]
 *                 example: "cancelled"
 *     responses:
 *       200:
 *         description: Status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderDetailResponse'
 *       400:
 *         description: Invalid status, or the order is already cancelled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch('/:id/status', validateStatusUpdate, orderController.updateOrderStatus);

module.exports = router;
