const express = require('express');
const { validarJWT } = require('../helpers/validar-jwt');
const upload = require('../helpers/multerConfig'); 
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
router.post('/upload_image', upload.single('profileImage'), (req, res) => {
    if (!req.file) {
        return res.status(400).send({ message: 'No se ha subido ningún archivo.' });
    }
    const imageUrl = `http://localhost:8085/uploads/${req.file.filename}`;
    res.status(200).send({ url: imageUrl });
});

module.exports = router;
