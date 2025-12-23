import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../theme/theme.dart';

/// حقل إدخال محسّن مع animations و validation
/// Enhanced Text Field with animations and validation
class AppTextField extends StatefulWidget {
  final TextEditingController? controller;
  final String? hintText;
  final String? labelText;
  final String? errorText;
  final IconData? prefixIcon;
  final IconData? suffixIcon;
  final bool obscureText;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final int? maxLines;
  final int? maxLength;
  final bool enabled;
  final bool readOnly;
  final bool showClearButton;
  final VoidCallback? onTap;
  final Function(String)? onChanged;
  final Function(String)? onSubmitted;
  final String? Function(String?)? validator;
  final List<TextInputFormatter>? inputFormatters;
  final FocusNode? focusNode;
  final bool autofocus;
  final EdgeInsetsGeometry? contentPadding;

  const AppTextField({
    super.key,
    this.controller,
    this.hintText,
    this.labelText,
    this.errorText,
    this.prefixIcon,
    this.suffixIcon,
    this.obscureText = false,
    this.keyboardType,
    this.textInputAction,
    this.maxLines = 1,
    this.maxLength,
    this.enabled = true,
    this.readOnly = false,
    this.showClearButton = false,
    this.onTap,
    this.onChanged,
    this.onSubmitted,
    this.validator,
    this.inputFormatters,
    this.focusNode,
    this.autofocus = false,
    this.contentPadding,
  });

  @override
  State<AppTextField> createState() => _AppTextFieldState();
}

class _AppTextFieldState extends State<AppTextField>
    with SingleTickerProviderStateMixin {
  late FocusNode _focusNode;
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  bool _isFocused = false;
  bool _hasText = false;

  @override
  void initState() {
    super.initState();
    _focusNode = widget.focusNode ?? FocusNode();
    _focusNode.addListener(_onFocusChange);

    _controller = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );

    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 1.02,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));

    if (widget.controller != null) {
      _hasText = widget.controller!.text.isNotEmpty;
      widget.controller!.addListener(_onTextChange);
    }
  }

  @override
  void dispose() {
    if (widget.focusNode == null) {
      _focusNode.dispose();
    }
    _controller.dispose();
    widget.controller?.removeListener(_onTextChange);
    super.dispose();
  }

  void _onFocusChange() {
    setState(() {
      _isFocused = _focusNode.hasFocus;
      if (_isFocused) {
        _controller.forward();
        HapticFeedback.lightImpact();
      } else {
        _controller.reverse();
      }
    });
  }

  void _onTextChange() {
    setState(() {
      _hasText = widget.controller!.text.isNotEmpty;
    });
  }

  void _clearText() {
    widget.controller?.clear();
    setState(() => _hasText = false);
    HapticFeedback.lightImpact();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: _scaleAnimation,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        decoration: BoxDecoration(
          color:
              widget.enabled
                  ? (_isFocused ? AppColors.white : AppColors.background)
                  : AppColors.greyLight.withOpacity(0.3),
          borderRadius: AppSpacing.borderRadiusMD,
          border: Border.all(
            color:
                widget.errorText != null
                    ? AppColors.error
                    : (_isFocused ? AppColors.primary : Colors.transparent),
            width: _isFocused || widget.errorText != null ? 2 : 0,
          ),
          boxShadow:
              _isFocused
                  ? [
                    BoxShadow(
                      color: AppColors.primary.withOpacity(0.1),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ]
                  : null,
        ),
        child: TextField(
          controller: widget.controller,
          focusNode: _focusNode,
          obscureText: widget.obscureText,
          keyboardType: widget.keyboardType,
          textInputAction: widget.textInputAction,
          maxLines: widget.maxLines,
          maxLength: widget.maxLength,
          enabled: widget.enabled,
          readOnly: widget.readOnly,
          autofocus: widget.autofocus,
          textAlign: TextAlign.right,
          style: AppTypography.body.copyWith(
            color: widget.enabled ? AppColors.textDark : AppColors.textLight,
          ),
          inputFormatters: widget.inputFormatters,
          onTap: widget.onTap,
          onChanged: widget.onChanged,
          onSubmitted: widget.onSubmitted,
          decoration: InputDecoration(
            hintText: widget.hintText,
            labelText: widget.labelText,
            errorText: widget.errorText,
            hintStyle: AppTypography.body.copyWith(color: AppColors.textGrey),
            errorStyle: AppTypography.small.copyWith(color: AppColors.error),
            border: InputBorder.none,
            contentPadding:
                widget.contentPadding ??
                const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
            prefixIcon:
                widget.prefixIcon != null
                    ? Icon(
                      widget.prefixIcon,
                      color:
                          _isFocused ? AppColors.primary : AppColors.textGrey,
                      size: AppSpacing.iconMD,
                    )
                    : null,
            suffixIcon: _buildSuffixIcon(),
            counterText: '',
          ),
        ),
      ),
    );
  }

  Widget? _buildSuffixIcon() {
    if (widget.showClearButton && _hasText && !widget.readOnly) {
      return IconButton(
        icon: Icon(
          Icons.clear_rounded,
          color: AppColors.textLight,
          size: AppSpacing.iconSM,
        ),
        onPressed: _clearText,
      );
    }

    if (widget.suffixIcon != null) {
      return Icon(
        widget.suffixIcon,
        color: _isFocused ? AppColors.primary : AppColors.textGrey,
        size: AppSpacing.iconMD,
      );
    }

    return null;
  }
}

/// حقل كلمة المرور المحسّن
/// Enhanced Password Text Field
class AppPasswordField extends StatefulWidget {
  final TextEditingController? controller;
  final String? hintText;
  final String? labelText;
  final String? errorText;
  final Function(String)? onChanged;
  final Function(String)? onSubmitted;
  final String? Function(String?)? validator;
  final bool showStrengthIndicator;
  final TextInputAction? textInputAction;
  final bool autofocus;

  const AppPasswordField({
    super.key,
    this.controller,
    this.hintText,
    this.labelText,
    this.errorText,
    this.onChanged,
    this.onSubmitted,
    this.validator,
    this.showStrengthIndicator = false,
    this.textInputAction,
    this.autofocus = false,
  });

  @override
  State<AppPasswordField> createState() => _AppPasswordFieldState();
}

class _AppPasswordFieldState extends State<AppPasswordField> {
  bool _obscureText = true;
  double _passwordStrength = 0.0;
  Color _strengthColor = AppColors.error;

  @override
  void initState() {
    super.initState();
    if (widget.showStrengthIndicator && widget.controller != null) {
      widget.controller!.addListener(_calculatePasswordStrength);
    }
  }

  @override
  void dispose() {
    widget.controller?.removeListener(_calculatePasswordStrength);
    super.dispose();
  }

  void _calculatePasswordStrength() {
    final password = widget.controller!.text;
    double strength = 0.0;

    if (password.isEmpty) {
      strength = 0.0;
    } else {
      // Length check
      if (password.length >= 8) strength += 0.25;
      if (password.length >= 12) strength += 0.25;

      // Contains uppercase
      if (password.contains(RegExp(r'[A-Z]'))) strength += 0.15;

      // Contains lowercase
      if (password.contains(RegExp(r'[a-z]'))) strength += 0.15;

      // Contains numbers
      if (password.contains(RegExp(r'[0-9]'))) strength += 0.1;

      // Contains special characters
      if (password.contains(RegExp(r'[!@#$%^&*(),.?":{}|<>]'))) strength += 0.1;
    }

    setState(() {
      _passwordStrength = strength;
      if (strength < 0.3) {
        _strengthColor = AppColors.error;
      } else if (strength < 0.6) {
        _strengthColor = AppColors.warning;
      } else if (strength < 0.8) {
        _strengthColor = Colors.orange;
      } else {
        _strengthColor = AppColors.success;
      }
    });
  }

  void _toggleObscureText() {
    setState(() => _obscureText = !_obscureText);
    HapticFeedback.lightImpact();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AppTextField(
          controller: widget.controller,
          hintText: widget.hintText,
          labelText: widget.labelText,
          errorText: widget.errorText,
          obscureText: _obscureText,
          prefixIcon: Icons.lock_outline,
          suffixIcon:
              _obscureText
                  ? Icons.visibility_off_outlined
                  : Icons.visibility_outlined,
          onChanged: widget.onChanged,
          onSubmitted: widget.onSubmitted,
          validator: widget.validator,
          textInputAction: widget.textInputAction,
          autofocus: widget.autofocus,
          keyboardType: TextInputType.visiblePassword,
        ),
        if (widget.showStrengthIndicator && _passwordStrength > 0) ...[
          AppSpacing.gapVerticalSM,
          AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.greyLight,
              borderRadius: AppSpacing.borderRadiusXS,
            ),
            child: FractionallySizedBox(
              alignment: Alignment.centerRight,
              widthFactor: _passwordStrength,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                decoration: BoxDecoration(
                  color: _strengthColor,
                  borderRadius: AppSpacing.borderRadiusXS,
                ),
              ),
            ),
          ),
          AppSpacing.gapVerticalXS,
          Text(
            _getStrengthText(),
            style: AppTypography.caption.copyWith(
              color: _strengthColor,
              fontWeight: AppTypography.fontWeightSemiBold,
            ),
          ),
        ],
      ],
    );
  }

  String _getStrengthText() {
    if (_passwordStrength < 0.3) {
      return 'ضعيفة';
    } else if (_passwordStrength < 0.6) {
      return 'متوسطة';
    } else if (_passwordStrength < 0.8) {
      return 'جيدة';
    } else {
      return 'قوية جداً';
    }
  }
}

/// حقل بحث محسّن
/// Enhanced Search Field
class AppSearchField extends StatefulWidget {
  final TextEditingController? controller;
  final String? hintText;
  final Function(String)? onChanged;
  final Function(String)? onSubmitted;
  final VoidCallback? onClear;

  const AppSearchField({
    super.key,
    this.controller,
    this.hintText,
    this.onChanged,
    this.onSubmitted,
    this.onClear,
  });

  @override
  State<AppSearchField> createState() => _AppSearchFieldState();
}

class _AppSearchFieldState extends State<AppSearchField> {
  late TextEditingController _controller;
  bool _hasText = false;

  @override
  void initState() {
    super.initState();
    _controller = widget.controller ?? TextEditingController();
    _hasText = _controller.text.isNotEmpty;
    _controller.addListener(_onTextChange);
  }

  @override
  void dispose() {
    _controller.removeListener(_onTextChange);
    if (widget.controller == null) {
      _controller.dispose();
    }
    super.dispose();
  }

  void _onTextChange() {
    setState(() {
      _hasText = _controller.text.isNotEmpty;
    });
  }

  void _clearText() {
    _controller.clear();
    widget.onClear?.call();
    HapticFeedback.lightImpact();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: AppSpacing.borderRadiusRound,
        border: Border.all(color: AppColors.greyBorder, width: 1),
      ),
      child: TextField(
        controller: _controller,
        textAlign: TextAlign.right,
        style: AppTypography.body,
        onChanged: widget.onChanged,
        onSubmitted: widget.onSubmitted,
        decoration: InputDecoration(
          hintText: widget.hintText ?? 'بحث...',
          hintStyle: AppTypography.body.copyWith(color: AppColors.textGrey),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 20,
            vertical: 12,
          ),
          prefixIcon: Icon(
            Icons.search_rounded,
            color: AppColors.textGrey,
            size: AppSpacing.iconMD,
          ),
          suffixIcon:
              _hasText
                  ? IconButton(
                    icon: Icon(
                      Icons.clear_rounded,
                      color: AppColors.textLight,
                      size: AppSpacing.iconSM,
                    ),
                    onPressed: _clearText,
                  )
                  : null,
        ),
      ),
    );
  }
}

/// حقل نصي متعدد الأسطر
/// Enhanced Multi-line Text Field
class AppTextArea extends StatelessWidget {
  final TextEditingController? controller;
  final String? hintText;
  final String? labelText;
  final String? errorText;
  final int maxLines;
  final int? maxLength;
  final Function(String)? onChanged;
  final String? Function(String?)? validator;

  const AppTextArea({
    super.key,
    this.controller,
    this.hintText,
    this.labelText,
    this.errorText,
    this.maxLines = 5,
    this.maxLength,
    this.onChanged,
    this.validator,
  });

  @override
  Widget build(BuildContext context) {
    return AppTextField(
      controller: controller,
      hintText: hintText,
      labelText: labelText,
      errorText: errorText,
      maxLines: maxLines,
      maxLength: maxLength,
      onChanged: onChanged,
      validator: validator,
      keyboardType: TextInputType.multiline,
      textInputAction: TextInputAction.newline,
      contentPadding: const EdgeInsets.all(16),
    );
  }
}
