// Swagger / OpenAPI 3.0 configuration
const path = require('path');
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const PORT = process.env.PORT || 3001;

const errorContent = { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } };

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Orders & Inventory Management API - Web & Database Lab 3 Homework',
      version: '1.0.0',
      description: 'E-commerce orders API built with Express.js and MySQL (mysql2/promise), using SQL transactions for stock management'
    },
    servers: [
      {
        url: `http://localhost:${PORT}/api/v1`,
        description: 'Development Local Server'
      }
    ],
    components: {
      parameters: {
        idParam: {
          in: 'path',
          name: 'id',
          required: true,
          description: 'Numeric ID of the resource',
          schema: { type: 'integer', minimum: 1, example: 1 }
        }
      },
      schemas: {
        Pagination: {
          type: 'object',
          properties: {
            currentPage: { type: 'integer', example: 1 },
            totalPages: { type: 'integer', example: 1 },
            totalOrders: { type: 'integer', example: 4 }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Error message' }
          }
        }
      },
      responses: {
        BadRequest: { description: 'Invalid input', content: errorContent },
        NotFound: { description: 'Resource not found', content: errorContent }
      }
    }
  },
  apis: [path.join(__dirname, '../routes/*.js')]
};

const swaggerSpec = swaggerJSDoc(options);

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log(`Swagger UI documentation is ready at: http://localhost:${PORT}/api-docs`);
};

module.exports = setupSwagger;
