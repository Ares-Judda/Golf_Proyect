const { response } = require('express');
const connection = require('../../business/models/database');
const userTokenManager = require('../../business/helpers/user-token-manager'); 

const add_articulo_to_car = async (req, res) => {
    try {
        const { userId } = req.params;
        const { ID_Clothes, Quantity } = req.body;
        if (!userId || !ID_Clothes || !Quantity) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        const response = await add_to_shopping_car(userId, ID_Clothes, Quantity);
        if (!response.success) {
            return res.status(500).json({ error: response.message });
        }
        res.json({ mensaje: 'Artículo añadido al carrito exitosamente' });
    } catch (error) {
        console.error('Error al guardar el artículo en el carrito', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};


async function add_to_shopping_car(userId, ID_Clothes, Quantity) {
    return new Promise((resolve) => {
        const query = 'INSERT INTO cart (ID_Client, ID_Clothes, quantity) VALUES (?, ?, ?)';
        connection.query(query, [userId, ID_Clothes, Quantity], (err, result) => {
            if (err) {
                console.error(`Error al guardar el producto en el carrito:`, err);
                return resolve({ success: false, message: 'Error al guardar el artículo en el carrito' });
            }
            resolve({ success: true });
        });
    });
};

const get_shopping_car = async (req, res) => {
    const { userId } = req.params; 
    try {
        if (!userId) {
            return res.status(400).json({ mensaje: 'Se requiere un ID de usuario' });
        }
        const shoppingCarItems = await get_shopping_car_from_db(userId);

        if (shoppingCarItems.length === 0) {
            return res.status(404).json({ mensaje: 'No se encontraron artículos en el carrito para este usuario' });
        }
        res.status(200).json(shoppingCarItems);
    } catch (error) {
        console.error('Error al obtener el carrito:', error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
};

const get_shopping_car_from_db = async (userId) => {
    return new Promise((resolve, reject) => {
        connection.query(
            `SELECT 
                cr.quantity, 
                cl.name, 
                cl.size, 
                cl.price, 
                cl.quota,
                pc.pick AS image
            FROM 
                cart AS cr
            INNER JOIN 
                clothes AS cl
            ON 
                cr.ID_Clothes = cl.ID_Clothes
            LEFT JOIN 
                pickclothes AS pc
            ON 
                cl.ID_Clothes = pc.ID_Clothes    
            WHERE 
                cr.ID_Client = ? 
                AND available = 1`,
            [userId],
            (err, results) => {
                if (err) {
                    console.error('Error al consultar la base de datos:', err);
                    reject({ message: 'Error al buscar artículos en el carrito', error: err });
                } else if (results.length === 0) {
                    resolve({ message: 'No hay artículos en el carrito o todos están no disponibles' });
                } else {
                    resolve(results); 
                }
            }
        );
    });
};

const update_quantity = async (req, res) => {
    const { userId } = req.params;
    const { ID_Clothes, newQuantity } = req.body;

    if (!userId || !ID_Clothes || newQuantity == null) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    try {
        const response = await update_quantity_in_cart(userId, ID_Clothes, newQuantity);

        if (!response.success) {
            return res.status(404).json({ error: response.message });
        }

        return res.status(200).json({ message: response.message });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const update_quantity_in_cart = async (userId, clothesId, newQuantity) => {
    return new Promise((resolve, reject) => {
        connection.query(
            `UPDATE cart 
             SET quantity = ? 
             WHERE ID_Client = ? AND ID_Clothes = ?`,
            [newQuantity, userId, clothesId],
            (err, result) => {
                if (err) {
                    console.error('Error al actualizar la cantidad en el carrito:', err);
                    return reject({ success: false, message: 'Error al actualizar la cantidad', error: err });
                }

                if (result.affectedRows === 0) {
                    return resolve({ success: false, message: 'No se encontró el artículo para actualizar' });
                }

                return resolve({ success: true, message: 'Cantidad actualizada exitosamente' });
            }
        );
    });
};

const delete_from_car = async (req, res) => {
    const { userId } = req.params;
    const { ID_Clothes } = req.body;

    if (!userId || !ID_Clothes) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    try {
        const response = await remove_from_cart(userId, ID_Clothes);

        res.status(200).json(response);
    } catch (error) {
        console.error('Error interno del servidor:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

const remove_from_cart = async (userId, clothesId) => {
    return new Promise((resolve, reject) => {
        connection.query(
            `UPDATE cart 
             SET available = 0 
             WHERE ID_Client = ? AND ID_Clothes = ?`,
            [userId, clothesId],
            (err, result) => {
                if (err) {
                    console.error('Error al eliminar el artículo del carrito:', err);
                    reject({ message: 'Error al eliminar el artículo', error: err });
                } else if (result.affectedRows === 0) {
                    resolve({ message: 'No se encontró el artículo para eliminar' });
                } else {
                    resolve({ message: 'Artículo eliminado del carrito exitosamente' });
                }
            }
        );
    });
};

module.exports = {
    add_articulo_to_car,
    get_shopping_car,
    update_quantity,
    delete_from_car
};