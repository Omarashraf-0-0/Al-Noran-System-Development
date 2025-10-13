## 🚨 حل مشكلة "السيرفر مش شغال"

### المشكلة:
Flutter مش قادر يتصل بـ Node.js server على الرغم من إن السيرفر شغال.

### السبب:
**Android Emulator** مش بيقدر يتصل بـ `localhost` أو `127.0.0.1` بشكل مباشر!

---

## ✅ الحل النهائي (3 خطوات):

### خطوة 1: شغّل السيرفر
افتح **PowerShell منفصل** (خارج VS Code):

```powershell
cd "c:\Al Noran\Al-Noran-System-Development\Web\backend"
npm start
```

**اترك النافذة مفتوحة!**

---

### خطوة 2: تأكد من baseURL في Flutter
الكود تم تعديله تلقائياً ليستخدم:

**للـ Android Emulator:**
```
http://10.0.2.2:3500
```

**للـ Chrome/Web:**
```
http://localhost:3500
```

---

### خطوة 3: أعد تشغيل Flutter
```powershell
# أوقف التطبيق الحالي (اضغط Ctrl+C في terminal)
# ثم شغّله من جديد:
flutter run
```

**أو:**

إذا كان التطبيق شغال، اعمل **Hot Restart**:
- اضغط `R` في terminal Flutter
- أو اضغط على زر Restart في IDE

---

## 🔍 التحقق من الاتصال:

### 1. تأكد إن السيرفر شغال:
في PowerShell جديد:
```powershell
curl http://localhost:3500
```

يجب أن ترى صفحة HTML أو response من السيرفر.

---

### 2. جرب Login:
استخدم أي email/password، حتى لو خطأ، عشان تشوف:

**لو قال "Invalid credentials"** ← ✅ الاتصال شغال!  
**لو قال "خطأ في الاتصال"** ← ❌ المشكلة لسه موجودة

---

## 🛠️ لو المشكلة لسه موجودة:

### الحل البديل: استخدم IP Address بتاع الكمبيوتر

#### 1. اعرف IP بتاعك:
```powershell
ipconfig
```

ابحث عن **IPv4 Address** تحت WiFi Adapter  
مثال: `192.168.1.100`

#### 2. عدّل `api_service.dart`:
```dart
// للـ Android Emulator والأجهزة الحقيقية
if (Platform.isAndroid) {
  return 'http://192.168.1.100:3500'; // ضع IP بتاعك هنا
}
```

#### 3. تأكد إن Windows Firewall بيسمح:
```powershell
# افتح PowerShell كـ Administrator
New-NetFirewallRule -DisplayName "Node.js Server" -Direction Inbound -LocalPort 3500 -Protocol TCP -Action Allow
```

---

## 📱 اختبار سريع:

### من Chrome (في الكمبيوتر):
افتح المتصفح واكتب:
```
http://localhost:3500
```

يجب أن تشوف صفحة أو response.

### من Flutter Web:
```powershell
flutter run -d chrome
```

ده أسهل طريقة للاختبار لأن Chrome بيستخدم `localhost` مباشرة.

---

## ✨ نصيحة:

**استخدم Chrome للتجربة الأولى** عشان تتأكد إن كل حاجة شغالة، بعدين انتقل للـ Android Emulator.

```powershell
flutter run -d chrome
```

---

**جرب الخطوات دي وقولي النتيجة! 🚀**
