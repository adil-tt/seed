// src/utils/sendEmail.js
const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  try {
    // 1. Create the transporter (Using Gmail as the service)
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USERNAME, // Your Gmail address from .env
        pass: process.env.EMAIL_PASSWORD, // Your Google App Password from .env
      },
    });

    // 2. Define the email options
    const mailOptions = {
      from: 'Ceramico Support <noreply@ceramico.com>',
      to: options.email,
      subject: options.subject,
      text: options.message,
    };

    // 3. Send the email
    await transporter.sendMail(mailOptions);
    console.log(`Email successfully sent to ${options.email}`);

  } catch (error) {
    console.error("EMAIL SENDING ERROR:", error);
    throw new Error("Could not send email. Please try again later.");
  }
};

module.exports = sendEmail;