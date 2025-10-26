const nodemailer = require("nodemailer");
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "salahgamal20016@gmail.com",
    pass: process.env.GOOGLE_APP_PASSWORD,
  },
});


const send_mail = async (to, subject, text) => {
    try {
        const info = await transporter.sendMail({
            from: "salahgamal20016@gmail.com",
            to,
            subject,
            text,
            html: `<b>${text}</b>`,
        });

        console.log("Message sent:", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        return {"error":error.message};
        //throw error;
    }
};

// send_mail("salahgamal20016@gmail.com", "Test", "wobbly wiggly wobbly wiggly wobbly wiggly woooooo");

module.exports = { send_mail };