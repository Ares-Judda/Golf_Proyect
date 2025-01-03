const connection = require('../../business/models/database');
const grpc = require('@grpc/grpc-js');

const getAllArticulos = (call, callback) => {
    try {
        console.log('Solicitud recibida para obtener todos los artículos...');
        
        connection.query('SELECT * FROM clothes', (err, results) => {
            if (err) {
                console.error('Error al obtener artículos: ', err);
                return callback({
                    code: grpc.status.INTERNAL,
                    message: 'Error interno del servidor al obtener los artículos'
                });
            }
            
            const articulos = results.map(row => {

                return {
                    ID_Clothes: row.ID_Clothes,
                    name: row.name,
                    clothecategory: row.clothecategory,
                    price: row.price,
                    quota: row.quota,
                    size: row.size  
                };
            });

            console.log('Artículos obtenidos correctamente.');
            callback(null, { articulos });
        });

    } catch (error) {
        console.error('Error inesperado al obtener artículos:', error);
        callback({
            code: grpc.status.INTERNAL,
            message: 'Error interno inesperado del servidor'
        });
    }
};

const getArticulosBySelling = (ID_Selling, callback) => {
    try {
        console.log('Solicitud recibida para obtener artículos por ID de vendedor...');
        if (!ID_Selling) {
            console.error('El ID del vendedor no fue proporcionado en controlador.');
            return callback({
                code: grpc.status.INVALID_ARGUMENT,
                message: 'El ID del vendedor no fue proporcionado'
            });
        }

        connection.query('SELECT c.ID_Clothes, c.name, c.clothecategory, c.price, c.size, c.quota FROM selling_clothes sc INNER JOIN clothes c ON sc.ID_Clothes = c.ID_Clothes WHERE sc.ID_Selling = ?', [ID_Selling], (err, results) => {
            if (err) {
                console.error('Error al obtener artículos relacionados al vendedor: ', err);
                return callback({
                    code: grpc.status.INTERNAL,
                    message: 'Error interno del servidor al obtener los artículos'
                });
            }

            if (results.length === 0) {
                console.warn('No se encontraron artículos para el vendedor proporcionado.');
                return callback({
                    code: grpc.status.NOT_FOUND,
                    message: 'No se encontraron artículos relacionados al vendedor'
                });
            }

            const articulos = results.map(row => {

                return {
                    ID_Clothes: row.ID_Clothes,
                    name: row.name,
                    clothecategory: row.clothecategory,
                    price: row.price,
                    quota: row.quota,
                    size: row.size
                };
            });

            callback(null, { articulos });
        });
    } catch (error) {
        console.error('Error inesperado al procesar la solicitud:', error);
        callback({
            code: grpc.status.INTERNAL,
            message: 'Error interno inesperado del servidor'
        });
    }
};

const saveArticulo = (name, clothecategory, price, size, quota, ID_Selling, callback) => {
    try {
        // Insertar los datos del artículo en la base de datos
        connection.query(
            'INSERT INTO clothes (name, clothecategory, price, size, quota) VALUES (?, ?, ?, ?, ?)',
            [name, clothecategory, price, size, quota],
            (err, results) => {
                if (err) {
                    console.error('Error al guardar el artículo: ', err);
                    return callback({
                        code: grpc.status.INTERNAL,
                        details: 'Error al guardar la prenda'
                    });
                }

                // Obtener el ID del artículo recién insertado
                const ID_Clothes = results.insertId; // El insertId contiene el ID generado por la base de datos

                console.log("Se ha agregado un nuevo artículo con ID_Clothes: ", ID_Clothes);

                // Ahora insertar el registro en la tabla selling_clothes
                connection.query(
                    'INSERT INTO selling_clothes (ID_Clothes, ID_Selling) VALUES (?, ?)',
                    [ID_Clothes, ID_Selling],
                    (err2) => {
                        if (err2) {
                            console.error('Error al guardar el registro en selling_clothes: ', err2);
                            return callback({
                                code: grpc.status.INTERNAL,
                                details: 'Error al guardar el registro en selling_clothes'
                            });
                        }

                        console.log("Se ha agregado el registro a selling_clothes");

                        // Enviar la respuesta al cliente
                        callback(null, { mensaje: 'Artículo creado y asociado exitosamente' });
                    }
                );
            }
        );
    } catch (error) {
        console.error('Error al guardar el artículo: ', error);
        callback({
            code: grpc.status.INTERNAL,
            details: 'Error interno al guardar el artículo'
        });
    }
};

const deleteArticulo = (ID_Clothes, callback) => {
    try {
        // Primera consulta: eliminar en selling_clothes
        connection.query(
            'DELETE FROM selling_clothes WHERE ID_Clothes = ?',
            [ID_Clothes],
            (err, result) => {
                if (err) {
                    console.error('Error al eliminar el artículo en ventas:', err);
                    return callback({
                        code: grpc.status.INTERNAL,
                        details: 'Error interno al eliminar el artículo en ventas',
                    });
                }

                if (result.affectedRows === 0) {
                    console.warn('Artículo no encontrado en selling_clothes con ID:', ID_Clothes);
                    return callback({
                        code: grpc.status.NOT_FOUND,
                        details: 'Artículo no encontrado en ventas',
                    });
                }

                console.log('Artículo eliminado de selling_clothes exitosamente.');

                connection.query(
                    'DELETE FROM clothes WHERE ID_Clothes = ?',
                    [ID_Clothes],
                    (err, result) => {
                        if (err) {
                            console.error('Error al eliminar el artículo en clothes:', err);
                            return callback({
                                code: grpc.status.INTERNAL,
                                details: 'Error interno al eliminar el artículo',
                            });
                        }

                        if (result.affectedRows === 0) {
                            console.warn('Artículo no encontrado en clothes con ID:', ID_Clothes);
                            return callback({
                                code: grpc.status.NOT_FOUND,
                                details: 'Artículo no encontrado en la tabla clothes',
                            });
                        }

                        callback(null, { mensaje: 'Artículo eliminado exitosamente' });
                    }
                );
            }
        );
    } catch (error) {
        console.error('Error al eliminar el artículo:', error);
        callback({
            code: grpc.status.INTERNAL,
            details: 'Error interno al eliminar el artículo',
        });
    }
};

const update_articulo = (ID_Clothes, actualizaciones, callback) => {
    try {
        // Validar que se proporcionen tanto el ID como los campos a actualizar
        if (!ID_Clothes) {
            return callback({
                code: grpc.status.INVALID_ARGUMENT,
                message: 'El ID del artículo no fue proporcionado'
            });
        }

        if (!actualizaciones || Object.keys(actualizaciones).length === 0) {
            return callback({
                code: grpc.status.INVALID_ARGUMENT,
                message: 'No se proporcionaron campos a actualizar'
            });
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
                    return callback({
                        code: grpc.status.INTERNAL,
                        message: 'Error interno al actualizar artículo'
                    });
                }

                if (result.affectedRows === 0) {
                    return callback({
                        code: grpc.status.NOT_FOUND,
                        message: 'Artículo no encontrado'
                    });
                }

                // Respuesta exitosa
                callback(null, { mensaje: 'Artículo actualizado exitosamente' });
            }
        );
    } catch (error) {
        console.error('Error en la actualización del artículo:', error);
        callback({
            code: grpc.status.INTERNAL,
            message: 'Error interno en el servidor'
        });
    }
};

const getArticleByName = (name, callback) => {
    try {
        if (!name) {
            return callback({
                code: grpc.status.INVALID_ARGUMENT,
                details: "El nombre del artículo no fue proporcionado"
            });
        }

        connection.query('SELECT * FROM clothes WHERE name LIKE ?', [`%${name}%`], (err, results) => {
            if (err) {
                console.error('Error al buscar el artículo: ', err);
                return callback({
                    code: grpc.status.INTERNAL,
                    details: 'Error interno al buscar el artículo'
                });
            }

            // Si no hay artículos, retornamos un mensaje indicando que no se encontraron
            if (results.length === 0) {
                return callback({
                    code: grpc.status.NOT_FOUND,
                    details: 'No se encontraron artículos con ese nombre'
                });
            }

            // Mapear los resultados a la estructura esperada en ArticulosResponse
            const articulos = results.map(row => ({
                ID_Clothes: row.ID_Clothes,
                name: row.name,
                clothecategory: row.clothecategory,
                price: row.price,
                quota: row.quota,
                size: row.size
            }));

            // Enviar los resultados al cliente
            callback(null, { articulos });
        });
    } catch (error) {
        console.error('Error al buscar el artículo: ', error);
        callback({
            code: grpc.status.INTERNAL,
            details: 'Error interno inesperado del servidor'
        });
    }
};

const getArticleByCategory = (clothecategory, callback) => {
    try {
        if (!clothecategory) {
            return callback({
                code: grpc.status.INVALID_ARGUMENT,
                details: "La categoria del artículo no fue proporcionada"
            });
        }

        connection.query('SELECT * FROM clothes WHERE clothecategory = ?', [clothecategory], (err, results) => {
            if (err) {
                console.error('Error al buscar el artículo: ', err);
                return callback({
                    code: grpc.status.INTERNAL,
                    details: 'Error interno al buscar el artículo'
                });
            }

            // Si no hay artículos, retornamos un mensaje indicando que no se encontraron
            if (results.length === 0) {
                return callback({
                    code: grpc.status.NOT_FOUND,
                    details: 'No se encontraron artículos con esa categoría'
                });
            }

            // Mapear los resultados a la estructura esperada en ArticulosResponse
            const articulos = results.map(row => ({
                ID_Clothes: row.ID_Clothes,
                name: row.name,
                clothecategory: row.clothecategory,
                price: row.price,
                quota: row.quota,
                size: row.size
            }));

            // Enviar los resultados al cliente
            callback(null, { articulos });
        });
    } catch (error) {
        console.error('Error al buscar el artículo: ', error);
        callback({
            code: grpc.status.INTERNAL,
            details: 'Error interno inesperado del servidor'
        });
    }
};


module.exports = { getAllArticulos, getArticulosBySelling, saveArticulo, deleteArticulo, update_articulo, getArticleByName, getArticleByCategory };