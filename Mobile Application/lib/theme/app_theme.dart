import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'app_colors.dart';
import 'app_typography.dart';
import 'app_spacing.dart';

/// نظام الثيم الكامل لتطبيق النوران
/// Al-Noran Complete Theme System
class AppTheme {
  // ==================== Light Theme ====================
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      fontFamily: AppTypography.fontFamily,
      primaryColor: AppColors.primary,
      scaffoldBackgroundColor: AppColors.background,
      colorScheme: ColorScheme.light(
        primary: AppColors.primary,
        secondary: AppColors.accent,
        surface: AppColors.white,
        error: AppColors.error,
        onPrimary: AppColors.white,
        onSecondary: AppColors.white,
        onSurface: AppColors.textDark,
        onError: AppColors.white,
      ),

      // ==================== AppBar Theme ====================
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.white,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: AppTypography.h2.copyWith(color: AppColors.white),
        iconTheme: const IconThemeData(
          color: AppColors.white,
          size: AppSpacing.iconMD,
        ),
        systemOverlayStyle: SystemUiOverlayStyle.light,
      ),

      // ==================== Button Themes ====================
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.white,
          elevation: AppSpacing.elevationNone,
          padding: AppSpacing.buttonPadding,
          shape: RoundedRectangleBorder(
            borderRadius: AppSpacing.borderRadiusMD,
          ),
          textStyle: AppTypography.button,
        ),
      ),

      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.primary,
          padding: AppSpacing.buttonPadding,
          side: const BorderSide(color: AppColors.primary, width: 1.5),
          shape: RoundedRectangleBorder(
            borderRadius: AppSpacing.borderRadiusMD,
          ),
          textStyle: AppTypography.button,
        ),
      ),

      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.primary,
          padding: AppSpacing.paddingHorizontalBase,
          textStyle: AppTypography.link,
        ),
      ),

      // ==================== Card Theme ====================
      cardTheme: CardThemeData(
        color: AppColors.cardBackground,
        elevation: AppSpacing.elevationNone,
        shape: RoundedRectangleBorder(
          borderRadius: AppSpacing.borderRadiusLG,
          side: BorderSide(color: Colors.grey.withOpacity(0.1), width: 1),
        ),
        margin: const EdgeInsets.only(bottom: 12),
      ),

      // ==================== Input Theme ====================
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.background,
        border: OutlineInputBorder(
          borderRadius: AppSpacing.borderRadiusMD,
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: AppSpacing.borderRadiusMD,
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: AppSpacing.borderRadiusMD,
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: AppSpacing.borderRadiusMD,
          borderSide: const BorderSide(color: AppColors.error, width: 1.5),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: AppSpacing.borderRadiusMD,
          borderSide: const BorderSide(color: AppColors.error, width: 2),
        ),
        contentPadding: AppSpacing.fieldPadding,
        hintStyle: AppTypography.body.copyWith(color: AppColors.textGrey),
        labelStyle: AppTypography.label.copyWith(color: AppColors.textMedium),
        errorStyle: AppTypography.small.copyWith(color: AppColors.error),
        prefixIconColor: AppColors.primary,
        suffixIconColor: AppColors.primary,
      ),

      // ==================== Floating Action Button Theme ====================
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.white,
        elevation: AppSpacing.elevationMD,
      ),

      // ==================== Bottom Navigation Bar Theme ====================
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.primary,
        selectedItemColor: AppColors.accent,
        unselectedItemColor: Colors.white70,
        type: BottomNavigationBarType.fixed,
        elevation: AppSpacing.elevationLG,
        selectedLabelStyle: TextStyle(
          fontFamily: AppTypography.fontFamily,
          fontSize: AppTypography.fontSizeXS,
          fontWeight: AppTypography.fontWeightSemiBold,
        ),
        unselectedLabelStyle: TextStyle(
          fontFamily: AppTypography.fontFamily,
          fontSize: AppTypography.fontSizeXS,
          fontWeight: AppTypography.fontWeightRegular,
        ),
      ),

      // ==================== Tab Bar Theme ====================
      tabBarTheme: TabBarThemeData(
        labelColor: AppColors.white,
        unselectedLabelColor: AppColors.primary,
        indicatorColor: AppColors.primary,
        labelStyle: AppTypography.bodySemiBold,
        unselectedLabelStyle: AppTypography.body,
        indicator: BoxDecoration(
          color: AppColors.primary,
          borderRadius: AppSpacing.borderRadiusMD,
        ),
      ),

      // ==================== Dialog Theme ====================
      dialogTheme: DialogThemeData(
        backgroundColor: AppColors.white,
        elevation: AppSpacing.elevationXL,
        shape: RoundedRectangleBorder(borderRadius: AppSpacing.borderRadiusXL),
        titleTextStyle: AppTypography.h2.copyWith(color: AppColors.textDark),
        contentTextStyle: AppTypography.body.copyWith(
          color: AppColors.textMedium,
        ),
      ),

      // ==================== Snackbar Theme ====================
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.textDark,
        contentTextStyle: AppTypography.body.copyWith(color: AppColors.white),
        shape: RoundedRectangleBorder(borderRadius: AppSpacing.borderRadiusMD),
        behavior: SnackBarBehavior.floating,
      ),

      // ==================== Progress Indicator Theme ====================
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: AppColors.primary,
        circularTrackColor: AppColors.greyLight,
      ),

      // ==================== Divider Theme ====================
      dividerTheme: const DividerThemeData(
        color: AppColors.divider,
        thickness: 1,
        space: AppSpacing.base,
      ),

      // ==================== Chip Theme ====================
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.background,
        selectedColor: AppColors.primary,
        labelStyle: AppTypography.badge,
        side: BorderSide.none,
        shape: RoundedRectangleBorder(borderRadius: AppSpacing.borderRadiusXS),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.xs,
        ),
      ),

      // ==================== Switch Theme ====================
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return AppColors.primary;
          }
          return AppColors.greyLight;
        }),
        trackColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return AppColors.primaryLight;
          }
          return AppColors.greyBorder;
        }),
      ),

      // ==================== Checkbox Theme ====================
      checkboxTheme: CheckboxThemeData(
        fillColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return AppColors.primary;
          }
          return AppColors.white;
        }),
        checkColor: WidgetStateProperty.all(AppColors.white),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
      ),

      // ==================== Radio Theme ====================
      radioTheme: RadioThemeData(
        fillColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return AppColors.primary;
          }
          return AppColors.greyLight;
        }),
      ),

      // ==================== List Tile Theme ====================
      listTileTheme: const ListTileThemeData(
        contentPadding: EdgeInsets.symmetric(
          horizontal: AppSpacing.base,
          vertical: AppSpacing.sm,
        ),
        iconColor: AppColors.primary,
        textColor: AppColors.textDark,
      ),

      // ==================== Text Theme ====================
      textTheme: TextTheme(
        displayLarge: AppTypography.h1.copyWith(color: AppColors.textDark),
        displayMedium: AppTypography.h2.copyWith(color: AppColors.textDark),
        displaySmall: AppTypography.h3.copyWith(color: AppColors.textDark),
        bodyLarge: AppTypography.bodyLarge.copyWith(
          color: AppColors.textMedium,
        ),
        bodyMedium: AppTypography.body.copyWith(color: AppColors.textMedium),
        bodySmall: AppTypography.small.copyWith(color: AppColors.textLight),
        labelLarge: AppTypography.button.copyWith(color: AppColors.white),
        labelMedium: AppTypography.label.copyWith(color: AppColors.textMedium),
        labelSmall: AppTypography.caption.copyWith(color: AppColors.textGrey),
      ),
    );
  }

  // ==================== Dark Theme ====================
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      fontFamily: AppTypography.fontFamily,
      brightness: Brightness.dark,
      primaryColor: AppColors.primary,
      scaffoldBackgroundColor: AppColors.darkBackground,
      colorScheme: const ColorScheme.dark(
        primary: AppColors.primary,
        secondary: AppColors.accent,
        surface: AppColors.darkSurface,
        error: AppColors.error,
        onPrimary: AppColors.white,
        onSecondary: AppColors.white,
        onSurface: AppColors.darkTextPrimary,
        onError: AppColors.white,
      ),

      // ==================== AppBar Theme ====================
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.darkSurface,
        foregroundColor: AppColors.white,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: AppTypography.h2.copyWith(color: AppColors.white),
        iconTheme: const IconThemeData(
          color: AppColors.white,
          size: AppSpacing.iconMD,
        ),
        systemOverlayStyle: SystemUiOverlayStyle.light,
      ),

      // ==================== Button Themes ====================
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: AppColors.white,
          elevation: AppSpacing.elevationNone,
          padding: AppSpacing.buttonPadding,
          shape: RoundedRectangleBorder(
            borderRadius: AppSpacing.borderRadiusMD,
          ),
          textStyle: AppTypography.button,
        ),
      ),

      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.gold,
          padding: AppSpacing.buttonPadding,
          side: const BorderSide(color: AppColors.gold, width: 1.5),
          shape: RoundedRectangleBorder(
            borderRadius: AppSpacing.borderRadiusMD,
          ),
          textStyle: AppTypography.button,
        ),
      ),

      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.gold,
          padding: AppSpacing.paddingHorizontalBase,
          textStyle: AppTypography.link,
        ),
      ),

      // ==================== Card Theme ====================
      cardTheme: CardThemeData(
        color: AppColors.darkCard,
        elevation: AppSpacing.elevationNone,
        shape: RoundedRectangleBorder(
          borderRadius: AppSpacing.borderRadiusLG,
          side: BorderSide(
            color: AppColors.darkBorder.withOpacity(0.3),
            width: 1,
          ),
        ),
        margin: const EdgeInsets.only(bottom: 12),
      ),

      // ==================== Input Theme ====================
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.darkCard,
        border: OutlineInputBorder(
          borderRadius: AppSpacing.borderRadiusMD,
          borderSide: BorderSide(color: AppColors.darkBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: AppSpacing.borderRadiusMD,
          borderSide: BorderSide(color: AppColors.darkBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: AppSpacing.borderRadiusMD,
          borderSide: const BorderSide(color: AppColors.gold, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: AppSpacing.borderRadiusMD,
          borderSide: const BorderSide(color: AppColors.error, width: 1.5),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: AppSpacing.borderRadiusMD,
          borderSide: const BorderSide(color: AppColors.error, width: 2),
        ),
        contentPadding: AppSpacing.fieldPadding,
        hintStyle: AppTypography.body.copyWith(color: AppColors.darkTextHint),
        labelStyle: AppTypography.label.copyWith(
          color: AppColors.darkTextSecondary,
        ),
        errorStyle: AppTypography.small.copyWith(color: AppColors.error),
        prefixIconColor: AppColors.gold,
        suffixIconColor: AppColors.gold,
      ),

      // ==================== Floating Action Button Theme ====================
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.white,
        elevation: AppSpacing.elevationMD,
      ),

      // ==================== Bottom Navigation Bar Theme ====================
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.darkSurface,
        selectedItemColor: AppColors.gold,
        unselectedItemColor: AppColors.darkTextMuted,
        type: BottomNavigationBarType.fixed,
        elevation: AppSpacing.elevationLG,
        selectedLabelStyle: TextStyle(
          fontFamily: AppTypography.fontFamily,
          fontSize: AppTypography.fontSizeXS,
          fontWeight: AppTypography.fontWeightSemiBold,
        ),
        unselectedLabelStyle: TextStyle(
          fontFamily: AppTypography.fontFamily,
          fontSize: AppTypography.fontSizeXS,
          fontWeight: AppTypography.fontWeightRegular,
        ),
      ),

      // ==================== Tab Bar Theme ====================
      tabBarTheme: TabBarThemeData(
        labelColor: AppColors.gold,
        unselectedLabelColor: AppColors.darkTextMuted,
        indicatorColor: AppColors.gold,
        labelStyle: AppTypography.bodySemiBold,
        unselectedLabelStyle: AppTypography.body,
        indicator: BoxDecoration(
          color: AppColors.darkCard,
          borderRadius: AppSpacing.borderRadiusMD,
          border: Border.all(color: AppColors.gold, width: 1),
        ),
      ),

      // ==================== Dialog Theme ====================
      dialogTheme: DialogThemeData(
        backgroundColor: AppColors.darkCard,
        elevation: AppSpacing.elevationXL,
        shape: RoundedRectangleBorder(borderRadius: AppSpacing.borderRadiusXL),
        titleTextStyle: AppTypography.h2.copyWith(
          color: AppColors.darkTextPrimary,
        ),
        contentTextStyle: AppTypography.body.copyWith(
          color: AppColors.darkTextSecondary,
        ),
      ),

      // ==================== Snackbar Theme ====================
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.darkCardElevated,
        contentTextStyle: AppTypography.body.copyWith(color: AppColors.white),
        shape: RoundedRectangleBorder(borderRadius: AppSpacing.borderRadiusMD),
        behavior: SnackBarBehavior.floating,
      ),

      // ==================== Progress Indicator Theme ====================
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: AppColors.gold,
        circularTrackColor: AppColors.darkBorder,
      ),

      // ==================== Divider Theme ====================
      dividerTheme: const DividerThemeData(
        color: AppColors.darkDivider,
        thickness: 1,
        space: AppSpacing.base,
      ),

      // ==================== Chip Theme ====================
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.darkCard,
        selectedColor: AppColors.primary,
        labelStyle: AppTypography.badge.copyWith(
          color: AppColors.darkTextPrimary,
        ),
        side: BorderSide(color: AppColors.darkBorder),
        shape: RoundedRectangleBorder(borderRadius: AppSpacing.borderRadiusXS),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.xs,
        ),
      ),

      // ==================== Switch Theme ====================
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return AppColors.gold;
          }
          return AppColors.darkTextMuted;
        }),
        trackColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return AppColors.goldDark;
          }
          return AppColors.darkBorder;
        }),
      ),

      // ==================== Checkbox Theme ====================
      checkboxTheme: CheckboxThemeData(
        fillColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return AppColors.gold;
          }
          return AppColors.darkCard;
        }),
        checkColor: WidgetStateProperty.all(AppColors.darkBackground),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
        side: BorderSide(color: AppColors.darkBorder),
      ),

      // ==================== Radio Theme ====================
      radioTheme: RadioThemeData(
        fillColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return AppColors.gold;
          }
          return AppColors.darkTextMuted;
        }),
      ),

      // ==================== List Tile Theme ====================
      listTileTheme: const ListTileThemeData(
        contentPadding: EdgeInsets.symmetric(
          horizontal: AppSpacing.base,
          vertical: AppSpacing.sm,
        ),
        iconColor: AppColors.gold,
        textColor: AppColors.darkTextPrimary,
        tileColor: Colors.transparent,
      ),

      // ==================== Text Theme ====================
      textTheme: TextTheme(
        displayLarge: AppTypography.h1.copyWith(
          color: AppColors.darkTextPrimary,
        ),
        displayMedium: AppTypography.h2.copyWith(
          color: AppColors.darkTextPrimary,
        ),
        displaySmall: AppTypography.h3.copyWith(
          color: AppColors.darkTextPrimary,
        ),
        bodyLarge: AppTypography.bodyLarge.copyWith(
          color: AppColors.darkTextSecondary,
        ),
        bodyMedium: AppTypography.body.copyWith(
          color: AppColors.darkTextSecondary,
        ),
        bodySmall: AppTypography.small.copyWith(color: AppColors.darkTextMuted),
        labelLarge: AppTypography.button.copyWith(color: AppColors.white),
        labelMedium: AppTypography.label.copyWith(
          color: AppColors.darkTextSecondary,
        ),
        labelSmall: AppTypography.caption.copyWith(
          color: AppColors.darkTextHint,
        ),
      ),

      // ==================== Bottom Sheet Theme ====================
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: AppColors.darkCard,
        modalBackgroundColor: AppColors.darkCard,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
      ),

      // ==================== Popup Menu Theme ====================
      popupMenuTheme: PopupMenuThemeData(
        color: AppColors.darkCard,
        shape: RoundedRectangleBorder(borderRadius: AppSpacing.borderRadiusMD),
        textStyle: AppTypography.body.copyWith(
          color: AppColors.darkTextPrimary,
        ),
      ),

      // ==================== Icon Theme ====================
      iconTheme: const IconThemeData(
        color: AppColors.darkTextPrimary,
        size: 24,
      ),
    );
  }
}
