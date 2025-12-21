import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../core/network/api_service.dart';
import '../../core/widgets/widgets.dart';
import '../../theme/theme.dart';

class ResetPasswordPage extends StatefulWidget {
  final String email;

  const ResetPasswordPage({super.key, required this.email});

  @override
  State<ResetPasswordPage> createState() => _ResetPasswordPageState();
}

class _ResetPasswordPageState extends State<ResetPasswordPage>
    with SingleTickerProviderStateMixin {
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
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              AppColors.primary.withValues(alpha: 0.08),
              AppColors.background,
              AppColors.background,
            ],
            stops: const [0.0, 0.3, 1.0],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: SlideTransition(
                position: _slideAnimation,
                child: Padding(
                  padding: AppSpacing.paddingHorizontalLG,
                  child: Column(
                    children: [
                      AppSpacing.gapVerticalSM,

                      // Back Button - على الشمال ويبص للشمال
                      _buildBackButton(),

                      AppSpacing.gapVerticalXL,

                      // Icon
                      _buildIcon(),

                      AppSpacing.gapVerticalLG,

                      // Title & Description
                      _buildHeader(),

                      AppSpacing.gapVerticalXL,

                      // Form Card
                      _buildFormCard(),

                      AppSpacing.gapVerticalMD,

                      // Password Requirements
                      _buildPasswordRequirements(),

                      AppSpacing.gapVerticalXL,
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  // ============= BACK BUTTON =============
  Widget _buildBackButton() {
    return Align(
      alignment: Alignment.centerLeft,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => context.pop(),
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Icon(
              Icons.arrow_forward_rounded,
              color: AppColors.primary,
              size: 24,
            ),
          ),
        ),
      ),
    );
  }

  // ============= ICON =============
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
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.15),
                  blurRadius: 30,
                  spreadRadius: 5,
                ),
              ],
            ),
            child: Icon(
              Icons.lock_reset_rounded,
              size: 60,
              color: AppColors.primary,
            ),
          ),
        );
      },
    );
  }

  // ============= HEADER =============
  Widget _buildHeader() {
    return Column(
      children: [
        Text(
          'تعيين كلمة مرور جديدة',
          style: AppTypography.h1.copyWith(
            color: AppColors.primary,
            fontSize: 28,
          ),
        ),
        AppSpacing.gapVerticalXS,
        Text(
          'أدخل كلمة مرور قوية لحسابك',
          style: AppTypography.body.copyWith(color: AppColors.textLight),
        ),
      ],
    );
  }

  // ============= FORM CARD =============
  Widget _buildFormCard() {
    return Container(
      padding: AppSpacing.paddingLG,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: AppSpacing.borderRadiusLG,
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.08),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
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

          AppSpacing.gapVerticalMD,

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

          AppSpacing.gapVerticalLG,

          // Submit Button
          AppPrimaryButton(
            text: 'تأكيد',
            onPressed: _resetPassword,
            isLoading: _isLoading,
            icon: Icons.check_circle_rounded,
          ),
        ],
      ),
    );
  }

  // ============= LABELED TEXT FIELD =============
  Widget _buildLabeledTextField({
    required String label,
    required TextEditingController controller,
    bool isPassword = false,
    bool obscureText = false,
    VoidCallback? onToggleVisibility,
    IconData? prefixIcon,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        // Label خارج الـ TextField
        Padding(
          padding: const EdgeInsets.only(bottom: 8, right: 4),
          child: Text(
            label,
            style: AppTypography.body.copyWith(
              fontWeight: FontWeight.w600,
              color: AppColors.textDark,
            ),
          ),
        ),

        // TextField
        Container(
          decoration: BoxDecoration(
            color: AppColors.background,
            borderRadius: AppSpacing.borderRadiusMD,
            border: Border.all(
              color:
                  controller.text.isNotEmpty
                      ? AppColors.primary.withValues(alpha: 0.3)
                      : AppColors.greyBorder,
            ),
          ),
          child: TextField(
            controller: controller,
            obscureText: isPassword ? obscureText : false,
            style: AppTypography.body.copyWith(color: AppColors.textDark),
            decoration: InputDecoration(
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 16,
              ),
              // Icon على اليمين في RTL (قبل النص)
              prefixIcon:
                  prefixIcon != null
                      ? Icon(prefixIcon, color: AppColors.primary, size: 22)
                      : null,
              // Toggle visibility على الشمال في RTL (بعد النص)
              suffixIcon:
                  isPassword
                      ? IconButton(
                        icon: Icon(
                          obscureText
                              ? Icons.visibility_off_rounded
                              : Icons.visibility_rounded,
                          color: AppColors.textGrey,
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

  // ============= PASSWORD REQUIREMENTS =============
  Widget _buildPasswordRequirements() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              Text(
                'متطلبات كلمة المرور',
                style: AppTypography.body.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(width: 8),
              Icon(
                Icons.info_outline_rounded,
                color: AppColors.primary,
                size: 20,
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildRequirement(
            '6 أرقام على الأقل',
            _passwordController.text.length >= 6,
          ),
        ],
      ),
    );
  }

  Widget _buildRequirement(String text, bool isMet) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          Text(
            text,
            style: AppTypography.small.copyWith(
              color: isMet ? Colors.green : AppColors.textGrey,
              fontWeight: isMet ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
          const SizedBox(width: 8),
          Icon(
            isMet ? Icons.check_circle : Icons.radio_button_unchecked,
            color: isMet ? Colors.green : AppColors.greyBorder,
            size: 18,
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
