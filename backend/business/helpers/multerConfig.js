const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ruta absoluta para la carpeta `uploads`
const uploadPath = path.join(__dirname, '..', 'uploads');

// Verificar y crear la carpeta si no existe
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

// Configuración de almacenamiento para Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadPath); // Carpeta donde se guardarán las imágenes
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Nombre único basado en la fecha
    },
});

// Crear el middleware de Multer
const upload = multer({ storage });

module.exports = upload;
