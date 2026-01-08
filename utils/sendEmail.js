const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, htmlContent, attachments = []) => {
  try {
    console.log("Email configuration:", {
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS ? "[REDACTED]" : undefined,
    });

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false, 
      },
    });

    const mailOptions = {
      from: `"PFOS" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
      attachments, 
    };

    console.log(`Preparing to send email to ${to} with subject: ${subject}`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${to}: ${info.messageId}`);
  } catch (error) {
    console.error(`❌ Email Error for ${to}:`, error.message);
    throw new Error(`Failed to send email to ${to}: ${error.message}`);
  }
};

module.exports = sendEmail;
