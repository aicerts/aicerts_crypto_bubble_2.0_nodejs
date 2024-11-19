// models/User.js

const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
  id:{
    type:Number,
    required:false
  },
  name: {
    type: String,
    required: true,  // Each watchlist must have a name
  },
  symbols: {
    type: [String],  // Array of symbol IDs
    required: true,
  },
});

const userSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: true,
    trim: true,
  },
  lastname: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  watchlists: {
    type: [watchlistSchema],  // Array of watchlists
    default: [],  // Default value is an empty array if no watchlists
  },
}, { timestamps: true });

const User = mongoose.model('CryptoUser', userSchema);
module.exports = User;
