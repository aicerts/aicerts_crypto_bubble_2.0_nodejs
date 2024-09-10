const mongoose = require('mongoose');
const { Schema } = mongoose;

const cryptoSchema = new Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    rank: { type: Number, required: true },
    symbol: { type: String, required: true },
    symbols: {
        binance: { type: String },
        kucoin: { type: String },
        bybit: { type: String },
        gateio: { type: String },
        coinbase: { type: String },
        mexc: { type: String },
        okx: { type: String }
    },
    image: { type: String, required: true },
    stable: { type: Boolean, required: true },
    // circulating_supply: { type: Number, required: true },
    dominance: { type: Number, required: true },
    rankDiffs: {
        hour: { type: Number, required: true },
        day: { type: Number, required: true },
        week: { type: Number, required: true },
        month: { type: Number, required: true },
        year: { type: Number, required: true }
    },
    cg_id: { type: String, required: true },
    price: { type: Number, required: true },
    marketcap: { type: Number, required: true },
    volume: { type: Number, required: true },
    performance: {
        hour: { type: Number, required: true },
        min1: { type: Number, required: true },
        min5: { type: Number, required: true },
        min15: { type: Number, required: true },
        day: { type: Number, required: true },
        week: { type: Number, required: true },
        month: { type: Number, required: true },
        year: { type: Number, required: true }
    }
});

const Crypto = mongoose.model('Crypto', cryptoSchema);

module.exports = Crypto;
