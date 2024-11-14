const dotenv = require("dotenv")
const nodemailer = require("nodemailer")

dotenv.config();

// Define the mail options object type
const mailOptions = {
    from: {
        name: 'Certs365 Admin',
        address: process.env.USER_MAIL || '',
    },
    to: '',  // Will be set dynamically in sendEmail or sendWelcomeMail
    subject: '',  // Will be set dynamically
    text: '',  // Will be set dynamically
};

// Nodemailer transporter configuration
const transporter = nodemailer.createTransport({
    service: process.env.MAIL_SERVICE,  // For example: 'Outlook'
    host: process.env.MAIL_HOST,  // Example: 'smtp.office365.com'
    port: 587,  // For TLS
    secure: false,  // Use TLS
    auth: {
        user: process.env.USER_NAME,  // Your email address
        pass: process.env.MAIL_PWD,  // App password
    },
});

// Function to send OTP email
const sendEmail = async ( email, otp, username) => {
    try {
        mailOptions.to = email;
        mailOptions.subject = `Your Authentication OTP`;
        mailOptions.text = `Hi ${username},

        Your one-time password (OTP) is ${otp}  Please enter this code to complete your authentication process.

        If you did not request this code, please ignore this message.
        
        Best regards,
        The Certs365 Team`;

        await transporter.sendMail(mailOptions);
        console.log('OTP email sent successfully');
    } catch (error) {
        console.error('Error sending OTP email:', error);
    }
};





module.exports = sendEmail
