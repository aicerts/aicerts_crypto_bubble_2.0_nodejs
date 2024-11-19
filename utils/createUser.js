const User = require("../models/user");

const createUser = async (profile, accessToken, sourceApp) => {
  try {
    const { id, displayName, emails, email } = profile;

    // Extract the email from profile
    const userEmail = email || (emails && emails.length > 0 ? emails[0].value : null);

    if (!userEmail) {
      throw new Error("Email is required");
    }

    // Check if user exists by email
    let user = await User.findOne({ email: userEmail });

    if (!user) {
      // Create a new user if not found
      const [firstname, ...lastnameParts] = displayName.split(" ");
      const lastname = lastnameParts.join(" ") || "N/A"; // Handle single-word names

      user = new User({
        firstname: firstname || "Unknown",
        lastname,
        email: userEmail,
        password: "oauth_generated", // Placeholder for password since OAuth users don't set a password
        watchlists: [], // Default to an empty array
      });

      await user.save();
    } else {
      // Update existing user if found
      user.password = "oauth_generated"; // Optionally update the password
      await user.save();
    }

    const response = {
      _id: user._id,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      token: accessToken,
    };

    return {
      code: 200,
      status: true,
      details: response,
    };
  } catch (error) {
    return {
      code: 400,
      status: false,
      message: error.message || "Error while creating user",
      details: { error },
    };
  }
};

module.exports = createUser;
