const express = require('express');
const { validarJWT } = require('../../business/helpers/validar-jwt');
const router = express.Router();
const {
    get_all_articulos, 
    get_articulos_by_selling,
    get_articulo_by_name,
    save_article, 
    update_articulo_body,
    delete_articulo,
    add_articulo_to_car,
    get_shopping_car
} = require('../../Logic/controllersRest/clothes');

router.get('/get_all_articulos',  get_all_articulos); 
router.get('/get_articulos_by_selling',  get_articulos_by_selling);
router.get('/get_articulo_by_name',  get_articulo_by_name); 
router.post('/save_article',  save_article); 
router.put('/update_articulo', update_articulo_body);
router.delete('/delete_articulo', delete_articulo);

module.exports = router;