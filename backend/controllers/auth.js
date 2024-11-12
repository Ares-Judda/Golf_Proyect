const { response } = require('express');
const { generarJWT } = require('../helpers/generar-jwt'); 
const connection = require('../models/database');
const userTokenManager = require('../helpers/user-token-manager');
const bcrypt = require('bcrypt');

const login = async (req, res = response) => {
    try {
        const { email, password } = req.body;
        console.log(`\nEl usuario ${email} se está intentando loguear...`);
        connection.query('SELECT * FROM user WHERE email = ?', [email], async (err, results) => {
            if (err) {
                console.error('Error en la consulta MySQL:', err);
                return res.status(500).json({ mensaje: 'Error interno en el servidor' });
            }
            if (results.length === 0) {
                console.log('Usuario no encontrado');
                return res.status(401).json({ mensaje: 'Credenciales inválidas' });
            }
            const usuario = results[0];
            const passwordMatch = await verifyPassword(password, usuario.password);
            if (!passwordMatch) {
                return res.status(401).json({ mensaje: 'Credenciales inválidas' });
            }
            const token = await generarJWT(usuario.ID_User); 
            userTokenManager.addUser(email, usuario.ID_User, token);
            res.header('x-token', token); 
            console.log(`Token enviado en el header: ${token}`);
            res.json(usuario);
        });
    } catch (error) {
        console.error('Error en el logueo de usuario', error);
        res.status(500).json({ mensaje: 'Error interno en el servidor' });
    }
};

async function verifyPassword(password, hashedPassword) {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
    
}

module.exports = { login };
