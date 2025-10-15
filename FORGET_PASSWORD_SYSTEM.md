# 🔐 نظام Forget Password مع OTP

## 📋 نظرة عامة

تم تنفيذ نظام كامل لاستعادة كلمة المرور باستخدام OTP (One-Time Password) عبر البريد الإلكتروني.

---

## 🎯 السيناريو الكامل

### 1️⃣ **Forget Password Page**
- المستخدم يدخل البريد الإلكتروني
- التحقق من وجود البريد في قاعدة البيانات
- ✅ **إذا موجود**: إرسال OTP عبر البريد
- ❌ **إذا غير موجود**: رسالة "البريد الإلكتروني غير مسجل لدينا"

### 2️⃣ **OTP Page**
- المستخدم يدخل رمز التحقق (6 أرقام)
- **المدة**: 5 دقائق فقط
- **المحاولات**: 5 محاولات كحد أقصى
- **إعادة الإرسال**: 3 مرات كحد أقصى
- **عداد وقت**: يعرض الوقت المتبقي بشكل حي
- ✅ **إذا صحيح**: الانتقال لصفحة إعادة تعيين كلمة المرور
- ❌ **إذا خطأ**: عرض المحاولات المتبقية
- ⏰ **إذا انتهى الوقت**: إلغاء العملية

### 3️⃣ **Reset Password Page**
- المستخدم يدخل كلمة المرور الجديدة
- تأكيد كلمة المرور
- ✅ **إذا نجح**: العودة لصفحة Login
- ❌ **إذا فشل**: عرض رسالة خطأ

---

## 🛠️ التنفيذ التقني

### 📧 **Email Configuration**
```
البريد: noransmartai@gmail.com
App Password: fxhm embd lhtm yeva
```

### 🗄️ **Backend Files**

#### 1. **Model: OTP Schema**
📁 `Web/backend/src/models/otp.js`
```javascript
- email: String (required)
- otp: String (required, 6 digits)
- attempts: Number (max 5)
- resendAttempts: Number (max 3)
- createdAt: Date (expires after 300 seconds = 5 minutes)
```

#### 2. **Service: Email Service**
📁 `Web/backend/src/services/emailService.js`
- إرسال OTP عبر Gmail
- تصميم HTML أنيق باللغة العربية
- يحتوي على:
  - رمز التحقق بخط كبير وواضح
  - تنبيه بالمدة (5 دقائق)
  - تنبيه بعدد المحاولات (5)
  - تنبيه بعدد مرات إعادة الإرسال (3)

#### 3. **Controller: Password Reset**
📁 `Web/backend/src/controllers/passwordResetController.js`

**الوظائف:**
- `forgotPassword`: إرسال OTP
- `resendOTP`: إعادة إرسال OTP
- `verifyOTP`: التحقق من OTP
- `resetPassword`: إعادة تعيين كلمة المرور

#### 4. **Routes: Password Reset**
📁 `Web/backend/src/routes/passwordResetRoutes.js`

**Endpoints:**
```
POST /api/auth/forgot-password  - إرسال OTP
POST /api/auth/resend-otp       - إعادة إرسال OTP
POST /api/auth/verify-otp       - التحقق من OTP
POST /api/auth/reset-password   - إعادة تعيين كلمة المرور
```

---

### 📱 **Flutter Pages**

#### 1. **Forget Password Page**
📁 `Mobile Application/lib/features/auth/forget_password_page.dart`
- حقل إدخال البريد الإلكتروني
- Validation للبريد
- زر إرسال OTP
- Info Box مع التنبيهات

#### 2. **OTP Page**
📁 `Mobile Application/lib/features/auth/otp_page.dart`
- 6 حقول منفصلة للأرقام
- Timer بعداد تنازلي (5 دقائق)
- زر التحقق
- زر إعادة الإرسال (مع عداد المحاولات)
- Info Box مع الملاحظات

**المميزات:**
- Auto-focus على الحقل التالي
- تغيير لون Timer عند الثواني الأخيرة
- تعطيل زر إعادة الإرسال بعد 3 مرات

#### 3. **Reset Password Page**
📁 `Mobile Application/lib/features/auth/reset_password_page.dart`
- حقل كلمة المرور الجديدة
- حقل تأكيد كلمة المرور
- Show/Hide Password
- متطلبات كلمة المرور
- زر حفظ

---

### 🔌 **API Service Updates**
📁 `Mobile Application/lib/core/network/api_service.dart`

**وظائف جديدة:**
```dart
forgotPassword(email)      // إرسال OTP
resendOTP(email)           // إعادة إرسال OTP
verifyOTP(email, otp)      // التحقق من OTP
resetPassword(email, password, confirmPassword)  // تغيير كلمة المرور
```

---

## 🎨 **التصميم والـ UX**

### **الألوان:**
- Primary: `#690000` (النوران الأحمر)
- Success: `#28a745`
- Error: `#dc3545`
- Warning: `#ffc107`
- Info: `#17a2b8`

### **الـ Pop-ups:**
- ✅ Success عند نجاح العملية
- ❌ Error عند فشل العملية
- ⚠️ Warning للتنبيهات
- ℹ️ Info للمعلومات
- 📧 SnackBar للرسائل السريعة

---

## 🔒 **الأمان والـ Validation**

### **Backend:**
1. ✅ التحقق من وجود البريد في قاعدة البيانات
2. ✅ OTP عشوائي (6 أرقام)
3. ✅ انتهاء صلاحية تلقائي بعد 5 دقائق
4. ✅ حد أقصى 5 محاولات خاطئة
5. ✅ حد أقصى 3 مرات إعادة إرسال
6. ✅ حذف OTP بعد التحقق الناجح
7. ✅ تشفير كلمة المرور الجديدة (bcrypt)

### **Frontend:**
1. ✅ Email validation (regex)
2. ✅ Password validation (6 أحرف على الأقل)
3. ✅ Password confirmation matching
4. ✅ OTP format validation (6 أرقام)
5. ✅ Timer للوقت المتبقي
6. ✅ عداد المحاولات والإعادات

---

## 📧 **Email Template**

البريد الإلكتروني يحتوي على:
- 🚚 شعار النوران
- 🎨 تصميم احترافي بالعربي (RTL)
- 🔢 رمز OTP بخط كبير وواضح
- ⏰ تنبيه بالمدة (5 دقائق)
- 📝 تنبيه بعدد المحاولات (5)
- 🔄 تنبيه بعدد مرات إعادة الإرسال (3)
- ⚠️ تحذير أمني (إذا لم تطلب، تجاهل البريد)

---

## 🧪 **كيفية التجربة**

### 1. **تشغيل Backend:**
```bash
cd "c:\Al Noran\Al-Noran-System-Development\Web\backend"
npm run dev
```

### 2. **تشغيل Flutter:**
```bash
cd "c:\Al Noran\Al-Noran-System-Development\Mobile Application"
flutter run
```

### 3. **السيناريو:**
1. افتح التطبيق
2. في صفحة Login، اضغط "نسيت كلمة المرور؟"
3. أدخل البريد الإلكتروني (مثال: omar@alnoran.com)
4. اضغط "إرسال رمز التحقق"
5. تحقق من بريدك الإلكتروني
6. أدخل الـ OTP (6 أرقام)
7. أدخل كلمة المرور الجديدة
8. تم! يمكنك الآن تسجيل الدخول

---

## 🎯 **الميزات الإضافية**

### ✨ **تفاصيل دقيقة:**
1. 📱 **Auto-focus**: الانتقال التلقائي بين حقول OTP
2. ⏲️ **Live Timer**: عداد وقت حي يتغير كل ثانية
3. 🔴 **Color Change**: تغيير لون Timer للأحمر عند آخر دقيقة
4. 🔄 **Smart Resend**: تعطيل زر إعادة الإرسال بعد 3 مرات
5. 📊 **Attempt Counter**: عرض المحاولات المتبقية
6. 🚫 **No Back**: منع الرجوع من صفحة Reset Password
7. 📧 **RTL Email**: تصميم البريد بالعربي من اليمين لليسار

---

## 📝 **رسائل الأخطاء (بالعربي)**

### Backend:
- ✅ "من فضلك أدخل البريد الإلكتروني"
- ✅ "البريد الإلكتروني غير مسجل لدينا"
- ✅ "تم إرسال رمز التحقق إلى بريدك الإلكتروني"
- ✅ "رمز التحقق منتهي الصلاحية أو غير موجود"
- ✅ "رمز التحقق غير صحيح. المحاولات المتبقية: X"
- ✅ "تم تجاوز الحد الأقصى للمحاولات (5 محاولات)"
- ✅ "تم تجاوز الحد الأقصى لإعادة الإرسال (3 مرات)"
- ✅ "تم تغيير كلمة المرور بنجاح"

### Frontend:
- ✅ "من فضلك أدخل البريد الإلكتروني"
- ✅ "البريد الإلكتروني غير صحيح"
- ✅ "من فضلك أدخل رمز التحقق كاملاً (6 أرقام)"
- ✅ "كلمة المرور يجب أن تكون 6 أحرف على الأقل"
- ✅ "كلمة المرور غير متطابقة"

---

## ✅ **الملفات المُنشأة/المُعدّلة**

### Backend:
- ✅ `src/models/otp.js` (جديد)
- ✅ `src/services/emailService.js` (جديد)
- ✅ `src/controllers/passwordResetController.js` (جديد)
- ✅ `src/routes/passwordResetRoutes.js` (جديد)
- ✅ `src/server.js` (تحديث - إضافة routes)

### Flutter:
- ✅ `lib/features/auth/forget_password_page.dart` (جديد)
- ✅ `lib/features/auth/otp_page.dart` (جديد)
- ✅ `lib/features/auth/reset_password_page.dart` (جديد)
- ✅ `lib/core/network/api_service.dart` (تحديث - إضافة 4 وظائف)
- ✅ `lib/features/auth/login_page.dart` (تحديث - ربط بـ Forget Password)

---

## 🚀 **جاهز للاستخدام!**

النظام كامل ومتكامل مع:
- ✅ Email مُرسل عبر Gmail
- ✅ OTP صالح لمدة 5 دقائق
- ✅ 5 محاولات كحد أقصى
- ✅ 3 مرات إعادة إرسال كحد أقصى
- ✅ تصميم أنيق ومتجاوب
- ✅ رسائل بالعربي
- ✅ Pop-ups مخصصة
- ✅ Validation شامل

**كل التفاصيل اللي طلبتها موجودة ومُنفذة! 🎉**
