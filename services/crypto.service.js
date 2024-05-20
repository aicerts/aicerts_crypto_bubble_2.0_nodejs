const Crypto = require('../models/cryptoModel');
const fetchCrypto = async() => {
    try {
        const cryptos = await Crypto.find({});
        return cryptos;
    } catch (error) {
        console.error('Error fetching crypto data:', error);
        return 'Internal Server Error'
    }
}

module.exports = {
    fetchCrypto
}