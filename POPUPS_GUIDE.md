# 🎨 دليل استخدام Pop-ups - تطبيق النوران

## 📁 الملفات المضافة:

```
lib/
├── theme/
│   └── colors.dart              # ألوان التطبيق
├── Pop-ups/
│   ├── al_noran_popups.dart     # نظام Pop-ups الكامل
│   └── popups_example_page.dart # أمثلة توضيحية
└── features/
    └── auth/
        └── login_page.dart      # تم تحديثه لاستخدام Pop-ups
```

---

## 🚀 طريقة الاستخدام

### 1️⃣ Import الملف في صفحتك:

```dart
import 'package:your_app/Pop-ups/al_noran_popups.dart';
```

---

## 📋 الأنواع المتاحة:

### ✅ **Success Popup** (نجاح)

```dart
AlNoranPopups.showSuccess(
  context: context,
  title: 'تم بنجاح!',
  message: 'تمت العملية بنجاح',
  buttonText: 'رائع',  // اختياري (default: "حسناً")
  onPressed: () {
    // كود يتنفذ بعد الضغط على الزر (اختياري)
    print('تم الضغط على الزر');
  },
);
```

**متى تستخدمه:**
- ✅ بعد تسجيل دخول ناجح
- ✅ بعد حفظ البيانات
- ✅ بعد إتمام عملية شراء
- ✅ بعد إرسال رسالة

---

### ❌ **Error Popup** (خطأ)

```dart
AlNoranPopups.showError(
  context: context,
  title: 'خطأ!',  // اختياري (default: "خطأ!")
  message: 'حدث خطأ أثناء معالجة طلبك',
  buttonText: 'حسناً',  // اختياري
);
```

**متى تستخدمه:**
- ❌ عند فشل تسجيل الدخول
- ❌ عند حدوث خطأ في الاتصال بالسيرفر
- ❌ عند فشل عملية الدفع
- ❌ عند رفض الصلاحيات

---

### ⚠️ **Warning Popup** (تحذير)

```dart
AlNoranPopups.showWarning(
  context: context,
  title: 'تحذير!',
  message: 'هذا الإجراء قد يؤثر على بياناتك',
);
```

**متى تستخدمه:**
- ⚠️ قبل حذف بيانات مهمة
- ⚠️ عند تغيير إعدادات حساسة
- ⚠️ عند اقتراب حد معين (مساحة، وقت، إلخ)

---

### ℹ️ **Info Popup** (معلومة)

```dart
AlNoranPopups.showInfo(
  context: context,
  title: 'معلومة',
  message: 'يمكنك استخدام هذه الميزة للحصول على نتائج أفضل',
);
```

**متى تستخدمه:**
- ℹ️ لعرض نصائح للمستخدم
- ℹ️ لشرح ميزة جديدة
- ℹ️ لإظهار معلومات إضافية

---

### ❓ **Confirmation Popup** (تأكيد)

```dart
final confirmed = await AlNoranPopups.showConfirmation(
  context: context,
  title: 'تأكيد',
  message: 'هل أنت متأكد من رغبتك في المتابعة؟',
  confirmText: 'نعم',       // اختياري (default: "نعم")
  cancelText: 'لا',         // اختياري (default: "لا")
);

if (confirmed) {
  // المستخدم ضغط "نعم"
  print('تم التأكيد');
} else {
  // المستخدم ضغط "لا"
  print('تم الإلغاء');
}
```

**متى تستخدمه:**
- ❓ قبل حذف عنصر
- ❓ قبل تسجيل الخروج
- ❓ قبل إلغاء طلب
- ❓ قبل استعادة إعدادات افتراضية

---

### ⏳ **Loading Dialog** (شاشة تحميل)

```dart
// عرض شاشة التحميل
AlNoranPopups.showLoading(
  context: context,
  message: 'جاري التحميل...',  // اختياري (default: "جاري التحميل...")
);

// القيام بالعملية (API call مثلاً)
await ApiService.getData();

// إخفاء شاشة التحميل
AlNoranPopups.hideLoading(context);
```

**متى تستخدمه:**
- ⏳ أثناء تسجيل الدخول
- ⏳ أثناء تحميل البيانات من السيرفر
- ⏳ أثناء معالجة الدفع
- ⏳ أثناء رفع الملفات

---

### 💬 **SnackBar** (رسالة سريعة)

```dart
AlNoranPopups.showSnackBar(
  context: context,
  message: 'تمت الإضافة إلى المفضلة',
  type: PopupType.success,  // success, error, warning, info
  duration: Duration(seconds: 3),  // اختياري (default: 3 ثواني)
);
```

**متى تستخدمه:**
- 💬 لعرض رسائل سريعة غير حرجة
- 💬 لتأكيد إجراء بسيط (مثل: تمت الإضافة، تم النسخ)
- 💬 لعرض إشعارات خفيفة

**الأنواع:**
```dart
PopupType.success  // ✅ أخضر
PopupType.error    // ❌ أحمر
PopupType.warning  // ⚠️ أصفر
PopupType.info     // ℹ️ أزرق
```

---

## 🎯 أمثلة عملية كاملة:

### مثال 1: تسجيل الدخول

```dart
Future<void> _handleLogin() async {
  // التحقق من المدخلات
  if (_emailController.text.isEmpty) {
    AlNoranPopups.showError(
      context: context,
      message: 'من فضلك أدخل البريد الإلكتروني',
    );
    return;
  }

  // عرض شاشة التحميل
  AlNoranPopups.showLoading(
    context: context,
    message: 'جاري تسجيل الدخول...',
  );

  try {
    // استدعاء الـ API
    final result = await ApiService.login(
      email: _emailController.text,
      password: _passwordController.text,
    );

    // إخفاء التحميل
    AlNoranPopups.hideLoading(context);

    if (result['success']) {
      // نجح تسجيل الدخول
      await AlNoranPopups.showSuccess(
        context: context,
        title: 'مرحباً بك!',
        message: 'تم تسجيل الدخول بنجاح',
        buttonText: 'المتابعة',
        onPressed: () {
          // الانتقال للصفحة الرئيسية
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (context) => HomePage()),
          );
        },
      );
    } else {
      // فشل تسجيل الدخول
      AlNoranPopups.showError(
        context: context,
        message: result['message'] ?? 'فشل تسجيل الدخول',
      );
    }
  } catch (e) {
    // إخفاء التحميل
    AlNoranPopups.hideLoading(context);
    
    // عرض خطأ
    AlNoranPopups.showError(
      context: context,
      title: 'خطأ في الاتصال',
      message: 'تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى',
    );
  }
}
```

---

### مثال 2: حذف عنصر

```dart
Future<void> _deleteItem(String itemId) async {
  // طلب التأكيد
  final confirmed = await AlNoranPopups.showConfirmation(
    context: context,
    title: 'تأكيد الحذف',
    message: 'هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء',
    confirmText: 'حذف',
    cancelText: 'إلغاء',
  );

  if (!confirmed) return;

  // عرض التحميل
  AlNoranPopups.showLoading(
    context: context,
    message: 'جاري الحذف...',
  );

  try {
    // استدعاء API
    await ApiService.deleteItem(itemId);

    // إخفاء التحميل
    AlNoranPopups.hideLoading(context);

    // عرض رسالة نجاح سريعة
    AlNoranPopups.showSnackBar(
      context: context,
      message: 'تم الحذف بنجاح',
      type: PopupType.success,
    );

    // تحديث القائمة
    _refreshList();
  } catch (e) {
    AlNoranPopups.hideLoading(context);
    
    AlNoranPopups.showError(
      context: context,
      message: 'فشل حذف العنصر. يرجى المحاولة مرة أخرى',
    );
  }
}
```

---

### مثال 3: حفظ البيانات

```dart
Future<void> _saveProfile() async {
  // عرض التحميل
  AlNoranPopups.showLoading(
    context: context,
    message: 'جاري حفظ البيانات...',
  );

  try {
    await ApiService.updateProfile(userData);
    
    AlNoranPopups.hideLoading(context);
    
    // استخدام SnackBar للرسالة السريعة
    AlNoranPopups.showSnackBar(
      context: context,
      message: 'تم حفظ التغييرات بنجاح',
      type: PopupType.success,
    );
  } catch (e) {
    AlNoranPopups.hideLoading(context);
    
    AlNoranPopups.showError(
      context: context,
      message: 'فشل حفظ البيانات',
    );
  }
}
```

---

### مثال 4: تسجيل الخروج

```dart
Future<void> _logout() async {
  final confirmed = await AlNoranPopups.showConfirmation(
    context: context,
    title: 'تسجيل الخروج',
    message: 'هل تريد تسجيل الخروج من حسابك؟',
    confirmText: 'نعم، تسجيل الخروج',
    cancelText: 'إلغاء',
  );

  if (confirmed) {
    await ApiService.removeToken();
    
    AlNoranPopups.showSnackBar(
      context: context,
      message: 'تم تسجيل الخروج بنجاح',
      type: PopupType.info,
    );
    
    // الانتقال لصفحة Login
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (context) => LoginPage()),
    );
  }
}
```

---

## 🎨 التخصيص:

### تغيير الألوان:

افتح ملف `lib/theme/colors.dart` وعدل الألوان:

```dart
class AlNoranColors {
  static const Color primary = Color(0xFF690000);     // لونك الأساسي
  static const Color success = Color(0xFF28a745);     // لون النجاح
  static const Color error = Color(0xFFdc3545);       // لون الخطأ
  static const Color warning = Color(0xFFffc107);     // لون التحذير
  static const Color info = Color(0xFF17a2b8);        // لون المعلومات
}
```

---

## 🧪 صفحة التجربة:

لرؤية كل الـ Pop-ups في صفحة واحدة:

```dart
import 'package:your_app/Pop-ups/popups_example_page.dart';

// في أي مكان في التطبيق:
Navigator.push(
  context,
  MaterialPageRoute(builder: (context) => PopupsExamplePage()),
);
```

---

## ✅ نصائح مهمة:

### 1. استخدم Loading Dialog دائماً مع API calls:
```dart
// ✅ صح
AlNoranPopups.showLoading(context: context);
await ApiService.call();
AlNoranPopups.hideLoading(context);

// ❌ غلط - مش هتعرف متى ينتهي
await ApiService.call();
```

### 2. استخدم SnackBar للرسائل البسيطة:
```dart
// ✅ للرسائل البسيطة
AlNoranPopups.showSnackBar(
  context: context,
  message: 'تمت الإضافة',
  type: PopupType.success,
);

// ❌ Dialog كبير جداً لرسالة بسيطة
AlNoranPopups.showSuccess(
  context: context,
  title: 'نجح',
  message: 'تمت الإضافة',
);
```

### 3. استخدم Confirmation قبل الإجراءات الخطيرة:
```dart
// ✅ صح - طلب تأكيد
final confirmed = await AlNoranPopups.showConfirmation(...);
if (confirmed) {
  await deleteAccount();
}

// ❌ غلط - حذف مباشر بدون تأكيد
await deleteAccount();
```

### 4. تأكد من mounted قبل عرض Pop-up:
```dart
// ✅ صح
if (mounted) {
  AlNoranPopups.showError(context: context, ...);
}

// ❌ قد يسبب مشاكل لو الـ widget اتحذف
AlNoranPopups.showError(context: context, ...);
```

---

## 📱 متى تستخدم Dialog ومتى SnackBar؟

### استخدم **Dialog** عندما:
- ✅ الرسالة مهمة ويجب قراءتها
- ✅ تحتاج تأكيد من المستخدم
- ✅ الإجراء حرج (حذف، تسجيل خروج، إلخ)

### استخدم **SnackBar** عندما:
- ✅ الرسالة معلوماتية بسيطة
- ✅ تأكيد إجراء بسيط (تمت الإضافة، تم النسخ)
- ✅ لا تريد مقاطعة المستخدم

---

## 🎯 الخلاصة:

```dart
// 1. Success
AlNoranPopups.showSuccess(context: context, message: '...');

// 2. Error
AlNoranPopups.showError(context: context, message: '...');

// 3. Warning
AlNoranPopups.showWarning(context: context, message: '...');

// 4. Info
AlNoranPopups.showInfo(context: context, message: '...');

// 5. Confirmation
final result = await AlNoranPopups.showConfirmation(context: context, ...);

// 6. Loading
AlNoranPopups.showLoading(context: context);
AlNoranPopups.hideLoading(context);

// 7. SnackBar
AlNoranPopups.showSnackBar(context: context, message: '...', type: PopupType.success);
```

---

**استمتع باستخدام Pop-ups جميلة ومتناسقة في تطبيقك! 🎨✨**
