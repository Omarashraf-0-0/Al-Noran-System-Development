import 'package:flutter/material.dart';
import '../../theme/app_colors.dart';

/// مساعد الألوان الديناميكية - Dynamic Colors Helper
/// يوفر ألوان تتغير تلقائياً حسب الثيم (فاتح/داكن)
class DynamicColors {
  final BuildContext context;
  late final bool isDark;

  DynamicColors(this.context) {
    isDark = Theme.of(context).brightness == Brightness.dark;
  }

  /// ألوان الخلفية
  Color get background =>
      isDark ? AppColors.darkBackground : AppColors.background;
  Color get surface => isDark ? AppColors.darkSurface : AppColors.white;
  Color get card => isDark ? AppColors.darkCard : AppColors.cardBackground;
  Color get cardElevated =>
      isDark ? AppColors.darkCardElevated : AppColors.white;

  /// ألوان النص
  Color get textPrimary =>
      isDark ? AppColors.darkTextPrimary : AppColors.textDark;
  Color get textSecondary =>
      isDark ? AppColors.darkTextSecondary : AppColors.textMedium;
  Color get textMuted => isDark ? AppColors.darkTextMuted : AppColors.textLight;
  Color get textHint => isDark ? AppColors.darkTextHint : AppColors.textGrey;

  /// ألوان الحدود
  Color get border => isDark ? AppColors.darkBorder : AppColors.greyBorder;
  Color get divider => isDark ? AppColors.darkDivider : AppColors.divider;

  /// الألوان الرئيسية
  Color get primary => AppColors.primary;
  Color get primaryLight => AppColors.primaryLight;
  Color get accent => AppColors.accent;
  Color get gold => AppColors.gold;
  Color get goldLight => AppColors.goldLight;

  /// ألوان الحالات
  Color get success => AppColors.success;
  Color get error => AppColors.error;
  Color get warning => AppColors.warning;
  Color get info => AppColors.info;

  /// التدرجات
  LinearGradient get primaryGradient =>
      isDark ? AppColors.darkPrimaryGradient : AppColors.primaryGradient;

  LinearGradient get surfaceGradient =>
      isDark
          ? AppColors.darkSurfaceGradient
          : LinearGradient(
            colors: [AppColors.white, AppColors.background],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          );

  /// الظلال
  List<BoxShadow> get cardShadow =>
      isDark
          ? [
            BoxShadow(
              color: Colors.black.withOpacity(0.3),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ]
          : AppColors.cardShadow;

  List<BoxShadow> get elevatedShadow =>
      isDark
          ? [
            BoxShadow(
              color: Colors.black.withOpacity(0.4),
              blurRadius: 15,
              offset: const Offset(0, 5),
            ),
          ]
          : AppColors.elevatedShadow;

  /// Input field colors
  Color get inputFill => isDark ? AppColors.darkCard : AppColors.background;
  Color get inputBorder => isDark ? AppColors.darkBorder : Colors.transparent;
  Color get inputFocusBorder => isDark ? AppColors.gold : AppColors.primary;

  /// Dialog/Popup colors
  Color get dialogBackground => isDark ? AppColors.darkCard : AppColors.white;
  Color get sheetBackground => isDark ? AppColors.darkCard : AppColors.white;

  /// Icon colors
  Color get iconPrimary => isDark ? AppColors.gold : AppColors.primary;
  Color get iconSecondary =>
      isDark ? AppColors.darkTextMuted : AppColors.textMedium;

  /// Button colors
  Color get buttonText => isDark ? AppColors.darkBackground : AppColors.white;
  Color get outlinedButtonBorder => isDark ? AppColors.gold : AppColors.primary;
  Color get outlinedButtonText => isDark ? AppColors.gold : AppColors.primary;

  /// Shimmer colors for loading
  Color get shimmerBase => isDark ? AppColors.darkCard : Colors.grey.shade200;
  Color get shimmerHighlight =>
      isDark ? AppColors.darkCardElevated : Colors.grey.shade100;

  /// AppBar colors
  Color get appBarBackground =>
      isDark ? AppColors.darkSurface : AppColors.primary;

  /// BottomNav colors
  Color get bottomNavBackground =>
      isDark ? AppColors.darkSurface : AppColors.primary;
  Color get bottomNavSelected => isDark ? AppColors.gold : AppColors.accent;
  Color get bottomNavUnselected =>
      isDark ? AppColors.darkTextMuted : Colors.white70;
}

/// Extension للوصول السريع للألوان الديناميكية
extension DynamicColorsExtension on BuildContext {
  DynamicColors get colors => DynamicColors(this);
  bool get isDarkMode => Theme.of(this).brightness == Brightness.dark;
}
