const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connection = require('./database');

class Server {
    constructor(){
        this.app = express();
        this.port = process.env.PORT;
        this.middlewares();
        this.routes();
    }

    middlewares() {
        this.app.use(cors());
        this.app.use(express.json());  
        this.app.use(express.static('public'));
    }    

    routes() {
        this.app.use('/api/usuarios', require('../routes/user'));  
        this.app.use('/api/auth', require('../routes/auth'));     
    }

    listen (){
        this.app.listen(this.port, () =>{
            console.log(`Server listening on port ${this.port}`)
        });
    }
}

module.exports = Server;
