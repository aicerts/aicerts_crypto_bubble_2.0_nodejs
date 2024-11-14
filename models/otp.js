const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  otp: {
    type: Number,
    required: false,  // OTP is not required for password reset flow
  },
  expiresAt: {
    type: Date,
    required: false,  // OTP expiration is not needed for password reset
  },
  resetToken: {
    type: String,
    required: false,  // The reset token will be used for forgot password flow
  },
  resetTokenExpiresAt: {
    type: Date,
    required: false,  // Expiry for the reset token
  },
}, { timestamps: true });

const Otp = mongoose.model('Otp', otpSchema);
module.exports = Otp;
