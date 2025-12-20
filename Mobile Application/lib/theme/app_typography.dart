import 'package:flutter/material.dart';

/// نظام Typography الموحد لتطبيق النوران
/// Al-Noran Unified Typography System
class AppTypography {
  // ==================== Font Family ====================
  static const String fontFamily = 'Cairo';

  // ==================== Font Sizes ====================
  static const double fontSizeXXL = 28.0; // Large Titles
  static const double fontSizeXL = 22.0; // Titles
  static const double fontSizeLG = 18.0; // Subtitles
  static const double fontSizeMD = 16.0; // Body Text Large
  static const double fontSizeBase = 14.0; // Body Text
  static const double fontSizeSM = 13.0; // Small Text
  static const double fontSizeXS = 11.0; // Caption
  static const double fontSizeXXS = 10.0; // Tiny Text

  // ==================== Font Weights ====================
  static const FontWeight fontWeightBold = FontWeight.w700;
  static const FontWeight fontWeightSemiBold = FontWeight.w600;
  static const FontWeight fontWeightMedium = FontWeight.w500;
  static const FontWeight fontWeightRegular = FontWeight.w400;
  static const FontWeight fontWeightLight = FontWeight.w300;

  // ==================== Text Styles ====================

  // Large Titles
  static const TextStyle h1 = TextStyle(
    fontFamily: fontFamily,
    fontSize: fontSizeXXL,
    fontWeight: fontWeightBold,
    height: 1.2,
    letterSpacing: -0.5,
  );

  // Titles
  static const TextStyle h2 = TextStyle(
    fontFamily: fontFamily,
    fontSize: fontSizeXL,
    fontWeight: fontWeightBold,
    height: 1.3,
    letterSpacing: -0.3,
  );

  // Subtitles
  static const TextStyle h3 = TextStyle(
    fontFamily: fontFamily,
    fontSize: fontSizeLG,
    fontWeight: fontWeightSemiBold,
    height: 1.4,
    letterSpacing: -0.2,
  );

  // Body Large
  static const TextStyle bodyLarge = TextStyle(
    fontFamily: fontFamily,
    fontSize: fontSizeMD,
    fontWeight: fontWeightRegular,
    height: 1.5,
  );

  // Body
  static const TextStyle body = TextStyle(
    fontFamily: fontFamily,
    fontSize: fontSizeBase,
    fontWeight: fontWeightRegular,
    height: 1.5,
  );

  // Body Semi-Bold
  static const TextStyle bodySemiBold = TextStyle(
    fontFamily: fontFamily,
    fontSize: fontSizeBase,
    fontWeight: fontWeightSemiBold,
    height: 1.5,
  );

  // Small Text
  static const TextStyle small = TextStyle(
    fontFamily: fontFamily,
    fontSize: fontSizeSM,
    fontWeight: fontWeightRegular,
    height: 1.4,
  );

  // Caption
  static const TextStyle caption = TextStyle(
    fontFamily: fontFamily,
    fontSize: fontSizeXS,
    fontWeight: fontWeightRegular,
    height: 1.3,
  );

  // Button Text
  static const TextStyle button = TextStyle(
    fontFamily: fontFamily,
    fontSize: fontSizeMD,
    fontWeight: fontWeightBold,
    height: 1.2,
    letterSpacing: 0.2,
  );

  // Button Text Small
  static const TextStyle buttonSmall = TextStyle(
    fontFamily: fontFamily,
    fontSize: fontSizeBase,
    fontWeight: fontWeightBold,
    height: 1.2,
    letterSpacing: 0.2,
  );

  // Link
  static const TextStyle link = TextStyle(
    fontFamily: fontFamily,
    fontSize: fontSizeBase,
    fontWeight: fontWeightSemiBold,
    height: 1.5,
    decoration: TextDecoration.none,
  );

  // Label
  static const TextStyle label = TextStyle(
    fontFamily: fontFamily,
    fontSize: fontSizeSM,
    fontWeight: fontWeightMedium,
    height: 1.3,
  );

  // Badge
  static const TextStyle badge = TextStyle(
    fontFamily: fontFamily,
    fontSize: fontSizeXS,
    fontWeight: fontWeightBold,
    height: 1.2,
  );

  // ==================== Helper Methods ====================

  /// Create text style with custom color
  static TextStyle withColor(TextStyle style, Color color) {
    return style.copyWith(color: color);
  }

  /// Create text style with custom size
  static TextStyle withSize(TextStyle style, double size) {
    return style.copyWith(fontSize: size);
  }

  /// Create text style with custom weight
  static TextStyle withWeight(TextStyle style, FontWeight weight) {
    return style.copyWith(fontWeight: weight);
  }
}
