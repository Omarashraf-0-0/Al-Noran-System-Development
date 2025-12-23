import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../theme/app_colors.dart';

/// Premium Background Widget - يدعم Light و Dark Mode
/// خلفية متدرجة مع تأثيرات ديكورية
class PremiumBackground extends StatelessWidget {
  final Widget child;
  final bool showDecorations;
  final bool useGradientHeader;

  const PremiumBackground({
    super.key,
    required this.child,
    this.showDecorations = true,
    this.useGradientHeader = true,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Stack(
      children: [
        // Main Background
        Container(
          width: double.infinity,
          height: double.infinity,
          decoration: BoxDecoration(
            gradient:
                useGradientHeader
                    ? LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors:
                          isDark
                              ? [
                                const Color(0xFF1A0505),
                                const Color(0xFF2D0A0A),
                                const Color(0xFF121212),
                              ]
                              : [
                                const Color(0xFF690000),
                                const Color(0xFF8B0000),
                                const Color(0xFF4A0000),
                              ],
                      stops: const [0.0, 0.5, 1.0],
                    )
                    : null,
            color:
                useGradientHeader
                    ? null
                    : (isDark
                        ? AppColors.darkBackground
                        : AppColors.background),
          ),
        ),

        // Decorative Elements
        if (showDecorations) ...[
          // Top Right Circle
          Positioned(
            top: -80,
            right: -80,
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color:
                    isDark
                        ? AppColors.gold.withOpacity(0.05)
                        : Colors.white.withOpacity(0.08),
              ),
            ),
          ),
          // Bottom Left Circle
          Positioned(
            bottom: -100,
            left: -60,
            child: Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color:
                    isDark
                        ? AppColors.primary.withOpacity(0.1)
                        : Colors.white.withOpacity(0.05),
              ),
            ),
          ),
          // Golden Accent Line
          Positioned(
            top: 150,
            left: 0,
            right: 0,
            child: Container(
              height: 2,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.transparent,
                    AppColors.gold.withOpacity(isDark ? 0.3 : 0.5),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
        ],

        // Child Content
        child,
      ],
    );
  }
}

/// Premium Card - بطاقة تدعم Light و Dark Mode
class PremiumCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final double borderRadius;
  final bool showGoldAccent;

  const PremiumCard({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.borderRadius = 24,
    this.showGoldAccent = false,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      margin: margin,
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(borderRadius),
        border:
            isDark
                ? Border.all(color: AppColors.darkBorder.withOpacity(0.3))
                : null,
        boxShadow: [
          BoxShadow(
            color:
                isDark
                    ? Colors.black.withOpacity(0.3)
                    : Colors.black.withOpacity(0.1),
            blurRadius: isDark ? 15 : 30,
            offset: const Offset(0, 10),
          ),
          if (showGoldAccent && !isDark)
            BoxShadow(
              color: AppColors.gold.withOpacity(0.1),
              blurRadius: 20,
              offset: const Offset(0, -5),
            ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (showGoldAccent)
              Container(
                height: 3,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Colors.transparent,
                      AppColors.gold,
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            Padding(padding: padding ?? const EdgeInsets.all(24), child: child),
          ],
        ),
      ),
    );
  }
}

/// Premium Text Field - حقل نص يدعم Dark Mode
class PremiumTextField extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final String hint;
  final IconData icon;
  final bool obscureText;
  final Widget? suffixIcon;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final String? Function(String?)? validator;
  final void Function(String)? onChanged;
  final List<TextInputFormatter>? inputFormatters;

  const PremiumTextField({
    super.key,
    required this.controller,
    required this.label,
    required this.hint,
    required this.icon,
    this.obscureText = false,
    this.suffixIcon,
    this.keyboardType,
    this.textInputAction,
    this.validator,
    this.onChanged,
    this.inputFormatters,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            fontFamily: 'Cairo',
            color:
                isDark ? AppColors.darkTextSecondary : const Color(0xFF374151),
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          obscureText: obscureText,
          keyboardType: keyboardType,
          textInputAction: textInputAction,
          validator: validator,
          onChanged: onChanged,
          inputFormatters: inputFormatters,
          style: TextStyle(
            fontFamily: 'Cairo',
            fontSize: 15,
            color: isDark ? AppColors.darkTextPrimary : AppColors.textDark,
          ),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(
              color: isDark ? AppColors.darkTextHint : Colors.grey.shade400,
              fontFamily: 'Cairo',
            ),
            prefixIcon: Container(
              margin: const EdgeInsets.only(left: 12, right: 8),
              child: Icon(
                icon,
                color: isDark ? AppColors.gold : AppColors.primary,
                size: 22,
              ),
            ),
            prefixIconConstraints: const BoxConstraints(minWidth: 50),
            suffixIcon: suffixIcon,
            filled: true,
            fillColor:
                isDark
                    ? AppColors.darkCard.withOpacity(0.5)
                    : const Color(0xFFF9FAFB),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 16,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(
                color: isDark ? AppColors.darkBorder : const Color(0xFFE5E7EB),
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(
                color: isDark ? AppColors.darkBorder : const Color(0xFFE5E7EB),
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: BorderSide(
                color: isDark ? AppColors.gold : AppColors.primary,
                width: 2,
              ),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: AppColors.error),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: AppColors.error, width: 2),
            ),
          ),
        ),
      ],
    );
  }
}

/// Premium Button - زر يدعم Dark Mode
class PremiumButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final bool isOutlined;
  final IconData? icon;
  final double? width;
  final double height;

  const PremiumButton({
    super.key,
    required this.text,
    this.onPressed,
    this.isLoading = false,
    this.isOutlined = false,
    this.icon,
    this.width,
    this.height = 56,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (isOutlined) {
      return SizedBox(
        width: width ?? double.infinity,
        height: height,
        child: OutlinedButton(
          onPressed: isLoading ? null : onPressed,
          style: OutlinedButton.styleFrom(
            side: BorderSide(
              color: isDark ? AppColors.gold : AppColors.primary,
              width: 2,
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
          ),
          child: _buildButtonContent(
            isDark ? AppColors.gold : AppColors.primary,
          ),
        ),
      );
    }

    return SizedBox(
      width: width ?? double.infinity,
      height: height,
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors:
                isDark
                    ? [const Color(0xFF8B0000), const Color(0xFF690000)]
                    : [const Color(0xFF690000), const Color(0xFF8B0000)],
            begin: Alignment.centerRight,
            end: Alignment.centerLeft,
          ),
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withOpacity(isDark ? 0.3 : 0.4),
              blurRadius: 15,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: ElevatedButton(
          onPressed: isLoading ? null : onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.transparent,
            shadowColor: Colors.transparent,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
          ),
          child: _buildButtonContent(Colors.white),
        ),
      ),
    );
  }

  Widget _buildButtonContent(Color color) {
    if (isLoading) {
      return SizedBox(
        width: 24,
        height: 24,
        child: CircularProgressIndicator(
          strokeWidth: 2.5,
          valueColor: AlwaysStoppedAnimation<Color>(color),
        ),
      );
    }

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (icon != null) ...[
          Icon(icon, size: 20, color: color),
          const SizedBox(width: 8),
        ],
        Text(
          text,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            fontFamily: 'Cairo',
            color: color,
          ),
        ),
      ],
    );
  }
}

/// Premium Divider with text
class PremiumDivider extends StatelessWidget {
  final String? text;

  const PremiumDivider({super.key, this.text});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final dividerColor = isDark ? AppColors.darkBorder : Colors.grey.shade300;
    final textColor = isDark ? AppColors.darkTextMuted : Colors.grey.shade500;

    if (text == null) {
      return Divider(color: dividerColor);
    }

    return Row(
      children: [
        Expanded(child: Divider(color: dividerColor)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            text!,
            style: TextStyle(
              color: textColor,
              fontFamily: 'Cairo',
              fontSize: 14,
            ),
          ),
        ),
        Expanded(child: Divider(color: dividerColor)),
      ],
    );
  }
}
