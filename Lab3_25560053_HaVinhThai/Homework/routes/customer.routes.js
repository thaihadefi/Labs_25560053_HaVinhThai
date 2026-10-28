const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const { validateIdParam } = require('../middlewares/order.validator');

router.param('id', validateIdParam);

/**
 * @swagger
 * tags:
 *   - name: Customers
 *     description: Customer reports
 *
 * /customers/{id}/order-history:
 *   get:
 *     summary: Get all orders of a customer and their lifetime spending
 *     tags: [Customers]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Order history retrieved successfully
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
 *                     customer:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         full_name:
 *                           type: string
 *                           example: "Nguyen Van Hung"
 *                         email:
 *                           type: string
 *                           example: "hung.nguyen@example.com"
 *                         phone:
 *                           type: string
 *                           example: "0901234567"
 *                         created_at:
 *                           type: string
 *                           format: date-time
 *                     totalLifetimeSpent:
 *                       type: number
 *                       description: Sum of the customer's completed orders
 *                       example: 35500000
 *                     totalOrders:
 *                       type: integer
 *                       example: 2
 *                     orders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           order_id:
 *                             type: integer
 *                             example: 1
 *                           status:
 *                             type: string
 *                             example: "completed"
 *                           total_amount:
 *                             type: number
 *                             example: 35500000
 *                           total_items_count:
 *                             type: integer
 *                             example: 3
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id/order-history', customerController.getOrderHistory);

module.exports = router;
