# 🎯 دليل استخدام النظام - Al Noran System

## ✅ تم إنجازه

### 1. Backend (Node.js + MongoDB)
- ✅ إضافة Login endpoint: `POST /api/auth/login`
- ✅ إضافة Signup endpoint: `POST /api/auth/signup`  
- ✅ إضافة دالة `matchPassword` للتحقق من كلمة المرور
- ✅ إصلاح CORS للسماح بالاتصال من Flutter
- ✅ الاتصال بـ MongoDB Atlas يعمل بنجاح

### 2. Flutter App
- ✅ تحديث `api_service.dart` للاتصال بالسيرفر
- ✅ إضافة دوال لحفظ بيانات المستخدم والـ Token
- ✅ صفحة Login جاهزة ومتصلة بالـ API

---

## 📋 خطوات التشغيل

### خطوة 1: تشغيل Backend Server

افتح PowerShell جديد وشغل:

```powershell
cd "c:\Al Noran\Al-Noran-System-Development\Web\backend"
npm start
```

**يجب أن ترى:**
```
development
Connected to MongoDB
MongoDB Connected: ac-yskwkgn-shard-00-XX.kap4tle.mongodb.net
Server running on port 3500
```

**⚠️ مهم:** اترك Terminal ده مفتوح طول ما أنت شغال!

---

### خطوة 2: تشغيل Flutter App

#### أ. على المحاكي Android:
```powershell
cd "c:\Al Noran\Al-Noran-System-Development\Mobile Application"
flutter run
```

**ملحوظة:** Android Emulator بيستخدم `10.0.2.2` للاتصال بـ localhost على الكمبيوتر.
في ملف `api_service.dart` السطر 8، غيّر baseUrl لو محتاج:
```dart
static const String baseUrl = 'http://10.0.2.2:3500'; // للمحاكي Android
// أو
static const String baseUrl = 'http://localhost:3500'; // للويب أو iOS simulator
```

#### ب. على جهاز حقيقي (عبر WiFi):
1. اعرف IP Address بتاع الكمبيوتر:
```powershell
ipconfig
```
ابحث عن `IPv4 Address` تحت WiFi adapter (مثلاً: `192.168.1.100`)

2. غيّر في `api_service.dart`:
```dart
static const String baseUrl = 'http://192.168.1.100:3500';
```

3. تأكد إن الكمبيوتر والموبايل على نفس الشبكة (WiFi)

---

### خطوة 3: اختبار تسجيل الدخول

#### من Flutter App:
1. افتح التطبيق
2. جرب تسجل حساب جديد من صفحة Register
3. أو استخدم حساب موجود في MongoDB

#### من MongoDB Atlas:
1. افتح https://cloud.mongodb.com/
2. اذهب لـ Cluster0 → Browse Collections
3. اختر database → users collection
4. شوف المستخدمين الموجودين

---

## 🧪 اختبار API يدوياً

### 1. باستخدام PowerShell (في terminal منفصل):

#### تسجيل مستخدم جديد:
```powershell
Invoke-RestMethod -Uri "http://localhost:3500/api/auth/signup" `
  -Method POST `
  -ContentType "application/json" `
  -Body (@{
    fullname = "محمد أحمد"
    username = "mohamed123"
    phone = "01111111111"
    email = "mohamed@test.com"
    password = "123456"
    type = "client"
    clientType = "personal"
    ssn = "12345678901234"
  } | ConvertTo-Json)
```

#### تسجيل الدخول:
```powershell
Invoke-RestMethod -Uri "http://localhost:3500/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body (@{
    email = "mohamed@test.com"
    password = "123456"
  } | ConvertTo-Json)
```

---

## 🔧 إعدادات مهمة

### في `api_service.dart`:
```dart
// للتجربة المحلية (Web, iOS simulator):
static const String baseUrl = 'http://localhost:3500';

// للمحاكي Android:
static const String baseUrl = 'http://10.0.2.2:3500';

// لجهاز حقيقي (استبدل بـ IP بتاعك):
static const String baseUrl = 'http://192.168.1.100:3500';

// لـ ngrok (لو عايز تجرب من أي مكان):
// 1. شغل: ngrok http 3500
// 2. استخدم URL اللي ngrok هيديهولك
static const String baseUrl = 'https://your-url.ngrok-free.app';
```

---

## ❌ حل المشاكل الشائعة

### مشكلة 1: "خطأ في الاتصال بالسيرفر"
**الحلول:**
1. تأكد إن السيرفر شغال (شوف terminal السيرفر)
2. جرب افتح http://localhost:3500 في المتصفح
3. تأكد إن baseURL في Flutter صحيح
4. لو على جهاز حقيقي، تأكد إن الكمبيوتر والموبايل على نفس WiFi

### مشكلة 2: "Invalid credentials"
**الحلول:**
1. تأكد إن البريد الإلكتروني صحيح
2. تأكد إن كلمة المرور صحيحة (6 أحرف على الأقل)
3. شوف MongoDB وتأكد إن المستخدم موجود

### مشكلة 3: "User with that email already exists"
**الحل:**
- المستخدم ده موجود بالفعل، استخدم بريد إلكتروني مختلف
- أو استخدم صفحة Login

### مشكلة 4: السيرفر بيقفل لوحده
**الحل:**
- احذف كل الـ terminals وافتح واحد جديد
- شغل السيرفر: `npm start`
- ماتشغلش أي command تاني في نفس الـ terminal

---

## 📂 ملفات مهمة

### Backend:
- `Web/backend/src/server.js` - ملف السيرفر الرئيسي
- `Web/backend/src/controllers/authController.js` - منطق Login/Signup
- `Web/backend/src/models/user.js` - نموذج المستخدم في MongoDB
- `Web/backend/src/routes/authRoutes.js` - مسارات التسجيل
- `Web/backend/.env` - إعدادات قاعدة البيانات

### Flutter:
- `Mobile Application/lib/core/network/api_service.dart` - خدمة الاتصال بالـ API
- `Mobile Application/lib/features/auth/login_page.dart` - صفحة تسجيل الدخول
- `Mobile Application/lib/features/auth/register_page.dart` - صفحة إنشاء الحساب

---

## 🎯 الخطوات التالية (مقترحة)

1. **إنشاء صفحة Home** بعد تسجيل الدخول الناجح
2. **إضافة Logout** لمسح الـ Token والبيانات المحفوظة
3. **إضافة middleware للتحقق من Token** في requests محمية
4. **إضافة Forgot Password** functionality
5. **تحسين error handling** وعرض رسائل أكثر وضوحاً
6. **إضافة Profile Page** لعرض وتعديل بيانات المستخدم

---

## 💡 نصائح

1. **احتفظ بـ terminal السيرفر مفتوح** طول ما أنت شغال
2. **استخدم MongoDB Atlas web interface** لمتابعة البيانات
3. **اختبر من Flutter مباشرة** بدل test scripts
4. **اقرأ API_TESTING.md** لمزيد من التفاصيل عن الـ endpoints

---

## ✅ المطلوب منك دلوقتي:

1. **افتح PowerShell جديد** وشغل السيرفر:
   ```powershell
   cd "c:\Al Noran\Al-Noran-System-Development\Web\backend"
   npm start
   ```

2. **في VS Code terminal تاني** (أو في Android Studio):
   ```powershell
   cd "c:\Al Noran\Al-Noran-System-Development\Mobile Application"
   flutter run
   ```

3. **جرب تسجل حساب جديد** أو **سجل دخول** بحساب موجود

4. **لو عندك أي مشكلة**, قولي وأنا هساعدك!

---

**✨ كل حاجة جاهزة دلوقتي! جرب وقولي النتيجة 🚀**
