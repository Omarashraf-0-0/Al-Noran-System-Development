const nodemailer = require("nodemailer");
require('dotenv').config();

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: "salahgamal20016@gmail.com",
//     pass: process.env.GOOGLE_APP_PASSWORD,
//   },
// });

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
});


const send_mail = async (to, subject, text, html = "") => {

  if(html === "")
  html = `<b>${text}</b>`
    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
            html,
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