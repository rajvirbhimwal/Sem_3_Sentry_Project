const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

async function sendOtpEmail(email, otp) {
    await transporter.sendMail({
        from: `"EcoConnect" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: "Your EcoConnect Verification Code",
        text: `Your EcoConnect OTP is ${otp}. It expires in 5 minutes. Do not share this code with anyone.`,
        html: `       <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">         <h2>EcoConnect Email Verification</h2>         <p>Use the following code to verify your email address:</p>         <h1 style="letter-spacing: 6px;">${otp}</h1>         <p>This code expires in 5 minutes.</p>         <p>If you did not request this code, you can ignore this email.</p>       </div>
    `,
    });
}

module.exports = sendOtpEmail;
