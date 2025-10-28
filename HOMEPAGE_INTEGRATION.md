# تكامل صفحة HomePage مع المشروع

## التغييرات التي تمت

### 1. تحديث HomePage (lib/features/home/homePage.dart)

#### التحسينات المضافة:
- ✅ **ربط مع نظام Authentication**: الصفحة الآن تستقبل `userName` و `userEmail` من صفحة Login
- ✅ **عرض بيانات المستخدم الفعلية**: يتم عرض اسم المستخدم وبريده الإلكتروني في شريط العلوي
- ✅ **قسم الإحصائيات**: تم إضافة كروت تعرض:
  - إجمالي الشحنات
  - الشحنات النشطة  
  - الشحنات المكتملة
- ✅ **وظيفة البحث عن الشحنات**: زر التتبع الآن وظيفي ويتحقق من رقم التتبع
- ✅ **قائمة جانبية**: عند الضغط على أيقونة القائمة يظهر:
  - الملف الشخصي
  - الإعدادات
  - المساعدة
  - تسجيل الخروج
- ✅ **تسجيل الخروج**: يتم تأكيد تسجيل الخروج ثم العودة لصفحة Login
- ✅ **خدمات تفاعلية**: جميع أزرار الخدمات أصبحت قابلة للضغط مع رسائل تفاعلية
- ✅ **التنقل السفلي وظيفي**: كل زر في الـ Bottom Navigation له وظيفة
- ✅ **كروت الشحنات قابلة للضغط**: عند الضغط على شحنة تظهر تفاصيلها

### 2. تحديث Login Page (lib/features/auth/login_page.dart)

#### التغييرات:
- ✅ تم تحديث كود تسجيل الدخول للانتقال إلى HomePage بدلاً من عرض رسالة نجاح فقط
- ✅ يتم تمرير بيانات المستخدم (الاسم والبريد الإلكتروني) للصفحة الرئيسية
- ✅ يتم استخراج الاسم من `fullname` أو `username` من response الـ Backend

### 3. تحديث main.dart

#### التغييرات:
- ✅ إضافة import لـ HomePage
- ✅ إضافة route `/home` لصفحة HomePage
- ✅ إضافة route `/shipments` للانتقال لصفحة الشحنات (حالياً يعيد توجيه لـ HomePage)
- ✅ الـ routes تستقبل البيانات من صفحات أخرى عبر arguments

## البيانات من Backend

### البيانات المستخدمة حالياً:
```javascript
// من User Schema في Backend
{
  fullname: String,      // اسم المستخدم الكامل
  username: String,      // اسم المستخدم
  email: String,         // البريد الإلكتروني
  phone: String,         // رقم الهاتف
  type: String,          // نوع المستخدم (client/employee)
  clientDetails: {
    clientType: String,  // نوع العميل (commercial/factory/personal)
    ssn: String          // الرقم القومي
  }
}
```

### البيانات المطلوبة مستقبلاً من Backend:

#### 1. API لإحصائيات المستخدم
```javascript
// GET /api/users/:userId/statistics
Response: {
  totalShipments: Number,     // إجمالي الشحنات
  activeShipments: Number,    // الشحنات النشطة
  completedShipments: Number, // الشحنات المكتملة
  pendingShipments: Number    // الشحنات قيد الانتظار
}
```

#### 2. API للشحنات الحالية
```javascript
// GET /api/users/:userId/shipments/recent
Response: {
  shipments: [
    {
      id: String,
      trackingNumber: String,
      name: String,
      polNumber: String,         // رقم البوليصة
      status: String,
      isUrgent: Boolean,
      createdAt: Date,
      estimatedDelivery: Date
    }
  ]
}
```

#### 3. API للبحث عن شحنة
```javascript
// GET /api/shipments/track/:trackingNumber
Response: {
  shipment: {
    id: String,
    trackingNumber: String,
    sender: Object,
    receiver: Object,
    origin: String,
    destination: String,
    status: String,
    updates: Array
  }
}
```

## الملفات المتأثرة

```
Mobile Application/
├── lib/
│   ├── main.dart                          [تم التحديث]
│   ├── features/
│   │   ├── auth/
│   │   │   └── login_page.dart           [تم التحديث]
│   │   └── home/
│   │       └── homePage.dart              [تم التحديث بشكل كامل]
│   └── Pop-ups/
│       └── al_noran_popups.dart           [مستخدم]
```

## خطوات التشغيل

### 1. تشغيل Backend:
```bash
cd "c:\Al Noran\Al-Noran-System-Development\Web\backend"
npm start
```

### 2. تشغيل Flutter App:
```bash
cd "c:\Al Noran\Al-Noran-System-Development\Mobile Application"
flutter run
```

### 3. تسجيل الدخول:
- استخدم حساب موجود في قاعدة البيانات
- بعد تسجيل الدخول سيتم الانتقال تلقائياً لـ HomePage
- سيتم عرض اسم المستخدم في الشريط العلوي

## المهام المستقبلية (TODO)

### Backend Tasks:
- [ ] إنشاء API لإحصائيات المستخدم (`/api/users/:userId/statistics`)
- [ ] إنشاء API للشحنات الحالية (`/api/users/:userId/shipments/recent`)
- [ ] إنشاء API للبحث عن شحنة (`/api/shipments/track/:trackingNumber`)
- [ ] إنشاء Shipment Model في Backend
- [ ] إضافة علاقة بين User و Shipments

### Frontend Tasks:
- [ ] إنشاء Shipment Service في Flutter لاستدعاء APIs
- [ ] ربط قسم الإحصائيات مع Backend API
- [ ] ربط قسم الشحنات الحالية مع Backend API
- [ ] ربط البحث عن الشحنات مع Backend API
- [ ] إنشاء صفحة تفاصيل الشحنة الكاملة
- [ ] إنشاء صفحة الفواتير
- [ ] إنشاء صفحة إدارة المدفوعات
- [ ] إنشاء صفحة الملف الشخصي
- [ ] إنشاء صفحة الإعدادات

### UI/UX Improvements:
- [ ] إضافة Pull-to-Refresh للشحنات
- [ ] إضافة Loading States أثناء تحميل البيانات
- [ ] إضافة Empty States عندما لا توجد بيانات
- [ ] إضافة Shimmer Effect للتحميل
- [ ] تحسين الرسوم المتحركة (Animations)

## الميزات الحالية

### ✅ جاهزة للاستخدام:
1. ✅ تسجيل الدخول مع Backend
2. ✅ عرض بيانات المستخدم
3. ✅ قائمة جانبية
4. ✅ تسجيل الخروج
5. ✅ Bottom Navigation
6. ✅ UI/UX كامل ومتناسق

### ⏳ تحتاج Backend:
1. ⏳ الإحصائيات الحقيقية
2. ⏳ الشحنات الحالية الحقيقية
3. ⏳ البحث عن الشحنات
4. ⏳ تفاصيل الشحنة

## ملاحظات مهمة

1. **البيانات الحالية**: البيانات المعروضة في قسم الإحصائيات والشحنات هي بيانات تجريبية (Mock Data)
2. **الـ Routes**: تم إعداد الـ routing بشكل كامل وجاهز لإضافة صفحات جديدة
3. **Theme Colors**: تم استخدام نفس الألوان في كل المشروع:
   - Primary: `#690000`
   - Secondary: `#A40000`
   - Accent: `#1BA3B6`
4. **RTL Support**: كل الصفحات تدعم اللغة العربية بشكل كامل
5. **Cairo Font**: جاهز للتفعيل عند إضافة ملفات الخط

## اختبار التكامل

### Test Flow:
1. افتح التطبيق → Splash Screen
2. انتظر 3 ثوان → Login Page
3. سجل الدخول → HomePage
4. شاهد اسمك في الشريط العلوي ✅
5. اضغط على القائمة → تظهر القائمة الجانبية ✅
6. اضغط على خدمة → تظهر رسالة ✅
7. اضغط على شحنة → تظهر التفاصيل ✅
8. اضغط على "تسجيل الخروج" → يطلب تأكيد → يعود للـ Login ✅

## الدعم والمساعدة

إذا كان هناك أي مشكلة أو تحتاج تعديلات إضافية، يمكن:
1. التحقق من الـ Console للأخطاء
2. التأكد من أن Backend يعمل
3. التأكد من أن البيانات ترجع بشكل صحيح من API
4. مراجعة الـ API Service في `lib/core/network/api_service.dart`

---

**تاريخ التحديث**: 21 أكتوبر 2025
**الحالة**: ✅ جاهز للاستخدام (مع بيانات تجريبية)
**التكامل مع Backend**: ⏳ قيد التطوير (يحتاج APIs جديدة)
