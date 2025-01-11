const connection = require('../../business/models/database');
const grpc = require('@grpc/grpc-js');

const getAllArticulos = (call, callback) => {
    try {
        console.log('Solicitud recibida para obtener todos los artículos...');
        
        connection.query('SELECT c.ID_Clothes, c.name, c.clothecategory, c.price, c.size, c.quota, p.pick FROM clothes c LEFT JOIN pickclothes p ON c.ID_Clothes = p.ID_Clothes', (err, results) => {
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
                    size: row.size,
                    image: row.pick
                };
            });

            console.log('Artículos obtenidos correctamente.', results);
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

        connection.query('SELECT c.ID_Clothes, c.name, c.clothecategory, c.price, c.size, c.quota, p.pick FROM selling_clothes sc INNER JOIN clothes c ON sc.ID_Clothes = c.ID_Clothes LEFT JOIN pickclothes p ON c.ID_Clothes = p.ID_Clothes WHERE sc.ID_Selling = ?', [ID_Selling], (err, results) => {
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
                    size: row.size,
                    image: row.pick
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

const saveArticulo = (name, clothecategory, price, size, quota, ID_Selling, image, callback) => {
    try {
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

                const ID_Clothes = results.insertId;

                console.log("Se ha agregado un nuevo artículo con ID_Clothes: ", ID_Clothes);

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

                        connection.query(
                            'INSERT INTO pickclothes (ID_Clothes, pick) VALUES (?, ?)',
                            [ID_Clothes, image],
                            (err3) => {
                                if (err3) {
                                    console.error('Error al guardar el registro en pickclothes: ', err3);
                                    return callback({
                                        code: grpc.status.INTERNAL,
                                        details: 'Error al guardar el registro en pickclothes'
                                    });
                                }

                                console.log("Se ha agregado el registro a pickclothes");

                                callback(null, { mensaje: 'Artículo creado y asociado exitosamente' });
                            }
                        );
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
        if (!ID_Clothes) {
            return callback({
                code: grpc.status.INVALID_ARGUMENT,
                message: 'El ID del artículo no fue proporcionado',
            });
        }

        if (!actualizaciones || Object.keys(actualizaciones).length === 0) {
            return callback({
                code: grpc.status.INVALID_ARGUMENT,
                message: 'No se proporcionaron campos a actualizar',
            });
        }

        const clothesUpdates = Object.keys(actualizaciones)
            .filter(key => key !== 'pick') 
            .map(key => `${key} = ?`)
            .join(', ');

        const clothesValues = Object.keys(actualizaciones)
            .filter(key => key !== 'pick')
            .map(key => actualizaciones[key]);

        const pickValue = actualizaciones.pick;

        const updateClothesQuery = clothesUpdates
            ? `UPDATE clothes SET ${clothesUpdates} WHERE ID_Clothes = ?`
            : null;

        connection.beginTransaction(err => {
            if (err) {
                console.error('Error al iniciar la transacción:', err);
                return callback({
                    code: grpc.status.INTERNAL,
                    message: 'Error interno al iniciar la transacción',
                });
            }

            const updateClothes = updateClothesQuery
                ? new Promise((resolve, reject) => {
                      connection.query(
                          updateClothesQuery,
                          [...clothesValues, ID_Clothes],
                          (err, result) => {
                              if (err) return reject(err);
                              resolve(result);
                          }
                      );
                  })
                : Promise.resolve();

            const validatePick = pickValue
                ? new Promise((resolve, reject) => {
                      connection.query(
                          `SELECT 1 FROM pickclothes WHERE ID_Clothes = ?`,
                          [ID_Clothes],
                          (err, results) => {
                              if (err) return reject(err);
                              resolve(results.length > 0); 
                          }
                      );
                  })
                : Promise.resolve(false);

            updateClothes
                .then(() => validatePick)
                .then(exists => {
                    if (pickValue) {
                        if (exists) {
                            return new Promise((resolve, reject) => {
                                connection.query(
                                    `UPDATE pickclothes SET pick = ? WHERE ID_Clothes = ?`,
                                    [pickValue, ID_Clothes],
                                    (err, result) => {
                                        if (err) return reject(err);
                                        resolve(result);
                                    }
                                );
                            });
                        } else {
                            return new Promise((resolve, reject) => {
                                connection.query(
                                    `INSERT INTO pickclothes (pick, ID_Clothes) VALUES (?, ?)`,
                                    [pickValue, ID_Clothes],
                                    (err, result) => {
                                        if (err) return reject(err);
                                        resolve(result);
                                    }
                                );
                            });
                        }
                    }
                    return Promise.resolve();
                })
                .then(() => {
                    connection.commit(err => {
                        if (err) {
                            console.error('Error al confirmar la transacción:', err);
                            connection.rollback(() => {
                                callback({
                                    code: grpc.status.INTERNAL,
                                    message: 'Error interno al confirmar la transacción',
                                });
                            });
                        } else {
                            callback(null, { mensaje: 'Artículo actualizado exitosamente' });
                        }
                    });
                })
                .catch(error => {
                    console.error('Error durante la actualización:', error);
                    connection.rollback(() => {
                        callback({
                            code: grpc.status.INTERNAL,
                            message: 'Error interno durante la actualización',
                        });
                    });
                });
        });
    } catch (error) {
        console.error('Error en la actualización del artículo:', error);
        callback({
            code: grpc.status.INTERNAL,
            message: 'Error interno en el servidor',
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

        connection.query('SELECT c.ID_Clothes, c.name, c.clothecategory, c.price, c.size, c.quota, p.pick FROM clothes c LEFT JOIN pickclothes p ON c.ID_Clothes = p.ID_Clothes WHERE name LIKE ?', [`%${name}%`], (err, results) => {
            if (err) {
                console.error('Error al buscar el artículo: ', err);
                return callback({
                    code: grpc.status.INTERNAL,
                    details: 'Error interno al buscar el artículo'
                });
            }

            if (results.length === 0) {
                return callback({
                    code: grpc.status.NOT_FOUND,
                    details: 'No se encontraron artículos con ese nombre'
                });
            }

            const articulos = results.map(row => ({
                ID_Clothes: row.ID_Clothes,
                name: row.name,
                clothecategory: row.clothecategory,
                price: row.price,
                quota: row.quota,
                size: row.size,
                image: row.pick
            }));
            
            console.log('Artículos obtenidos correctamente.', results);
          
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

const getArticlesBySellingAndName = (ID_Selling, name, callback) => {
    try {
        if (!ID_Selling || !name) {
            return callback({
                code: grpc.status.INVALID_ARGUMENT,
                details: "El nombre del artículo o el ID del vendedor no fueron proporcionados"
            });
        }

        connection.query('SELECT c.ID_Clothes, c.name, c.clothecategory, c.price, c.size, c.quota, p.pick FROM selling_clothes sc INNER JOIN clothes c ON sc.ID_Clothes = c.ID_Clothes LEFT JOIN pickclothes p ON c.ID_Clothes = p.ID_Clothes WHERE sc.ID_Selling = ? AND c.name LIKE ?', [ID_Selling, `%${name}%`], (err, results) => {
            if (err) {
                console.error('Error al buscar los artículos por vendedor y nombre: ', err);
                return callback({
                    code: grpc.status.INTERNAL,
                    details: 'Error interno al buscar los artículos'
                });
            }

            if (results.length === 0) {
                return callback({
                    code: grpc.status.NOT_FOUND,
                    details: 'No se encontraron artículos con ese nombre para el vendedor proporcionado'
                });
            }

            const articulos = results.map(row => ({
                ID_Clothes: row.ID_Clothes,
                name: row.name,
                clothecategory: row.clothecategory,
                price: row.price,
                quota: row.quota,
                size: row.size,
                image: row.pick
            }));

            callback(null, { articulos });
        });
    } catch (error) {
        console.error('Error inesperado al buscar los artículos: ', error);
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

        connection.query('SELECT c.ID_Clothes, c.name, c.clothecategory, c.price, c.size, c.quota, p.pick FROM clothes c LEFT JOIN pickclothes p ON c.ID_Clothes = p.ID_Clothes WHERE clothecategory = ?', [clothecategory], (err, results) => {
            if (err) {
                console.error('Error al buscar el artículo: ', err);
                return callback({
                    code: grpc.status.INTERNAL,
                    details: 'Error interno al buscar el artículo'
                });
            }

            if (results.length === 0) {
                return callback({
                    code: grpc.status.NOT_FOUND,
                    details: 'No se encontraron artículos con esa categoría'
                });
            }

            const articulos = results.map(row => ({
                ID_Clothes: row.ID_Clothes,
                name: row.name,
                clothecategory: row.clothecategory,
                price: row.price,
                quota: row.quota,
                size: row.size,
                image: row.pick
            }));

            console.log('Artículos obtenidos correctamente.', results);
            
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

const getArticlesBySellingAndCategory = (ID_Selling, clothecategory, callback) => {
    try {
        if (!ID_Selling || !clothecategory) {
            return callback({
                code: grpc.status.INVALID_ARGUMENT,
                details: "La categoria del artículo o el ID del vendedor no fueron proporcionados"
            });
        }

        connection.query('SELECT c.ID_Clothes, c.name, c.clothecategory, c.price, c.size, c.quota, p.pick FROM selling_clothes sc INNER JOIN clothes c ON sc.ID_Clothes = c.ID_Clothes LEFT JOIN pickclothes p ON c.ID_Clothes = p.ID_Clothes WHERE sc.ID_Selling = ? AND c.clothecategory = ?', [ID_Selling, clothecategory], (err, results) => {
            if (err) {
                console.error('Error al buscar los artículos por vendedor y nombre: ', err);
                return callback({
                    code: grpc.status.INTERNAL,
                    details: 'Error interno al buscar los artículos'
                });
            }

            if (results.length === 0) {
                return callback({
                    code: grpc.status.NOT_FOUND,
                    details: 'No se encontraron artículos con ese nombre para el vendedor proporcionado'
                });
            }

            const articulos = results.map(row => ({
                ID_Clothes: row.ID_Clothes,
                name: row.name,
                clothecategory: row.clothecategory,
                price: row.price,
                quota: row.quota,
                size: row.size,
                image: row.pick
            }));

            callback(null, { articulos });
        });
    } catch (error) {
        console.error('Error inesperado al buscar los artículos: ', error);
        callback({
            code: grpc.status.INTERNAL,
            details: 'Error interno inesperado del servidor'
        });
    }
};


module.exports = { getAllArticulos, getArticulosBySelling, getArticlesBySellingAndName, getArticlesBySellingAndCategory, saveArticulo, deleteArticulo, update_articulo, getArticleByName, getArticleByCategory };