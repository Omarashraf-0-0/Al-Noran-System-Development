# 🔐 Forget Password Flow - Complete Documentation

## 📋 Overview
نظام استرجاع كلمة المرور الكامل للموبايل أبلكيشن مع OTP verification

## 🎯 السيناريو الكامل

### 1️⃣ **Forgot Password Page** (`ForgotPasswordPage.dart`)
- المستخدم يدخل البريد الإلكتروني
- النظام يتحقق من وجود الإيميل في الداتابيز
- ✅ **إذا الإيميل موجود**: يبعت OTP (5 digits) على الإيميل
- ❌ **إذا الإيميل مش موجود**: رسالة "البريد الإلكتروني غير مسجل"

### 2️⃣ **OTP Verification Page** (`OtpVerificationPage.dart`)
- المستخدم يدخل الـ 5 digits OTP
- **Timer**: 5 دقائق فقط لإدخال الكود
- **حدود المحاولات**:
  - ✅ **إعادة الإرسال**: 3 مرات كحد أقصى
  - ✅ **محاولات خاطئة**: 5 محاولات كحد أقصى
- **النتائج**:
  - ✅ **OTP صحيح**: الانتقال لصفحة تغيير كلمة المرور
  - ❌ **OTP خاطئ**: رسالة خطأ + counter (مثال: 3/5)
  - ❌ **5 محاولات خاطئة**: إلغاء العملية والرجوع للـ Login
  - ⏰ **انتهاء الوقت**: زر "إعادة الإرسال" يظهر

### 3️⃣ **Reset Password Page** (`reset_password_page.dart`)
- المستخدم يدخل كلمة المرور الجديدة
- تأكيد كلمة المرور
- **Validation**:
  - كلمة المرور على الأقل 6 أحرف
  - كلمة المرور وتأكيدها متطابقين
- ✅ **النجاح**: رسالة نجاح + الرجوع لصفحة Login

## 🔌 Backend Endpoints

### 1. Forgot Password (Send OTP)
```
POST /api/otp/forgotPassword
Body: { email: string }
Response: { msg: "OTP sent to your email" }
```

### 2. Resend OTP
```
POST /api/otp/forgotPassword
Body: { email: string }
Note: نفس الـ endpoint (resend = forgot password)
```

### 3. Verify OTP
```
POST /api/otp/verifyOTP
Body: { email: string, otp: string }
Response: { msg: "OTP verified" }
```

### 4. Reset Password
```
PATCH /api/otp/resetPassword
Body: { email: string, newPassword: string }
Response: { msg: "Password updated successfully" }
```

## ⚙️ Technical Details

### OTP Configuration
- **Length**: 5 digits
- **Validity**: 5 minutes (300 seconds)
- **Storage**: في الـ User model (resetOTP, otpExpires fields)
- **Email**: noransmartai@gmail.com

### Limits & Security
- ✅ Maximum 3 resend attempts
- ✅ Maximum 5 wrong OTP attempts
- ✅ OTP expires after 5 minutes
- ✅ Email must exist in database
- ✅ Password minimum 6 characters

### UI Features
- ✅ Loading indicators during API calls
- ✅ Real-time timer countdown (MM:SS format)
- ✅ Attempt counters display
- ✅ Auto-focus between OTP input boxes
- ✅ Error messages in Arabic
- ✅ Success popups with navigation

## 📱 Flutter Pages

### ForgotPasswordPage
- **Import**: `import 'ForgotPasswordPage.dart';`
- **Navigation**: `Navigator.push(context, MaterialPageRoute(builder: (context) => ForgotPasswordPage()))`
- **Connected to**: OtpVerificationPage

### OtpVerificationPage
- **Import**: `import 'OtpVerificationPage.dart';`
- **Required**: `email` parameter
- **Navigation**: `OtpVerificationPage(email: email)`
- **Connected to**: ResetPasswordPage

### ResetPasswordPage
- **Import**: `import 'reset_password_page.dart';`
- **Required**: `email` parameter
- **Navigation**: `ResetPasswordPage(email: email)`
- **Connected to**: LoginPage

## 🎨 Design Colors
- **Primary Dark**: `#690000`
- **Primary Light**: `#A40000`
- **Accent**: `#1BA3B6`

## ✅ Testing

### Test via Terminal
```bash
# Test forgot password (send OTP)
node test-forgot-password.js

# Check email for 5-digit OTP
# Then test in mobile app
```

### Test via Mobile App
1. Open app → Login Page
2. Click "نسيت كلمة المرور؟"
3. Enter email → Click "إرسال الكود"
4. Check email for 5-digit OTP
5. Enter OTP in app → Click "تأكيد الكود"
6. Enter new password → Click "تأكيد"
7. Success! → Redirect to Login

## 🔒 Security Notes
- ✅ OTP stored hashed in database
- ✅ OTP expires automatically
- ✅ Limited attempts prevent brute force
- ✅ All errors in Arabic for consistency
- ✅ No token needed (email-based verification)

## 📊 Status
✅ **Fully Implemented** - Ready for testing
✅ **Backend Connected** - Server running on port 3500
✅ **Email Service Active** - Sending via noransmartai@gmail.com
✅ **No Errors** - All pages compile successfully
