const jwt = require('jsonwebtoken');
const jwtManager = require('../helpers/jwt-manager');
/**
 * Middleware para validar el JWT del usuario y asegurar que la solicitud esté autenticada.
 * Este middleware verifica que el token JWT almacenado en la base de datos sea válido
 * y que el usuario esté autenticado antes de acceder a las rutas protegidas.
 *
 * @param {Object} req - El objeto de solicitud de Express.
 * @param {Object} res - El objeto de respuesta de Express.
 * @param {Function} next - La función para pasar al siguiente middleware o ruta.
 */
const validarJWT = async (req, res, next) => {
    const { userId } = req.params;  // Obtener el userId de los parámetros de la URL
    if (!userId) {
        return res.status(400).json({ mensaje: 'Falta el ID del usuario en los parámetros de la URL' });
    }

    try {
        // Verificar el token almacenado en la base de datos para el ID del usuario
        const verifiedUid = await jwtManager.verifyToken(userId);
        if (!verifiedUid) {
            return res.status(401).json({ mensaje: 'Token no válido o expirado' });
        }

        // Si el token es válido, asignamos el UID a la solicitud para su uso en otras rutas
        req.uid = verifiedUid;
        next();  // Pasar al siguiente middleware o ruta
    } catch (error) {
        console.error('Error al verificar el token:', error);
        return res.status(401).json({ mensaje: 'Token no válido' });
    }
};

module.exports = {
    validarJWT
};

