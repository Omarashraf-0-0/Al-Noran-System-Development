import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../core/network/api_service.dart';
import '../../core/widgets/enhanced_popups.dart';
import '../../theme/app_colors.dart';
import 'auth_dark_mode_mixin.dart';

class ResetPasswordPage extends StatefulWidget {
  final String email;

  const ResetPasswordPage({super.key, required this.email});

  @override
  State<ResetPasswordPage> createState() => _ResetPasswordPageState();
}

class _ResetPasswordPageState extends State<ResetPasswordPage>
    with SingleTickerProviderStateMixin, AuthDarkModeMixin {
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController =
      TextEditingController();

  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _isLoading = false;

  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();

    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: const Interval(0.0, 0.6, curve: Curves.easeIn),
      ),
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: const Interval(0.2, 0.8, curve: Curves.easeOutCubic),
      ),
    );

    _animationController.forward();
  }

  @override
  void dispose() {
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // ============= PREMIUM GRADIENT BACKGROUND =============
          Container(
            width: double.infinity,
            height: double.infinity,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: backgroundGradient,
                stops: const [0.0, 0.5, 1.0],
              ),
            ),
          ),

          // ============= DECORATIVE CIRCLES =============
          Positioned(
            top: -80,
            right: -60,
            child: Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: decorativeCircleColor,
              ),
            ),
          ),
          Positioned(
            bottom: -100,
            left: -80,
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: decorativeCircleColorSmall,
              ),
            ),
          ),

          // ============= GOLDEN ACCENT LINE =============
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: Container(
              height: 3,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.transparent,
                    Color(0xFFD4AF37),
                    Color(0xFFF5E7A3),
                    Color(0xFFD4AF37),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          // ============= MAIN CONTENT =============
          SafeArea(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: SlideTransition(
                  position: _slideAnimation,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Column(
                      children: [
                        const SizedBox(height: 16),

                        // Back Button
                        _buildBackButton(),

                        const SizedBox(height: 32),

                        // Icon
                        _buildIcon(),

                        const SizedBox(height: 24),

                        // Title & Description
                        _buildHeader(),

                        const SizedBox(height: 32),

                        // Form Card
                        _buildFormCard(),

                        const SizedBox(height: 20),

                        // Password Requirements
                        _buildPasswordRequirements(),

                        const SizedBox(height: 40),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ============= PREMIUM BACK BUTTON =============
  Widget _buildBackButton() {
    return Align(
      alignment: Alignment.centerLeft,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => context.pop(),
          borderRadius: BorderRadius.circular(14),
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: backButtonBgColor,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: const Color(0xFFD4AF37).withValues(alpha: 0.4),
                width: 1.5,
              ),
            ),
            child: const Icon(
              Icons.arrow_forward_rounded,
              color: Colors.white,
              size: 24,
            ),
          ),
        ),
      ),
    );
  }

  // ============= PREMIUM ICON WITH GOLD RING =============
  Widget _buildIcon() {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: const Duration(milliseconds: 800),
      curve: Curves.elasticOut,
      builder: (context, value, child) {
        return Transform.scale(
          scale: value,
          child: Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFFD4AF37),
                  Color(0xFFF5E7A3),
                  Color(0xFFD4AF37),
                ],
              ),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFFD4AF37).withValues(alpha: 0.5),
                  blurRadius: 25,
                  spreadRadius: 3,
                ),
              ],
            ),
            child: Container(
              margin: const EdgeInsets.all(5),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: logoContainerColor,
              ),
              child: const Icon(
                Icons.lock_reset_rounded,
                size: 55,
                color: Color(0xFFD4AF37),
              ),
            ),
          ),
        );
      },
    );
  }

  // ============= PREMIUM HEADER WITH GOLD TEXT =============
  Widget _buildHeader() {
    return Column(
      children: [
        ShaderMask(
          shaderCallback:
              (bounds) => const LinearGradient(
                colors: [
                  Color(0xFFD4AF37),
                  Color(0xFFF5E7A3),
                  Color(0xFFD4AF37),
                ],
              ).createShader(bounds),
          child: const Text(
            'تعيين كلمة مرور جديدة',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: Colors.white,
              letterSpacing: 0.5,
            ),
            textAlign: TextAlign.center,
          ),
        ),
        const SizedBox(height: 12),
        Text(
          'أدخل كلمة مرور قوية لحسابك',
          style: TextStyle(
            fontSize: 15,
            color: Colors.white.withValues(alpha: 0.8),
            height: 1.5,
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  // ============= PREMIUM FORM CARD =============
  Widget _buildFormCard() {
    final badgeBgColor =
        isDark
            ? AppColors.gold.withValues(alpha: 0.15)
            : LinearGradient(
              colors: [
                const Color(0xFF690000).withValues(alpha: 0.1),
                const Color(0xFFD4AF37).withValues(alpha: 0.1),
              ],
            );
    final badgeTextColor = isDark ? AppColors.gold : const Color(0xFF690000);
    final badgeIconColor = isDark ? AppColors.gold : const Color(0xFF690000);

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: cardDecoration,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Premium badge
          Container(
            margin: const EdgeInsets.only(bottom: 20),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: isDark ? AppColors.gold.withValues(alpha: 0.15) : null,
              gradient:
                  isDark
                      ? null
                      : LinearGradient(
                        colors: [
                          const Color(0xFF690000).withValues(alpha: 0.1),
                          const Color(0xFFD4AF37).withValues(alpha: 0.1),
                        ],
                      ),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: const Color(0xFFD4AF37).withValues(alpha: 0.3),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.shield_rounded, size: 18, color: badgeIconColor),
                const SizedBox(width: 8),
                Text(
                  'كلمة مرور محمية',
                  style: TextStyle(
                    fontSize: 14,
                    color: badgeTextColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),

          // Password Field
          _buildLabeledTextField(
            label: 'كلمة المرور الجديدة',
            controller: _passwordController,
            isPassword: true,
            obscureText: _obscurePassword,
            onToggleVisibility: () {
              setState(() => _obscurePassword = !_obscurePassword);
              HapticFeedback.selectionClick();
            },
            prefixIcon: Icons.lock_rounded,
          ),

          const SizedBox(height: 20),

          // Confirm Password Field
          _buildLabeledTextField(
            label: 'تأكيد كلمة المرور',
            controller: _confirmPasswordController,
            isPassword: true,
            obscureText: _obscureConfirmPassword,
            onToggleVisibility: () {
              setState(
                () => _obscureConfirmPassword = !_obscureConfirmPassword,
              );
              HapticFeedback.selectionClick();
            },
            prefixIcon: Icons.lock_rounded,
          ),

          const SizedBox(height: 28),

          // Premium Submit Button
          _buildPremiumSubmitButton(),
        ],
      ),
    );
  }

  // ============= PREMIUM TEXT FIELD =============
  Widget _buildLabeledTextField({
    required String label,
    required TextEditingController controller,
    bool isPassword = false,
    bool obscureText = false,
    VoidCallback? onToggleVisibility,
    IconData? prefixIcon,
  }) {
    final labelTextColor = isDark ? AppColors.gold : const Color(0xFF690000);
    final textFieldBgColor =
        isDark ? AppColors.darkSurface : const Color(0xFFF8F8F8);
    final textColor =
        isDark ? AppColors.darkTextPrimary : const Color(0xFF2D2D2D);
    final borderActiveColor = const Color(0xFFD4AF37);
    final borderInactiveColor = const Color(0xFFD4AF37).withValues(alpha: 0.3);
    final visibilityColor = isDark ? AppColors.gold : const Color(0xFF690000);
    final hintTextColor =
        isDark ? AppColors.darkTextMuted : Colors.grey.shade400;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        // Label with gold accent
        Padding(
          padding: const EdgeInsets.only(bottom: 10, right: 4),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: labelTextColor,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFD4AF37), Color(0xFFF5E7A3)],
                  ),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  prefixIcon ?? Icons.lock_rounded,
                  size: 14,
                  color: const Color(0xFF690000),
                ),
              ),
            ],
          ),
        ),

        // TextField
        Container(
          decoration: BoxDecoration(
            color: textFieldBgColor,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color:
                  controller.text.isNotEmpty
                      ? borderActiveColor
                      : borderInactiveColor,
              width: controller.text.isNotEmpty ? 2 : 1.5,
            ),
          ),
          child: TextField(
            controller: controller,
            obscureText: isPassword ? obscureText : false,
            style: TextStyle(fontSize: 16, color: textColor),
            decoration: InputDecoration(
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 16,
              ),
              hintText: label,
              hintStyle: TextStyle(color: hintTextColor, fontSize: 14),
              // Toggle visibility
              suffixIcon:
                  isPassword
                      ? IconButton(
                        icon: Icon(
                          obscureText
                              ? Icons.visibility_off_rounded
                              : Icons.visibility_rounded,
                          color: visibilityColor,
                          size: 22,
                        ),
                        onPressed: onToggleVisibility,
                      )
                      : null,
            ),
            onChanged: (value) => setState(() {}),
          ),
        ),
      ],
    );
  }

  // ============= PREMIUM SUBMIT BUTTON =============
  Widget _buildPremiumSubmitButton() {
    return SizedBox(
      height: 56,
      child: ElevatedButton(
        onPressed: _isLoading ? null : _resetPassword,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          padding: EdgeInsets.zero,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
        child: Ink(
          decoration: BoxDecoration(
            gradient: buttonGradient,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: buttonShadowColor,
                blurRadius: 15,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Container(
            alignment: Alignment.center,
            child:
                _isLoading
                    ? SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          buttonTextColor,
                        ),
                      ),
                    )
                    : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.check_circle_rounded,
                          color: buttonTextColor,
                        ),
                        const SizedBox(width: 10),
                        Text(
                          'تأكيد',
                          style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.bold,
                            color: buttonTextColor,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
          ),
        ),
      ),
    );
  }

  // ============= PREMIUM PASSWORD REQUIREMENTS =============
  Widget _buildPasswordRequirements() {
    final containerBg =
        isDark
            ? AppColors.darkCard.withValues(alpha: 0.5)
            : Colors.white.withValues(alpha: 0.15);
    final textNotMetColor =
        isDark
            ? AppColors.darkTextSecondary
            : Colors.white.withValues(alpha: 0.7);
    final circleNotMetColor =
        isDark ? AppColors.darkCard : Colors.white.withValues(alpha: 0.1);
    final iconNotMetColor =
        isDark ? AppColors.darkTextMuted : Colors.white.withValues(alpha: 0.5);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: containerBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFFD4AF37).withValues(alpha: 0.4),
          width: 1.5,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              ShaderMask(
                shaderCallback:
                    (bounds) => const LinearGradient(
                      colors: [Color(0xFFD4AF37), Color(0xFFF5E7A3)],
                    ).createShader(bounds),
                child: const Text(
                  'متطلبات كلمة المرور',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                    fontSize: 15,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFD4AF37), Color(0xFFF5E7A3)],
                  ),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(
                  Icons.info_outline_rounded,
                  color: Color(0xFF690000),
                  size: 16,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          _buildRequirement(
            '6 أرقام على الأقل',
            _passwordController.text.length >= 6,
          ),
        ],
      ),
    );
  }

  Widget _buildRequirement(String text, bool isMet) {
    final textNotMetColor =
        isDark
            ? AppColors.darkTextSecondary
            : Colors.white.withValues(alpha: 0.7);
    final circleNotMetColor =
        isDark ? AppColors.darkCard : Colors.white.withValues(alpha: 0.1);
    final iconNotMetColor =
        isDark ? AppColors.darkTextMuted : Colors.white.withValues(alpha: 0.5);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          Text(
            text,
            style: TextStyle(
              fontSize: 14,
              color: isMet ? const Color(0xFF4CAF50) : textNotMetColor,
              fontWeight: isMet ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color:
                  isMet
                      ? const Color(0xFF4CAF50).withValues(alpha: 0.2)
                      : circleNotMetColor,
            ),
            child: Icon(
              isMet ? Icons.check_circle : Icons.radio_button_unchecked,
              color: isMet ? const Color(0xFF4CAF50) : iconNotMetColor,
              size: 16,
            ),
          ),
        ],
      ),
    );
  }

  // ============= PASSWORD VALIDATION =============
  bool _isPasswordValid(String password) {
    return password.length >= 6 && RegExp(r'^\d{6,}$').hasMatch(password);
  }

  // ============= RESET PASSWORD =============
  Future<void> _resetPassword() async {
    FocusScope.of(context).unfocus();

    String password = _passwordController.text.trim();
    String confirmPassword = _confirmPasswordController.text.trim();

    if (password.isEmpty || confirmPassword.isEmpty) {
      HapticFeedback.mediumImpact();
      EnhancedPopups.showWarning(
        context: context,
        title: 'تنبيه',
        message: 'الرجاء إدخال كلمة المرور وتأكيدها',
      );
      return;
    }

    if (!_isPasswordValid(password)) {
      HapticFeedback.mediumImpact();
      EnhancedPopups.showWarning(
        context: context,
        title: 'كلمة مرور غير صحيحة',
        message: 'كلمة المرور يجب أن تكون 6 أرقام على الأقل',
      );
      return;
    }

    if (password != confirmPassword) {
      HapticFeedback.mediumImpact();
      EnhancedPopups.showError(
        context: context,
        title: 'خطأ',
        message: 'كلمة المرور غير متطابقة',
      );
      return;
    }

    setState(() => _isLoading = true);
    HapticFeedback.lightImpact();

    try {
      final result = await ApiService.resetPassword(
        email: widget.email,
        newPassword: password,
      );

      setState(() => _isLoading = false);

      if (!mounted) return;

      if (result['success'] == true) {
        HapticFeedback.heavyImpact();
        EnhancedPopups.showSuccess(
          context: context,
          title: 'تم بنجاح',
          message: 'تم تغيير كلمة المرور بنجاح',
        );

        await Future.delayed(const Duration(milliseconds: 1500));
        if (!mounted) return;

        context.go('/login');
      } else {
        HapticFeedback.mediumImpact();
        EnhancedPopups.showError(
          context: context,
          title: 'خطأ',
          message: result['message'] ?? 'فشل تغيير كلمة المرور',
        );
      }
    } catch (e) {
      setState(() => _isLoading = false);
      HapticFeedback.mediumImpact();

      if (mounted) {
        EnhancedPopups.showError(
          context: context,
          title: 'خطأ',
          message: 'حدث خطأ في الاتصال بالسيرفر',
        );
      }
    }
  }
}
