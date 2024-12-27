const connection = require('../../business/models/database');
const grpc = require('@grpc/grpc-js');

const getAllVentas = (ID_Selling, InitialDate, CutDate, callback) => {
    try {
        console.log('Solicitud recibida para obtener todos las ventas...');

        connection.query('SELECT ph.ID_Purchase, ph.ID_Client, ph.ID_Clothes, ph.quantity, ph.purchase_date, c.name, c.price, CONCAT(s.name,  \' \' , s.lastname) AS nombreCompleto FROM purchase_history ph INNER JOIN clothes c ON ph.ID_Clothes = c.ID_Clothes INNER JOIN selling_clothes sc ON sc.ID_Clothes = c.ID_Clothes INNER JOIN selling s ON s.ID_Selling = sc.ID_Selling WHERE sc.ID_Selling = ? AND ph.purchase_date >= ? AND ph.purchase_date <= ?', [ID_Selling, InitialDate, CutDate], (err, results) => {
            if (err) {
                console.error('Error al obtener ventas: ', err);
                return callback({
                    code: grpc.status.INTERNAL,
                    message: 'Error interno del servidor al obtener las ventas'
                });
            }
            
            const ventas = results.map(row => {
                console.log('Row data:', row.purchase_date);
                return {
                    ID_Purchase: row.ID_Purchase,
                    ID_Client: row.ID_Client,
                    ID_Clothes: row.ID_Clothes,
                    quantity: row.quantity,
                    fecha: row.purchase_date ? new Date(row.purchase_date).toISOString() : null,
                    name: row.name,
                    priceArticle: row.price,
                    nameSelling: row.nombreCompleto
                };
            });

            console.log('Ventas obtenidas correctamente.', ventas);
            callback(null, { ventas });
        });

    } catch (error) {
        console.error('Error inesperado al obtener ventas:', error);
        callback({
            code: grpc.status.INTERNAL,
            message: 'Error interno inesperado del servidor'
        });
    }
};

module.exports = { getAllVentas };