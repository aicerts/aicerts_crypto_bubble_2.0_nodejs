const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const User = require("../models/user");
const Otp = require("../models/otp");
const sendEmail = require("../services/sendMail");
const bcrypt = require("bcrypt");
const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken")
const crypto = require("crypto");

const signup = catchAsync(async (req, res, next) => {
  try {
    const { firstname, lastname, email, password } = req.body;

    // Validate input fields
    if (!firstname || !lastname || !email || !password) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "Firstname, lastname, email, and password are required",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "User already exists",
      });
    }

    // Generate OTP and expiration time
    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Save OTP in the database
    await Otp.findOneAndUpdate(
      { email },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    // Send OTP email
    await sendEmail(email, otp, firstname);
    res.status(httpStatus.OK).json({ message: "OTP sent to email" });

  } catch (error) {
    console.error("Error in signup:", error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: "An error occurred while initiating signup",
    });
  }
});

const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp, firstname, lastname, password } = req.body;

    // Validate the OTP and password fields
    if (!email || !otp || !password || !firstname || !lastname) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "Email, OTP, firstname, lastname, and password are required",
      });
    }

    // Find OTP record
    const otpRecord = await Otp.findOne({ email });

    if (!otpRecord) {
      return next(
        new ApiError(
          "OTP not found. Please request a new one.",
          httpStatus.BAD_REQUEST
        )
      );
    }

    // Check if OTP is valid and not expired
    if (otpRecord.otp !== parseInt(otp) || otpRecord.expiresAt < new Date()) {
      return next(
        new ApiError("Invalid or expired OTP", httpStatus.BAD_REQUEST)
      );
    }

    // OTP verified successfully; remove the OTP record
    await Otp.deleteOne({ email });

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in the database
    const newUser = new User({
      firstname,
      lastname,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { email: newUser.email, id: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(httpStatus.CREATED).json({
      message: "User registered successfully",
      token,
      userEmail:email
    });
  } catch (error) {
    console.error("Error in verifyOtp:", error);
    return next(
      new ApiError(
        "An error occurred during OTP verification",
        httpStatus.INTERNAL_SERVER_ERROR
      )
    );
  }
};

// Step 3: Set Password and Complete Signup
const setPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate password
    if (!password || password.length < 6) {
      return res.status(httpStatus.BAD_REQUEST).json({
        error: "Password must be at least 6 characters",
      });
    }

    // Check if OTP verification was successful
    const otpRecord = await Otp.findOne({ email });
    if (!otpRecord) {
      return res.status(httpStatus.BAD_REQUEST).json({
        error: "Please verify OTP before setting password",
      });
    }

    await Otp.deleteOne({ email });

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in the database
    const newUser = new User({
      username: email.split("@")[0],
      email,
      password: hashedPassword,
    });
    await newUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { email: newUser.email, id: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(httpStatus.CREATED).json({
      message: "User registered successfully",
      token,
    });
  } catch (error) {
    console.error("Error in setPassword:", error);
    // Send proper response with status code and message
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      error: "An error occurred while setting password",
    });
  }
};

const login = catchAsync(async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email and password
    if (!email || !password) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "Email and password are required",
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "User not found",
      });
    }

    // Check if password matches
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        message: "Incorrect password",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { email: user.email, id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Return success response with the token
    res.status(httpStatus.OK).json({
      message: "Login successful",
      token,
      userEmail:email
    });
  } catch (error) {
    console.error("Error in login:", error);
    return next(
      new ApiError("An error occurred while processing your login request", httpStatus.INTERNAL_SERVER_ERROR)
    );
  }
});

const forgotPassword = catchAsync(async (req, res, next) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "Email is required",
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "User not found",
      });
    }

    // Generate reset token (random and unique)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Token expires in 15 minutes

    // Save reset token and expiration time in Otp model
    await Otp.findOneAndUpdate(
      { email },
      { resetToken, resetTokenExpiresAt: expiresAt },
      { upsert: true, new: true }
    );

    // Send email with the reset link (reset token included in the URL)
    const resetUrl = `${process.env.RESET_PASSWORD}?token=${resetToken}&email=${email}`;
    await sendEmail(email, resetUrl, "Password Reset");

    res.status(httpStatus.OK).json({
      message: "Password reset link sent to email",
    });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    return next(
      new ApiError("An error occurred while requesting the password reset", httpStatus.INTERNAL_SERVER_ERROR)
    );
  }
});

const resetPassword = catchAsync(async (req, res, next) => {
  try {
    const { token, email, newPassword } = req.body;

    // Validate input fields
    if (!token || !email || !newPassword) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "Token, email, and new password are required",
      });
    }

    // Find the reset token record in the database
    const resetRecord = await Otp.findOne({ email, resetToken: token }); 
    console.log(resetRecord)
    if (!resetRecord) {
      return next(
        new ApiError("Invalid or expired reset token", httpStatus.BAD_REQUEST)
      );
    }

    // Check if the token has expired
    if (resetRecord.resetTokenExpiresAt < new Date()) {
      return next(
        new ApiError("Reset token has expired", httpStatus.BAD_REQUEST)
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the User model
    const user = await User.findOneAndUpdate(
      { email },
      { password: hashedPassword },
      { new: true }
    );

    // Delete the reset token after use
    await Otp.deleteOne({ email });

    res.status(httpStatus.OK).json({
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    return next(
      new ApiError("An error occurred while resetting the password", httpStatus.INTERNAL_SERVER_ERROR)
    );
  }
});

const changePassword = catchAsync(async (req, res, next) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    // Validate input fields
    if (!email || !newPassword) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "Email and new password are required",
      });
    }

    if (!currentPassword) {
      return res.status(httpStatus.BAD_REQUEST).json({
        message: "current password is required",
      });
    }

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(httpStatus.NOT_FOUND).json({
        message: "User not found",
      });
    }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(httpStatus.UNAUTHORIZED).json({
          message: "Current password is incorrect",
        });
      }
    

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    res.status(httpStatus.OK).json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error in changePassword:", error);
    return next(
      new ApiError("An error occurred while changing the password", httpStatus.INTERNAL_SERVER_ERROR)
    );
  }
});


module.exports = {
    verifyOtp,
    signup, 
    setPassword,
    login,
    resetPassword,
    forgotPassword,
    changePassword
    
}
