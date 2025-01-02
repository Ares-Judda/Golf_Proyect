const express = require('express');
const { validarJWT } = require('../../business/helpers/validar-jwt');
const router = express.Router();
const {
    buy_shopping_car
} = require('../../Logic/controllersRest/sales');


router.post('/buy_shopping_car/:userId', validarJWT, buy_shopping_car); 

module.exports = router;