const connection = require('../models/database');
const userTokenManager = require('../helpers/user-token-manager');
const bcrypt = require('bcrypt');
const jwtManager = require('../helpers/jwt-manager');

const login = async (email, password) => {
    try {
        console.log(`\nEl usuario ${email} se está intentando loguear...`);
        return new Promise((resolve, reject) => {
            connection.query('SELECT * FROM user WHERE email = ?', [email], async (err, results) => {
                if (err) {
                    console.error('Error en la consulta MySQL:', err);
                    return reject({ mensaje: 'Error interno en el servidor' });
                }
                if (results.length === 0) {
                    console.log('Usuario no encontrado');
                    return reject({ mensaje: 'Credenciales inválidas' });
                }
                const usuario = results[0];
                try {
                    const passwordMatch = await verifyPassword(password, usuario.password);
                    if (!passwordMatch) {
                        return reject({ mensaje: 'Credenciales inválidas' });
                    }
                    const token = await jwtManager.generateToken(usuario.ID_User);
                    userTokenManager.addUser(email, usuario.ID_User);
                    resolve({
                        token,           // Retorna el token
                        idUser: usuario.ID_User,
                        email: usuario.email,
                        role: usuario.role
                    });
                } catch (error) {
                    console.error('Error al verificar la contraseña:', error);
                    return reject({ mensaje: 'Error interno en el servidor' });
                }
            });
        });
    } catch (error) {
        console.error('Error en el logueo de usuario', error);
        throw new Error('Error interno en el servidor');
    }
};

async function verifyPassword(password, hashedPassword) {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
}

module.exports = { login };