const { response } = require('express');
const connection = require('../../business/models/database');
const userTokenManager = require('../../business/helpers/user-token-manager'); 

/**
 * Obtiene lista de todos los artículos de la base de datos.
 * Este método consulta todos los usuarios almacenados y devuelve la lista en formato JSON.
 * @param {*} req - La solicitud HTTP (no se requieren parámetros específicos).
 * @param {*} res - La respuesta HTTP que contiene la lista de usuarios en formato JSON.
 */
const get_all_articulos = async (req, res = response) => {
    try {
        connection.query('SELECT * FROM clothes', (err, results) => {
            if (err) {
                console.error('Error al obtener artículos: ', err);
                return res.status(500).json({ error: 'Error interno del servidor' });
            }
            res.json({ articulos: results });
        });
    } catch (error) {
        console.error('Error al obtener artículos: ', error);  
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

/**
 * Obtiene lista de los artículos relacionados al vendedor de la base de datos.
 * Este método consulta todos los usuarios almacenados y devuelve la lista en formato JSON.
 * @param {*} req - La solicitud HTTP (no se requieren parámetros específicos).
 * @param {*} res - La respuesta HTTP que contiene la lista de usuarios en formato JSON.
 */
const get_articulos_by_selling = async (req, res = response) => {
    try {
        // Desestructurar el ID del artículo y los campos a actualizar desde el body de la solicitud
        const { ID_Selling} = req.body;

        // Validar que se proporcionen tanto el ID como los campos a actualizar
        if (!ID_Selling) {
            return res.status(400).json({ mensaje: 'El ID del vendedor no fue proporcionado' });
        }

        connection.query('SELECT * FROM selling_clothes WHERE ID_Selling = ?',  [ID_Selling],  (err, results) => {
            if (err) {
                console.error('Error al obtener artículos: ', err);
                return res.status(500).json({ error: 'Error interno del servidor' });
            }

            if (results.length === 0) {
                return res.status(404).json({ mensaje: 'Vendedor no encontrado' });
            }

            res.json({ articulosRelacionadoAlVendedor: results });
        });
    } catch (error) {
        console.error('Error al obtener artículos: ', error);  
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

/**
 * Obtiene un artículo por medio de su nombre de la base de datos.
 * Este método consulta un artículo en formato JSON.
 * @param {*} req - La solicitud HTTP (no se requieren parámetros específicos).
 * @param {*} res - La respuesta HTTP que contiene la lista de usuarios en formato JSON.
 */
const get_articulo_by_name = async (req, res = response) => {
    try {
        // Desestructurar el nombre del artículo desde el body de la solicitud
        const { name } = req.body;

        // Validar que se proporcione el nombre
        if (!name) {
            return res.status(400).json({ mensaje: 'El nombre del artículo no fue proporcionado' });
        }

        // Ejecutar la consulta a la base de datos
        connection.query('SELECT * FROM clothes WHERE name LIKE ?', [`%${name}%`], (err, results) => {
            if (err) {
                console.error('Error al buscar el artículo: ', err);
                return res.status(500).json({ error: 'Error interno del servidor' });
            }

            // Validar si no se encontraron resultados
            if (results.length === 0) {
                return res.status(404).json({ mensaje: 'No se encontraron artículos con ese nombre' });
            }

            // Respuesta con los artículos encontrados
            res.json({ articulo: results });
        });
    } catch (error) {
        console.error('Error al buscar el artículo: ', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

/**
 * Registra un artículo en la base de datos.
 * Este método recibe los datos del usuario en el cuerpo de la solicitud y los guarda en la base de datos.
 * @param {*} req - La solicitud HTTP con los campos obligatorios name, clothecategory, price, size y quota en el cuerpo.
 * @param {*} res - La respuesta HTTP que contiene el resultado de la operación en formato JSON.
 */
const save_article = async (req, res = response) => {
    try { 
        /*const idUser = Object.keys(userTokenManager.users)[0];
        if (!idUser) {
            return res.status(400).json({ mensaje: 'Se requiere un ID' });
        }*/

        const { name, clothecategory, price, size, quota } = req.body;
        if (!name || !clothecategory || !price || !size || !quota) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }
        connection.query(
            'INSERT INTO clothes (name, clothecategory, price, size, quota) VALUES (?, ?, ?, ?, ?)',
            [name, clothecategory, price, size, quota],
            (err) => {
                if (err) {
                    console.error('Error al guardar el usuario: ', err);
                    return res.status(400).json({ error: 'Error al guardar la prenda' });
                }
                res.json({ mensaje: 'Artículo creado exitosamente' });
                console.log("Se ha agregado un nuevo artículo");
            }
        );
    } catch (error) {
        console.error('Error al guardar el artículo: ', error);
        res.status(400).json({ error: 'Error al guardar el artículo' });
    }
};

/**
 * Actualiza un artículo.
 * Este método recibe el _id y los campos a actualizar en el cuerpo de la solicitud,
 * realiza la actualización en la base de datos y devuelve el artículo actualizado.
 * @param {*} req - La solicitud HTTP con el campo _id y al menos un campo a actualizar en el cuerpo.
 * @param {*} res - La respuesta HTTP que contiene al artículo actualizado o un mensaje de error.
 */
const update_articulo_body = async (req, res) => {
    try {
        // Desestructurar el ID del artículo y los campos a actualizar desde el body de la solicitud
        const { ID_Clothes, actualizaciones } = req.body;

        // Validar que se proporcionen tanto el ID como los campos a actualizar
        if (!ID_Clothes) {
            return res.status(400).json({ mensaje: 'El ID del artículo no fue proporcionado' });
        }

        if (!actualizaciones || Object.keys(actualizaciones).length === 0) {
            return res.status(400).json({ mensaje: 'No se proporcionaron campos a actualizar' });
        }

        // Construir dinámicamente los campos a actualizar
        const updates = Object.keys(actualizaciones)
            .map(key => `${key} = ?`)
            .join(', ');

        // Obtener los valores de las actualizaciones
        const values = Object.values(actualizaciones);

        // Ejecutar la consulta para actualizar el artículo
        connection.query(
            `UPDATE clothes SET ${updates} WHERE ID_Clothes = ?`,
            [...values, ID_Clothes], // Agregar el ID al final
            (err, result) => {
                if (err) {
                    console.error('Error al actualizar artículo:', err);
                    return res.status(500).json({ mensaje: 'Error interno al actualizar artículo' });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({ mensaje: 'Artículo no encontrado' });
                }

                // Respuesta exitosa
                res.json({ mensaje: 'Artículo actualizado exitosamente' });
            }
        );
    } catch (error) {
        console.error('Error en la actualización del artículo:', error);
        res.status(500).json({ mensaje: 'Error interno en el servidor' });
    }
};

/**
 * Elimina un artículo.
 * Este método recibe el _id en el cuerpo de la solicitud,
 * realiza la eliminación en la base de datos.
 * @param {*} req - La solicitud HTTP con el campo _id.
 * @param {*} res - La respuesta HTTP que contiene al artículo eliminado o un mensaje de error.
 */
const delete_articulo = async (req, res) => {
    try {
        // Obtener el ID del artículo desde los parámetros de la URL
        const { ID_Clothes } = req.body;

        // Validar que el ID_Clothes se proporcione
        if (!ID_Clothes) {
            return res.status(400).json({ mensaje: 'ID del artículo no proporcionado' });
        }

        // Ejecutar la consulta para eliminar el artículo
        connection.query(
            `DELETE FROM clothes WHERE ID_Clothes = ?`,
            [ID_Clothes], // Pasar el ID como parámetro
            (err, result) => {
                if (err) {
                    console.error('Error al eliminar el artículo:', err);
                    return res.status(500).json({ mensaje: 'Error interno al eliminar el artículo' });
                }

                // Validar si se encontró el artículo
                if (result.affectedRows === 0) {
                    return res.status(404).json({ mensaje: 'Artículo no encontrado' });
                }

                // Respuesta exitosa
                res.json({ mensaje: 'Artículo eliminado exitosamente' });
            }
        );
    } catch (error) {
        console.error('Error en la eliminación del artículo:', error);
        res.status(500).json({ mensaje: 'Error interno en el servidor' });
    }
};

module.exports = {
    save_article,
    get_all_articulos,
    get_articulos_by_selling,
    get_articulo_by_name,
    update_articulo_body,
    delete_articulo
};