const nodemailer = require("nodemailer");

// Create transporter (Gmail SMTP)
// NOTE: EMAIL_PASS must be a Gmail App Password
// Generate at: https://myaccount.google.com/apppasswords
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

const sendOTP = async (email, otp) => {
  try {
    const info = await transporter.sendMail({
      from: `"YouAI" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🔐 Your YouAI Magic Code",
      html: `
        <div style="font-family: sans-serif;">
          <h2>Your OTP is: <span style="color: #6366f1;">${otp}</span></h2>
          <p>This code is valid for <strong>5 minutes</strong>.</p>
          <p>Please do not share it with anyone.</p>
        </div>
      `,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send OTP email:', error.message);
    throw error;
  }
};

module.exports = { sendOTP };
