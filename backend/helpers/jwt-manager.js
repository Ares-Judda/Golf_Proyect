const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * Clase Singleton para gestionar JSON Web Tokens (JWT).
 * La clave secreta se genera dinámicamente una vez y se reutiliza para todas las operaciones con JWT.
 */
class JWTManager {
    static instance;
    static tokens = {}; 
    constructor() {
        if (JWTManager.instance) {
            return JWTManager.instance;
        }

        this.secretKey = crypto.randomBytes(32).toString('hex'); 
        this.expiresIn = 2 * 60 * 60; 
        JWTManager.instance = this;
    }

    /**
     * Genera un token JWT para un usuario dado.
     * @param {string} uid - El identificador único del usuario para el que se genera el token.
     * @returns {string} - El token JWT generado.
     */
    generateToken(uid) {
        const token = jwt.sign({ uid }, this.secretKey, { expiresIn: this.expiresIn });
        JWTManager.tokens[uid] = token; 
        console.log('\n Secret Key:', this.secretKey);  // Para verificar la clave secreta utilizada
        return token;
    }

    /**
     * Verifica la validez de un token JWT.
     * @param {string} token - El token JWT a verificar.
     * @returns {string|null} - Devuelve el UID decodificado si es válido, o null si no lo es.
     */
    verifyToken(token) {
        try {
            const decoded = jwt.verify(token, this.secretKey);
            return decoded.uid; 
        } catch (error) {
            return null; 
        }
    }
}

const jwtManager = new JWTManager();
module.exports = jwtManager;
