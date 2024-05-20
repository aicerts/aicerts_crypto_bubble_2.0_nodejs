const mongoose = require('mongoose')
const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');
const axios = require('axios')
const Crypto = require('./models/cryptoModel')
const cron = require('node-cron')

const validateCryptoData = (cryptoData) => {
    return cryptoData.map(data => {
        return {
            ...data,
            symbols: {
                binance: data.symbols.binance || '',
                kucoin: data.symbols.kucoin || '',
                bybit: data.symbols.bybit || '',
                gateio: data.symbols.gateio || '',
                coinbase: data.symbols.coinbase || '',
                mexc: data.symbols.mexc || '',
                okx: data.symbols.okx || ''
            },
            rankDiffs: {
                hour: data.rankDiffs?.hour ?? 0,
                day: data.rankDiffs?.day ?? 0,
                week: data.rankDiffs?.week ?? 0,
                month: data.rankDiffs?.month ?? 0,
                year: data.rankDiffs?.year ?? 0
            },
            performance: {
                hour: data.performance?.hour ?? 0,
                min1: data.performance?.min1 ?? 0,
                min5: data.performance?.min5 ?? 0,
                min15: data.performance?.min15 ?? 0,
                day: data.performance?.day ?? 0,
                week: data.performance?.week ?? 0,
                month: data.performance?.month ?? 0,
                year: data.performance?.year ?? 0
            }
        };
    });
};


// Fetch and save data function
const fetchDataAndSave =  async() => {
    try {
        const response = await axios.get('https://cryptobubbles.net/backend/data/bubbles1000.usd.json');
        cryptoData = response.data;

        cryptoData = validateCryptoData(cryptoData);

        await Crypto.deleteMany({});

        await Crypto.insertMany(cryptoData.slice(0,100));
        console.log('Data saved successfully')
    } catch(error) {
        console.log('Error fetching data or saving crypto data', error)
    }
};

cron.schedule('* * * * *', fetchDataAndSave);

let server
mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
    logger.info('Connected to MongoDB');
    server = app.listen(config.port, () => {
        logger.info('Express server listening on port ' + config.port);
    })
}).catch(error => {
    logger.error('Could not connect to MongoDB. Exiting now...', error);
    process.exit();
});



const exitHandler = () => {
    if (server) {
        server.close(() => {
            logger.info('Server closed');
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
};

const unexpectedErrorHandler = (error) => {
    logger.error(error);
    exitHandler();
}

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
    logger.info('SIGTERM received');
    if (server) {
        server.close();
    }
});