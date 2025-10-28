# تحديثات نظام التسجيل ورفع المستندات

## التحديثات المنفذة:

### 1. ✅ دعم رفع ملفات PDF بجانب الصور
**المشكلة السابقة:** كان النظام يدعم الصور فقط (image_picker)
**الحل:**
- إضافة package: `file_picker: ^6.1.1`
- إنشاء FilePickerHelper في `lib/util/file_picker_helper.dart`
- يدعم الآن: كاميرا، اختيار صور، اختيار PDF

**طريقة الاستخدام:**
```dart
import '../../util/file_picker_helper.dart';

// رفع ملف واحد (صورة أو PDF)
final File? file = await FilePickerHelper.pickFile(context);

// رفع عدة ملفات
final List<File> files = await FilePickerHelper.pickMultipleFiles(context);

// التحقق من نوع الملف
bool isPDF = FilePickerHelper.isPDF(file);
bool isImage = FilePickerHelper.isImage(file);
```

---

### 2. ✅ التحقق من توفر اسم المستخدم والإيميل قبل التسجيل
**المشكلة السابقة:** كان الـ validation يحصل بعد رفع المستندات
**الحل:**

**Backend:**
- إضافة endpoint جديد: `POST /api/auth/check-availability`
- في `authController.js`: دالة `checkAvailability()`
- في `authRoutes.js`: route جديد

**Frontend:**
- في `api_service.dart`: دالة `checkAvailability()`

**طريقة الاستخدام في register_page.dart:**
```dart
// قبل الانتقال لصفحة رفع المستندات، نتحقق أولاً:
final checkResult = await ApiService.checkAvailability(
  username: _usernameController.text.trim(),
  email: _emailController.text.trim(),
);

if (!checkResult['success'] || !checkResult['available']) {
  String fieldName = checkResult['field'] == 'username' 
    ? 'اسم المستخدم' 
    : 'البريد الإلكتروني';
  
  AlNoranPopups.showError(
    context: context,
    message: '$fieldName مستخدم بالفعل',
  );
  return; // لا تكمل التسجيل
}

// لو البيانات متاحة، ننتقل لصفحة رفع المستندات
Navigator.push(context, MaterialPageRoute(...));
```

---

### 3. ✅ تحديث IP السيرفر للموبايل
**التغيير:**
- IP القديم: `192.168.1.12`
- IP الجديد: `192.168.1.8`

**الملفات المعدلة:**
- `api_service.dart` (Line 20)
- `server.js` (Line 68)

**السيرفر الآن يعمل على:**
- Local: `http://localhost:3500`
- Network: `http://192.168.1.8:3500`

---

## الملفات المحدثة:

### Backend:
1. `Web/backend/src/routes/authRoutes.js` - إضافة route للـ check-availability
2. `Web/backend/src/controllers/authController.js` - إضافة دالة checkAvailability
3. `Web/backend/src/server.js` - تحديث IP

### Frontend (Mobile):
1. `pubspec.yaml` - إضافة file_picker
2. `lib/util/file_picker_helper.dart` - **ملف جديد** للتعامل مع PDF والصور
3. `lib/core/network/api_service.dart` - إضافة checkAvailability() + تحديث IP
4. `lib/features/auth/commercialRegistration.dart` - استخدام FilePickerHelper

---

## خطوات التطبيق على باقي الصفحات:

### لتحديث personalRegistration.dart:
```dart
// 1. حذف import image_picker
// 2. إضافة import file_picker_helper
import '../../util/file_picker_helper.dart';

// 3. حذف السطر: final ImagePicker _picker = ImagePicker();

// 4. تبديل دالة _pickFile:
Future<void> _pickFile(String fileType) async {
  try {
    final File? pickedFile = await FilePickerHelper.pickFile(context);
    if (pickedFile != null) {
      setState(() {
        // تعيين الملف حسب النوع
      });
    }
  } catch (e) {
    AlNoranPopups.showError(
      context: context,
      message: 'حدث خطأ أثناء اختيار الملف',
    );
  }
}
```

### لتحديث factoryRegistration.dart:
نفس الخطوات بالضبط

---

## API Endpoints:

### تسجيل جديد:
```
POST /api/auth/signup
Body: {
  fullname, username, email, phone, password,
  type: 'client',
  clientType: 'personal' | 'commercial' | 'factory',
  ssn (للـ personal فقط)
}
Response: { success, message, token, user }
```

### التحقق من التوفر:
```
POST /api/auth/check-availability
Body: {
  username: string,
  email: string
}
Response: {
  success: true,
  available: boolean,
  field: 'username' | 'email', // لو available = false
  message: string
}
```

### رفع ملف لـ S3:
```
POST /api/uploads
Headers: { Authorization: 'Bearer TOKEN' }
Body: FormData {
  file: File,
  category: 'registration',
  documentType: string,
  userType: 'client',
  clientType: string
}
Response: {
  success: boolean,
  message: string,
  data: { s3Url, s3Key, ... }
}
```

---

## نصائح مهمة:

1. **لازم السيرفر يكون شغال:** 
   ```bash
   cd "Web/backend"
   node src/server.js
   ```

2. **تأكد إن الموبايل والـ Laptop على نفس الـ WiFi**

3. **لو IP الـ Laptop اتغير:**
   - حدث في `api_service.dart` (Platform.isAndroid)
   - حدث في `server.js` (console.log)

4. **للـ permissions (Android):**
   ```xml
   <uses-permission android:name="android.permission.CAMERA" />
   <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
   <uses-permission android:name="android.permission.INTERNET" />
   ```

---

## الخطوات التالية (للتنفيذ):

### ⏳ Pending - تحديث personalRegistration.dart
- [ ] استبدال image_picker بـ FilePickerHelper
- [ ] حذف ImagePicker instance
- [ ] تبسيط _pickFile method

### ⏳ Pending - تحديث factoryRegistration.dart
- [ ] نفس التحديثات

### ⏳ Pending - إضافة validation في register_page.dart
- [ ] استدعاء checkAvailability() قبل Navigator.push()
- [ ] عرض رسالة خطأ لو البيانات مستخدمة
- [ ] منع الانتقال لصفحة المستندات

### ⏳ Pending - اختبار Upload
- [ ] تسجيل حساب جديد
- [ ] رفع صور + PDF
- [ ] التحقق من وصول الملفات لـ S3
- [ ] التحقق من حفظ البيانات في MongoDB

---

## تشخيص الأخطاء:

### لو Upload مش شغال:
1. تحقق من السيرفر (لازم يكون شغال)
2. تحقق من الـ token (في SharedPreferences)
3. شوف الـ console logs
4. تحقق من AWS credentials في `.env`

### لو PDF مش بيظهر:
1. تأكد إن `file_picker` مثبت: `flutter pub get`
2. تأكد إن الـ import صحيح
3. اعمل hot restart (مش hot reload)

---

تم التحديث: ${DateTime.now()}
