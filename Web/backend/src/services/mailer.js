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


const send_mail = async (to, subject, text = "", html = "") => {
    // Validate inputs and provide defaults
    if (!to || !subject) {
        console.error("Error: 'to' and 'subject' are required parameters");
        return { "error": "Missing required parameters: to or subject" };
    }

    // Use html if provided, otherwise generate from text
    if (html === "" && text !== "") {
        html = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    direction: rtl;
                    text-align: right;
                }
            </style>
        </head>
        <body>
            <div style="padding: 20px;">
                ${text.split('\n').map(line => `<p>${line}</p>`).join('')}
            </div>
        </body>
        </html>
        `;
    } else if (html === "" && text === "") {
        console.error("Error: Either 'text' or 'html' must be provided");
        return { "error": "Missing email content" };
    }

    // Fallback text if not provided
    if (text === "" && html !== "") {
        text = subject; // Use subject as fallback text
    }

    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
            html,
            encoding: 'utf-8',
            textEncoding: 'base64',
            headers: {
                'Content-Type': 'text/html; charset=UTF-8',
                'Content-Transfer-Encoding': 'base64'
            }
        });

        console.log("✅ Message sent successfully:", info.messageId);
        return info;
    } catch (error) {
        console.error("❌ Error sending email:", error);
        return { "error": error.message };
    }
};

// send_mail("salahgamal20016@gmail.com", "Test", "wobbly wiggly wobbly wiggly wobbly wiggly woooooo");

module.exports = { send_mail };