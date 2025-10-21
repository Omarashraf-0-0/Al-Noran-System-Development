# 🔄 نظام التحميل (Loading) المخصص - Al Noran

## 📁 الملفات المحدثة

### 1. `lib/Pop-ups/al_noran_popups.dart`
تم تحسين دالة `showLoading()` لتكون أكثر جمالاً واحترافية

### 2. `lib/core/widgets/al_noran_loading.dart` ✨ جديد
Widget مخصص للـ Loading يمكن استخدامه في أي مكان

### 3. `lib/features/auth/login_page.dart`
تم تحديث زر تسجيل الدخول ليستخدم الـ Loading الجديد

---

## 🎨 أنواع Loading المتاحة

### 1️⃣ **Loading Dialog** (شاشة تحميل كاملة)

#### الاستخدام:
```dart
// عرض
AlNoranPopups.showLoading(
  context: context,
  message: 'جاري تسجيل الدخول...',
);

// إخفاء
AlNoranPopups.hideLoading(context);
```

#### المميزات:
- ✅ أيقونة شاحنة في المنتصف
- ✅ دائرة تحميل خارجية
- ✅ Background للأيقونة
- ✅ رسالة مخصصة
- ✅ نص "الرجاء الانتظار..."
- ✅ Shadow ناعم
- ✅ Rounded Corners

#### المظهر:
```
┌────────────────────────┐
│                        │
│     ╔═══════╗         │
│     ║   🚚  ║         │  ← دائرة تحميل
│     ╚═══════╝         │
│                        │
│  جاري تسجيل الدخول... │  ← رسالة مخصصة
│   الرجاء الانتظار...  │  ← نص ثابت
│                        │
└────────────────────────┘
```

---

### 2️⃣ **AlNoranLoading** (Widget قابل لإعادة الاستخدام)

#### الاستخدام:
```dart
// بسيط
AlNoranLoading()

// مع رسالة
AlNoranLoading(
  message: 'جاري التحميل...',
)

// مع حجم مخصص
AlNoranLoading(
  size: 60,
  message: 'جاري التحميل...',
)

// مع لون مخصص
AlNoranLoading(
  color: Color(0xFF1ba3b6),
  message: 'جاري التحميل...',
)
```

#### المميزات:
- ✅ حجم قابل للتعديل
- ✅ لون قابل للتعديل
- ✅ رسالة اختيارية
- ✅ يمكن استخدامه في أي مكان

---

### 3️⃣ **AlNoranLoadingOverlay** (غطاء شاشة)

#### الاستخدام:
```dart
Stack(
  children: [
    // محتوى الصفحة
    YourPageContent(),
    
    // Loading Overlay
    if (_isLoading)
      AlNoranLoadingOverlay(
        message: 'جاري التحميل...',
      ),
  ],
)
```

#### المميزات:
- ✅ يغطي الشاشة كاملة
- ✅ Background شفاف داكن
- ✅ Box أبيض في المنتصف
- ✅ Shadow جميل

---

### 4️⃣ **AlNoranButtonLoading** (للأزرار)

#### الاستخدام:
```dart
ElevatedButton(
  onPressed: _isLoading ? null : _handleSubmit,
  child: _isLoading 
    ? const AlNoranButtonLoading()
    : const Text('تسجيل الدخول'),
)

// مع لون مخصص
AlNoranButtonLoading(
  color: Colors.white,
  size: 20,
)
```

#### المميزات:
- ✅ صغير الحجم (مناسب للأزرار)
- ✅ لون قابل للتعديل
- ✅ حجم قابل للتعديل
- ✅ خفيف وسريع

---

## 🎯 أمثلة استخدام عملية

### مثال 1: صفحة تسجيل الدخول
```dart
// في الزر
ElevatedButton(
  onPressed: _isLoading ? null : _handleLogin,
  child: _isLoading 
    ? const AlNoranButtonLoading()
    : const Text('تسجيل الدخول'),
)

// عند الاستدعاء API
void _handleLogin() async {
  // عرض Loading Dialog
  AlNoranPopups.showLoading(
    context: context,
    message: 'جاري تسجيل الدخول...',
  );
  
  try {
    final result = await ApiService.login(...);
    
    // إخفاء Loading
    AlNoranPopups.hideLoading(context);
    
    if (result['success']) {
      // النجاح
    }
  } catch (e) {
    AlNoranPopups.hideLoading(context);
    // معالجة الخطأ
  }
}
```

---

### مثال 2: صفحة مع بيانات
```dart
class MyPage extends StatefulWidget {
  @override
  _MyPageState createState() => _MyPageState();
}

class _MyPageState extends State<MyPage> {
  bool _isLoading = true;
  List<dynamic> _data = [];
  
  @override
  void initState() {
    super.initState();
    _loadData();
  }
  
  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    
    // جلب البيانات
    _data = await ApiService.getData();
    
    setState(() => _isLoading = false);
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _isLoading
        ? const AlNoranLoading(
            message: 'جاري تحميل البيانات...',
          )
        : ListView.builder(
            itemCount: _data.length,
            itemBuilder: (context, index) {
              return ListTile(title: Text(_data[index]));
            },
          ),
    );
  }
}
```

---

### مثال 3: Pull to Refresh
```dart
RefreshIndicator(
  color: AlNoranColors.primary,
  onRefresh: _refreshData,
  child: ListView(...),
)

Future<void> _refreshData() async {
  // جلب البيانات الجديدة
  await ApiService.getData();
}
```

---

## 🎨 التصميم

### الألوان المستخدمة:
- **Primary**: `#690000` (Burgundy) - للدوائر الرئيسية
- **Background**: `#690000` مع opacity 0.1 - للخلفيات
- **Grey**: `#757575` - للنص الثانوي
- **White**: `#FFFFFF` - للخلفيات

### الأحجام:
- **Dialog Loading**: 70x70 px
- **Default Widget**: 50x50 px
- **Button Loading**: 20x20 px

### الأيقونة:
- `Icons.local_shipping_rounded` 🚚
- يمكن تغييرها حسب الحاجة

---

## ✅ التحسينات المنفذة

### قبل ❌
- `CircularProgressIndicator` عادي
- ألوان افتراضية
- بدون أيقونة
- تصميم بسيط

### بعد ✅
- تصميم مخصص
- أيقونة شاحنة في المنتصف
- دائرة تحميل ملونة
- Background للأيقونة
- Shadow ناعم
- Rounded Corners
- رسائل مخصصة
- متناسق مع الثيم

---

## 🔧 ملاحظات تقنية

### Performance:
- ✅ استخدام `const` حيثما أمكن
- ✅ Widget خفيفة الوزن
- ✅ بدون animations معقدة (اختياري)

### Accessibility:
- ✅ `WillPopScope` لمنع الإغلاق
- ✅ `barrierDismissible: false`
- ✅ نصوص واضحة

### Customization:
- ✅ ألوان قابلة للتخصيص
- ✅ أحجام قابلة للتخصيص
- ✅ رسائل قابلة للتخصيص

---

## 🚀 الخطوات التالية (اختياري)

### تحسينات مستقبلية:
1. ⏳ إضافة Animation للأيقونة (rotation/pulse)
2. ⏳ إضافة Progress Indicator مع نسبة مئوية
3. ⏳ إضافة أنواع مختلفة من Loading (dots, bars, etc.)
4. ⏳ إضافة Shimmer Effect للـ Skeletons

---

## 📝 ملخص

### الملفات المنشأة:
1. ✅ `lib/core/widgets/al_noran_loading.dart` - Widget مخصص

### الملفات المحدثة:
1. ✅ `lib/Pop-ups/al_noran_popups.dart` - تحسين showLoading()
2. ✅ `lib/features/auth/login_page.dart` - استخدام Loading الجديد

### النتيجة:
🎉 **نظام Loading متكامل وموحد لكل التطبيق!**

---

**✨ الآن كل شاشات التحميل في التطبيق ستكون متناسقة مع الثيم!**
