# دليل اختبار API - Al Noran System

## معلومات السيرفر
- **Base URL**: `http://localhost:3500`
- **قاعدة البيانات**: MongoDB Atlas
- **المنفذ**: 3500

---

## 🔐 Authentication Endpoints

### 1. تسجيل مستخدم جديد (Signup)
**POST** `/api/auth/signup`

**Request Body:**
```json
{
  "fullname": "أحمد محمد",
  "username": "ahmed123",
  "phone": "01234567890",
  "email": "ahmed@example.com",
  "password": "123456",
  "type": "client",
  "clientType": "personal",
  "ssn": "12345678901234"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "fullname": "أحمد محمد",
    "username": "ahmed123",
    "type": "client"
  }
}
```

---

### 2. تسجيل الدخول (Login)
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "ahmed@example.com",
  "password": "123456"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "fullname": "أحمد محمد",
    "username": "ahmed123",
    "email": "ahmed@example.com",
    "type": "client",
    "phone": "01234567890"
  }
}
```

**Response (Error - Invalid credentials):**
```json
{
  "message": "Invalid credentials"
}
```

**Response (Error - Account deactivated):**
```json
{
  "message": "Your account has been deactivated"
}
```

---

## 🧪 اختبار API باستخدام PowerShell

### تسجيل مستخدم جديد:
```powershell
$headers = @{
    "Content-Type" = "application/json"
}

$body = @{
    fullname = "محمد أحمد"
    username = "mohamed123"
    phone = "01111111111"
    email = "mohamed@test.com"
    password = "123456"
    type = "client"
    clientType = "personal"
    ssn = "12345678901234"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3500/api/auth/signup" -Method POST -Headers $headers -Body $body
```

### تسجيل الدخول:
```powershell
$headers = @{
    "Content-Type" = "application/json"
}

$body = @{
    email = "mohamed@test.com"
    password = "123456"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3500/api/auth/login" -Method POST -Headers $headers -Body $body
```

---

## 📱 Flutter Integration

تطبيق Flutter جاهز للاتصال بالسيرفر:
- **ملف API**: `Mobile Application/lib/core/network/api_service.dart`
- **صفحة Login**: `Mobile Application/lib/features/auth/login_page.dart`

### ملاحظات مهمة:
1. **للتجربة على المحاكي Android**: 
   - غير `baseUrl` في `api_service.dart` إلى `http://10.0.2.2:3500`
   
2. **للتجربة على جهاز حقيقي**:
   - اعرف IP address بتاع الكمبيوتر بتاعك:
     ```powershell
     ipconfig
     ```
   - غير `baseUrl` إلى `http://[YOUR_IP]:3500`

3. **للتجربة مع ngrok**:
   - شغل ngrok: `ngrok http 3500`
   - استخدم URL اللي ngrok هيديهولك

---

## ✅ خطوات الاختبار السريعة

### 1. تشغيل السيرفر:
```powershell
cd "c:\Al Noran\Al-Noran-System-Development\Web\backend"
npm start
```

### 2. سجل مستخدم جديد من MongoDB:
افتح MongoDB Atlas وشوف collection `users` عشان تتأكد إن المستخدم اتسجل

### 3. جرب من Flutter:
```bash
cd "c:\Al Noran\Al-Noran-System-Development\Mobile Application"
flutter run
```

---

## 🔍 Troubleshooting

### مشكلة: "خطأ في الاتصال بالسيرفر"
- تأكد إن السيرفر شغال: `http://localhost:3500`
- تحقق من الـ firewall
- جرب تفتح `http://localhost:3500` في المتصفح

### مشكلة: "Invalid credentials"
- تأكد إن البريد الإلكتروني وكلمة المرور صحيحين
- شوف قاعدة البيانات وتأكد إن المستخدم موجود

### مشكلة: "Cannot connect to MongoDB"
- تحقق من `.env` file وتأكد إن `DATABASE_URI` صحيح
- تأكد إن الإنترنت شغال (MongoDB Atlas محتاج إنترنت)

---

## 📊 User Types في النظام

### Client Types:
- `commercial` - عميل تجاري
- `factory` - مصنع
- `personal` - عميل شخصي

### Employee Types:
- `Regular Employee` - موظف عادي
- `Certified Employee` - موظف معتمد
- `Department Manager` - مدير قسم
- `System Admin` - مدير النظام

---

## 🎯 الخطوات التالية

1. ✅ تشغيل السيرفر
2. ✅ اختبار login/signup من Postman أو PowerShell
3. ✅ اختبار من Flutter app
4. 🔜 إضافة صفحة الرئيسية بعد Login
5. 🔜 إضافة Logout functionality
6. 🔜 إضافة Token verification middleware
