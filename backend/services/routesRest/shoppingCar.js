const express = require('express');
const { validarJWT } = require('../../business/helpers/validar-jwt');
const router = express.Router();
const {
    add_articulo_to_car,
    get_shopping_car,
    update_quantity,
    delete_from_car
} = require('../../Logic/controllersRest/shoppingCar.js');

router.post('/add_articulo_to_car/:userId', validarJWT, add_articulo_to_car);
router.get('/get_shopping_car/:userId', validarJWT, get_shopping_car);
router.post('/update_quantity/:userId', validarJWT, update_quantity);
router.post('/delete_from_car/:userId', validarJWT, delete_from_car);

module.exports = router;