const express = require('express');
const router = express.Router();
const imagesController = require('../../Logic/controllersRest/images');
const upload = require('../../business/helpers/multerConfig');

router.post('/upload_image', upload.single('profileImage'), imagesController.uploadImage);

module.exports = router;
