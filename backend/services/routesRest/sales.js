const express = require('express');
const { validarJWT } = require('../../business/helpers/validar-jwt');
const router = express.Router();
const {
    get_all_ventas
} = require('../../Logic/controllersRest/sales');

router.get('/get_all_ventas',  get_all_ventas); //Falta validacion de credenciales

module.exports = router;