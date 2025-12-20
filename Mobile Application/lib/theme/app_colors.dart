import 'package:flutter/material.dart';

/// نظام الألوان الموحد لتطبيق النوران
/// Al-Noran Unified Color System
class AppColors {
  // ==================== Primary Colors ====================
  /// اللون الرئيسي - Burgundy Red
  static const Color primary = Color(0xFF690000);
  static const Color primaryLight = Color(0xFFa40000);
  static const Color primaryDark = Color(0xFF4a0000);
  static const Color primaryAlternative = Color(0xFF8B0000);

  // ==================== Accent Colors ====================
  /// اللون الثانوي - Turquoise Blue
  static const Color accent = Color(0xFF1ba3b6);
  static const Color accentDark = Color(0xFF16879a);
  static const Color accentLight = Color(0xFF06B6D4);

  // ==================== Neutral Colors ====================
  static const Color white = Color(0xFFFFFFFF);
  static const Color black = Color(0xFF000000);
  static const Color background = Color(0xFFF5F5F5);
  static const Color cardBackground = Color(0xFFFFFFFF);

  // Text Colors
  static const Color textDark = Color(0xFF2D2D2D);
  static const Color textMedium = Color(0xFF424242);
  static const Color textLight = Color(0xFF757575);
  static const Color textGrey = Color(0xFF9E9E9E);

  // Borders & Dividers
  static const Color greyLight = Color(0xFFBDBDBD);
  static const Color greyBorder = Color(0xFFE0E0E0);
  static const Color divider = Color(0xFFE0E0E0);

  // ==================== Status Colors ====================
  static const Color success = Color(0xFF28a745);
  static const Color error = Color(0xFFdc3545);
  static const Color warning = Color(0xFFffc107);
  static const Color info = Color(0xFF17a2b8);

  // ==================== Shipment Status Colors ====================
  static const Color statusWaitingShipment = Colors.orange; // في انتظار الشحن
  static const Color statusInTransit = Colors.blue; // في الطريق
  static const Color statusArrived = Colors.cyan; // تم وصول البضاعة
  static const Color statusWaitingPermission =
      Colors.amber; // في انتظار وصول الإذن
  static const Color statusPermissionReceived = Colors.teal; // تم وصول الإذن
  static const Color statusCustomsClearance =
      Colors.deepOrange; // التخليص الجمركي
  static const Color statusInserting = Colors.indigo; // جاري إدراج الشحنة
  static const Color statusInspection = Colors.purple; // جاري الكشف والتثمين
  static const Color statusCompleted = Colors.lightGreen; // مكتملة
  static const Color statusSuccess = Colors.green; // تمت بنجاح

  // ==================== Shipment Type Colors ====================
  static const Color seaShipment = accent; // بحري
  static const Color airShipment = Color(0xFFE65100); // جوي
  static const Color landShipment = Color(0xFF8D6E63); // بري

  // ==================== Notification Colors ====================
  static const Color notificationShipment = Color(0xFF3B82F6); // أزرق
  static const Color notificationAcid = Color(0xFF8B5CF6); // بنفسجي
  static const Color notificationPayment = Color(0xFFF59E0B); // أصفر برتقالي
  static const Color notificationDocument = Color(0xFF10B981); // أخضر
  static const Color notificationSystem = primary; // أحمر غامق
  static const Color notificationExport = Color(0xFF06B6D4); // سماوي

  // ==================== Document Status Colors ====================
  static const Color documentApproved = Colors.green;
  static const Color documentPending = Colors.orange;
  static const Color documentRejected = Colors.red;
  static const Color documentNotUploaded = Colors.grey;

  // ==================== Payment Status Colors ====================
  static const Color paymentPaid = Colors.green;
  static const Color paymentUnpaid = primary;
  static const Color paymentOverdue = Colors.red;

  // ==================== Gradients ====================
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primary, primaryAlternative],
    begin: Alignment.topRight,
    end: Alignment.bottomLeft,
  );

  static const LinearGradient accentGradient = LinearGradient(
    colors: [accent, accentDark],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static LinearGradient backgroundGradient = LinearGradient(
    colors: [accent.withOpacity(0.05), accent.withOpacity(0.02)],
  );

  // ==================== Shadows ====================
  static List<BoxShadow> cardShadow = [
    BoxShadow(
      color: Colors.black.withOpacity(0.03),
      blurRadius: 8,
      offset: const Offset(0, 2),
    ),
  ];

  static List<BoxShadow> elevatedShadow = [
    BoxShadow(
      color: Colors.black.withOpacity(0.1),
      blurRadius: 15,
      offset: const Offset(0, 5),
    ),
  ];

  static List<BoxShadow> accentShadow = [
    BoxShadow(
      color: primary.withOpacity(0.3),
      blurRadius: 8,
      offset: const Offset(0, 4),
    ),
  ];

  // ==================== Helper Methods ====================
  /// الحصول على لون حالة الشحنة
  static Color getShipmentStatusColor(int status) {
    switch (status) {
      case 1:
        return statusWaitingShipment;
      case 2:
        return statusInTransit;
      case 3:
        return statusArrived;
      case 4:
        return statusWaitingPermission;
      case 5:
        return statusPermissionReceived;
      case 6:
        return statusCustomsClearance;
      case 7:
        return statusInserting;
      case 8:
        return statusInspection;
      case 9:
        return statusCompleted;
      case 10:
        return statusSuccess;
      default:
        return textGrey;
    }
  }

  /// الحصول على لون نوع الشحن
  static Color getShipmentTypeColor(String type) {
    switch (type.toLowerCase()) {
      case 'sea':
      case 'بحري':
        return seaShipment;
      case 'air':
      case 'جوي':
        return airShipment;
      case 'land':
      case 'بري':
        return landShipment;
      default:
        return textGrey;
    }
  }
}
