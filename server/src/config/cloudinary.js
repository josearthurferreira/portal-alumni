const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const dotenv = require('dotenv');
const path = require('path');

// Tenta carregar o .env explicitamente do diretório raiz
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// OU se o seu .env está na mesma pasta do package.json, apenas dotenv.config() costuma bastar,
// mas o código acima é mais seguro se houver confusão de pastas.

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();

module.exports = {
  cloudinary,
  storage,
};
