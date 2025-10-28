import 'package:flutter/material.dart';
import '../theme/colors.dart';

/// أنواع الـ Pop-ups
enum PopupType { success, error, warning, info, question }

/// خدمة Pop-ups مخصصة لتطبيق النوران
class AlNoranPopups {
  /// عرض Dialog بسيط مع أيقونة وعنوان ورسالة
  static Future<void> show({
    required BuildContext context,
    required PopupType type,
    required String title,
    required String message,
    String? buttonText,
    VoidCallback? onPressed,
  }) async {
    // اختيار اللون والأيقونة حسب النوع
    Color color;
    IconData icon;

    switch (type) {
      case PopupType.success:
        color = AlNoranColors.success;
        icon = AlNoranIcons.success;
        break;
      case PopupType.error:
        color = AlNoranColors.error;
        icon = AlNoranIcons.error;
        break;
      case PopupType.warning:
        color = AlNoranColors.warning;
        icon = AlNoranIcons.warning;
        break;
      case PopupType.info:
        color = AlNoranColors.info;
        icon = AlNoranIcons.info;
        break;
      case PopupType.question:
        color = AlNoranColors.primary;
        icon = AlNoranIcons.question;
        break;
    }

    return showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return Directionality(
          textDirection: TextDirection.rtl,
          child: AlertDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
            ),
            contentPadding: EdgeInsets.zero,
            content: Container(
              width: MediaQuery.of(context).size.width * 0.8,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                color: Colors.white,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // رأس الـ Dialog مع الأيقونة (بدون background)
                  Padding(
                    padding: const EdgeInsets.only(top: 32, bottom: 16),
                    child: Icon(icon, size: 72, color: color),
                  ),

                  const SizedBox(height: 8),

                  // العنوان
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Text(
                      title,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Cairo',
                        color: AlNoranColors.primary,
                      ),
                    ),
                  ),

                  const SizedBox(height: 12),

                  // الرسالة
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Text(
                      message,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 16,
                        fontFamily: 'Cairo',
                        color: AlNoranColors.grey,
                        height: 1.5,
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // الزر
                  Padding(
                    padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
                    child: SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.of(context).pop();
                          if (onPressed != null) {
                            onPressed();
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: color,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 0,
                        ),
                        child: Text(
                          buttonText ?? 'حسناً',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Cairo',
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  /// Pop-up للنجاح
  static Future<void> showSuccess({
    required BuildContext context,
    String title = 'نجح!',
    required String message,
    String? buttonText,
    VoidCallback? onPressed,
  }) {
    return show(
      context: context,
      type: PopupType.success,
      title: title,
      message: message,
      buttonText: buttonText,
      onPressed: onPressed,
    );
  }

  /// Pop-up للخطأ
  static Future<void> showError({
    required BuildContext context,
    String title = 'خطأ!',
    required String message,
    String? buttonText,
    VoidCallback? onPressed,
  }) {
    return show(
      context: context,
      type: PopupType.error,
      title: title,
      message: message,
      buttonText: buttonText,
      onPressed: onPressed,
    );
  }

  /// Pop-up للتحذير
  static Future<void> showWarning({
    required BuildContext context,
    String title = 'تحذير!',
    required String message,
    String? buttonText,
    VoidCallback? onPressed,
  }) {
    return show(
      context: context,
      type: PopupType.warning,
      title: title,
      message: message,
      buttonText: buttonText,
      onPressed: onPressed,
    );
  }

  /// Pop-up للمعلومات
  static Future<void> showInfo({
    required BuildContext context,
    String title = 'معلومة',
    required String message,
    String? buttonText,
    VoidCallback? onPressed,
  }) {
    return show(
      context: context,
      type: PopupType.info,
      title: title,
      message: message,
      buttonText: buttonText,
      onPressed: onPressed,
    );
  }

  /// Pop-up للتأكيد (بزرين: نعم / لا)
  static Future<bool> showConfirmation({
    required BuildContext context,
    String title = 'تأكيد',
    required String message,
    String confirmText = 'نعم',
    String cancelText = 'لا',
  }) async {
    return await showDialog<bool>(
          context: context,
          barrierDismissible: false,
          builder: (BuildContext context) {
            return Directionality(
              textDirection: TextDirection.rtl,
              child: AlertDialog(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
                contentPadding: EdgeInsets.zero,
                content: Container(
                  width: MediaQuery.of(context).size.width * 0.8,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    color: Colors.white,
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // رأس الـ Dialog (بدون background)
                      const Padding(
                        padding: EdgeInsets.only(top: 32, bottom: 16),
                        child: Icon(
                          AlNoranIcons.question,
                          size: 72,
                          color: AlNoranColors.primary,
                        ),
                      ),

                      const SizedBox(height: 8),

                      // العنوان
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: Text(
                          title,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Cairo',
                            color: AlNoranColors.primary,
                          ),
                        ),
                      ),

                      const SizedBox(height: 12),

                      // الرسالة
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: Text(
                          message,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 16,
                            fontFamily: 'Cairo',
                            color: AlNoranColors.grey,
                            height: 1.5,
                          ),
                        ),
                      ),

                      const SizedBox(height: 24),

                      // الأزرار
                      Padding(
                        padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
                        child: Row(
                          children: [
                            // زر الإلغاء
                            Expanded(
                              child: SizedBox(
                                height: 50,
                                child: OutlinedButton(
                                  onPressed: () {
                                    Navigator.of(context).pop(false);
                                  },
                                  style: OutlinedButton.styleFrom(
                                    side: const BorderSide(
                                      color: AlNoranColors.grey,
                                      width: 1.5,
                                    ),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                  ),
                                  child: Text(
                                    cancelText,
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      fontFamily: 'Cairo',
                                      color: AlNoranColors.grey,
                                    ),
                                  ),
                                ),
                              ),
                            ),

                            const SizedBox(width: 12),

                            // زر التأكيد
                            Expanded(
                              child: SizedBox(
                                height: 50,
                                child: ElevatedButton(
                                  onPressed: () {
                                    Navigator.of(context).pop(true);
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AlNoranColors.primary,
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    elevation: 0,
                                  ),
                                  child: Text(
                                    confirmText,
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      fontFamily: 'Cairo',
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ) ??
        false;
  }

  /// Alias for showConfirmation (for consistency)
  static Future<bool> showConfirmDialog({
    required BuildContext context,
    String title = 'تأكيد',
    required String message,
    String confirmText = 'نعم',
    String cancelText = 'لا',
  }) {
    return showConfirmation(
      context: context,
      title: title,
      message: message,
      confirmText: confirmText,
      cancelText: cancelText,
    );
  }

  /// Loading Dialog (شاشة تحميل)
  static void showLoading({
    required BuildContext context,
    String message = 'جاري التحميل...',
  }) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return WillPopScope(
          onWillPop: () async => false,
          child: Directionality(
            textDirection: TextDirection.rtl,
            child: Dialog(
              backgroundColor: Colors.transparent,
              elevation: 0,
              child: Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Custom Loading Animation
                    Stack(
                      alignment: Alignment.center,
                      children: [
                        // Outer Circle
                        SizedBox(
                          width: 70,
                          height: 70,
                          child: CircularProgressIndicator(
                            valueColor: const AlwaysStoppedAnimation<Color>(
                              AlNoranColors.primary,
                            ),
                            strokeWidth: 4,
                            backgroundColor: AlNoranColors.primary.withOpacity(
                              0.1,
                            ),
                          ),
                        ),
                        // Inner Icon/Logo
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: AlNoranColors.primary.withOpacity(0.1),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.flight_takeoff_rounded,
                            color: AlNoranColors.primary,
                            size: 24,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    Text(
                      message,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 16,
                        fontFamily: 'Cairo',
                        fontWeight: FontWeight.w600,
                        color: AlNoranColors.primary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'الرجاء الانتظار...',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 13,
                        fontFamily: 'Cairo',
                        color: AlNoranColors.grey.withOpacity(0.7),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  /// إغلاق Loading Dialog
  static void hideLoading(BuildContext context) {
    Navigator.of(context).pop();
  }

  /// SnackBar مخصص (رسالة سريعة في أسفل الشاشة)
  static void showSnackBar({
    required BuildContext context,
    required String message,
    PopupType type = PopupType.info,
    Duration duration = const Duration(seconds: 3),
  }) {
    Color backgroundColor;
    IconData icon;

    switch (type) {
      case PopupType.success:
        backgroundColor = AlNoranColors.success;
        icon = AlNoranIcons.success;
        break;
      case PopupType.error:
        backgroundColor = AlNoranColors.error;
        icon = AlNoranIcons.error;
        break;
      case PopupType.warning:
        backgroundColor = AlNoranColors.warning;
        icon = AlNoranIcons.warning;
        break;
      case PopupType.info:
        backgroundColor = AlNoranColors.info;
        icon = AlNoranIcons.info;
        break;
      case PopupType.question:
        backgroundColor = AlNoranColors.primary;
        icon = AlNoranIcons.question;
        break;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(icon, color: Colors.white),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(fontFamily: 'Cairo', fontSize: 14),
              ),
            ),
          ],
        ),
        backgroundColor: backgroundColor,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        duration: duration,
        margin: const EdgeInsets.all(16),
      ),
    );
  }
}
