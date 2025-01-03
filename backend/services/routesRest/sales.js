const express = require('express');
const { validarJWT } = require('../../business/helpers/validar-jwt');
const router = express.Router();
const {
    buy_shopping_car,
    get_purchase_history_by_client
} = require('../../Logic/controllersRest/sales');


router.post('/buy_shopping_car/:userId', validarJWT, buy_shopping_car); 
router.get('/get_purchase_history_by_client/:userId', get_purchase_history_by_client); 

module.exports = router;