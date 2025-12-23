import 'package:flutter/material.dart';
import '../../theme/theme.dart';

/// Mixin لإضافة دعم Dark Mode لصفحات المصادقة
/// يوفر جميع الألوان والتدرجات اللازمة
///
/// القاعدة: نفس الألوان الأساسية في Light و Dark
/// فقط الخلفيات والبطاقات تتغير من فاتحة إلى داكنة
mixin AuthDarkModeMixin<T extends StatefulWidget> on State<T> {
  // ============= Dark Mode Check =============
  bool get isDark => Theme.of(context).brightness == Brightness.dark;

  // ============= Primary Colors (SAME for Light & Dark) =============
  static const Color primaryDark = Color(0xFF690000);
  static const Color primaryLight = Color(0xFF8B0000);
  static const Color goldAccent = Color(0xFFD4AF37);
  static const Color accentColor = Color(0xFF1ba3b6); // تركواز
  static const Color accentColorDark = Color(0xFF0D7377); // تركواز أغمق للدارك

  // ============= Background Gradient Colors =============
  /// نفس التدرج الأحمر الأساسي في كلا الوضعين
  List<Color> get backgroundGradient => [
    primaryDark,
    primaryLight,
    const Color(0xFF4A0000),
  ];

  // ============= Background Gradient (for pages that use gradient: parameter) =============
  LinearGradient get backgroundGradientFull => const LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primaryDark, primaryLight, Color(0xFF4A0000)],
  );

  // ============= Decorative Circle Colors =============
  Color get decorativeCircleColor => Colors.white.withValues(alpha: 0.08);
  Color get decorativeCircleColorSmall => Colors.white.withValues(alpha: 0.05);

  // ============= Golden Line Opacity =============
  double get goldenLineAlpha => 0.5;

  // ============= Card Colors =============
  Color get cardColor => isDark ? AppColors.darkCard : Colors.white;

  BoxDecoration get cardDecoration => BoxDecoration(
    color: cardColor,
    borderRadius: BorderRadius.circular(24),
    border:
        isDark
            ? Border.all(color: AppColors.darkBorder.withValues(alpha: 0.5))
            : null,
    boxShadow: [
      BoxShadow(
        color:
            isDark
                ? Colors.black.withValues(alpha: 0.4)
                : Colors.black.withValues(alpha: 0.2),
        blurRadius: 30,
        offset: const Offset(0, 15),
      ),
      BoxShadow(
        color: goldAccent.withValues(alpha: 0.1),
        blurRadius: 20,
        offset: const Offset(0, -5),
      ),
    ],
  );

  // ============= Back Button Colors =============
  Color get backButtonBgColor => Colors.white.withValues(alpha: 0.15);

  // ============= Input Field Colors =============
  Color get labelColor =>
      isDark ? AppColors.darkTextPrimary : const Color(0xFF333333);
  Color get inputTextColor =>
      isDark ? AppColors.darkTextPrimary : const Color(0xFF333333);
  Color get fillColor =>
      isDark ? AppColors.darkSurface : const Color(0xFFF8F9FA);
  Color get borderColor => isDark ? AppColors.darkBorder : Colors.grey[200]!;
  Color get focusBorderColor => primaryDark; // نفس اللون في كلا الوضعين
  Color get iconColor => primaryDark; // نفس اللون في كلا الوضعين
  Color? get hintColor => isDark ? AppColors.darkTextMuted : Colors.grey[400];
  Color? get visibilityIconColor =>
      isDark ? AppColors.darkTextMuted : Colors.grey[500];

  BoxDecoration get inputShadowDecoration => BoxDecoration(
    borderRadius: BorderRadius.circular(14),
    boxShadow: [
      BoxShadow(
        color:
            isDark
                ? Colors.black.withValues(alpha: 0.2)
                : primaryDark.withValues(alpha: 0.08),
        blurRadius: 10,
        offset: const Offset(0, 4),
      ),
    ],
  );

  // ============= Button Colors (SAME gradient in both modes) =============
  LinearGradient get buttonGradient =>
      const LinearGradient(colors: [primaryDark, primaryLight]);

  Color get buttonShadowColor => primaryDark.withValues(alpha: 0.4);
  Color get buttonTextColor => Colors.white;

  // ============= Link Colors =============
  Color get linkContainerColor => Colors.white.withValues(alpha: 0.1);
  Color get linkBorderColor => Colors.white.withValues(alpha: 0.2);
  Color get linkTextColor =>
      isDark
          ? AppColors.darkTextSecondary
          : Colors.white.withValues(alpha: 0.9);

  // ============= Logo Container Color =============
  Color get logoContainerColor => primaryDark;

  // ============= Social Button Colors =============
  Color get socialButtonColor => isDark ? AppColors.darkCard : Colors.white;
  Color get socialButtonTextColor =>
      isDark ? AppColors.darkTextPrimary : const Color(0xFF333333);

  BoxDecoration get socialButtonDecoration => BoxDecoration(
    color: socialButtonColor,
    borderRadius: BorderRadius.circular(16),
    border:
        isDark
            ? Border.all(color: AppColors.darkBorder.withValues(alpha: 0.5))
            : null,
    boxShadow: [
      BoxShadow(
        color:
            isDark
                ? Colors.black.withValues(alpha: 0.3)
                : Colors.black.withValues(alpha: 0.15),
        blurRadius: 15,
        offset: const Offset(0, 5),
      ),
    ],
  );

  // ============= Accent Color (Turquoise) =============
  /// التركواز - أغمق قليلاً في الدارك مود
  Color get accentTurquoise => isDark ? accentColorDark : accentColor;
}
