const { response } = require('express');
const upload = require('../../business/helpers/multerConfig');

const uploadImage = (req, res) => {
    if (!req.file) {
        return res.status(400).send({ message: 'No se ha subido ningún archivo.' });
    }
    console.log(`Archivo guardado en: ${req.file.path}`); // Ruta física del archivo
    const imageUrl = `http://localhost:${process.env.PORT || 8085}/uploads/${req.file.filename}`;
    res.status(200).send({ url: imageUrl });
};

module.exports = {
    uploadImage,
};