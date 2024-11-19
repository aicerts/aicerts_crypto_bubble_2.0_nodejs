 const dotenv = require('dotenv') ;
const jwt = require('jsonwebtoken')

dotenv.config();

const generateJwtToken = async() => {
  try {
    const expiresInMinutes = process.env.JWT_EXPIRE;
    const claims = { authType: "User" };
    const token = jwt.sign(claims, process.env.JWT_SECRET, {
      expiresIn: `${expiresInMinutes}`
    });
    return token;
  } catch (error) {
    console.error("Error generating JWT token:", error);
    throw error; 
  }
}
module.exports = generateJwtToken
