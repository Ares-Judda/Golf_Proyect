require('dotenv').config();
const Server = require('./models/server');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const server = new Server();
server.listen(); 
