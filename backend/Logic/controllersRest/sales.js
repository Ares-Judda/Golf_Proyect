const { response } = require('express');
const connection = require('../models/database');
const userTokenManager = require('../helpers/user-token-manager'); 

/**
 * Obtiene lista de todas las ventas de la base de datos.
 * Este método consulta todas las ventas almacenados y devuelve la lista en formato JSON.
 * @param {*} req - La solicitud HTTP (no se requieren parámetros específicos).
 * @param {*} res - La respuesta HTTP que contiene la lista de ventas en formato JSON.
 */
const get_all_ventas = async (req, res = response) => {
    //Falta validacion de credenciales
    try {
        connection.query('SELECT * FROM purchase_history', (err, results) => {
            if (err) {
                console.error('Error al obtener ventas: ', err);
                return res.status(500).json({ error: 'Error interno del servidor' });
            }
            res.json({ ventas: results });
        });
    } catch (error) {
        console.error('Error al obtener ventas: ', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = {
    get_all_ventas
};