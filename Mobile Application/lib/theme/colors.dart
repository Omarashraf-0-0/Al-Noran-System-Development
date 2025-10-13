import 'package:flutter/material.dart';

/// ألوان ثيم النوران
class AlNoranColors {
  // الألوان الأساسية
  static const Color primary = Color(0xFF690000); // الأحمر الغامق
  static const Color primaryLight = Color(0xFFa40000); // أحمر فاتح شوية
  static const Color primaryDark = Color(0xFF4a0000); // أحمر أغمق

  // ألوان الحالات
  static const Color success = Color(0xFF28a745); // أخضر للنجاح
  static const Color error = Color(0xFFdc3545); // أحمر للخطأ
  static const Color warning = Color(0xFFffc107); // أصفر للتحذير
  static const Color info = Color(0xFF17a2b8); // أزرق للمعلومات

  // ألوان محايدة
  static const Color white = Color(0xFFFFFFFF);
  static const Color black = Color(0xFF000000);
  static const Color grey = Color(0xFF757575);
  static const Color greyLight = Color(0xFFBDBDBD);
  static const Color greyBg = Color(0xFFF5F5F5);
}

/// أيقونات مخصصة للحالات المختلفة
class AlNoranIcons {
  static const IconData success = Icons.check_circle;
  static const IconData error = Icons.error;
  static const IconData warning = Icons.warning;
  static const IconData info = Icons.info;
  static const IconData question = Icons.help;
}
