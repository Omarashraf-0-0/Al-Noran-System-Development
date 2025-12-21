# دليل النوران - مرجع تصميم واجهة المستخدم وتجربة المستخدم الشامل
# Al-Noran UI/UX Reference Guide

## 📋 نظرة عامة على النظام | System Overview

### الاسم الرسمي | Official Name
**NoranSmart (نوران سمارت)**

### الهوية التجارية | Brand Identity
**شركة النوران للاستيراد والتصدير والتخليص الجمركي**
- نظام إدارة شحنات استيراد وتصدير بحرية وجوية وبرية
- تخليص جمركي كامل
- إصدار شهادات ACID & UCR
- متابعة حية للشحنات
- إدارة المدفوعات والفواتير

### طبيعة النظام | System Nature
- **المجال**: Logistics & Shipping - لوجستيات وشحن دولي
- **التخصص**: Customs Clearance - تخليص جمركي
- **النوع**: B2B (Business to Business) - عملاء شركات ومصانع وأفراد
- **الأنظمة المدعومة**: Android, iOS, Web, Desktop

---

## 🎨 البراندينج والهوية البصرية | Branding & Visual Identity

### 1. الألوان الأساسية | Primary Colors

#### اللون الرئيسي - Burgundy Red (الأحمر الغامق)
```dart
Primary: Color(0xFF690000)     // الأحمر الغامق - اللون الرئيسي للبراند
PrimaryLight: Color(0xFFa40000) // أحمر فاتح قليلاً
PrimaryDark: Color(0xFF4a0000)  // أحمر أغمق
Alternative: Color(0xFF8B0000)  // للتدرجات Gradients
```

**استخدامات اللون الأحمر الأساسي:**
- خلفية الـ AppBar والـ Header
- الأزرار الرئيسية (Primary Buttons)
- الأيقونات المهمة (Critical Icons)
- العناوين الرئيسية (Headings)
- الـ Floating Action Buttons
- الـ Bottom Navigation Bar
- حالات الخطر والإلحاح (Urgent/Critical States)
- الـ Active State في الـ Tabs

#### اللون الثانوي - Turquoise Blue (الأزرق الفيروزي)
```dart
Accent: Color(0xFF1ba3b6)       // الفيروزي - اللون الثانوي
AccentDark: Color(0xFF16879a)   // فيروزي غامق
AccentLight: Color(0xFF06B6D4)  // فيروزي فاتح (Cyan)
```

**استخدامات اللون الفيروزي:**
- الشحنات البحرية (Sea Shipments)
- الأيقونات الثانوية
- الأزرار الثانوية
- الـ Links والروابط
- الـ Progress Indicators
- الشاشات الخاصة بالبحر والموانئ
- الـ Info States

### 2. الألوان المحايدة | Neutral Colors

```dart
// خلفيات
White: Color(0xFFFFFFFF)          // الخلفية الرئيسية
Background: Color(0xFFF5F5F5)     // خلفية الصفحات
CardBackground: Colors.white      // خلفية الكروت

// نصوص
Black: Color(0xFF000000)          // نص أسود
TextDark: Color(0xFF2D2D2D)       // نص غامق رئيسي
TextMedium: Color(0xFF424242)     // نص متوسط
TextLight: Color(0xFF757575)      // نص فاتح
TextGrey: Color(0xFF9E9E9E)       // نص رمادي فاتح

// حدود وفواصل
GreyLight: Color(0xFFBDBDBD)      // حدود فاتحة
GreyBorder: Color(0xFFE0E0E0)     // حدود الحقول
Divider: Colors.grey[200]         // خطوط الفصل
```

### 3. ألوان الحالات | Status Colors

#### الشحنات (Shipments Status)
```dart
// 10 حالات للشحنات
Orange: Colors.orange             // في انتظار الشحن
Blue: Colors.blue                 // في الطريق
Cyan: Colors.cyan                 // تم وصول البضاعة
Amber: Colors.amber               // في انتظار وصول الإذن
Teal: Colors.teal                 // تم وصول الإذن
DeepOrange: Colors.deepOrange     // التخليص الجمركي
Indigo: Colors.indigo             // جاري إدراج الشحنة
Purple: Colors.purple             // جاري الكشف والتثمين
LightGreen: Colors.lightGreen     // مكتملة
Green: Colors.green               // تمت بنجاح
```

#### الإشعارات (Notifications)
```dart
Success: Color(0xFF28a745)        // النجاح - أخضر
Error: Color(0xFFdc3545)          // الخطأ - أحمر
Warning: Color(0xFFffc107)        // التحذير - أصفر
Info: Color(0xFF17a2b8)           // المعلومات - أزرق
```

#### نوع الشحن (Shipment Type)
```dart
SeaShipment: Color(0xFF1ba3b6)    // بحري - فيروزي
AirShipment: Colors.orange[700]    // جوي - برتقالي
LandShipment: Colors.brown[400]    // بري - بني (غير مستخدم حالياً)
```

### 4. الخطوط | Typography

#### الخط الأساسي
```yaml
Font Family: 'Cairo'              # خط عربي احترافي
```

**مقاسات الخطوط:**
```dart
// العناوين الكبيرة (Large Titles)
fontSize: 28
fontWeight: FontWeight.bold

// العناوين الرئيسية (Titles)
fontSize: 20-22
fontWeight: FontWeight.bold

// العناوين الفرعية (Subtitles)
fontSize: 16-18
fontWeight: FontWeight.w600

// النصوص العادية (Body Text)
fontSize: 14-15
fontWeight: FontWeight.normal

// النصوص الصغيرة (Small Text)
fontSize: 11-13
fontWeight: FontWeight.normal

// النصوص الدقيقة (Caption)
fontSize: 10-11
color: Colors.grey[600]
```

### 5. الشعار والأيقونات | Logo & Icons

#### الشعار الرئيسي
```
Location: assets/img/logo.png
Usage: 
  - Splash Screen (150x150)
  - AppBar (60-70px)
  - Profile Header (80x80)
  - App Icon (generated via flutter_launcher_icons)
```

#### الأيقونات
```dart
// Material Icons من Flutter
Success: Icons.check_circle
Error: Icons.error
Warning: Icons.warning
Info: Icons.info
Question: Icons.help

// Shipment Types
Sea: Icons.directions_boat_rounded
Air: Icons.flight_takeoff_rounded
Land: Icons.local_shipping_rounded

// Documents
Upload: Icons.cloud_upload_outlined
Download: Icons.file_download
PDF: Icons.picture_as_pdf
Image: Icons.image
```

#### أيقونة Google Sign-In
```
Location: assets/img/googleIcon.png
Size: 24x24
Usage: Google Sign-In buttons
```

---

## 🏗️ المكونات الأساسية | Core Components

### 1. UnifiedTopBar - شريط العلوي الموحد

**الوصف:**  
مكون موحد للـ App Bar يستخدم في جميع الصفحات

**الميزات:**
```dart
- دعم صورة البروفايل (Profile Photo)
- عرض اسم المستخدم والبريد الإلكتروني
- أيقونة الإشعارات مع عداد غير مقروء
- زر القائمة أو زر الرجوع
- تحديث تلقائي من UserCacheService
- تدرج لوني من الأحمر الغامق للأحمر الفاتح
```

**الكود المعماري:**
```dart
UnifiedTopBar(
  title: 'عنوان مخصص',           // اختياري
  subtitle: 'عنوان فرعي',         // اختياري
  showNotification: true,         // إظهار الإشعارات
  showMenu: true,                 // إظهار القائمة
  showBackButton: false,          // أو زر الرجوع
  showProfilePhoto: true,         // إظهار الصورة
  height: 120,                    // ارتفاع مخصص
)
```

**الألوان:**
```dart
primaryDark: Color(0xFF690000)
accentColor: Color(0xFF1ba3b6)
```

### 2. AlNoranPopups - النوافذ المنبثقة

**الأنواع:**
```dart
enum PopupType {
  success,   // نجاح
  error,     // خطأ
  warning,   // تحذير
  info,      // معلومات
  question   // سؤال
}
```

**طرق الاستخدام:**
```dart
// Success
AlNoranPopups.showSuccess(
  context: context,
  message: 'تم بنجاح',
)

// Error
AlNoranPopups.showError(
  context: context,
  message: 'حدث خطأ',
  title: 'عنوان اختياري',
)

// Warning
AlNoranPopups.showWarning(
  context: context,
  message: 'تحذير مهم',
)

// Loading
AlNoranPopups.showLoading(
  context: context,
  message: 'جاري التحميل...',
)

// Hide Loading
AlNoranPopups.hideLoading(context)
```

**التصميم:**
- شكل دائري: `BorderRadius.circular(20)`
- أيقونة كبيرة: `size: 72`
- عنوان: `fontSize: 22, fontWeight: FontWeight.bold`
- رسالة: `fontSize: 16`
- زر واحد أو اثنين حسب الحاجة

### 3. AlNoranLoading - مؤشر التحميل

**الأنواع:**
```dart
// Full Screen Loading
AlNoranFullScreenLoading()

// Button Loading (داخل الأزرار)
AlNoranButtonLoading()

// Standard CircularProgressIndicator
CircularProgressIndicator(
  color: Color(0xFF690000),
)
```

### 4. الأزرار | Buttons

#### Primary Button (الزر الرئيسي)
```dart
ElevatedButton(
  style: ElevatedButton.styleFrom(
    backgroundColor: Color(0xFF690000),
    foregroundColor: Colors.white,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
    ),
    padding: EdgeInsets.symmetric(vertical: 14),
    elevation: 0,
  ),
  child: Text(
    'نص الزر',
    style: TextStyle(
      fontSize: 16,
      fontWeight: FontWeight.bold,
      fontFamily: 'Cairo',
    ),
  ),
)
```

#### Secondary Button (الزر الثانوي)
```dart
OutlinedButton(
  style: OutlinedButton.styleFrom(
    foregroundColor: Color(0xFF690000),
    side: BorderSide(color: Color(0xFF690000), width: 1.5),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
    ),
    padding: EdgeInsets.symmetric(vertical: 14),
  ),
)
```

#### Text Button
```dart
TextButton(
  style: TextButton.styleFrom(
    foregroundColor: Color(0xFF690000),
  ),
  child: Text(
    'نص',
    style: TextStyle(
      fontFamily: 'Cairo',
      fontWeight: FontWeight.w600,
    ),
  ),
)
```

#### Floating Action Button
```dart
FloatingActionButton.extended(
  onPressed: () {},
  backgroundColor: Color(0xFF690000),
  elevation: 4,
  label: Text(
    'طلب ACID',
    style: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.bold,
      fontFamily: 'Cairo',
      color: Colors.white,
    ),
  ),
  icon: Icon(Icons.receipt_long_rounded, size: 24, color: Colors.white),
)
```

### 5. حقول الإدخال | Text Fields

```dart
Container(
  decoration: BoxDecoration(
    color: Color(0xFFF5F5F5),
    borderRadius: BorderRadius.circular(12),
  ),
  child: TextField(
    textAlign: TextAlign.right,
    style: TextStyle(fontFamily: 'Cairo'),
    decoration: InputDecoration(
      hintText: 'نص توضيحي',
      hintStyle: TextStyle(
        color: Color(0xFFBDBDBD),
        fontFamily: 'Cairo',
      ),
      border: InputBorder.none,
      contentPadding: EdgeInsets.symmetric(
        horizontal: 20,
        vertical: 18,
      ),
      prefixIcon: Icon(
        Icons.email_outlined,
        color: Color(0xFF690000),
      ),
    ),
  ),
)
```

### 6. الكروت | Cards

#### Shipment Card (كارت الشحنة)
```dart
Container(
  margin: EdgeInsets.only(bottom: 12),
  padding: EdgeInsets.all(18),
  decoration: BoxDecoration(
    color: Colors.white,
    borderRadius: BorderRadius.circular(16),
    border: Border.all(
      color: Colors.grey.withOpacity(0.1),
      width: 1,
    ),
    boxShadow: [
      BoxShadow(
        color: Colors.black.withOpacity(0.03),
        blurRadius: 8,
        offset: Offset(0, 2),
      ),
    ],
  ),
)
```

#### ACID Request Card (كارت طلب ACID)
```dart
Container(
  decoration: BoxDecoration(
    gradient: LinearGradient(
      colors: [
        Color(0xFF1ba3b6).withOpacity(0.05),
        Color(0xFF1ba3b6).withOpacity(0.02),
      ],
    ),
    borderRadius: BorderRadius.circular(16),
    border: Border.all(
      color: Color(0xFF1ba3b6).withOpacity(0.3),
      width: 1.5,
    ),
  ),
)
```

### 7. الـ Badges والـ Tags

#### Type Badge (بدج نوع الشحن)
```dart
Container(
  padding: EdgeInsets.symmetric(horizontal: 10, vertical: 5),
  decoration: BoxDecoration(
    color: typeColor.withOpacity(0.1),
    borderRadius: BorderRadius.circular(6),
  ),
  child: Row(
    children: [
      Icon(typeIcon, size: 14, color: typeColor),
      SizedBox(width: 4),
      Text(
        typeText,
        style: TextStyle(
          fontSize: 11,
          fontFamily: 'Cairo',
          fontWeight: FontWeight.bold,
          color: typeColor,
        ),
      ),
    ],
  ),
)
```

#### Status Badge (بدج الحالة)
```dart
Container(
  padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
  decoration: BoxDecoration(
    color: statusColor,
    borderRadius: BorderRadius.circular(6),
  ),
  child: Row(
    children: [
      Icon(statusIcon, size: 12, color: Colors.white),
      SizedBox(width: 4),
      Text(
        statusText,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.bold,
          color: Colors.white,
          fontFamily: 'Cairo',
        ),
      ),
    ],
  ),
)
```

#### Urgent Badge (بدج عاجل)
```dart
Container(
  padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
  decoration: BoxDecoration(
    color: Colors.red.withOpacity(0.1),
    borderRadius: BorderRadius.circular(6),
  ),
  child: Row(
    children: [
      Icon(Icons.priority_high, size: 14, color: Colors.red),
      SizedBox(width: 2),
      Text(
        'عاجل',
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.bold,
          color: Colors.red,
          fontFamily: 'Cairo',
        ),
      ),
    ],
  ),
)
```

---

## 📱 الصفحات والميزات | Pages & Features

### 1. Splash Screen (شاشة البداية)

**الميزات:**
- رسوم متحركة للشعار (Scale + Opacity Animation)
- رسوم متحركة للأمواج (Wave Animation) بالفيروزي
- رسوم متحركة لسفينة (Ship Animation)
- شريط تقدم (Progress Bar) مع نسبة مئوية
- تدرج لوني من الأحمر الغامق للفاتح
- نصوص متحركة تظهر تدريجياً

**الألوان:**
```dart
Gradient: [Color(0xFF690000), Color(0xFF8b0000), Color(0xFF690000)]
Waves: Color(0xFF1ba3b6)
Text: Color(0xFF690000)
```

**المدة:**
- Animation: 1800ms (Logo)
- Text: 1200ms
- Wave: 3000ms (Loop)
- Total Wait: ~2000-2500ms

### 2. Auth Pages (صفحات المصادقة)

#### Login Page (صفحة تسجيل الدخول)
**الحقول:**
- البريد الإلكتروني (Email)
- كلمة المرور (Password) مع إظهار/إخفاء

**الأزرار:**
- تسجيل الدخول (Primary Button)
- نسيت كلمة المرور (Link)
- تسجيل بواسطة Google (With Google Icon)
- تسجيل بواسطة Apple (With Apple Icon)
- إنشاء حساب (Link)

**التصميم:**
- Logo: 150x150 في الأعلى
- العنوان: "تسجيل الدخول" - 28px Bold
- العنوان الفرعي: "أهلاً بك في النوران" - 16px
- فاصل "أو" بين الحقول والأزرار الاجتماعية

#### Register Page (صفحة التسجيل)
**أنواع العملاء:**
1. **Personal (شخصي)**: للأفراد
2. **Commercial (تجاري)**: للشركات
3. **Factory (مصنع)**: للمصانع

**المستندات المطلوبة:**
- **Personal**: البطاقة الشخصية + التوكيل
- **Commercial**: العقد + البطاقة الضريبية + السجل التجاري + شهادة القيمة المضافة + بطاقة استيراد/تصدير
- **Factory**: العقد + البطاقة الضريبية + السجل التجاري + شهادة القيمة المضافة + مستلزمات الإنتاج + السجل الصناعي

#### OTP Verification Page (صفحة التحقق)
- 6 خانات لإدخال الكود
- عداد تنازلي لإعادة الإرسال
- رسالة تم الإرسال إلى رقم الموبايل

### 3. Home Page (الصفحة الرئيسية)

**الأقسام:**
1. **Top Bar**: UnifiedTopBar مع الصورة والإشعارات
2. **Search Bar**: بحث برقم الشحنة
3. **Stats Cards**: (3 كروت)
   - إجمالي الشحنات
   - الشحنات النشطة
   - الشحنات المكتملة
4. **Recent Shipments**: آخر 3 شحنات تم فتحها
5. **Quick Actions**: (4 أزرار سريعة)
   - ACID Request (طلب ACID)
   - UCR Request (طلب UCR)
   - Track Shipment (تتبع الشحنة)
   - Support (الدعم الفني)

**الألوان:**
- Background: `Color(0xFFF5F5F5)`
- Cards: White with subtle shadows
- Stats Icons: `Color(0xFF690000)`

### 4. My Shipments (شحناتي)

**التبويبات (Tabs):**
1. **الجارية (Current)**: الشحنات قيد التنفيذ
2. **المكتملة (Completed)**: الشحنات المنتهية
3. **طلبات ACID**: جميع طلبات ACID

**الفلاتر (Filters):**
- الكل
- بحري (Sea)
- جوي (Air)
- طلبات ACID

**الترتيب (Sort):**
- الأحدث
- الأقدم
- حسب ACID

**كارت الشحنة يحتوي على:**
- Shipment Code Badge (إن وجد)
- Type Badge (بحري/جوي)
- Urgent Badge (إن كانت عاجلة)
- رقم ACID
- رقم 46 (إن وجد)
- الحالة (Status)
- تاريخ آخر تحديث
- زر "عرض تفاصيل الشحنة"

### 5. My Exports (صادراتي)

**مشابه لـ My Shipments ولكن للصادرات**

**التبويبات:**
1. الجارية
2. المكتملة

**معلومات كارت الصادرات:**
- Export Shipment Code
- نوع الشحن (بحري/جوي)
- رقم الحاوية
- المورد (Supplier)
- الوجهة (Destination)
- الحالة
- التاريخ

### 6. Shipment Details (تفاصيل الشحنة)

**الأقسام:**
1. **Header**: 
   - Gradient Background
   - Logo
   - Shipment Code
   - ACID Number
   - Type Badge

2. **Tabs**:
   - معلومات عامة (General Info)
   - المستندات (Documents)
   - المدفوعات (Payments)
   - المحادثات (Chat)

3. **General Info**:
   - اسم المستورد
   - اسم صاحب العمل
   - الوصف
   - رقم 46
   - رقم السياسة (Policy)
   - الحالة
   - تاريخ الإنشاء

4. **Documents**:
   - قائمة المستندات المرفوعة
   - أيقونات PDF/Image
   - إمكانية العرض والتحميل

5. **Payments**:
   - قائمة الفواتير
   - المبالغ المستحقة
   - إمكانية رفع إيصالات الدفع

6. **Chat**:
   - محادثة مباشرة مع الدعم الفني
   - رفع صور ومستندات

### 7. ACID Request Page (صفحة طلب ACID)

**الحقول:**
1. **Supplier Info**:
   - الاسم
   - العنوان
   - البلد

2. **Goods Info**:
   - الوصف
   - الوزن (Weight)
   - القيمة (Value)
   - بلد المنشأ

3. **Shipment Type**:
   - بحري (Sea)
   - جوي (Air)

4. **Documents**:
   - Invoice
   - Packing List
   - مستندات إضافية

**التصميم:**
- Gradient Header مع Logo
- حقول إدخال مع أيقونات
- أزرار رفع المستندات
- زر Submit كبير في الأسفل

### 8. UCR Request Page (صفحة طلب UCR)

**مشابه لـ ACID Request**

**الحقول:**
1. **Container Info**:
   - رقم الحاوية
   - نوع الحاوية
   - الحجم

2. **Goods Info**:
   - الوصف
   - الكمية
   - الوزن

3. **Documents**:
   - Bill of Lading
   - Packing List
   - Invoice

### 9. Payments Page (صفحة المدفوعات)

**التبويبات:**
1. **الكل (All)**
2. **مدفوعة (Paid)**
3. **غير مدفوعة (Unpaid)**

**كارت الفاتورة:**
- رقم الفاتورة
- نوع الخدمة (Service Type)
- المبلغ (Amount)
- الحالة (Status)
- تاريخ الإصدار
- تاريخ الاستحقاق
- زر عرض التفاصيل
- زر رفع إيصال الدفع (للغير مدفوعة)

**ألوان الحالات:**
- Paid: `Colors.green`
- Unpaid: `Color(0xFF690000)`
- Overdue: `Colors.red`

### 10. Profile Page (صفحة الملف الشخصي)

**الأقسام:**
1. **Header**:
   - صورة البروفايل (قابلة للتحديث)
   - الاسم الكامل
   - البريد الإلكتروني
   - نوع العميل (Personal/Commercial/Factory)

2. **Personal Info**:
   - Icon: `Icons.person_outline`
   - Color: `Color(0xFF690000)`

3. **Company/Business Info** (للتجاري والمصنع):
   - Icon: `Icons.business`
   - Color: `Color(0xFF1ba3b6)`

4. **Documents** (المستندات المرفوعة):
   - Icon: `Icons.folder_open`
   - Color: `Color(0xFF1ba3b6)`

5. **Settings Menu**:
   - تغيير كلمة المرور
   - إعدادات الإشعارات
   - اللغة
   - سياسة الخصوصية
   - الشروط والأحكام
   - عن التطبيق
   - تسجيل الخروج

**الألوان:**
- Profile Header: Gradient `[Color(0xFF690000), Color(0xFF8B0000)]`
- Info Cards: White
- Icons: Alternating between Primary and Accent

### 11. Notifications Page (صفحة الإشعارات)

**أنواع الإشعارات:**
1. **Shipment Updates**: تحديثات الشحنات
2. **ACID/UCR Updates**: تحديثات الطلبات
3. **Payment Reminders**: تذكيرات المدفوعات
4. **Documents**: المستندات
5. **System**: إشعارات النظام
6. **Export Shipments**: الصادرات

**كارت الإشعار:**
- أيقونة بلون مخصص حسب النوع
- العنوان (Bold)
- الوصف
- الوقت (Time Ago)
- دائرة زرقاء صغيرة للغير مقروء

**ألوان الإشعارات:**
```dart
Shipment: Color(0xFF3B82F6)    // أزرق
ACID: Color(0xFF8B5CF6)        // بنفسجي
Payment: Color(0xFFF59E0B)     // أصفر برتقالي
Documents: Color(0xFF10B981)   // أخضر
System: Color(0xFF690000)      // أحمر غامق
Export: Color(0xFF06B6D4)      // سماوي
```

### 12. Documents Settings Page (صفحة إعدادات المستندات)

**الميزات:**
1. **Stats Cards**: (5 كروت)
   - مقبولة (Approved)
   - قيد المراجعة (Pending)
   - مرفوضة (Rejected)
   - المرفوعة (Uploaded)
   - ناقصة (Missing)

2. **Warning Banner**: إذا كانت المستندات غير معتمدة

3. **Required Documents List**: حسب نوع العميل

4. **Document Card**:
   - أيقونة PDF/Image
   - Status Badge (مقبول/قيد المراجعة/مرفوض)
   - اسم المستند
   - تاريخ الرفع
   - سبب الرفض (إن وجد)
   - أزرار: عرض / تعديل / إعادة رفع

**ألوان الحالات:**
```dart
Approved: Colors.green
Pending: Colors.orange
Rejected: Colors.red
Not Uploaded: Colors.grey
```

### 13. Chat Page (صفحة المحادثة)

**الميزات:**
- محادثة فورية مع الدعم الفني
- رفع صور ومستندات
- إرسال رسائل نصية
- عرض حالة القراءة
- تنبيهات صوتية للرسائل الجديدة

**تصميم الرسائل:**
- **رسائل المستخدم**: 
  - Background: `Color(0xFF690000)`
  - Text: White
  - Align: Right

- **رسائل الدعم**:
  - Background: `Color(0xFFF5F5F5)`
  - Text: Black
  - Align: Left

---

## 🎨 الأنماط والباترنات | Patterns & Styles

### 1. التدرجات اللونية | Gradients

#### Primary Gradient (تدرج أحمر)
```dart
LinearGradient(
  colors: [Color(0xFF690000), Color(0xFF8B0000)],
  begin: Alignment.topRight,
  end: Alignment.bottomLeft,
)
```

#### Accent Gradient (تدرج فيروزي)
```dart
LinearGradient(
  colors: [Color(0xFF1ba3b6), Color(0xFF16879a)],
  begin: Alignment.topLeft,
  end: Alignment.bottomRight,
)
```

#### Background Gradient (تدرج خفيف)
```dart
LinearGradient(
  colors: [
    Color(0xFF1ba3b6).withOpacity(0.05),
    Color(0xFF1ba3b6).withOpacity(0.02),
  ],
)
```

### 2. الظلال | Shadows

#### Card Shadow (ظل الكروت)
```dart
BoxShadow(
  color: Colors.black.withOpacity(0.03),
  blurRadius: 8,
  offset: Offset(0, 2),
)
```

#### Elevated Shadow (ظل مرتفع)
```dart
BoxShadow(
  color: Colors.black.withOpacity(0.1),
  blurRadius: 15,
  offset: Offset(0, 5),
)
```

#### Accent Shadow (ظل ملون)
```dart
BoxShadow(
  color: Color(0xFF690000).withOpacity(0.3),
  blurRadius: 8,
  offset: Offset(0, 4),
)
```

### 3. الحواف المستديرة | Border Radius

```dart
// Standard
BorderRadius.circular(12)     // الحقول والأزرار

// Large
BorderRadius.circular(16)     // الكروت الكبيرة

// XLarge
BorderRadius.circular(20)     // الـ Dialogs

// Header
BorderRadius.only(
  bottomLeft: Radius.circular(25),
  bottomRight: Radius.circular(25),
)
```

### 4. المسافات | Spacing

```dart
// Small
SizedBox(height: 4)
SizedBox(height: 6)
SizedBox(height: 8)

// Medium
SizedBox(height: 12)
SizedBox(height: 14)
SizedBox(height: 16)

// Large
SizedBox(height: 20)
SizedBox(height: 24)

// XLarge
SizedBox(height: 30)

// Padding
EdgeInsets.all(16)                    // Standard
EdgeInsets.symmetric(horizontal: 20, vertical: 14)  // Buttons
EdgeInsets.all(18)                    // Cards
```

### 5. الرسوم المتحركة | Animations

#### Fade Animation
```dart
AnimationController(
  duration: Duration(milliseconds: 1200),
  vsync: this,
);

Animation<double> fadeAnimation = Tween<double>(
  begin: 0.0,
  end: 1.0,
).animate(CurvedAnimation(
  parent: controller,
  curve: Curves.easeIn,
));
```

#### Scale Animation
```dart
Animation<double> scaleAnimation = Tween<double>(
  begin: 0.3,
  end: 1.0,
).animate(CurvedAnimation(
  parent: controller,
  curve: Curves.easeOutBack,
));
```

#### Slide Animation
```dart
Animation<Offset> slideAnimation = Tween<Offset>(
  begin: Offset(0, 0.3),
  end: Offset.zero,
).animate(CurvedAnimation(
  parent: controller,
  curve: Curves.easeOut,
));
```

---

## 📐 التخطيطات | Layouts

### 1. Bottom Navigation Bar

```dart
Container(
  decoration: BoxDecoration(
    color: Color(0xFF690000),
    borderRadius: BorderRadius.only(
      topLeft: Radius.circular(25),
      topRight: Radius.circular(25),
    ),
    boxShadow: [
      BoxShadow(
        color: Colors.black.withOpacity(0.2),
        blurRadius: 15,
        offset: Offset(0, -5),
      ),
    ],
  ),
  height: 65,
  child: Row(
    children: [
      // 4 Items:
      // 1. الرئيسية (Home)
      // 2. الوارد (Imports)
      // 3. الصادر (Exports)
      // 4. الفواتير (Payments)
    ],
  ),
)
```

**الألوان:**
- Background: `Color(0xFF690000)`
- Selected: `Color(0xFF1ba3b6)`
- Unselected: `Colors.white70`

**الأيقونات:**
```dart
Home: Icons.home_rounded
Imports: Icons.flight_land_rounded
Exports: Icons.flight_takeoff_rounded
Payments: Icons.receipt_long_rounded
```

### 2. AppBar Layouts

#### Simple AppBar
```dart
AppBar(
  backgroundColor: Color(0xFF690000),
  elevation: 0,
  title: Text(
    'العنوان',
    style: TextStyle(
      fontFamily: 'Cairo',
      fontWeight: FontWeight.bold,
    ),
  ),
  centerTitle: true,
)
```

#### Expanded AppBar (SliverAppBar)
```dart
SliverAppBar(
  expandedHeight: 180,
  floating: false,
  pinned: true,
  backgroundColor: Color(0xFF690000),
  flexibleSpace: FlexibleSpaceBar(
    background: Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF690000), Color(0xFF8B0000)],
        ),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(25),
          bottomRight: Radius.circular(25),
        ),
      ),
    ),
  ),
)
```

### 3. TabBar Layout

```dart
Container(
  margin: EdgeInsets.symmetric(horizontal: 16),
  decoration: BoxDecoration(
    color: Colors.white,
    borderRadius: BorderRadius.circular(16),
    boxShadow: [
      BoxShadow(
        color: Colors.black.withOpacity(0.05),
        blurRadius: 10,
        offset: Offset(0, 2),
      ),
    ],
  ),
  child: TabBar(
    labelColor: Colors.white,
    unselectedLabelColor: Color(0xFF690000),
    indicator: BoxDecoration(
      color: Color(0xFF690000),
      borderRadius: BorderRadius.circular(12),
    ),
    indicatorPadding: EdgeInsets.all(4),
    tabs: [
      Tab(text: 'Tab 1'),
      Tab(text: 'Tab 2'),
      Tab(text: 'Tab 3'),
    ],
  ),
)
```

### 4. Drawer Layout (القائمة الجانبية)

**لم يتم تطبيقها بعد، ولكن يمكن استخدام هذا التصميم:**

```dart
Drawer(
  child: Container(
    decoration: BoxDecoration(
      gradient: LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          Color(0xFF690000),
          Color(0xFF8B0000),
        ],
      ),
    ),
    child: Column(
      children: [
        // Header with Logo & User Info
        DrawerHeader(
          child: Column(
            children: [
              CircleAvatar(radius: 40),
              SizedBox(height: 12),
              Text('اسم المستخدم', style: TextStyle(color: Colors.white)),
              Text('email@example.com', style: TextStyle(color: Colors.white70)),
            ],
          ),
        ),
        // Menu Items
        ListTile(
          leading: Icon(Icons.home, color: Colors.white),
          title: Text('الرئيسية', style: TextStyle(color: Colors.white)),
        ),
        // ... more items
      ],
    ),
  ),
)
```

---

## 🌍 التدويل والتوطين | Internationalization

### اللغة الافتراضية
```dart
Locale: ar_EG (العربية - مصر)
TextDirection: RTL (من اليمين لليسار)
```

### الإعدادات في main.dart
```dart
localizationsDelegates: [
  GlobalMaterialLocalizations.delegate,
  GlobalWidgetsLocalizations.delegate,
  GlobalCupertinoLocalizations.delegate,
],
supportedLocales: [
  Locale('ar', 'EG'),
  Locale('ar', ''),
],
locale: Locale('ar', 'EG'),
```

### استخدام Directionality
```dart
// في كل صفحة
Directionality(
  textDirection: TextDirection.rtl,
  child: Scaffold(...),
)
```

---

## 🔔 الإشعارات | Notifications

### أنواع الإشعارات
```dart
// 1. Shipment Status Change
'shipment_status_changed'

// 2. ACID Request Status
'acid_request_created'
'acid_request_approved'
'acid_request_rejected'

// 3. UCR Request Status
'ucr_request_created'
'ucr_request_approved'
'ucr_request_rejected'

// 4. Payment Reminders
'payment_due_reminder'
'payment_received'

// 5. Document Status
'document_approved'
'document_rejected'
'document_pending'

// 6. Export Shipments
'export_shipment_created'
'export_shipment_status_changed'

// 7. System Notifications
'system_announcement'
'new_feature'
```

### تصميم الإشعار
```dart
Container(
  padding: EdgeInsets.all(16),
  decoration: BoxDecoration(
    color: isRead ? Colors.white : Color(0xFF1ba3b6).withOpacity(0.05),
    borderRadius: BorderRadius.circular(12),
    border: Border.all(
      color: isRead ? Colors.grey[200]! : Color(0xFF1ba3b6).withOpacity(0.3),
    ),
  ),
  child: Row(
    children: [
      // Icon with colored background
      Container(
        padding: EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: iconColor.withOpacity(0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: iconColor, size: 24),
      ),
      SizedBox(width: 12),
      // Content
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: TextStyle(fontWeight: FontWeight.bold)),
            SizedBox(height: 4),
            Text(message),
          ],
        ),
      ),
      // Time & Unread Badge
      Column(
        children: [
          Text(timeAgo, style: TextStyle(fontSize: 11, color: Colors.grey)),
          if (!isRead)
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                color: Color(0xFF10B981),
                shape: BoxShape.circle,
              ),
            ),
        ],
      ),
    ],
  ),
)
```

---

## 📂 الـ File Upload | File Uploading

### تصميم زر رفع الملفات
```dart
InkWell(
  onTap: () => _pickFile(),
  borderRadius: BorderRadius.circular(14),
  child: Container(
    padding: EdgeInsets.all(20),
    decoration: BoxDecoration(
      border: Border.all(
        color: Color(0xFF690000).withOpacity(0.3),
        width: 2,
        style: BorderStyle.solid,
      ),
      borderRadius: BorderRadius.circular(14),
      color: Colors.white,
    ),
    child: Column(
      children: [
        Icon(
          Icons.cloud_upload_outlined,
          size: 50,
          color: Color(0xFF690000).withOpacity(0.7),
        ),
        SizedBox(height: 12),
        Text(
          'اضغط لرفع الملف',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            fontFamily: 'Cairo',
            color: Color(0xFF690000),
          ),
        ),
        SizedBox(height: 6),
        Text(
          'PDF, JPG, PNG (حتى 10MB)',
          style: TextStyle(
            fontSize: 13,
            fontFamily: 'Cairo',
            color: Colors.grey[600],
          ),
        ),
      ],
    ),
  ),
)
```

### عرض الملف المرفوع
```dart
Container(
  padding: EdgeInsets.all(14),
  decoration: BoxDecoration(
    color: Color(0xFF1ba3b6).withOpacity(0.08),
    borderRadius: BorderRadius.circular(12),
    border: Border.all(
      color: Color(0xFF1ba3b6).withOpacity(0.3),
    ),
  ),
  child: Row(
    children: [
      Icon(
        isPDF ? Icons.picture_as_pdf : Icons.image,
        color: Color(0xFF1ba3b6),
        size: 32,
      ),
      SizedBox(width: 12),
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              fileName,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                fontFamily: 'Cairo',
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            SizedBox(height: 2),
            Text(
              fileSize,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
                fontFamily: 'Cairo',
              ),
            ),
          ],
        ),
      ),
      IconButton(
        icon: Icon(Icons.close, color: Colors.red),
        onPressed: () => _removeFile(),
      ),
    ],
  ),
)
```

---

## 🔒 حالات الخطأ والـ Empty States | Error & Empty States

### Loading State (حالة التحميل)
```dart
Center(
  child: Column(
    mainAxisAlignment: MainAxisAlignment.center,
    children: [
      CircularProgressIndicator(color: Color(0xFF690000)),
      SizedBox(height: 16),
      Text(
        'جاري التحميل...',
        style: TextStyle(
          fontFamily: 'Cairo',
          fontSize: 14,
          color: Colors.grey[600],
        ),
      ),
    ],
  ),
)
```

### Empty State (لا توجد بيانات)
```dart
Center(
  child: Column(
    mainAxisAlignment: MainAxisAlignment.center,
    children: [
      Container(
        padding: EdgeInsets.all(30),
        decoration: BoxDecoration(
          color: Colors.grey.shade100,
          shape: BoxShape.circle,
        ),
        child: Icon(
          Icons.inventory_2_outlined,
          size: 80,
          color: Colors.grey[300],
        ),
      ),
      SizedBox(height: 24),
      Text(
        'لا توجد شحنات',
        style: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.bold,
          color: Colors.grey[600],
          fontFamily: 'Cairo',
        ),
      ),
      SizedBox(height: 8),
      Text(
        'اسحب لأسفل للتحديث',
        style: TextStyle(
          fontSize: 14,
          color: Colors.grey[500],
          fontFamily: 'Cairo',
        ),
      ),
    ],
  ),
)
```

### Error State (حالة الخطأ)
```dart
Center(
  child: Column(
    mainAxisAlignment: MainAxisAlignment.center,
    children: [
      Icon(
        Icons.error_outline,
        size: 80,
        color: Colors.red[300],
      ),
      SizedBox(height: 16),
      Text(
        'حدث خطأ في تحميل البيانات',
        style: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.bold,
          color: Colors.grey[700],
          fontFamily: 'Cairo',
        ),
      ),
      SizedBox(height: 16),
      ElevatedButton(
        onPressed: () => _retry(),
        style: ElevatedButton.styleFrom(
          backgroundColor: Color(0xFF690000),
        ),
        child: Text('إعادة المحاولة'),
      ),
    ],
  ),
)
```

---

## 📝 ملاحظات إضافية | Additional Notes

### 1. الأداء والتحسين | Performance
- استخدام `ShipmentsCacheService` لتخزين البيانات مؤقتاً
- استخدام `UserCacheService` لبيانات المستخدم
- استخدام `RecentShipmentsService` لحفظ آخر الشحنات المفتوحة
- تحميل الصور بشكل lazy مع placeholder
- استخدام `RefreshIndicator` للتحديث بالسحب

### 2. الأمان | Security
- استخدام `flutter_secure_storage` لحفظ الـ Token
- تشفير بيانات المستخدم الحساسة
- استخدام JWT للمصادقة
- HTTPS فقط للـ API Calls

### 3. التنقل | Navigation
- استخدام `go_router` للتنقل
- دعم Deep Linking
- حفظ الحالة عند التنقل بين الصفحات

### 4. الإشعارات | Notifications
- استخدام Firebase Cloud Messaging (FCM)
- طلب الإذن للإشعارات على Android 13+
- Local Notifications للتنبيهات الفورية
- Badge لعرض عدد الإشعارات غير المقروءة

### 5. الصور والأيقونات | Images & Icons
- استخدام Material Icons بشكل أساسي
- Logo من `assets/img/logo.png`
- Google Icon من `assets/img/googleIcon.png`
- دعم صور المستخدمين من S3 عبر Presigned URLs

### 6. حالات الشحنات (10 حالات) | Shipment States
```
1. في انتظار الشحن
2. في الطريق
3. تم وصول البضاعة
4. في انتظار وصول الإذن
5. تم وصول الإذن
6. التخليص الجمركي
7. جاري إدراج الشحنة واستكمال الإجراءات
8. جاري الكشف والتثمين
9. مكتملة
10. تمت بنجاح
```

### 7. أنواع العملاء | Client Types
```
1. Personal (شخصي)
2. Commercial (تجاري)
3. Factory (مصنع)
```

---

## 🎯 النقاط المهمة للتطوير المستقبلي | Future Development

### 1. تحسينات UI/UX مقترحة
- [ ] إضافة Dark Mode
- [ ] تحسين الرسوم المتحركة (Micro-interactions)
- [ ] إضافة Skeleton Loaders بدلاً من CircularProgressIndicator
- [ ] تحسين Empty States برسوم توضيحية (Illustrations)
- [ ] إضافة Haptic Feedback للتفاعلات المهمة

### 2. ميزات جديدة
- [ ] دعم اللغة الإنجليزية
- [ ] إضافة خاصية الدفع الإلكتروني
- [ ] تتبع الشحنات على الخريطة (Map Tracking)
- [ ] إشعارات فورية للتحديثات الحرجة
- [ ] تصدير الفواتير كـ PDF

### 3. تحسينات الأداء
- [ ] تقليل حجم الصور باستخدام Image Compression
- [ ] استخدام Lazy Loading للقوائم الطويلة
- [ ] تحسين استهلاك البطارية
- [ ] تقليل استخدام الذاكرة (Memory Optimization)

---

## 📞 جهات الاتصال والدعم | Support & Contact

**اسم النظام**: NoranSmart - نوران سمارت  
**الشركة**: شركة النوران للاستيراد والتصدير  
**المجال**: Customs Clearance & Logistics  

**الأنظمة المدعومة**:
- ✅ Android
- ✅ iOS
- ✅ Web
- 🔄 Desktop (قيد التطوير)

---

## 📚 المراجع | References

### الحزم المستخدمة | Used Packages
```yaml
dependencies:
  flutter: sdk
  cupertino_icons: ^1.0.8
  intl: ^0.19.0
  http: ^1.2.0
  shared_preferences: ^2.2.2
  image_picker: ^1.0.7
  file_picker: ^8.1.2
  url_launcher: ^6.2.5
  flutter_secure_storage: ^9.0.0
  go_router: ^14.6.2
  firebase_core: ^3.8.1
  firebase_messaging: ^15.2.0
  flutter_local_notifications: ^18.0.1
  permission_handler: ^11.3.1
  google_sign_in: ^6.2.1

dev_dependencies:
  flutter_launcher_icons: ^0.14.3
```

### روابط مفيدة | Useful Links
- Flutter Documentation: https://docs.flutter.dev/
- Material Design: https://m3.material.io/
- Cairo Font: https://fonts.google.com/specimen/Cairo
- Firebase: https://firebase.google.com/

---

## ✅ Checklist للمطورين الجدد | Developer Checklist

عند البدء بتطوير ميزة جديدة، تأكد من:

- [ ] استخدام `Directionality(textDirection: TextDirection.rtl)`
- [ ] استخدام `fontFamily: 'Cairo'` لجميع النصوص
- [ ] استخدام الألوان من `AlNoranColors` أو الألوان المعرفة في الدليل
- [ ] استخدام `BorderRadius.circular(12)` للحواف القياسية
- [ ] استخدام `AlNoranPopups` للإشعارات
- [ ] استخدام `UnifiedTopBar` للـ AppBar عند الإمكان
- [ ] إضافة Loading States و Empty States
- [ ] التأكد من دعم RTL بشكل كامل
- [ ] اختبار الواجهة على أحجام شاشات مختلفة
- [ ] إضافة Accessibility Features (مثل Semantic Labels)

---

## 🎨 الخلاصة النهائية | Final Summary

نظام **NoranSmart** هو تطبيق متكامل لإدارة الشحنات والتخليص الجمركي بتصميم عربي احترافي يعتمد على:

1. **الألوان**: أحمر غامق (Primary) + فيروزي (Accent)
2. **الخط**: Cairo للغة العربية
3. **الاتجاه**: RTL بالكامل
4. **المكونات**: مكونات قابلة لإعادة الاستخدام ومتناسقة
5. **الأداء**: استخدام Cache Services للسرعة
6. **الأمان**: JWT + Secure Storage
7. **الإشعارات**: Firebase Cloud Messaging
8. **التصميم**: Modern, Clean, Professional

---

**تاريخ الإصدار**: ديسمبر 2025  
**الإصدار**: 1.0.0  
**آخر تحديث**: 19 ديسمبر 2025

---

**ملاحظة**: هذا الدليل يجب أن يتم تحديثه باستمرار مع كل تغيير كبير في التصميم أو الميزات.

**For Web & Desktop Teams**: استخدموا نفس الألوان والخطوط والمسافات لضمان تناسق الهوية البصرية عبر جميع المنصات.

---

© 2025 NoranSmart - Al-Noran System Development
