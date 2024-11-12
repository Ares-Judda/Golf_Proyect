const { response } = require('express');
const connection = require('../models/database');
const userTokenManager = require('../helpers/user-token-manager'); 
const bcrypt = require('bcrypt');

/**
 * Obtiene lista de todos los usuarios de la base de datos.
 * Este método consulta todos los usuarios almacenados y devuelve la lista en formato JSON.
 * @param {*} req - La solicitud HTTP (no se requieren parámetros específicos).
 * @param {*} res - La respuesta HTTP que contiene la lista de usuarios en formato JSON.
 */
const get_all_usuarios = async (req, res = response) => {
    try {
        connection.query('SELECT * FROM user', (err, results) => {
            if (err) {
                console.error('Error al obtener usuarios: ', err);
                return res.status(500).json({ error: 'Error interno del servidor' });
            }
            res.json({ usuarios: results });
        });
    } catch (error) {
        console.error('Error al obtener usuarios: ', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

/**
 * Registra un usuario en la base de datos.
 * Este método recibe los datos del usuario en el cuerpo de la solicitud y los guarda en la base de datos.
 * @param {*} req - La solicitud HTTP con los campos obligatorios email, username y password en el cuerpo.
 * @param {*} res - La respuesta HTTP que contiene el resultado de la operación en formato JSON.
 */
const save_usuario = async (req, res = response) => {
    try { 
        const { email, role, password, imagen } = req.body;
        if (!email || !password || !imagen) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }
        const hashedPassword = await hashPassword(password);
        connection.query(
            'INSERT INTO user (email, password, role, imagen) VALUES (?, ?, ?, ?)',
            [email, hashedPassword, role, imagen],
            (err, result) => {
                if (err) {
                    console.error('Error al guardar el usuario: ', err);
                    return res.status(400).json({ error: 'Error al guardar el usuario' });
                }
                res.json({ mensaje: 'Usuario actualizado exitosamente' });
                console.log("Se a agregado un nuevo usuario");
            }
        );
    } catch (error) {
        console.error('Error al guardar el usuario: ', error);
        res.status(400).json({ error: 'Error al guardar el usuario' });
    }
};

/**
 * Obtiene un usuario por su ID.
 * Este método consulta la base de datos con un _id que se recibe en el cuerpo de la solicitud.
 * @param {*} req - La solicitud HTTP con el campo _id en el cuerpo.
 * @param {*} res - La respuesta HTTP que contiene el usuario encontrado o un mensaje de error.
 */
const get_usuario = async (req, res = response) => {
    try {
        const idUser = Object.keys(userTokenManager.users)[0];
        if (!idUser) {
            return res.status(400).json({ mensaje: 'Se requiere un ID' });
        }
        connection.query(
            'SELECT * FROM user WHERE ID_User = ?',
            [idUser],
            (err, results) => {
                if (err) {
                    console.error('Error al buscar usuario por ID: ', err);
                    return res.status(500).json({ mensaje: 'Error interno del servidor' });
                }
                if (results.length === 0) {
                    return res.status(404).json({ mensaje: 'Usuario no encontrado' });
                }
                res.json(results[0]);
            }
        );
    } catch (error) {
        console.error('Error al buscar usuario por ID: ', error);
        res.status(500).json({ mensaje: 'Error interno del servidor' });
    }
};

/**
 * Actualiza un usuario.
 * Este método recibe el _id y los campos a actualizar en el cuerpo de la solicitud,
 * realiza la actualización en la base de datos y devuelve el usuario actualizado.
 * @param {*} req - La solicitud HTTP con el campo _id y al menos un campo a actualizar en el cuerpo.
 * @param {*} res - La respuesta HTTP que contiene el usuario actualizado o un mensaje de error.
 */
const update_usuario_body = async (req, res = response) => {
    try {
        const idUser = Object.keys(userTokenManager.users)[0];
        const { actualizaciones } = req.body;
        if (!idUser) {
            return res.status(400).json({ mensaje: 'ID de usuario no proporcionado' });
        }
        if (!actualizaciones || Object.keys(actualizaciones).length === 0) {
            return res.status(400).json({ mensaje: 'No se proporcionaron campos a actualizar' });
        }
        const updates = Object.keys(actualizaciones).map(key => `${key} = ?`).join(', ');
        const values = Object.values(actualizaciones);
        connection.query(
            `UPDATE user SET ${updates} WHERE ID_User = ?`,
            [...values, idUser],
            (err, result) => {
                if (err) {
                    console.error('Error al actualizar usuario:', err);
                    return res.status(500).json({ mensaje: 'Error interno al actualizar usuario' });
                }
                if (result.affectedRows === 0) {
                    return res.status(404).json({ mensaje: 'Usuario no encontrado' });
                }
                res.json({ mensaje: 'Usuario actualizado exitosamente' });
            }
        );
    } catch (error) {
        console.error('Error en la actualización del usuario:', error);
        res.status(500).json({ mensaje: 'Error interno en el servidor' });
    }
};

/**
 * Cierra la sesión del usuario.
 * Este método elimina la referencia del usuario en el UserTokenManager y "mata" el token al cerrar sesión.
 * @param {*} req - La solicitud HTTP.
 * @param {*} res - La respuesta HTTP que contiene un mensaje de confirmación o de error.
 */
const logout_usuario = (req, res = response) => {
    try {
        const idUser = Object.keys(userTokenManager.users)[0]; 
        if (!idUser) {
            return res.status(400).json({ mensaje: 'No hay usuario activo para cerrar sesión' });
        }
        userTokenManager.logoutUser(idUser);
        console.log(`\nEl usuario ${idUser} ha cerrado sesión`);
        res.json({ mensaje: 'Sesión cerrada exitosamente' });
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        res.status(500).json({ mensaje: 'Error al cerrar sesión' });
    }
};

async function hashPassword(password) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword; 
}

module.exports = {
    get_all_usuarios,
    save_usuario,
    get_usuario,
    update_usuario_body,
    logout_usuario
};