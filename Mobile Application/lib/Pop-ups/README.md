# 🎨 Pop-ups System - Quick Reference

## استخدام سريع:

```dart
// 1. Import
import 'package:your_app/Pop-ups/al_noran_popups.dart';

// 2. استخدم في أي مكان:

// ✅ نجاح
AlNoranPopups.showSuccess(
  context: context,
  message: 'تمت العملية بنجاح',
);

// ❌ خطأ
AlNoranPopups.showError(
  context: context,
  message: 'حدث خطأ',
);

// ⚠️ تحذير
AlNoranPopups.showWarning(
  context: context,
  message: 'انتبه!',
);

// ℹ️ معلومة
AlNoranPopups.showInfo(
  context: context,
  message: 'معلومة مفيدة',
);

// ❓ تأكيد
final confirmed = await AlNoranPopups.showConfirmation(
  context: context,
  message: 'هل أنت متأكد؟',
);

// ⏳ تحميل
AlNoranPopups.showLoading(context: context);
await someAsyncOperation();
AlNoranPopups.hideLoading(context);

// 💬 رسالة سريعة
AlNoranPopups.showSnackBar(
  context: context,
  message: 'تم الحفظ',
  type: PopupType.success,
);
```

## الألوان:
- 🔴 Primary: #690000 (أحمر النوران)
- 🟢 Success: #28a745
- 🔴 Error: #dc3545
- 🟡 Warning: #ffc107
- 🔵 Info: #17a2b8
