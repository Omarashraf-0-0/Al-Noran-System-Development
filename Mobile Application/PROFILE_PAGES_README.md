# Profile & Profile Settings Pages

## تم إنشاء صفحتين جديدتين:

### 1️⃣ صفحة الملف الشخصي (ProfilePage)
**المسار:** `lib/features/profile/profile_page.dart`

**الوظيفة:**
- عرض جميع بيانات العميل الشخصية
- عرض معلومات الشركة (إن وجدت)
- عرض جميع المستندات المرفوعة من العميل
- زر تسجيل خروج

**المميزات:**
- ✅ Pull-to-refresh لتحديث البيانات
- ✅ عرض نوع الحساب (مصنع / تجاري / فردي)
- ✅ عرض المستندات حسب النوع (PDF / صورة)
- ✅ تصميم متجاوب مع الديزاين الأساسي للتطبيق

---

### 2️⃣ صفحة إعدادات الملف الشخصي (ProfileSettingsPage)
**المسار:** `lib/features/profile/profile_settings_page.dart`

**الوظيفة:**
- تعديل المعلومات الشخصية (الاسم - البريد - الهاتف - الرقم القومي)
- تعديل معلومات الشركة (اسم الشركة - السجل التجاري - البطاقة الضريبية - العنوان)
- تغيير كلمة المرور

**المميزات:**
- ✅ Validation كامل على جميع الحقول
- ✅ حفظ التعديلات في SecureStorage تلقائياً
- ✅ عدم السماح بتغيير اسم المستخدم (Username)
- ✅ إخفاء/إظهار كلمة المرور
- ✅ تأكيد كلمة المرور الجديدة

---

## 🔧 التعديلات على الملفات الموجودة:

### 1. ApiService (`lib/core/network/api_service.dart`)
**تم إضافة 4 Methods جديدة:**

```dart
// 1. جلب المستندات المرفوعة للعميل
static Future<Map<String, dynamic>> getUploads({
  required String userId,
  String? category,
})

// 2. تحديث البيانات الشخصية
static Future<Map<String, dynamic>> updateUserProfile({
  required String userId,
  String? fullname,
  String? email,
  String? phone,
  String? nationalId,
})

// 3. تحديث معلومات الشركة
static Future<Map<String, dynamic>> updateClientDetails({
  required String userId,
  String? companyName,
  String? commercialRegisterNumber,
  String? taxCardNumber,
  String? address,
})

// 4. تغيير كلمة المرور
static Future<Map<String, dynamic>> changePassword({
  required String userId,
  required String currentPassword,
  required String newPassword,
})
```

---

### 2. SecureStorage (`lib/core/storage/secure_storage.dart`)
**تم إنشاء Class كامل للتعامل مع التخزين:**

```dart
class SecureStorage {
  // حفظ وجلب Token
  static Future<void> saveToken(String token)
  static Future<String?> getToken()
  static Future<void> deleteToken()
  
  // حفظ وجلب بيانات المستخدم (JSON)
  static Future<void> saveUserData(Map<String, dynamic> userData)
  static Future<Map<String, dynamic>?> getUserData()
  static Future<void> deleteUserData()
  
  // مساعدة
  static Future<void> clearAll()
  static Future<bool> isLoggedIn()
}
```

---

### 3. HomePage (`lib/features/home/homePage.dart`)
**تم إضافة كارتين جديدين في قسم الخدمات:**

```dart
// كارت الملف الشخصي
_buildServiceCard(
  'الملف الشخصي',
  Icons.person_outline,
  onTap: () => Navigator.push(context, ProfilePage()),
)

// كارت إعدادات الحساب
_buildServiceCard(
  'إعدادات الحساب',
  Icons.settings_outlined,
  onTap: () => Navigator.push(context, ProfileSettingsPage()),
)
```

---

### 4. AlNoranPopups (`lib/Pop-ups/al_noran_popups.dart`)
**تم إضافة Alias جديد:**

```dart
// Alias للـ showConfirmation
static Future<bool> showConfirmDialog({...})
```

---

## 📋 المتطلبات من الـ Backend:

### يجب توفير الـ Endpoints التالية:

#### 1. GET `/api/uploads/user/:userId`
- **Query Parameters:** `?category=registration` (اختياري)
- **Response:**
```json
{
  "success": true,
  "uploads": [
    {
      "filename": "contract.pdf",
      "documentType": "contract",
      "mimetype": "application/pdf",
      "uploadedAt": "2025-01-01T10:00:00Z"
    }
  ]
}
```

#### 2. PUT `/api/users/:userId`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
```json
{
  "fullname": "أحمد محمد",
  "email": "ahmed@example.com",
  "phone": "01234567890",
  "nationalId": "12345678901234"
}
```

#### 3. PUT `/api/users/:userId/client-details`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
```json
{
  "companyName": "شركة النوران",
  "commercialRegisterNumber": "123456",
  "taxCardNumber": "789456",
  "address": "القاهرة - مصر"
}
```

#### 4. PUT `/api/users/:userId/change-password`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

---

## 🎨 التصميم:

- **الألوان:** متناسقة مع الديزاين الأساسي
  - Primary: `#690000` (أحمر داكن)
  - Secondary: `#1ba3b6` (أزرق)
  - Background: `#F5F5F5` (رمادي فاتح)

- **الخطوط:** Cairo (عربي)

- **المكونات:**
  - Cards بظلال خفيفة
  - Rounded borders (12-16px)
  - Icons مع background دائري شفاف
  - Buttons بارتفاع 50px

---

## ✅ الحالة النهائية:

- ✅ **لا توجد أخطاء Compile**
- ✅ **التصميم متسق مع HomePage**
- ✅ **الـ Structure منظم ومرتب**
- ✅ **Error Handling موجود في جميع الوظائف**
- ✅ **Loading States موجودة**
- ✅ **Validation كامل**

---

## 🚀 كيفية الاستخدام:

1. **من HomePage:** اضغط على كارت "الملف الشخصي" أو "إعدادات الحساب"

2. **في ProfilePage:**
   - اسحب لأسفل للتحديث (Pull to Refresh)
   - اضغط على أيقونة الخروج للـ Logout

3. **في ProfileSettingsPage:**
   - عدّل البيانات المطلوبة
   - اضغط "حفظ" لحفظ القسم المعدل
   - لتغيير كلمة المرور: أدخل القديمة والجديدة واضغط "تغيير"

---

## 🔒 الأمان:

- ✅ كل الطلبات تتطلب JWT Token
- ✅ كلمات المرور لا تُحفظ في الذاكرة
- ✅ البيانات الحساسة في SecureStorage (SharedPreferences)
- ✅ Logout يحذف جميع البيانات المحفوظة

---

تم التطوير بنجاح! 🎉
