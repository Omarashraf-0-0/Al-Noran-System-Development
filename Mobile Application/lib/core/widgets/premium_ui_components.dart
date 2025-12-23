import 'package:flutter/material.dart';

/// Premium Theme Colors
class PremiumColors {
  // Primary Colors (Maroon)
  static const Color primary = Color(0xFF690000);
  static const Color primaryLight = Color(0xFF8B0000);
  static const Color primaryDark = Color(0xFF4A0000);

  // Gold Accent
  static const Color gold = Color(0xFFD4AF37);
  static const Color goldLight = Color(0xFFF5E7A3);

  // Secondary (Teal)
  static const Color secondary = Color(0xFF1BA3B6);
  static const Color secondaryLight = Color(0xFF15919F);

  // Status Colors
  static const Color success = Color(0xFF10B981);
  static const Color successLight = Color(0xFFD1FAE5);
  static const Color error = Color(0xFFEF4444);
  static const Color errorLight = Color(0xFFFEE2E2);
  static const Color warning = Color(0xFFF59E0B);
  static const Color warningLight = Color(0xFFFEF3C7);
  static const Color info = Color(0xFF3B82F6);
  static const Color infoLight = Color(0xFFDBEAFE);

  // Neutral Colors
  static const Color surface = Color(0xFFFAF9F7);
  static const Color cardBg = Colors.white;
  static const Color textDark = Color(0xFF1A1A1A);
  static const Color textMedium = Color(0xFF6B7280);
  static const Color textLight = Color(0xFF9CA3AF);
  static const Color border = Color(0xFFE5E7EB);
}

/// Premium Text Field - حقل إدخال بتصميم premium
class PremiumTextField extends StatefulWidget {
  final String label;
  final String? hint;
  final TextEditingController? controller;
  final bool obscureText;
  final TextInputType? keyboardType;
  final IconData? prefixIcon;
  final Widget? suffix;
  final String? Function(String?)? validator;
  final void Function(String)? onChanged;
  final int maxLines;
  final bool enabled;
  final FocusNode? focusNode;

  const PremiumTextField({
    super.key,
    required this.label,
    this.hint,
    this.controller,
    this.obscureText = false,
    this.keyboardType,
    this.prefixIcon,
    this.suffix,
    this.validator,
    this.onChanged,
    this.maxLines = 1,
    this.enabled = true,
    this.focusNode,
  });

  @override
  State<PremiumTextField> createState() => _PremiumTextFieldState();
}

class _PremiumTextFieldState extends State<PremiumTextField> {
  bool _isFocused = false;
  late FocusNode _focusNode;

  @override
  void initState() {
    super.initState();
    _focusNode = widget.focusNode ?? FocusNode();
    _focusNode.addListener(_onFocusChange);
  }

  @override
  void dispose() {
    if (widget.focusNode == null) {
      _focusNode.dispose();
    }
    super.dispose();
  }

  void _onFocusChange() {
    setState(() {
      _isFocused = _focusNode.hasFocus;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Label
        Text(
          widget.label,
          style: TextStyle(
            fontFamily: 'Cairo',
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color:
                _isFocused ? PremiumColors.primary : PremiumColors.textMedium,
          ),
        ),
        const SizedBox(height: 8),

        // Text Field Container
        AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: _isFocused ? PremiumColors.primary : PremiumColors.border,
              width: _isFocused ? 2 : 1,
            ),
            color: widget.enabled ? Colors.white : PremiumColors.surface,
            boxShadow:
                _isFocused
                    ? [
                      BoxShadow(
                        color: PremiumColors.primary.withOpacity(0.1),
                        blurRadius: 8,
                        offset: const Offset(0, 4),
                      ),
                    ]
                    : null,
          ),
          child: TextFormField(
            controller: widget.controller,
            focusNode: _focusNode,
            obscureText: widget.obscureText,
            keyboardType: widget.keyboardType,
            maxLines: widget.maxLines,
            enabled: widget.enabled,
            onChanged: widget.onChanged,
            validator: widget.validator,
            style: const TextStyle(
              fontFamily: 'Cairo',
              fontSize: 15,
              color: PremiumColors.textDark,
            ),
            decoration: InputDecoration(
              hintText: widget.hint,
              hintStyle: TextStyle(
                fontFamily: 'Cairo',
                fontSize: 14,
                color: Colors.grey.shade400,
              ),
              prefixIcon:
                  widget.prefixIcon != null
                      ? Container(
                        margin: const EdgeInsets.all(12),
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color:
                              _isFocused
                                  ? PremiumColors.primary.withOpacity(0.1)
                                  : PremiumColors.surface,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(
                          widget.prefixIcon,
                          color:
                              _isFocused
                                  ? PremiumColors.primary
                                  : PremiumColors.textMedium,
                          size: 20,
                        ),
                      )
                      : null,
              suffixIcon: widget.suffix,
              border: InputBorder.none,
              contentPadding: EdgeInsets.symmetric(
                horizontal: widget.prefixIcon != null ? 0 : 16,
                vertical: 16,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// Premium Dropdown - قائمة منسدلة بتصميم premium
class PremiumDropdown<T> extends StatefulWidget {
  final String label;
  final T? value;
  final List<DropdownItem<T>> items;
  final void Function(T?)? onChanged;
  final IconData? prefixIcon;
  final String? hint;
  final bool enabled;

  const PremiumDropdown({
    super.key,
    required this.label,
    this.value,
    required this.items,
    this.onChanged,
    this.prefixIcon,
    this.hint,
    this.enabled = true,
  });

  @override
  State<PremiumDropdown<T>> createState() => _PremiumDropdownState<T>();
}

class _PremiumDropdownState<T> extends State<PremiumDropdown<T>> {
  bool _isExpanded = false;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Label
        Text(
          widget.label,
          style: TextStyle(
            fontFamily: 'Cairo',
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color:
                _isExpanded ? PremiumColors.primary : PremiumColors.textMedium,
          ),
        ),
        const SizedBox(height: 8),

        // Dropdown Container
        AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: _isExpanded ? PremiumColors.primary : PremiumColors.border,
              width: _isExpanded ? 2 : 1,
            ),
            color: widget.enabled ? Colors.white : PremiumColors.surface,
            boxShadow:
                _isExpanded
                    ? [
                      BoxShadow(
                        color: PremiumColors.primary.withOpacity(0.1),
                        blurRadius: 8,
                        offset: const Offset(0, 4),
                      ),
                    ]
                    : null,
          ),
          child: DropdownButtonFormField<T>(
            value: widget.value,
            isExpanded: true,
            icon: AnimatedRotation(
              turns: _isExpanded ? 0.5 : 0,
              duration: const Duration(milliseconds: 200),
              child: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: PremiumColors.gold.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.keyboard_arrow_down_rounded,
                  color: PremiumColors.gold,
                  size: 20,
                ),
              ),
            ),
            decoration: InputDecoration(
              hintText: widget.hint,
              hintStyle: TextStyle(
                fontFamily: 'Cairo',
                fontSize: 14,
                color: Colors.grey.shade400,
              ),
              prefixIcon:
                  widget.prefixIcon != null
                      ? Container(
                        margin: const EdgeInsets.all(12),
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color:
                              _isExpanded
                                  ? PremiumColors.primary.withOpacity(0.1)
                                  : PremiumColors.surface,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(
                          widget.prefixIcon,
                          color:
                              _isExpanded
                                  ? PremiumColors.primary
                                  : PremiumColors.textMedium,
                          size: 20,
                        ),
                      )
                      : null,
              border: InputBorder.none,
              contentPadding: EdgeInsets.symmetric(
                horizontal: widget.prefixIcon != null ? 0 : 16,
                vertical: 4,
              ),
            ),
            dropdownColor: Colors.white,
            borderRadius: BorderRadius.circular(14),
            onTap: () {
              setState(() {
                _isExpanded = !_isExpanded;
              });
            },
            onChanged:
                widget.enabled
                    ? (value) {
                      setState(() {
                        _isExpanded = false;
                      });
                      widget.onChanged?.call(value);
                    }
                    : null,
            items:
                widget.items
                    .map(
                      (item) => DropdownMenuItem<T>(
                        value: item.value,
                        child: Text(
                          item.label,
                          style: const TextStyle(
                            fontFamily: 'Cairo',
                            fontSize: 14,
                            color: PremiumColors.textDark,
                          ),
                        ),
                      ),
                    )
                    .toList(),
          ),
        ),
      ],
    );
  }
}

/// Dropdown Item Model
class DropdownItem<T> {
  final T value;
  final String label;
  final IconData? icon;

  const DropdownItem({required this.value, required this.label, this.icon});
}

/// Premium Button - زر بتصميم premium
class PremiumButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool isLoading;
  final bool isOutlined;
  final bool isDanger;
  final double? width;
  final double height;

  const PremiumButton({
    super.key,
    required this.text,
    this.onPressed,
    this.icon,
    this.isLoading = false,
    this.isOutlined = false,
    this.isDanger = false,
    this.width,
    this.height = 52,
  });

  @override
  Widget build(BuildContext context) {
    final gradientColors =
        isDanger
            ? [PremiumColors.error, const Color(0xFFDC2626)]
            : [PremiumColors.primary, PremiumColors.primaryLight];

    if (isOutlined) {
      return SizedBox(
        width: width,
        height: height,
        child: OutlinedButton(
          onPressed: isLoading ? null : onPressed,
          style: OutlinedButton.styleFrom(
            side: BorderSide(
              color: isDanger ? PremiumColors.error : PremiumColors.primary,
              width: 1.5,
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
          ),
          child: _buildContent(
            isDanger ? PremiumColors.error : PremiumColors.primary,
          ),
        ),
      );
    }

    return SizedBox(
      width: width,
      height: height,
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
              color: gradientColors.first.withOpacity(0.4),
              blurRadius: 12,
              offset: const Offset(0, 6),
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
          child: _buildContent(Colors.white),
        ),
      ),
    );
  }

  Widget _buildContent(Color color) {
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
      mainAxisSize: MainAxisSize.min,
      children: [
        if (icon != null) ...[
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 8),
        ],
        Text(
          text,
          style: TextStyle(
            fontFamily: 'Cairo',
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
      ],
    );
  }
}

/// Premium Card - بطاقة بتصميم premium
class PremiumCard extends StatelessWidget {
  final Widget child;
  final EdgeInsets? padding;
  final EdgeInsets? margin;
  final VoidCallback? onTap;
  final bool showGoldAccent;
  final Color? backgroundColor;

  const PremiumCard({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.onTap,
    this.showGoldAccent = false,
    this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin ?? const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        color: backgroundColor ?? Colors.white,
        borderRadius: BorderRadius.circular(16),
        border:
            showGoldAccent
                ? Border.all(
                  color: PremiumColors.gold.withOpacity(0.3),
                  width: 1,
                )
                : null,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(16),
          child: Stack(
            children: [
              Padding(
                padding: padding ?? const EdgeInsets.all(16),
                child: child,
              ),
              if (showGoldAccent)
                Positioned(
                  top: 0,
                  right: 16,
                  child: Container(
                    width: 4,
                    height: 30,
                    decoration: BoxDecoration(
                      color: PremiumColors.gold,
                      borderRadius: const BorderRadius.only(
                        bottomLeft: Radius.circular(4),
                        bottomRight: Radius.circular(4),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Premium Badge - شارة بتصميم premium
class PremiumBadge extends StatelessWidget {
  final String text;
  final Color? color;
  final Color? textColor;
  final IconData? icon;
  final bool isOutlined;

  const PremiumBadge({
    super.key,
    required this.text,
    this.color,
    this.textColor,
    this.icon,
    this.isOutlined = false,
  });

  factory PremiumBadge.success(String text, {IconData? icon}) {
    return PremiumBadge(
      text: text,
      color: PremiumColors.successLight,
      textColor: PremiumColors.success,
      icon: icon,
    );
  }

  factory PremiumBadge.error(String text, {IconData? icon}) {
    return PremiumBadge(
      text: text,
      color: PremiumColors.errorLight,
      textColor: PremiumColors.error,
      icon: icon,
    );
  }

  factory PremiumBadge.warning(String text, {IconData? icon}) {
    return PremiumBadge(
      text: text,
      color: PremiumColors.warningLight,
      textColor: PremiumColors.warning,
      icon: icon,
    );
  }

  factory PremiumBadge.info(String text, {IconData? icon}) {
    return PremiumBadge(
      text: text,
      color: PremiumColors.infoLight,
      textColor: PremiumColors.info,
      icon: icon,
    );
  }

  factory PremiumBadge.gold(String text, {IconData? icon}) {
    return PremiumBadge(
      text: text,
      color: PremiumColors.goldLight,
      textColor: PremiumColors.gold,
      icon: icon,
    );
  }

  @override
  Widget build(BuildContext context) {
    final bgColor = color ?? PremiumColors.primary.withOpacity(0.1);
    final fgColor = textColor ?? PremiumColors.primary;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: isOutlined ? Colors.transparent : bgColor,
        border: isOutlined ? Border.all(color: fgColor, width: 1) : null,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, color: fgColor, size: 14),
            const SizedBox(width: 6),
          ],
          Text(
            text,
            style: TextStyle(
              fontFamily: 'Cairo',
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: fgColor,
            ),
          ),
        ],
      ),
    );
  }
}

/// Premium Divider - خط فاصل بتصميم premium
class PremiumDivider extends StatelessWidget {
  final String? text;
  final bool showGoldAccent;

  const PremiumDivider({super.key, this.text, this.showGoldAccent = false});

  @override
  Widget build(BuildContext context) {
    if (text == null) {
      return Container(
        height: 1,
        margin: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          gradient:
              showGoldAccent
                  ? LinearGradient(
                    colors: [
                      Colors.transparent,
                      PremiumColors.gold.withOpacity(0.5),
                      Colors.transparent,
                    ],
                  )
                  : null,
          color: showGoldAccent ? null : PremiumColors.border,
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Row(
        children: [
          Expanded(child: Container(height: 1, color: PremiumColors.border)),
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color:
                  showGoldAccent
                      ? PremiumColors.goldLight
                      : PremiumColors.surface,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              text!,
              style: TextStyle(
                fontFamily: 'Cairo',
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color:
                    showGoldAccent
                        ? PremiumColors.gold
                        : PremiumColors.textMedium,
              ),
            ),
          ),
          Expanded(child: Container(height: 1, color: PremiumColors.border)),
        ],
      ),
    );
  }
}

/// Premium Empty State - حالة فارغة بتصميم premium
class PremiumEmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final String? buttonText;
  final VoidCallback? onButtonPressed;

  const PremiumEmptyState({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.buttonText,
    this.onButtonPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    PremiumColors.primary.withOpacity(0.1),
                    PremiumColors.primaryLight.withOpacity(0.05),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 56, color: PremiumColors.primary),
            ),
            const SizedBox(height: 24),
            Container(
              width: 50,
              height: 3,
              decoration: BoxDecoration(
                color: PremiumColors.gold,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              title,
              style: const TextStyle(
                fontFamily: 'Cairo',
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: PremiumColors.textDark,
              ),
              textAlign: TextAlign.center,
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 12),
              Text(
                subtitle!,
                style: const TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 14,
                  color: PremiumColors.textMedium,
                ),
                textAlign: TextAlign.center,
              ),
            ],
            if (buttonText != null && onButtonPressed != null) ...[
              const SizedBox(height: 32),
              PremiumButton(
                text: buttonText!,
                onPressed: onButtonPressed,
                icon: Icons.add_rounded,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
