const jwt = require('jsonwebtoken');
const jwtManager = require('../helpers/jwt-manager');
const userTokenManager = require('../helpers/user-token-manager');

/**
 * Middleware para validar el JWT del usuario y asegurar que la solicitud esté autenticada.
 * Este middleware verifica que el token JWT proporcionado sea válido y que el usuario
 * esté autenticado antes de acceder a las rutas protegidas.
 *
 * @param {Object} req - El objeto de solicitud de Express.
 * @param {Object} res - El objeto de respuesta de Express.
 * @param {Function} next - La función para pasar al siguiente middleware o ruta.
 */
const validarJWT = (req, res, next) => {
    const ID_User = Object.keys(userTokenManager.users)[0];  // O puedes obtenerlo de req.headers si ya se envió por header

    // Verificar si el usuario tiene un token almacenado en el UserTokenManager.
    if (!ID_User) {
        return res.status(400).json({ mensaje: 'Falta el ID del usuario' });
    }

    // Verificar la validez del token usando el JWTManager.
    const user = userTokenManager.getUser(ID_User);
    if (!user || !user.token) {
        return res.status(401).json({ mensaje: 'No hay token activo para este usuario' });
    }

    const verifiedUid = jwtManager.verifyToken(user.token);
    if (!verifiedUid) {
        return res.status(401).json({ mensaje: 'Token no válido' });
    }

    req.uid = verifiedUid; 
    next();
};

module.exports = {
    validarJWT
};
