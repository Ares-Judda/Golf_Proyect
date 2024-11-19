const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const connection = require('../models/database');

class JWTManager {
    static secretKey = crypto.randomBytes(32).toString('hex');
    static tokenExpiration = 20;

    /**
     * Genera un token JWT para un usuario y lo guarda en la base de datos.
     * @param {string} uid - El identificador único del usuario.
     * @returns {Promise<string>} - El nuevo token generado.
     */
    static async generateToken(uid) {
        const token = jwt.sign({ uid }, this.secretKey, { expiresIn: this.tokenExpiration });
        await this.updateUserTokenInDB(uid, token);
        return token;
    }

    /**
     * Verifica el token del usuario. Si ha caducado, genera uno nuevo y lo guarda.
     * @param {string} uid - El identificador único del usuario.
     * @returns {Promise<string|null>} - Devuelve el UID si el token es válido o un nuevo token si estaba caducado, o null si ocurre un error.
     */
    static async verifyToken(uid) {
        try {
            const token = await this.getUserTokenFromDB(uid);
            if (!token) return null;
            try {
                const decoded = jwt.verify(token, this.secretKey);
                return decoded.uid; 
            } catch (err) {
                if (err.name === 'TokenExpiredError') {
                    console.log('Token expirado, generando uno nuevo...');
                    const newToken = await this.generateToken(uid); 
                    console.log("\nEl nuevo token es:", newToken);
                    return newToken;
                } else {
                    console.error('Error al verificar el token:', err);
                    return null;
                }
            }
        } catch (err) {
            console.error('Error al obtener el token desde la base de datos:', err);
            return null;
        }
    }

    /**
     * Actualiza el token del usuario en la base de datos.
     * @param {string} uid - El UID del usuario.
     * @param {string} token - El token JWT que se asignará al usuario.
     * @returns {Promise<void>}
     */
    static updateUserTokenInDB(uid, token) {
        return new Promise((resolve, reject) => {
            connection.query(
                'UPDATE user SET token = ? WHERE ID_User = ?',
                [token, uid],
                (err, results) => {
                    if (err) {
                        console.error('Error en la consulta MySQL:', err);
                        reject('Error interno en el servidor');
                    } else if (results.affectedRows === 0) {
                        console.log('Usuario no encontrado en la base de datos para el UID:', uid);
                        reject('Usuario no encontrado');
                    } else {
                        resolve();
                    }
                }
            );
        });
    }

    /**
     * Obtiene el token del usuario desde la base de datos.
     * @param {string} uid - El UID del usuario a consultar.
     * @returns {Promise<string|null>} - El token JWT almacenado para el usuario, o null si no se encuentra.
     */
    static getUserTokenFromDB(uid) {
        return new Promise((resolve, reject) => {
            connection.query('SELECT token FROM user WHERE ID_User = ?', [uid], (err, results) => {
                if (err) {
                    console.error('Error en la consulta MySQL:', err);
                    return reject('Error interno en el servidor');
                }
                if (results.length === 0) {
                    console.log('Usuario no encontrado');
                    return resolve(null);
                }
                resolve(results[0].token);
            });
        });
    }
}

module.exports = JWTManager;
