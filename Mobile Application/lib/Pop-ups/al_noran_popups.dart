import 'package:flutter/material.dart';

/// أنواع الـ Pop-ups
enum PopupType { success, error, warning, info, question }

/// Premium Theme Colors for Popups
class _PopupColors {
  static const Color primary = Color(0xFF690000);
  static const Color primaryLight = Color(0xFF8B0000);
  static const Color gold = Color(0xFFD4AF37);
  static const Color success = Color(0xFF10B981);
  static const Color error = Color(0xFFEF4444);
  static const Color warning = Color(0xFFF59E0B);
  static const Color info = Color(0xFF3B82F6);

  // Dark Mode Colors
  static const Color darkBackground = Color(0xFF1E1E1E);
  static const Color darkCard = Color(0xFF252525);
  static const Color darkText = Color(0xFFE0E0E0);
  static const Color darkBorder = Color(0xFF3D3D3D);
}

/// خدمة Pop-ups مخصصة لتطبيق النوران - Premium Design
class AlNoranPopups {
  /// عرض Dialog بسيط مع أيقونة وعنوان ورسالة - Premium
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
    List<Color> gradientColors;

    switch (type) {
      case PopupType.success:
        color = _PopupColors.success;
        icon = Icons.check_circle_rounded;
        gradientColors = [_PopupColors.success, const Color(0xFF059669)];
        break;
      case PopupType.error:
        color = _PopupColors.error;
        icon = Icons.cancel_rounded;
        gradientColors = [_PopupColors.error, const Color(0xFFDC2626)];
        break;
      case PopupType.warning:
        color = _PopupColors.warning;
        icon = Icons.warning_rounded;
        gradientColors = [_PopupColors.warning, const Color(0xFFD97706)];
        break;
      case PopupType.info:
        color = _PopupColors.info;
        icon = Icons.info_rounded;
        gradientColors = [_PopupColors.info, const Color(0xFF2563EB)];
        break;
      case PopupType.question:
        color = _PopupColors.primary;
        icon = Icons.help_rounded;
        gradientColors = [_PopupColors.primary, _PopupColors.primaryLight];
        break;
    }

    // Check if dark mode
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardColor = isDark ? _PopupColors.darkCard : Colors.white;
    final textColor = isDark ? _PopupColors.darkText : const Color(0xFF1A1A1A);
    final subtitleColor = isDark ? Colors.grey.shade400 : Colors.grey.shade600;

    await showGeneralDialog(
      context: context,
      barrierDismissible: false,
      barrierLabel: '',
      barrierColor: Colors.black54,
      transitionDuration: const Duration(milliseconds: 300),
      pageBuilder: (context, animation, secondaryAnimation) {
        return Container();
      },
      transitionBuilder: (context, animation, secondaryAnimation, child) {
        final curvedAnimation = CurvedAnimation(
          parent: animation,
          curve: Curves.easeOutBack,
        );

        return ScaleTransition(
          scale: curvedAnimation,
          child: FadeTransition(
            opacity: animation,
            child: Directionality(
              textDirection: TextDirection.rtl,
              child: AlertDialog(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                ),
                contentPadding: EdgeInsets.zero,
                backgroundColor: cardColor,
                content: Container(
                  width: MediaQuery.of(context).size.width * 0.85,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(24),
                    color: cardColor,
                    border:
                        isDark
                            ? Border.all(
                              color: _PopupColors.darkBorder.withOpacity(0.3),
                            )
                            : null,
                    boxShadow: [
                      BoxShadow(
                        color:
                            isDark
                                ? Colors.black.withOpacity(0.4)
                                : color.withOpacity(0.2),
                        blurRadius: 20,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Compact Premium Header
                      Container(
                        padding: const EdgeInsets.symmetric(
                          vertical: 20,
                          horizontal: 24,
                        ),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors:
                                isDark
                                    ? [
                                      gradientColors[0].withOpacity(0.8),
                                      gradientColors[1].withOpacity(0.8),
                                    ]
                                    : gradientColors,
                            begin: Alignment.topRight,
                            end: Alignment.bottomLeft,
                          ),
                          borderRadius: const BorderRadius.only(
                            topLeft: Radius.circular(24),
                            topRight: Radius.circular(24),
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            // Compact Icon
                            Container(
                              width: 52,
                              height: 52,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.1),
                                    blurRadius: 10,
                                    spreadRadius: 1,
                                  ),
                                ],
                              ),
                              child: Icon(
                                icon,
                                size: 28,
                                color: gradientColors[0],
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Gold accent line
                      Container(
                        width: double.infinity,
                        height: 3,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              Colors.transparent,
                              _PopupColors.gold,
                              Colors.transparent,
                            ],
                          ),
                        ),
                      ),

                      const SizedBox(height: 24),

                      // Title
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: Text(
                          title,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Cairo',
                            color: textColor,
                          ),
                        ),
                      ),

                      const SizedBox(height: 12),

                      // Message
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: Text(
                          message,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 15,
                            fontFamily: 'Cairo',
                            color: subtitleColor,
                            height: 1.6,
                          ),
                        ),
                      ),

                      const SizedBox(height: 28),

                      // Premium Button with gradient
                      Padding(
                        padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
                        child: SizedBox(
                          width: double.infinity,
                          height: 52,
                          child: Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: gradientColors,
                                begin: Alignment.centerRight,
                                end: Alignment.centerLeft,
                              ),
                              borderRadius: BorderRadius.circular(14),
                              boxShadow: [
                                BoxShadow(
                                  color: color.withOpacity(0.4),
                                  blurRadius: 12,
                                  offset: const Offset(0, 6),
                                ),
                              ],
                            ),
                            child: ElevatedButton(
                              onPressed: () {
                                Navigator.of(context).pop();
                                if (onPressed != null) {
                                  onPressed();
                                }
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.transparent,
                                shadowColor: Colors.transparent,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(14),
                                ),
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
                      ),
                    ],
                  ),
                ),
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

  /// Pop-up للتأكيد (بزرين: نعم / لا) - Premium Design
  static Future<bool> showConfirmation({
    required BuildContext context,
    String title = 'تأكيد',
    required String message,
    String confirmText = 'نعم',
    String cancelText = 'لا',
    bool isDanger = false,
    Color? confirmColor,
  }) async {
    final primaryColor =
        confirmColor ?? (isDanger ? _PopupColors.error : _PopupColors.primary);
    final gradientColors =
        isDanger
            ? [_PopupColors.error, const Color(0xFFDC2626)]
            : [_PopupColors.primary, _PopupColors.primaryLight];

    return await showGeneralDialog<bool>(
          context: context,
          barrierDismissible: false,
          barrierLabel: '',
          barrierColor: Colors.black54,
          transitionDuration: const Duration(milliseconds: 300),
          pageBuilder: (context, animation, secondaryAnimation) {
            return Container();
          },
          transitionBuilder: (context, animation, secondaryAnimation, child) {
            final curvedAnimation = CurvedAnimation(
              parent: animation,
              curve: Curves.easeOutBack,
            );

            return ScaleTransition(
              scale: curvedAnimation,
              child: FadeTransition(
                opacity: animation,
                child: Directionality(
                  textDirection: TextDirection.rtl,
                  child: AlertDialog(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(24),
                    ),
                    contentPadding: EdgeInsets.zero,
                    content: Container(
                      width: MediaQuery.of(context).size.width * 0.85,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(24),
                        color: Colors.white,
                        boxShadow: [
                          BoxShadow(
                            color: primaryColor.withOpacity(0.15),
                            blurRadius: 20,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          // Compact Premium Header
                          Container(
                            padding: const EdgeInsets.symmetric(
                              vertical: 20,
                              horizontal: 24,
                            ),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: gradientColors,
                                begin: Alignment.topRight,
                                end: Alignment.bottomLeft,
                              ),
                              borderRadius: const BorderRadius.only(
                                topLeft: Radius.circular(24),
                                topRight: Radius.circular(24),
                              ),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                // Compact Icon
                                Container(
                                  width: 52,
                                  height: 52,
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    shape: BoxShape.circle,
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withOpacity(0.1),
                                        blurRadius: 10,
                                        spreadRadius: 1,
                                      ),
                                    ],
                                  ),
                                  child: Icon(
                                    isDanger
                                        ? Icons.warning_rounded
                                        : Icons.help_outline_rounded,
                                    size: 28,
                                    color: gradientColors[0],
                                  ),
                                ),
                              ],
                            ),
                          ),

                          // Gold accent line
                          Container(
                            width: double.infinity,
                            height: 3,
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  Colors.transparent,
                                  _PopupColors.gold,
                                  Colors.transparent,
                                ],
                              ),
                            ),
                          ),

                          const SizedBox(height: 24),

                          // Title
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 24),
                            child: Text(
                              title,
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'Cairo',
                                color: Color(0xFF1A1A1A),
                              ),
                            ),
                          ),

                          const SizedBox(height: 12),

                          // Message
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 24),
                            child: Text(
                              message,
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 15,
                                fontFamily: 'Cairo',
                                color: Colors.grey.shade600,
                                height: 1.6,
                              ),
                            ),
                          ),

                          const SizedBox(height: 28),

                          // Premium Buttons
                          Padding(
                            padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
                            child: Row(
                              children: [
                                // Cancel Button
                                Expanded(
                                  child: SizedBox(
                                    height: 52,
                                    child: OutlinedButton(
                                      onPressed: () {
                                        Navigator.of(context).pop(false);
                                      },
                                      style: OutlinedButton.styleFrom(
                                        side: BorderSide(
                                          color: Colors.grey.shade300,
                                          width: 1.5,
                                        ),
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(
                                            14,
                                          ),
                                        ),
                                      ),
                                      child: Text(
                                        cancelText,
                                        style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.bold,
                                          fontFamily: 'Cairo',
                                          color: Colors.grey.shade600,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),

                                const SizedBox(width: 12),

                                // Confirm Button with gradient
                                Expanded(
                                  child: SizedBox(
                                    height: 52,
                                    child: Container(
                                      decoration: BoxDecoration(
                                        gradient: LinearGradient(
                                          colors: gradientColors,
                                          begin: Alignment.centerRight,
                                          end: Alignment.centerLeft,
                                        ),
                                        borderRadius: BorderRadius.circular(14),
                                        boxShadow: [
                                          BoxShadow(
                                            color: primaryColor.withOpacity(
                                              0.4,
                                            ),
                                            blurRadius: 12,
                                            offset: const Offset(0, 6),
                                          ),
                                        ],
                                      ),
                                      child: ElevatedButton(
                                        onPressed: () {
                                          Navigator.of(context).pop(true);
                                        },
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: Colors.transparent,
                                          shadowColor: Colors.transparent,
                                          shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(
                                              14,
                                            ),
                                          ),
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
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
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
    bool isDanger = false,
  }) {
    return showConfirmation(
      context: context,
      title: title,
      message: message,
      confirmText: confirmText,
      cancelText: cancelText,
      isDanger: isDanger,
    );
  }

  /// Delete Confirmation Dialog - Premium Design
  static Future<bool> showDeleteConfirmation({
    required BuildContext context,
    String title = 'تأكيد الحذف',
    String message = 'هل أنت متأكد من حذف هذا العنصر؟',
    String confirmText = 'حذف',
    String cancelText = 'إلغاء',
  }) {
    return showConfirmation(
      context: context,
      title: title,
      message: message,
      confirmText: confirmText,
      cancelText: cancelText,
      isDanger: true,
    );
  }

  /// Logout Confirmation Dialog - Premium Design
  static Future<bool> showLogoutConfirmation({
    required BuildContext context,
    String title = 'تسجيل الخروج',
    String message = 'هل أنت متأكد من تسجيل الخروج؟',
    String confirmText = 'خروج',
    String cancelText = 'إلغاء',
  }) {
    return showConfirmation(
      context: context,
      title: title,
      message: message,
      confirmText: confirmText,
      cancelText: cancelText,
      isDanger: true,
    );
  }

  /// Loading Dialog (شاشة تحميل) - Premium Design
  static void showLoading({
    required BuildContext context,
    String message = 'جاري التحميل...',
  }) {
    showGeneralDialog(
      context: context,
      barrierDismissible: false,
      barrierLabel: '',
      barrierColor: Colors.black54,
      transitionDuration: const Duration(milliseconds: 200),
      pageBuilder: (context, animation, secondaryAnimation) {
        return Container();
      },
      transitionBuilder: (context, animation, secondaryAnimation, child) {
        return FadeTransition(
          opacity: animation,
          child: ScaleTransition(
            scale: Tween<double>(begin: 0.8, end: 1.0).animate(
              CurvedAnimation(parent: animation, curve: Curves.easeOutCubic),
            ),
            child: PopScope(
              canPop: false,
              child: Directionality(
                textDirection: TextDirection.rtl,
                child: Dialog(
                  backgroundColor: Colors.transparent,
                  elevation: 0,
                  child: Container(
                    padding: const EdgeInsets.all(28),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: _PopupColors.primary.withOpacity(0.15),
                          blurRadius: 30,
                          offset: const Offset(0, 15),
                        ),
                      ],
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Premium Loading Animation
                        Stack(
                          alignment: Alignment.center,
                          children: [
                            // Outer rotating ring
                            SizedBox(
                              width: 80,
                              height: 80,
                              child: CircularProgressIndicator(
                                valueColor: const AlwaysStoppedAnimation<Color>(
                                  _PopupColors.primary,
                                ),
                                strokeWidth: 3,
                                backgroundColor: _PopupColors.primary
                                    .withOpacity(0.1),
                              ),
                            ),
                            // Middle ring
                            SizedBox(
                              width: 60,
                              height: 60,
                              child: CircularProgressIndicator(
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  _PopupColors.gold.withOpacity(0.5),
                                ),
                                strokeWidth: 2,
                              ),
                            ),
                            // Inner icon container with gradient
                            Container(
                              width: 45,
                              height: 45,
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(
                                  colors: [
                                    _PopupColors.primary,
                                    _PopupColors.primaryLight,
                                  ],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: _PopupColors.primary.withOpacity(
                                      0.3,
                                    ),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: const Icon(
                                Icons.flight_takeoff_rounded,
                                color: Colors.white,
                                size: 22,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),
                        // Gold accent line
                        Container(
                          width: 40,
                          height: 3,
                          decoration: BoxDecoration(
                            color: _PopupColors.gold,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          message,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 16,
                            fontFamily: 'Cairo',
                            fontWeight: FontWeight.bold,
                            color: _PopupColors.primary,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'الرجاء الانتظار...',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 13,
                            fontFamily: 'Cairo',
                            color: Colors.grey.shade500,
                          ),
                        ),
                      ],
                    ),
                  ),
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

  /// Premium SnackBar مخصص (رسالة سريعة في أسفل الشاشة)
  static void showSnackBar({
    required BuildContext context,
    required String message,
    PopupType type = PopupType.info,
    Duration duration = const Duration(seconds: 3),
  }) {
    Color backgroundColor;
    Color iconBgColor;
    IconData icon;

    switch (type) {
      case PopupType.success:
        backgroundColor = _PopupColors.success;
        iconBgColor = Colors.white.withOpacity(0.2);
        icon = Icons.check_circle_rounded;
        break;
      case PopupType.error:
        backgroundColor = _PopupColors.error;
        iconBgColor = Colors.white.withOpacity(0.2);
        icon = Icons.cancel_rounded;
        break;
      case PopupType.warning:
        backgroundColor = _PopupColors.warning;
        iconBgColor = Colors.white.withOpacity(0.2);
        icon = Icons.warning_rounded;
        break;
      case PopupType.info:
        backgroundColor = _PopupColors.info;
        iconBgColor = Colors.white.withOpacity(0.2);
        icon = Icons.info_rounded;
        break;
      case PopupType.question:
        backgroundColor = _PopupColors.primary;
        iconBgColor = Colors.white.withOpacity(0.2);
        icon = Icons.help_rounded;
        break;
    }

    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Container(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Row(
            children: [
              // Icon with background
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: iconBgColor,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: Colors.white, size: 22),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Text(
                  message,
                  style: const TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              // Gold accent
              Container(
                width: 3,
                height: 30,
                decoration: BoxDecoration(
                  color: _PopupColors.gold,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ],
          ),
        ),
        backgroundColor: backgroundColor,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        duration: duration,
        margin: const EdgeInsets.all(16),
        elevation: 8,
      ),
    );
  }
}

/// Premium Action Sheet - لعرض قائمة إجراءات
class AlNoranActionSheet {
  static Future<T?> show<T>({
    required BuildContext context,
    required String title,
    String? subtitle,
    required List<ActionSheetItem<T>> items,
    bool showCancel = true,
    String cancelText = 'إلغاء',
  }) {
    return showModalBottomSheet<T>(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder:
          (context) => _PremiumActionSheet<T>(
            title: title,
            subtitle: subtitle,
            items: items,
            showCancel: showCancel,
            cancelText: cancelText,
          ),
    );
  }
}

/// Action Sheet Item Model
class ActionSheetItem<T> {
  final IconData icon;
  final String title;
  final String? subtitle;
  final T value;
  final List<Color>? iconGradient;
  final bool isDanger;

  const ActionSheetItem({
    required this.icon,
    required this.title,
    this.subtitle,
    required this.value,
    this.iconGradient,
    this.isDanger = false,
  });
}

/// Premium Action Sheet Widget
class _PremiumActionSheet<T> extends StatefulWidget {
  final String title;
  final String? subtitle;
  final List<ActionSheetItem<T>> items;
  final bool showCancel;
  final String cancelText;

  const _PremiumActionSheet({
    required this.title,
    this.subtitle,
    required this.items,
    required this.showCancel,
    required this.cancelText,
  });

  @override
  State<_PremiumActionSheet<T>> createState() => _PremiumActionSheetState<T>();
}

class _PremiumActionSheetState<T> extends State<_PremiumActionSheet<T>>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _slideAnimation = Tween<double>(
      begin: 1.0,
      end: 0.0,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic));
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Transform.translate(
          offset: Offset(
            0,
            MediaQuery.of(context).size.height * _slideAnimation.value * 0.5,
          ),
          child: child,
        );
      },
      child: Container(
        margin: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.15),
              blurRadius: 20,
              spreadRadius: 5,
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 24),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [_PopupColors.primary, _PopupColors.primaryLight],
                  begin: Alignment.centerRight,
                  end: Alignment.centerLeft,
                ),
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(24),
                  topRight: Radius.circular(24),
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.title,
                          style: const TextStyle(
                            fontFamily: 'Cairo',
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        if (widget.subtitle != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            widget.subtitle!,
                            style: TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 13,
                              color: Colors.white.withOpacity(0.8),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  Container(
                    width: 3,
                    height: 40,
                    decoration: BoxDecoration(
                      color: _PopupColors.gold,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ],
              ),
            ),

            // Items
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  for (int i = 0; i < widget.items.length; i++) ...[
                    _buildActionItem(widget.items[i], i),
                    if (i < widget.items.length - 1) const SizedBox(height: 10),
                  ],
                ],
              ),
            ),

            // Cancel button
            if (widget.showCancel)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                child: SizedBox(
                  width: double.infinity,
                  child: TextButton(
                    onPressed: () => Navigator.pop(context),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(color: Colors.grey.shade300),
                      ),
                    ),
                    child: Text(
                      widget.cancelText,
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionItem(ActionSheetItem<T> item, int index) {
    final defaultGradient =
        item.isDanger
            ? [_PopupColors.error, const Color(0xFFDC2626)]
            : [_PopupColors.primary, _PopupColors.primaryLight];
    final gradient = item.iconGradient ?? defaultGradient;

    return TweenAnimationBuilder<double>(
      duration: Duration(milliseconds: 200 + (index * 80)),
      tween: Tween(begin: 0.0, end: 1.0),
      builder: (context, value, child) {
        return Transform.translate(
          offset: Offset(30 * (1 - value), 0),
          child: Opacity(opacity: value, child: child),
        );
      },
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => Navigator.pop(context, item.value),
          borderRadius: BorderRadius.circular(14),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFFAF9F7),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: gradient,
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: gradient.first.withOpacity(0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Icon(item.icon, color: Colors.white, size: 22),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.title,
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color:
                              item.isDanger
                                  ? _PopupColors.error
                                  : const Color(0xFF1A1A1A),
                        ),
                      ),
                      if (item.subtitle != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          item.subtitle!,
                          style: TextStyle(
                            fontFamily: 'Cairo',
                            fontSize: 12,
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: _PopupColors.gold.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    Icons.arrow_forward_ios_rounded,
                    color: _PopupColors.gold,
                    size: 14,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
