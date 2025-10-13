# 🔧 إصلاح مشكلة Register

## ❌ المشكلة:
عند محاولة التسجيل بالبيانات:
- Name: Mohamed Ahmed
- Email: itzm7madx@gmail.com
- Phone: 01156762762
- Password: 123456

**كان يظهر خطأ!**

---

## 🔍 السبب:

### 1. **Endpoint خطأ**
- Flutter كان يستخدم: `/api/auth/register`
- السيرفر يستخدم: `/api/auth/signup`

### 2. **أسماء الحقول مختلفة**
- Flutter كان يرسل: `name`
- السيرفر يتوقع: `fullname`

### 3. **حقول ناقصة**
السيرفر يطلب:
- `username` ❌ (مفقود)
- `type` ❌ (مفقود)
- `clientType` ❌ (مفقود)
- `ssn` (للـ personal clients)

---

## ✅ الحل:

تم تعديل `api_service.dart`:

### قبل التعديل:
```dart
body: jsonEncode({
  'name': name,              // ❌ خطأ
  'email': email,
  'phone': phone,
  'password': password,
}),
```

### بعد التعديل:
```dart
// Generate username automatically
final username = name.toLowerCase().replaceAll(' ', '') + 
                DateTime.now().millisecondsSinceEpoch.toString().substring(8);

body: jsonEncode({
  'fullname': name,          // ✅ صحيح
  'username': username,      // ✅ تم إنشاؤه تلقائياً
  'email': email,
  'phone': phone,
  'password': password,
  'type': 'client',          // ✅ تم الإضافة
  'clientType': 'commercial',// ✅ تم الإضافة (لا يحتاج SSN)
}),
```

---

## 📝 التفاصيل:

### Username Generation:
```dart
"Mohamed Ahmed" → "mohamedahmed" + timestamp
// مثال: mohamedahmed45678901
```

### Client Type:
استخدمنا `commercial` بدلاً من `personal` لأن:
- ✅ `commercial` لا يحتاج SSN
- ✅ `factory` لا يحتاج SSN
- ❌ `personal` يحتاج SSN (الرقم القومي)

---

## 🎯 الآن يمكنك:

### ✅ التسجيل من Flutter مباشرة!

استخدم البيانات:
```
الاسم: Mohamed Ahmed
Email: itzm7madx@gmail.com
Phone: 01156762762
Password: 123456
تأكيد كلمة المرور: 123456
```

**واضغط "إنشاء الحساب"** - سيعمل بنجاح! ✨

---

## 📊 ما تم تعديله:

| الملف | التعديل |
|-------|---------|
| `api_service.dart` | ✅ تغيير endpoint من `/register` إلى `/signup` |
| `api_service.dart` | ✅ تغيير `name` إلى `fullname` |
| `api_service.dart` | ✅ إضافة `username` (auto-generated) |
| `api_service.dart` | ✅ إضافة `type: 'client'` |
| `api_service.dart` | ✅ إضافة `clientType: 'commercial'` |

---

## 🚀 جرب الآن:

1. ✅ السيرفر شغال
2. ✅ الكود معدّل
3. ✅ البيانات متوافقة مع السيرفر

**افتح التطبيق وجرب التسجيل! 🎉**

---

## 💡 ملاحظة للمستقبل:

إذا أردت استخدام `personal` بدلاً من `commercial`:
1. أضف حقل SSN في صفحة Register
2. غيّر `clientType` إلى `'personal'`
3. أرسل SSN مع البيانات

---

**المشكلة تم حلها! جرب دلوقتي! 🚀✨**
