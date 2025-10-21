# ✅ نظام التحقق من الصحة (Validation) - النوران

## 📋 المتطلبات

### 1. البريد الإلكتروني (Email)
- ✅ يقبل Capital و Small (case-insensitive)
- ✅ يتم تحويل الإيميل إلى lowercase قبل الإرسال للـ Backend

### 2. رقم الهاتف المصري
- ✅ Validation باستخدام Regular Expression
- ✅ يدعم الشبكات المصرية: Vodafone, Etisalat, Orange, WE

### 3. الرقم القومي المصري
- ✅ Validation باستخدام Regular Expression
- ✅ التحقق من بنية الرقم (14 رقم)
- ✅ التحقق من القرن، التاريخ، والمحافظة

---

## 📁 الملفات المنشأة/المحدثة

### 1. **lib/util/validators.dart** ✨ جديد
ملف شامل لكل عمليات التحقق من الصحة

### 2. **lib/features/auth/register_page.dart** ✅ محدث
- استخدام Validators الجديدة
- تحويل الإيميل إلى lowercase

### 3. **lib/features/auth/login_page.dart** ✅ محدث
- تحويل الإيميل إلى lowercase

---

## 🔧 الدوال المتاحة في `AlNoranValidators`

### 1. `isValidEmail(String email)` 📧
#### الوصف:
التحقق من صحة البريد الإلكتروني (Case-Insensitive)

#### المميزات:
- ✅ يقبل Capital و Small
- ✅ يزيل المسافات من الأطراف
- ✅ Regular Expression دقيق

#### مثال:
```dart
// كل هذه صحيحة:
AlNoranValidators.isValidEmail('Omar@Gmail.com');      // ✅ true
AlNoranValidators.isValidEmail('OMAR@GMAIL.COM');      // ✅ true
AlNoranValidators.isValidEmail('omar@gmail.com');      // ✅ true
AlNoranValidators.isValidEmail('Omar.Ahmed@gmail.com'); // ✅ true

// خاطئة:
AlNoranValidators.isValidEmail('omar@gmail');          // ❌ false
AlNoranValidators.isValidEmail('omar.gmail.com');      // ❌ false
```

---

### 2. `isValidEgyptianPhone(String phone)` 📱
#### الوصف:
التحقق من صحة رقم الهاتف المصري

#### الصيغ المقبولة:
```
✅ 01012345678        (11 رقم)
✅ 01112345678        (Etisalat)
✅ 01212345678        (Orange)
✅ 01512345678        (WE)
✅ +2001012345678     (مع كود الدولة)
✅ 002001012345678    (مع البريفيكس الدولي)
```

#### الشبكات المدعومة:
- **010**: Vodafone 📶
- **011**: Etisalat 📡
- **012**: Orange 🍊
- **015**: WE 💙

#### مثال:
```dart
AlNoranValidators.isValidEgyptianPhone('01012345678');    // ✅ true
AlNoranValidators.isValidEgyptianPhone('01112345678');    // ✅ true
AlNoranValidators.isValidEgyptianPhone('+2001012345678'); // ✅ true

// خاطئة:
AlNoranValidators.isValidEgyptianPhone('0102345678');     // ❌ false (10 digits)
AlNoranValidators.isValidEgyptianPhone('01312345678');    // ❌ false (013 not valid)
AlNoranValidators.isValidEgyptianPhone('02012345678');    // ❌ false (doesn't start with 01)
```

---

### 3. `isValidEgyptianNationalId(String nationalId)` 🆔
#### الوصف:
التحقق من صحة الرقم القومي المصري

#### البنية (14 رقم):
```
X YY MM DD SS GGG C
│ │  │  │  │  │   └─ Check digit
│ │  │  │  │  └───── Sequence number (001-999)
│ │  │  │  └──────── Governorate code (01-35)
│ │  │  └─────────── Day (01-31)
│ │  └────────────── Month (01-12)
│ └───────────────── Year (00-99)
└────────────────── Century (2=1900s, 3=2000s)
```

#### مثال:
```
29912011234567
││││││││││││││
│││││││││││││└─ Check digit: 7
││││││││││└──── Sequence: 456
││││││└──────── Governorate: 12 (Cairo)
│││││└───────── Day: 01
││││└────────── Month: 12
│└──────────── Year: 99 (1999)
└───────────── Century: 2 (1900s)
```

#### التحققات:
- ✅ 14 رقم بالضبط
- ✅ أرقام فقط
- ✅ يبدأ بـ 2 أو 3
- ✅ الشهر (01-12)
- ✅ اليوم (01-31)
- ✅ كود المحافظة (01-35)

#### مثال:
```dart
AlNoranValidators.isValidEgyptianNationalId('29912011234567'); // ✅ true
AlNoranValidators.isValidEgyptianNationalId('30001011234567'); // ✅ true (2000s)

// خاطئة:
AlNoranValidators.isValidEgyptianNationalId('2991201123456');  // ❌ false (13 digits)
AlNoranValidators.isValidEgyptianNationalId('19912011234567'); // ❌ false (starts with 1)
AlNoranValidators.isValidEgyptianNationalId('29913011234567'); // ❌ false (invalid month: 13)
AlNoranValidators.isValidEgyptianNationalId('29912401234567'); // ❌ false (invalid governorate: 40)
```

---

### 4. `getPhoneErrorMessage(String phone)` 💬
#### الوصف:
الحصول على رسالة خطأ مفصلة لرقم الهاتف

#### الرسائل:
- "من فضلك أدخل رقم الهاتف"
- "رقم الهاتف قصير جداً"
- "رقم الهاتف طويل جداً"
- "رقم الهاتف يجب أن يبدأ بـ 01"
- "رقم الهاتف غير صحيح (يجب أن يكون 010, 011, 012, أو 015)"

#### مثال:
```dart
print(AlNoranValidators.getPhoneErrorMessage('0102345678'));
// Output: "رقم الهاتف قصير جداً"

print(AlNoranValidators.getPhoneErrorMessage('01312345678'));
// Output: "رقم الهاتف غير صحيح (يجب أن يكون 010, 011, 012, أو 015)"
```

---

### 5. `getNationalIdErrorMessage(String nationalId)` 💬
#### الوصف:
الحصول على رسالة خطأ مفصلة للرقم القومي

#### الرسائل:
- "من فضلك أدخل الرقم القومي"
- "الرقم القومي يجب أن يكون 14 رقم"
- "الرقم القومي يجب أن يحتوي على أرقام فقط"
- "الرقم القومي يجب أن يبدأ بـ 2 أو 3"
- "الشهر في الرقم القومي غير صحيح"
- "اليوم في الرقم القومي غير صحيح"
- "كود المحافظة في الرقم القومي غير صحيح"

#### مثال:
```dart
print(AlNoranValidators.getNationalIdErrorMessage('2991201123456'));
// Output: "الرقم القومي يجب أن يكون 14 رقم"

print(AlNoranValidators.getNationalIdErrorMessage('29913011234567'));
// Output: "الشهر في الرقم القومي غير صحيح"
```

---

### 6. `normalizeEmail(String email)` 🔄
#### الوصف:
تحويل الإيميل إلى lowercase وإزالة المسافات

#### مثال:
```dart
AlNoranValidators.normalizeEmail('Omar@Gmail.COM  ');
// Output: "omar@gmail.com"

AlNoranValidators.normalizeEmail('  AHMED@YAHOO.COM');
// Output: "ahmed@yahoo.com"
```

---

### 7. `formatEgyptianPhone(String phone)` 📞
#### الوصف:
تنسيق رقم الهاتف للعرض

#### مثال:
```dart
AlNoranValidators.formatEgyptianPhone('01012345678');
// Output: "0101 234 5678"
```

---

### 8. `formatNationalId(String nationalId)` 🎫
#### الوصف:
تنسيق الرقم القومي للعرض

#### مثال:
```dart
AlNoranValidators.formatNationalId('29912011234567');
// Output: "2-991201-1234567"
```

---

## 🎯 الاستخدام في التطبيق

### في صفحة التسجيل (register_page.dart):
```dart
// Email Validation
if (!AlNoranValidators.isValidEmail(_emailController.text)) {
  AlNoranPopups.showError(
    context: context,
    message: 'البريد الإلكتروني غير صحيح',
  );
  return;
}

// Phone Validation
if (!AlNoranValidators.isValidEgyptianPhone(_phoneController.text)) {
  AlNoranPopups.showError(
    context: context,
    message: AlNoranValidators.getPhoneErrorMessage(_phoneController.text),
  );
  return;
}

// National ID Validation
if (!AlNoranValidators.isValidEgyptianNationalId(_ssnController.text)) {
  AlNoranPopups.showError(
    context: context,
    message: AlNoranValidators.getNationalIdErrorMessage(_ssnController.text),
  );
  return;
}

// Normalize Email before sending to API
final result = await ApiService.register(
  email: AlNoranValidators.normalizeEmail(_emailController.text),
  // ... other fields
);
```

### في صفحة تسجيل الدخول (login_page.dart):
```dart
// Normalize Email
final result = await ApiService.login(
  email: AlNoranValidators.normalizeEmail(_emailController.text),
  password: _passwordController.text.trim(),
);
```

---

## 📊 أمثلة عملية

### مثال 1: التسجيل
```dart
// المستخدم يدخل:
Email: Omar@Gmail.COM
Phone: 01012345678
National ID: 29912011234567

// التحقق:
✅ Email valid (case-insensitive)
✅ Phone valid (Vodafone)
✅ National ID valid

// يتم الإرسال:
Email: omar@gmail.com (normalized)
Phone: 01012345678
National ID: 29912011234567
```

### مثال 2: أخطاء شائعة
```dart
// خطأ في الهاتف
Phone: 0102345678  // ❌ قصير جداً
Message: "رقم الهاتف قصير جداً"

// خطأ في الرقم القومي
National ID: 2991301123456  // ❌ شهر غير صحيح
Message: "الشهر في الرقم القومي غير صحيح"
```

---

## 🔍 Regular Expressions المستخدمة

### Email:
```regex
^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$
```

### Egyptian Phone:
```regex
# Pattern 1: 01[0125][0-9]{8}
^01[0125][0-9]{8}$

# Pattern 2: +2001[0125][0-9]{8}
^\+2001[0125][0-9]{8}$

# Pattern 3: 002001[0125][0-9]{8}
^002001[0125][0-9]{8}$
```

### Egyptian National ID:
```regex
^[0-9]{14}$
```
مع تحققات إضافية:
- Century: 2 أو 3
- Month: 01-12
- Day: 01-31
- Governorate: 01-35

---

## ✅ الملخص

### التحديثات المنفذة:
1. ✅ إنشاء ملف `validators.dart` شامل
2. ✅ تحديث `register_page.dart`
3. ✅ تحديث `login_page.dart`

### المميزات:
- ✅ Email case-insensitive
- ✅ Phone validation للشبكات المصرية
- ✅ National ID validation كامل
- ✅ رسائل خطأ واضحة
- ✅ Normalization للإيميل
- ✅ Format functions للعرض

### النتيجة:
🎉 **نظام validation احترافي ومتكامل لمصر!**

---

## 📝 ملاحظات مهمة

### للـ Backend:
⚠️ تأكد أن الـ Backend يتعامل مع:
- Email بـ lowercase
- Phone في الصيغ المختلفة
- National ID بـ 14 رقم

### للمستقبل:
- يمكن إضافة validation لدول أخرى
- يمكن إضافة format للعرض
- يمكن إضافة auto-format أثناء الكتابة

---

**✨ الآن التطبيق يدعم التحقق الكامل من البيانات المصرية!**
