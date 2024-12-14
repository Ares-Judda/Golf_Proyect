const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connection = require('../../business/models/database');
const path = require('path');
const YAML = require('yamljs');
const swaggerUi = require('swagger-ui-express');
const grpcServerUser = require('../../services/servicesGrpc/userService');
const grpcServerAuth = require('../../services/servicesGrpc/authService');

class Server {
    constructor() {
        this.app = express();
        this.port = process.env.PORT;
        this.swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));
        this.middlewares();
        this.routes();
        this.setupSwagger();
        grpcServerUser.start();
        grpcServerAuth.start();
    }

    middlewares() {
        this.app.use(cors({
            origin: '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization'],
        }));
        this.app.use(express.json());
        this.app.use(express.static('public'));
        this.app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
    }

    routes() {
        this.app.use('/api/usuarios', require('../../services/routesRest/user'));
        this.app.use('/api/images', require('../../services/routesRest/images'));
        this.app.use('/api/clothes', require('../../services/routesRest/clothes'));
        this.app.use('/api/clothes', require('../../services/routesRest/sales'));
    }

    setupSwagger() {
        this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(this.swaggerDocument));
    }

    listen() {
        this.app.listen(this.port, () => {
            console.log(`Server listening on port ${this.port}`);
            console.log(`Documentación Swagger disponible en http://localhost:${this.port}/api-docs`);
        });
    }
}

module.exports = Server;
