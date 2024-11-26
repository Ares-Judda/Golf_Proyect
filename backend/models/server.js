const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connection = require('./database');
const path = require('path');
const YAML = require('yamljs');
const swaggerUi = require('swagger-ui-express');

class Server {
    constructor(){
        this.app = express();
        this.port = process.env.PORT;
        this.swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));
        this.middlewares();
        this.routes();
        this.setupSwagger();
    }

    middlewares() {
        this.app.use(cors({
            origin: '*', // Permite cualquier origen
            methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos HTTP permitidos
            allowedHeaders: ['Content-Type', 'Authorization'], // Headers permitidos
        }));
        this.app.use(express.json());  
        this.app.use(express.static('public'));
    }   

    routes() {
        this.app.use('/api/usuarios', require('../routes/user'));  
        this.app.use('/api/auth', require('../routes/auth'));     
    }

    setupSwagger() {
        this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(this.swaggerDocument));
    }

    listen (){
        this.app.listen(this.port, () =>{
            console.log(`Server listening on port ${this.port}`)
            console.log(`Documentación Swagger disponible en http://localhost:${this.port}/api-docs`);
        });
    }
}

module.exports = Server;
