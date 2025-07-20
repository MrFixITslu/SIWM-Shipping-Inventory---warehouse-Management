

const nodemailer = require('nodemailer');

let transporter;

// Check if all necessary environment variables are set.
const isEmailConfigured = process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS;

if (isEmailConfigured) {
    transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587', 10),
        secure: parseInt(process.env.EMAIL_PORT || '587', 10) === 465, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 10000,
        socketTimeout: 10000,
    });
    
    // Verify connection configuration
    transporter.verify()
      .then(() => console.log('Email service is configured and ready to send emails.'))
      .catch(err => {
        console.error('--- EMAIL SERVICE VERIFICATION FAILED ---');
        if (err.code === 'EAUTH') {
            console.error('Authentication Error: The username or password in your .env file is incorrect.');
            console.error('HINT: If you are using Gmail, you may need to generate and use an "App Password" instead of your regular password. Please see the README.md for instructions.');
        } else if (err.code === 'ECONNECTION') {
            console.error('Connection Error: Could not connect to the email server. Check EMAIL_HOST and EMAIL_PORT in your .env file.');
        } else {
            console.error('An unknown error occurred during email service verification. Please check all EMAIL_* variables in your .env file.');
        }
        console.error('Full error details:', err.message);
        console.error('------------------------------------------');
    });

} else {
    // This warning is now also handled in server.js for better visibility on startup.
    // console.warn('Email service is not configured. Emails will not be sent.');
}

/**
 * Sends an email using the configured transporter.
 * @param {object} mailData - The email data.
 * @param {string} mailData.to - The recipient's email address.
 * @param {string} mailData.subject - The subject of the email.
 * @param {string} mailData.html - The HTML body of the email.
 */
const sendEmail = async ({ to, subject, html }) => {
    if (!isEmailConfigured || !transporter) {
        console.warn(`Email not sent to <${to}> with subject "${subject}" because email service is not configured.`);
        return;
    }

    try {
        const mailOptions = {
            from: `"${process.env.EMAIL_FROM_NAME || 'Vision79 Shipping, Inventory & Warehouse Management'}" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        };
        
        let info = await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to <${to}> with Message ID: ${info.messageId}`);
    } catch (error) {
        console.error(`Error sending email to <${to}>:`, error);
        // We log the error but do not re-throw it. This prevents an email failure
        // from crashing a larger process (e.g., creating an ASN).
    }
};

module.exports = { sendEmail };