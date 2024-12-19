const connection = require('../../business/models/database');
const grpc = require('@grpc/grpc-js');

const getAllVentas = (call, callback) => {
    try {
        console.log('Solicitud recibida para obtener todos las ventas...');
        
        connection.query('SELECT * FROM purchase_history', (err, results) => {
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
                    fecha: row.purchase_date ? new Date(row.purchase_date).toISOString() : null
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