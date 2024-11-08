const express = require('express');
const { validarJWT } = require('../helpers/validar-jwt');
const router = express.Router();
const {
    get_all_usuarios, 
    save_usuario, 
    get_usuario, 
    update_usuario_body, 
    logout_usuario
} = require('../controllers/users');


router.get('/get_all_usuarios', validarJWT, get_all_usuarios); 
router.post('/save_usuario', save_usuario); 
router.get('/get_usuario', validarJWT, get_usuario); 
router.put('/update_usuario', validarJWT, update_usuario_body); 
router.get('/logout', logout_usuario);

module.exports = router;
