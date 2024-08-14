// models/Image.js
const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    imageName: String,  // URL of the image from the external API
    imageData: Buffer, // Binary data of the image
    contentType: String, // Content type (e.g., image/jpeg)
});

const CryptoImage = mongoose.model('crypto-image', imageSchema);
module.exports = CryptoImage
