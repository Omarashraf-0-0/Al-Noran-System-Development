const User = require("../models/user");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");

// ========== إرسال OTP ==========
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "البريد الإلكتروني غير مسجل لدينا" });

    const otp = Math.floor(10000 + Math.random() * 90000).toString(); // 5 digits

    user.resetOTP = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000; // 5 دقايق
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // HTML Email Template in Arabic
    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #690000 0%, #A40000 100%); padding: 40px 20px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; font-weight: bold; }
          .content { padding: 40px 30px; text-align: center; }
          .otp-box { background: #f8f9fa; border: 3px dashed #1BA3B6; border-radius: 12px; padding: 30px; margin: 30px 0; }
          .otp-code { font-size: 48px; font-weight: bold; color: #690000; letter-spacing: 8px; font-family: 'Courier New', monospace; }
          .info { color: #666; font-size: 14px; line-height: 1.8; margin: 20px 0; }
          .warning { background: #fff3cd; border-right: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 8px; }
          .warning strong { color: #856404; }
          .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #999; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 استعادة كلمة المرور</h1>
          </div>
          <div class="content">
            <p class="info">مرحباً،</p>
            <p class="info">لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك.</p>
            <p class="info">استخدم رمز التحقق التالي لإكمال العملية:</p>
            
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>
            
            <div class="warning">
              <strong>⚠️ تنبيه:</strong><br>
              • رمز التحقق صالح لمدة <strong>5 دقائق فقط</strong><br>
              • لديك <strong>5 محاولات</strong> لإدخال الرمز الصحيح<br>
              • يمكنك إعادة إرسال الرمز <strong>3 مرات كحد أقصى</strong>
            </div>
            
            <p class="info" style="margin-top: 30px; color: #999;">
              إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذه الرسالة.
            </p>
          </div>
          <div class="footer">
            <p>© 2025 Al-Noran System. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"نظام النوران" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🔐 رمز استعادة كلمة المرور - نظام النوران",
      html: htmlContent,
      text: `رمز التحقق الخاص بك هو: ${otp}\nصالح لمدة 5 دقائق فقط.`,
    });

    res.json({ msg: "تم إرسال رمز التحقق إلى بريدك الإلكتروني" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ========== التحقق من OTP ==========
const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "البريد الإلكتروني غير مسجل لدينا" });

    if (user.resetOTP !== otp)
      return res.status(400).json({ msg: "رمز التحقق غير صحيح" });

    if (Date.now() > user.otpExpires)
      return res.status(400).json({ msg: "انتهت صلاحية رمز التحقق" });

    res.json({ msg: "تم التحقق من الرمز بنجاح" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ========== تغيير الباسورد ==========
const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "البريد الإلكتروني غير مسجل لدينا" });

    // Don't manually hash - let the pre('save') hook handle it
    user.password = newPassword; // Assign plain text password
    user.resetOTP = undefined;
    user.otpExpires = undefined;

    await user.save(); // pre('save') hook will hash the password

    res.json({ msg: "تم تغيير كلمة المرور بنجاح" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { forgotPassword, verifyOTP, resetPassword };
