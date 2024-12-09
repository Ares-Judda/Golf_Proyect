const { response } = require('express');
const connection = require('../models/database');
const userTokenManager = require('../helpers/user-token-manager'); 
const bcrypt = require('bcrypt');
const upload = require('../helpers/multerConfig');

/**
 * Obtiene la lista de todos los usuarios de la base de datos.
 * Consulta todos los registros en la tabla `user` y devuelve la lista en formato JSON.
 * @param {*} req - La solicitud HTTP sin parámetros específicos.
 * @param {*} res - La respuesta HTTP con la lista de usuarios en formato JSON.
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
 * Guarda un usuario en la base de datos si el correo y nombre de usuario no existen.
 * Este método crea una entrada en la tabla `user` y asigna el rol en la tabla correspondiente (client o seller).
 * @param {*} req - La solicitud HTTP con los campos obligatorios email, username, password, imagen, name y lastname en el cuerpo.
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
        const response = await registerTypeUser(role, name, lastname, userId);
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
 * Consulta la base de datos usando el ID almacenado en `userTokenManager` y devuelve los datos completos del usuario.
 * Incluye datos adicionales de la tabla `client` o `seller`, según el rol.
 * @param {*} req - La solicitud HTTP, sin requerir ID en el cuerpo.
 * @param {*} res - La respuesta HTTP con los datos del usuario encontrado o un mensaje de error.
 */
const get_usuario = async (req, res) => {
    const { userId } = req.params;  // Obtener el userId de los parámetros de la URL

    try {
        if (!userId) {
            return res.status(400).json({ mensaje: 'Se requiere un ID de usuario' });
        }

        // Llamar a la función que realiza la consulta a la base de datos
        const usuario = await get_usuario_from_db(userId);

        if (!usuario) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        res.status(200).json(usuario);  // Responder con los datos del usuario
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

const get_usuario_from_db = async (userId) => {
    return new Promise((resolve, reject) => {
        connection.query(
            `SELECT u.email, u.role, u.imagen, u.username, 
                    c.name, c.lastname, c.cellphone, c.datebirth, c.address, c.zipcode
             FROM golfdb.user AS u
             INNER JOIN golfdb.client AS c ON u.ID_User = c.ID_User
             WHERE u.ID_User = ?`,
            [userId], // Pasamos el userId aquí
            (err, results) => {
                if (err) {
                    reject('Error al buscar usuario por ID');
                }
                if (results.length === 0) {
                    reject('Usuario no encontrado');
                }
                resolve(results[0]); // Retornamos los datos del usuario
            }
        );
    });
};


/**
 * Actualiza los datos de un usuario en las tablas `user`, `client` o `seller`.
 * Divide los campos a actualizar entre la tabla `user` y la tabla específica (client o seller) según el rol.
 * @param {*} req - La solicitud HTTP con los campos a actualizar en `actualizaciones`.
 * @param {*} res - La respuesta HTTP que contiene el resultado de la operación o un mensaje de error.
 */
const update_usuario_body = async (req, res = response) => {
    try {
        const idUser = req.userId;
        const { actualizaciones } = req.body;
        if (!idUser) {
            return res.status(400).json({ mensaje: 'ID de usuario no proporcionado' });
        }
        if (!actualizaciones || Object.keys(actualizaciones).length === 0) {
            return res.status(400).json({ mensaje: 'No se proporcionaron campos a actualizar' });
        }
        if (actualizaciones.username) {
            const existUserName = await userNameExist(actualizaciones.username);
            if (existUserName) {
                return res.status(400).json({ error: 'El nombre de usuario ya está registrado' });
            }
        }
        const userFields = ['email', 'role', 'imagen', 'username'];
        const userUpdates = {};
        const roleSpecificUpdates = {};
        Object.keys(actualizaciones).forEach(key => {
            if (userFields.includes(key)) {
                userUpdates[key] = actualizaciones[key];
            } else {
                roleSpecificUpdates[key] = actualizaciones[key];
            }
        });
        if (Object.keys(userUpdates).length > 0) {
            await updateTable('user', userUpdates, idUser);
        }
        const role = await getUserRole(idUser);
        const tablaEspecifica = role === 'CLIENT_ROLE' ? 'client' : 'seller';
        if (Object.keys(roleSpecificUpdates).length > 0) {
            await updateTable(tablaEspecifica, roleSpecificUpdates, idUser);
        }
        res.json({ mensaje: 'Usuario actualizado exitosamente' });
    } catch (error) {
        console.error('Error en la actualización del usuario:', error);
        res.status(500).json({ mensaje: 'Error interno en el servidor' });
    }
};

/**
 * Cierra la sesión del usuario.
 * Utiliza `userTokenManager` para eliminar la referencia del usuario actual y finalizar la sesión.
 * @param {*} req - La solicitud HTTP.
 * @param {*} res - La respuesta HTTP que contiene un mensaje de confirmación o error.
 */
const logout_usuario = (req, res = response) => {
    try {
        const idUser = req.userId;
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
 * Esta función realiza una consulta para insertar un nuevo usuario en la tabla `user` con un UUID generado automáticamente
 * y devuelve el ID de usuario recién registrado.
 * @param {Object} userData - Un objeto que contiene email, hashedPassword, role, imagen y userName del usuario.
 * @returns {Promise<string>} - Devuelve el ID del usuario recién registrado o un error si la operación falla.
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

/**
 * Cifra la contraseña del usuario utilizando bcrypt.
 * Esta función genera un hash seguro para almacenar la contraseña en la base de datos.
 * @param {string} password - La contraseña en texto plano.
 * @returns {Promise<string>} - Devuelve la contraseña cifrada.
 */
async function hashPassword(password) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword; 
}

/**
 * Registra un usuario en la tabla correspondiente a su rol (cliente o vendedor).
 * Inserta el usuario en la tabla `client` si es un cliente o en `selling` si es un vendedor.
 * @param {string} email - El correo del usuario.
 * @param {string} role - El rol del usuario (CLIENT_ROLE o SELLER_ROLE).
 * @param {string} name - Nombre del usuario.
 * @param {string} lastname - Apellido del usuario.
 * @param {string} userId - ID del usuario en la tabla `user`.
 * @returns {Promise<Object>} - Devuelve un objeto con `success: true` si la operación fue exitosa o un mensaje de error en caso de falla.
 */
async function registerTypeUser(role, name, lastname, userId) {
    return new Promise((resolve) => {
        const query = role === 'CLIENT_ROLE'
            ? 'INSERT INTO client (ID_Client, name, lastname, ID_User) VALUES (?, ?, ?, ?)'
            : 'INSERT INTO selling (ID_Selling, name, lastname, ID_User) VALUES (?, ?, ?, ?)';

        connection.query(query, [userId, name, lastname, userId], (err, result) => {
            if (err) {
                console.error(`Error al guardar el usuario de tipo ${role}: `, err);
                return resolve({ success: false, message: 'Error al guardar el usuario en el tipo correspondiente' });
            }
            resolve({ success: true });
        });
    });
}

/**
 * Verifica si el correo ya existe en la base de datos.
 * @param {string} email - El correo del usuario a verificar.
 * @returns {Promise<boolean>} - Devuelve `true` si el correo existe, o `false` si no existe.
 */
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

/**
 * Verifica si el nombre de usuario ya existe en la base de datos.
 * @param {string} userName - El nombre de usuario a verificar.
 * @returns {Promise<boolean>} - Devuelve `true` si el nombre de usuario existe, o `false` si no existe.
 */
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

/**
 * Actualiza una tabla específica con los campos proporcionados para un usuario.
 * @param {string} tabla - El nombre de la tabla a actualizar (`user`, `client`, o `seller`).
 * @param {Object} campos - Un objeto donde las claves son los nombres de los campos a actualizar y los valores son los nuevos valores.
 * @param {string} idUser - ID del usuario en la tabla `user`.
 * @returns {Promise} - Una promesa que se resuelve si la actualización fue exitosa o se rechaza con un mensaje de error.
 */
async function updateTable(tabla, campos, idUser) {
    return new Promise((resolve, reject) => {
        const updates = Object.keys(campos).map(key => `${key} = ?`).join(', ');
        const values = Object.values(campos);
        connection.query(
            `UPDATE ${tabla} SET ${updates} WHERE ID_User = ?`,
            [...values, idUser],
            (err, result) => {
                if (err) {
                    console.error(`Error al actualizar en ${tabla}:`, err);
                    return reject(new Error('Error interno al actualizar usuario'));
                }
                resolve(result);
            }
        );
    });
}

/**
 * Obtiene el rol del usuario dado su ID.
 * Consulta el rol en la tabla `user` utilizando el ID del usuario.
 * @param {string} idUser - ID del usuario en la tabla `user`.
 * @returns {Promise<string>} - Devuelve el rol del usuario o un error si el usuario no es encontrado.
 */
async function getUserRole(idUser) {
    return new Promise((resolve, reject) => {
        connection.query(
            'SELECT role FROM user WHERE ID_User = ?',
            [idUser],
            (err, results) => {
                if (err) {
                    console.error('Error al obtener rol del usuario:', err);
                    return reject(new Error('Error al obtener rol del usuario'));
                }
                if (results.length === 0) {
                    return reject(new Error('Usuario no encontrado'));
                }
                resolve(results[0].role);
            }
        );
    });
}

module.exports = {
    get_all_usuarios,
    save_usuario,
    get_usuario,
    update_usuario_body,
    logout_usuario
};