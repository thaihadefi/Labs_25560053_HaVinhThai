const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const validateObjectId = require('../middlewares/validate-object-id.middleware');
const { validateCategory, validateCategoryPatch } = require('../middlewares/category.validator');

/**
 * @swagger
 * tags:
 *   - name: Categories
 *     description: Category management endpoints
 *
 * components:
 *   schemas:
 *     CategoryInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           example: "Home & Living"
 *         description:
 *           type: string
 *           example: "Furniture and home appliances"
 *     CategoryPatch:
 *       type: object
 *       description: Send only the fields to change
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           example: "Home & Kitchen"
 *         description:
 *           type: string
 *           example: "Updated description only"
 *     Category:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated ID from MongoDB
 *           example: "6aa7c27316747184e0b762ad"
 *         name:
 *           type: string
 *           example: "Home & Living"
 *         slug:
 *           type: string
 *           description: Generated from name, unique
 *           example: "home-living"
 *         description:
 *           type: string
 *           example: "Furniture and home appliances"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CategoryResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Category created successfully"
 *         data:
 *           $ref: '#/components/schemas/Category'
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get the list of categories
 *     tags: [Categories]
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/limitParam'
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [name, -name, createdAt, -createdAt, updatedAt, -updatedAt]
 *           default: -createdAt
 *         description: Sort field, prefix with "-" for descending
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
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
 *                   $ref: '#/components/schemas/CategoryPagination'
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *   post:
 *     summary: Create a new category (slug is generated from name)
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.param('id', validateObjectId);

router.get('/', categoryController.getAllCategories);
router.post('/', validateCategory, categoryController.createCategory);

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get a category by ID
 *     tags: [Categories]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Category found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     summary: Replace a category by ID (fields not sent are removed)
 *     tags: [Categories]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *   patch:
 *     summary: Partially update a category by ID
 *     tags: [Categories]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryPatch'
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *   delete:
 *     summary: Delete a category by ID
 *     tags: [Categories]
 *     parameters:
 *       - $ref: '#/components/parameters/idParam'
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', categoryController.getCategoryById);
router.put('/:id', validateCategory, categoryController.replaceCategory);
router.patch('/:id', validateCategoryPatch, categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
