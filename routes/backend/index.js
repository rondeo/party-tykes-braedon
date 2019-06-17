const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('./../../config/auth');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
// const swaggerDocument = YAML.load('./../../swagger.yaml');

//swagger-API
// router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

module.exports = router;