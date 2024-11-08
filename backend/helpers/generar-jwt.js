const jwt = require('jsonwebtoken');
const jwtManager = require('../helpers/jwt-manager');

/**
 * Genera un JSON Web Token (JWT) para un usuario dado.
 * 
 * @param {string} uid - El identificador único del usuario para el que se genera el token.
 * @returns {Promise<string>} - Devuelve una promesa que resuelve con el token generado.
 * 
 * El token se firma utilizando una clave secreta y tiene una validez de 2 horas.
 * En caso de un error al generar el token, la promesa se rechaza con un mensaje de error.
 */
const generarJWT = (uid = '') => {
    return new Promise((resolve, reject) => {
        const payload = { uid };
        const secretKey = jwtManager.secretKey; 
        jwt.sign(payload, secretKey, { expiresIn: '2h' }, (err, token) => {
            if (err) {
                console.error('Error al generar el token:', err);
                reject('No se pudo generar el token');
            } else {
                resolve(token);
            }
        });
    });
};

module.exports = {
    generarJWT
};
