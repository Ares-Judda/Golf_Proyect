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
 * Guarda un usuario en la base de datos si el correo no existe.
 * @param {*} req - La solicitud HTTP con los campos obligatorios email, username y password en el cuerpo.
 * @param {*} res - La respuesta HTTP que contiene el resultado de la operación en formato JSON.
 */
const save_usuario = async (req, res = response) => {
    try {
        const { email, role, password, imagen, name, lastname, userName } = req.body;
        if (!email || !password || !imagen || !name || !lastname || !userName) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }
        const existEmail = await emailExist(email);
        if (existEmail) {
            return res.status(400).json({ error: 'El correo ya está registrado' });
        }
        const existUserName = await userNameExist(userName);
        if (existUserName) {
            return res.status(400).json({ error: 'El nombre de usuaio ya está registrado' });
        }
        const hashedPassword = await hashPassword(password);
        const userId = await insertUser({ email, hashedPassword, role, imagen, userName });
        const response = await registerTypeUser(email, role, name, lastname, userId);
        if (!response.success) {
            return res.status(500).json({ error: response.message });
        }
        res.json({ mensaje: 'Usuario registrado exitosamente' });
    } catch (error) {
        console.error('Error al guardar el usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
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

/**
 * Inserta un nuevo usuario en la base de datos.
 * @param {Object} userData - Los datos del usuario a registrar.
 * @returns {Promise<string>} - Devuelve el ID del usuario recién registrado.
 */
async function insertUser(userData) {
    const { email, hashedPassword, role, imagen, userName } = userData;
    return new Promise((resolve, reject) => {
        connection.query(
            'INSERT INTO user (ID_User, email, password, role, imagen, username) VALUES (UUID(), ?, ?, ?, ?, ?)',
            [email, hashedPassword, role, imagen, userName],
            (err, result) => {
                if (err) {
                    console.error('Error al guardar el usuario:', err);
                    return reject(new Error('Error al guardar el usuario'));
                }
                connection.query('SELECT ID_User FROM user WHERE email = ?', [email], (err, results) => {
                    if (err || results.length === 0) {
                        console.error('Error al recuperar el ID del usuario:', err);
                        return reject(new Error('Error al recuperar el ID del usuario'));
                    }
                    resolve(results[0].ID_User);
                });
            }
        );
    });
}

async function hashPassword(password) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword; 
}

async function registerTypeUser(email, role, name, lastname, userId) {
    return new Promise((resolve) => {
        const query = role === 'CLIENT_ROLE'
            ? 'INSERT INTO client (ID_Client, name, lastname, ID_User) VALUES (?, ?, ?, ?)'
            : 'INSERT INTO selling (ID_Selling, name, lastname, ID_User) VALUES (?, ?, ?, ?)';

        connection.query(query, [email, name, lastname, userId], (err, result) => {
            if (err) {
                console.error(`Error al guardar el usuario de tipo ${role}: `, err);
                return resolve({ success: false, message: 'Error al guardar el usuario en el tipo correspondiente' });
            }
            resolve({ success: true });
        });
    });
}

async function emailExist(email) {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM user WHERE email = ?', [email], (err, results) => {
            if (err) {
                console.error('Error al verificar el correo:', err);
                return reject(new Error('Error interno del servidor'));
            }
            resolve(results.length > 0);
        });
    });
}

async function userNameExist(userName) {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM user WHERE username = ?', [userName], (err, results) => {
            if (err) {
                console.error('Error al verificar el nombre de usuario:', err);
                return reject(new Error('Error interno del servidor'));
            }
            resolve(results.length > 0);
        });
    });
}

module.exports = {
    get_all_usuarios,
    save_usuario,
    get_usuario,
    update_usuario_body,
    logout_usuario
};