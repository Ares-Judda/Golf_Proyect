const { response } = require('express');
const connection = require('../../business/models/database');
const userTokenManager = require('../../business/helpers/user-token-manager'); 
const moment = require('moment'); 

const buy_shopping_car = async (req, res) => {
    const { userId } = req.params;
    const { updatedClothes = [] } = req.body;

    try {
        const updatedItems = [];
        for (const item of updatedClothes) {
            const clothe = await getClotheInfoFromCart(userId, item.ID_Clothes);
            if (!clothe) {
                return res.status(404).json("El artículo con ID " + item.ID_Clothes + " no existe o no está disponible.");
            }
            if (item.newQuantity > clothe.Quota) {
                return res.status(400).json("La cantidad solicitada de " + item.ID_Clothes + " excede las existencias disponibles.");
            }

            updatedItems.push(item);
        }

        for (const item of updatedItems) {
            await updateClotheQuantity(item.ID_Clothes, item.newQuantity);  
            await deleteClotheFromCar(item.ID_Clothes, userId); 
            await insertPurchaseHistory(userId, item.ID_Clothes, item.newQuantity);
        }

        return res.status(200).json("Compra procesada correctamente.");

    } catch (error) {
        console.error(error);
        return res.status(500).json("Error en el procesamiento de la compra.");
    }
};

const getClotheInfoFromCart = (userId, clothesId) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT cl.Quota, cr.Quantity
            FROM clothes cl
            INNER JOIN cart cr ON cl.ID_Clothes = cr.ID_Clothes
            WHERE cr.ID_Client = ? AND cr.ID_Clothes = ? AND cr.available = 1;
        `;
        
        connection.query(query, [userId, clothesId], (err, result) => {
            if (err) {
                console.error('Error al obtener la información de la prenda:', err);
                reject("Error al obtener la prenda");
            } else if (result.length === 0) {
                resolve(null); 
            } else {
                resolve(result[0]);  
            }
        });
    });
};

const deleteClotheFromCar = (clothesId, userId) => {
    return new Promise((resolve, reject) => {
        const query = `
            UPDATE cart 
            SET available = 0 
            WHERE ID_Clothes = ? AND ID_Client = ? ;
        `;
        connection.query(query, [clothesId, userId], (err, result) => {
            if (err) {
                console.error('Error al eliminar el artículo del carrito:', err);
                reject("Error al eliminar el artículo");
            } else if (result.affectedRows === 0) {
                resolve("No se encontró el artículo para eliminar");
            } else {
                resolve("Artículo eliminado del carrito exitosamente");
            }
        });
    });
};

const updateClotheQuantity = (clothesId, newQuantity) => {
    return new Promise((resolve, reject) => {
        const query = `
            UPDATE clothes 
            SET Quota = Quota - ? 
            WHERE ID_Clothes = ?;
        `;
        connection.query(query, [newQuantity, clothesId], (err, result) => {
            if (err) {
                console.error('Error al actualizar la cantidad de existencias de la prenda:', err);
                reject("Error al actualizar la cantidad de existencias");
            } else if (result.affectedRows === 0) {
                resolve("No se encontró el artículo para actualizar la cantidad de existencias");
            } else {
                resolve("Cantidad de existencias actualizada exitosamente");
            }
        });
    });
};

const insertPurchaseHistory = (userId, clothesId, quantity) => {
    return new Promise((resolve, reject) => {
        const purchaseDate = moment().format('YYYY-MM-DD HH:mm:ss'); 
        const query = `
            INSERT INTO purchase_history (ID_Client, ID_Clothes, quantity, purchase_date)
            VALUES (?, ?, ?, ?);
        `;
        connection.query(query, [userId, clothesId, quantity, purchaseDate], (err, result) => {
            if (err) {
                console.error('Error al insertar la compra en el historial:', err);
                reject("Error al insertar la compra en el historial");
            } else {
                resolve("Compra registrada en el historial exitosamente");
            }
        });
    });
};

const get_purchase_history_by_client = async (req, res) => {
    const { userId } = req.params; 
    try {
        if (!userId) {
            return res.status(400).json({ mensaje: 'El ID del cliente no fue proporcionado.' });
        }
        const purchaseItems = await get_purchase_history_by_client_from_db(userId);

        if (purchaseItems.length === 0) {
            return res.status(404).json({ mensaje: 'No se encontraron artículos para este cliente.' });
        }
        res.status(200).json(purchaseItems);
    } catch (error) {
        console.error('Error al obtener el historial de compras:', error);
        res.status(500).json({ mensaje: 'Error interno del servidor.' });
    }
};

const get_purchase_history_by_client_from_db = async (userId) => {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT * 
            FROM clothes AS c 
            INNER JOIN purchase_history AS s ON c.ID_Clothes = s.ID_Clothes 
            WHERE s.ID_Client = ?;
        `;
        connection.query(query, [userId], (err, results) => {
            if (err) {
                console.error('Error al consultar la base de datos:', err);
                reject({ message: 'Error al buscar historial de compras', error: err });
            } else {
                resolve(results); 
            }
        });
    });
};

module.exports = {
    buy_shopping_car,
    get_purchase_history_by_client
};
