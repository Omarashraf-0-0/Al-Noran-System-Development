# تحديث نظام التنقل - GoRouter

## ✅ التغييرات المنفذة

تم تحديث نظام التنقل في التطبيق بالكامل من `Navigator` التقليدي إلى `GoRouter` لحل مشاكل:
- الـ Lag أثناء التنقل
- فقدان البيانات (Data Loss)
- إدارة أفضل للـ State
- Performance محسّن

## 📦 الملفات المُحدثة

### 1. pubspec.yaml
- تمت إضافة: `go_router: ^14.6.2`

### 2. lib/config/app_router.dart (جديد)
ملف إعداد جميع الـ Routes:
- `/` - Splash Screen
- `/login` - تسجيل الدخول
- `/register` - التسجيل
- `/forgot-password` - نسيت كلمة المرور
- `/otp-verification` - التحقق من OTP
- `/reset-password` - إعادة تعيين كلمة المرور
- `/home` - الصفحة الرئيسية
- `/shipments` - الشحنات
- `/shipment-details/:shipmentId` - تفاصيل الشحنة
- `/chat/:shipmentId` - المحادثة
- `/acid-request` - طلب ACID
- `/profile` - الملف الشخصي
- `/profile-settings` - إعدادات الحساب
- `/settings` - القائمة

### 3. lib/main.dart
- تغيير من `MaterialApp` إلى `MaterialApp.router`
- استخدام `routerConfig: AppRouter.router`

### 4. الصفحات المُحدثة
- ✅ HomePage
- ✅ MyShipmentsPage
- ✅ SplashScreen
- ✅ LoginPage

## 🔧 كيفية استخدام GoRouter

### التنقل العادي (Push)
```dart
// القديم
Navigator.pushNamed(context, '/profile');

// الجديد
context.push('/profile');
```

### التنقل مع إرسال بيانات
```dart
// القديم
Navigator.pushNamed(
  context,
  '/home',
  arguments: {'userName': 'أحمد', 'userEmail': 'ahmed@example.com'},
);

// الجديد
context.push(
  '/home',
  extra: {'userName': 'أحمد', 'userEmail': 'ahmed@example.com'},
);
```

### استبدال الصفحة الحالية (Go/Replace)
```dart
// القديم
Navigator.pushReplacement(context, ...);

// الجديد
context.go('/home');
```

### الرجوع للخلف
```dart
// القديم
Navigator.pop(context);

// الجديد
context.pop();
```

### تمرير Parameters في URL
```dart
// تعريف في app_router.dart
GoRoute(
  path: '/shipment-details/:shipmentId',
  builder: (context, state) {
    final shipmentId = state.pathParameters['shipmentId'];
    return ShipmentDetailsPage(shipmentId: shipmentId);
  },
)

// الاستخدام
context.push('/shipment-details/SEA12345');
```

## 🚀 المميزات الجديدة

1. **Type-Safe Navigation**: لا مزيد من الأخطاء في أسماء الـ Routes
2. **Better Performance**: تحميل أسرع وأقل استهلاك للذاكرة
3. **Deep Linking Support**: دعم الروابط المباشرة
4. **URL-based Navigation**: سهولة في إدارة المسارات
5. **Error Handling**: صفحة خطأ مخصصة للـ Routes غير الموجودة

## 📝 ملاحظات مهمة

- ✅ جميع صفحات التنقل الرئيسية تم تحديثها
- ⚠️ إذا أضفت صفحة جديدة، أضفها في `app_router.dart`
- 🔄 استخدم `context.push()` للتنقل و `context.pop()` للرجوع
- 📦 استخدم `extra` لإرسال البيانات بين الصفحات

## 🐛 حل المشاكل

### مشكلة: "Cannot find context"
الحل: تأكد من استخدام `context` من داخل widget tree

### مشكلة: البيانات لا تصل للصفحة التالية
الحل: استخدم `extra` في `context.push()` وقراءتها من `state.extra`

### مشكلة: الرجوع لا يعمل
الحل: استخدم `context.pop()` بدلاً من `Navigator.pop()`

## ✅ الخطوات التالية

الآن يمكنك:
1. تشغيل التطبيق: `flutter run`
2. اختبار التنقل بين الصفحات
3. التأكد من عدم وجود lag أو فقدان للبيانات

---

**تم التحديث:** ديسمبر 2025  
**المطور:** Al Noran Development Team
