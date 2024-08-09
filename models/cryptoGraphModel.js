const mongoose = require("mongoose");

const cryptoDataSchema = new mongoose.Schema({
  timeframe: String,
  cryptoId: String,
  currency: String,
  data: [
    {
      t: Number,
      p: Number,
    },
  ],
  fetchedAt: { type: Date, default: Date.now },
});
const CryptoGraph = mongoose.model("CryptoData", cryptoDataSchema);

module.exports = CryptoGraph;
