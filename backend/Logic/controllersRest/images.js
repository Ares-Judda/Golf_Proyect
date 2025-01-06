const { response } = require('express');
const upload = require('../../business/helpers/multerConfig');
const path = require('path');
const fs = require('fs');

const uploadImage = (req, res) => {
    if (!req.file) {
        return res.status(400).send({ message: 'No se ha subido ningún archivo.' });
    }
    console.log(`Archivo guardado en: ${req.file.path}`); // Ruta física del archivo
    const imageUrl = `http://localhost:${process.env.PORT || 8085}/uploads/${req.file.filename}`;
    res.status(200).send({ url: imageUrl });
};

const deleteImage = (req, res) => {
    const { filename } = req.params;

    if (!filename) {
        return res.status(400).send({ message: 'El nombre del archivo no fue proporcionado.' });
    }

    const filePath = path.join(__dirname, '..', '..', 'business', 'uploads', filename);

    fs.unlink(filePath, (err) => {
        if (err) {
            if (err.code === 'ENOENT') {
                return res.status(404).send({ message: 'Archivo no encontrado.' });
            }
            console.error('Error al eliminar el archivo:', err);
            return res.status(500).send({ message: 'Error interno al eliminar el archivo.' });
        }

        res.status(200).send({ message: 'Archivo eliminado exitosamente.' });
    });
};

module.exports = {
    uploadImage,
    deleteImage
};