import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../core/widgets/widgets.dart';
import '../../theme/theme.dart';
import '../../util/validators.dart';
import '../../core/network/api_service.dart';
import '../../core/services/google_sign_in_service.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage>
    with SingleTickerProviderStateMixin {
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _usernameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController =
      TextEditingController();

  final _formKey = GlobalKey<FormState>();
  bool _agreeToTerms = false;
  bool _isLoading = false;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  String _selectedAccountType = 'personal'; // personal, commercial, factory

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
    _nameController.dispose();
    _usernameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
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
                  child: Form(
                    key: _formKey,
                    child: Column(
                      children: [
                        AppSpacing.gapVerticalSM,

                        // Back Button - على الشمال ويبص للشمال
                        _buildBackButton(),

                        // Logo
                        _buildAnimatedLogo(),

                        AppSpacing.gapVerticalLG,

                        // Title & Subtitle
                        _buildHeader(),

                        AppSpacing.gapVerticalLG,

                        // Form Card
                        _buildFormCard(),

                        AppSpacing.gapVerticalLG,

                        // Login Link
                        _buildLoginLink(),

                        AppSpacing.gapVerticalLG,

                        // Divider
                        _buildDivider(),

                        AppSpacing.gapVerticalLG,

                        // Social Registration
                        _buildSocialRegistration(),

                        AppSpacing.gapVerticalXL,
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  // ============= BACK BUTTON - على الشمال ويبص للشمال =============
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
          // Name Field
          _buildLabeledTextField(
            controller: _nameController,
            label: 'الاسم بالكامل',
            hint: 'أدخل اسمك الكامل',
            icon: Icons.person_rounded,
            textInputAction: TextInputAction.next,
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'من فضلك أدخل الاسم';
              }
              if (value.length < 3) {
                return 'الاسم يجب أن يكون 3 أحرف على الأقل';
              }
              return null;
            },
          ),

          AppSpacing.gapVerticalMD,

          // Username Field
          _buildLabeledTextField(
            controller: _usernameController,
            label: 'اسم المستخدم',
            hint: 'أدخل اسم المستخدم',
            icon: Icons.alternate_email_rounded,
            textInputAction: TextInputAction.next,
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'من فضلك أدخل اسم المستخدم';
              }
              if (value.length < 3) {
                return 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل';
              }
              return null;
            },
          ),

          AppSpacing.gapVerticalMD,

          // Email Field
          _buildLabeledTextField(
            controller: _emailController,
            label: 'البريد الإلكتروني',
            hint: 'example@email.com',
            icon: Icons.email_rounded,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
            textDirection: TextDirection.ltr,
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'من فضلك أدخل البريد الإلكتروني';
              }
              if (!AlNoranValidators.isValidEmail(value)) {
                return 'البريد الإلكتروني غير صحيح';
              }
              return null;
            },
          ),

          AppSpacing.gapVerticalMD,

          // Phone Field
          _buildLabeledTextField(
            controller: _phoneController,
            label: 'رقم الهاتف',
            hint: '01xxxxxxxxx',
            icon: Icons.phone_rounded,
            keyboardType: TextInputType.phone,
            textInputAction: TextInputAction.next,
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'من فضلك أدخل رقم الهاتف';
              }
              if (value.length < 10) {
                return 'رقم الهاتف غير صحيح';
              }
              return null;
            },
          ),

          AppSpacing.gapVerticalMD,

          // Account Type Selector
          _buildAccountTypeSelector(),

          AppSpacing.gapVerticalMD,

          // Password Field
          _buildLabeledTextField(
            controller: _passwordController,
            label: 'كلمة المرور',
            hint: '••••••••',
            icon: Icons.lock_rounded,
            isPassword: true,
            obscureText: _obscurePassword,
            onToggleObscure:
                () => setState(() => _obscurePassword = !_obscurePassword),
            textInputAction: TextInputAction.next,
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'من فضلك أدخل كلمة المرور';
              }
              if (value.length < 6) {
                return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
              }
              return null;
            },
          ),

          AppSpacing.gapVerticalMD,

          // Confirm Password Field
          _buildLabeledTextField(
            controller: _confirmPasswordController,
            label: 'تأكيد كلمة المرور',
            hint: '••••••••',
            icon: Icons.lock_outline_rounded,
            isPassword: true,
            obscureText: _obscureConfirmPassword,
            onToggleObscure:
                () => setState(
                  () => _obscureConfirmPassword = !_obscureConfirmPassword,
                ),
            textInputAction: TextInputAction.done,
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'من فضلك أعد إدخال كلمة المرور';
              }
              if (value != _passwordController.text) {
                return 'كلمتا المرور غير متطابقتين';
              }
              return null;
            },
            onSubmitted: (_) => _handleRegister(),
          ),

          AppSpacing.gapVerticalMD,

          // Terms Checkbox
          _buildTermsCheckbox(),

          AppSpacing.gapVerticalLG,

          // Register Button
          AppPrimaryButton(
            text: 'إنشاء الحساب',
            onPressed: _handleRegister,
            isLoading: _isLoading,
            icon: Icons.person_add_rounded,
          ),
        ],
      ),
    );
  }

  // ============= LABELED TEXT FIELD =============
  Widget _buildLabeledTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    bool isPassword = false,
    bool obscureText = false,
    VoidCallback? onToggleObscure,
    TextInputType? keyboardType,
    TextInputAction? textInputAction,
    TextDirection? textDirection,
    String? Function(String?)? validator,
    Function(String)? onSubmitted,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Label outside - على اليمين
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
        // Input field
        TextFormField(
          controller: controller,
          obscureText: isPassword ? obscureText : false,
          keyboardType: keyboardType,
          textInputAction: textInputAction,
          textAlign: TextAlign.right,
          textDirection: textDirection,
          validator: validator,
          onFieldSubmitted: onSubmitted,
          style: AppTypography.body.copyWith(color: AppColors.textDark),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: AppTypography.body.copyWith(color: AppColors.textGrey),
            filled: true,
            fillColor: AppColors.background,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 16,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppColors.greyBorder, width: 1),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppColors.primary, width: 2),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppColors.error, width: 1),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppColors.error, width: 2),
            ),
            // أيقونة على الشمال (بعد النص في RTL)
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
                      onPressed: onToggleObscure,
                    )
                    : Icon(icon, color: AppColors.textGrey, size: 22),
            // أيقونة القفل على اليمين للباسورد
            prefixIcon:
                isPassword
                    ? Icon(icon, color: AppColors.textGrey, size: 22)
                    : null,
          ),
        ),
      ],
    );
  }

  // ============= ANIMATED LOGO =============
  Widget _buildAnimatedLogo() {
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
            padding: AppSpacing.paddingMD,
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.2),
                  blurRadius: 25,
                  spreadRadius: 3,
                ),
              ],
            ),
            child: Image.asset(
              'assets/img/logo.png',
              fit: BoxFit.contain,
              errorBuilder: (context, error, stackTrace) {
                return Icon(
                  Icons.local_shipping_rounded,
                  size: 60,
                  color: AppColors.primary,
                );
              },
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
          'إنشاء حساب جديد',
          style: AppTypography.h1.copyWith(color: AppColors.primary),
        ),
        AppSpacing.gapVerticalSM,
        Text(
          'انضم إلى عائلة النوران للخدمات اللوجستية',
          style: AppTypography.body.copyWith(color: AppColors.textLight),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  // ============= ACCOUNT TYPE SELECTOR =============
  Widget _buildAccountTypeSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'نوع الحساب',
          style: AppTypography.body.copyWith(
            fontWeight: FontWeight.w600,
            color: AppColors.textDark,
          ),
        ),
        AppSpacing.gapVerticalSM,
        Container(
          padding: AppSpacing.paddingXS,
          decoration: BoxDecoration(
            color: AppColors.background,
            borderRadius: AppSpacing.borderRadiusMD,
            border: Border.all(color: AppColors.greyBorder),
          ),
          child: Row(
            children: [
              _buildAccountTypeButton('شخصي', 'personal', Icons.person_rounded),
              AppSpacing.gapHorizontalXS,
              _buildAccountTypeButton(
                'تجاري',
                'commercial',
                Icons.business_rounded,
              ),
              AppSpacing.gapHorizontalXS,
              _buildAccountTypeButton('مصنع', 'factory', Icons.factory_rounded),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildAccountTypeButton(String label, String value, IconData icon) {
    final isSelected = _selectedAccountType == value;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() => _selectedAccountType = value);
          HapticFeedback.selectionClick();
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeInOut,
          padding: AppSpacing.paddingSM,
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primary : Colors.transparent,
            borderRadius: AppSpacing.borderRadiusSM,
          ),
          child: Column(
            children: [
              Icon(
                icon,
                color: isSelected ? Colors.white : AppColors.textLight,
                size: 24,
              ),
              AppSpacing.gapVerticalXS,
              Text(
                label,
                style: AppTypography.small.copyWith(
                  color: isSelected ? Colors.white : AppColors.textLight,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ============= TERMS CHECKBOX =============
  Widget _buildTermsCheckbox() {
    return InkWell(
      onTap: () {
        setState(() => _agreeToTerms = !_agreeToTerms);
        HapticFeedback.selectionClick();
      },
      borderRadius: AppSpacing.borderRadiusSM,
      child: Container(
        padding: AppSpacing.paddingSM,
        decoration: BoxDecoration(
          color: AppColors.background,
          borderRadius: AppSpacing.borderRadiusSM,
          border: Border.all(
            color: _agreeToTerms ? AppColors.primary : AppColors.greyBorder,
            width: _agreeToTerms ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                color: _agreeToTerms ? AppColors.primary : Colors.transparent,
                borderRadius: AppSpacing.borderRadiusXS,
                border: Border.all(
                  color:
                      _agreeToTerms ? AppColors.primary : AppColors.greyBorder,
                  width: 2,
                ),
              ),
              child:
                  _agreeToTerms
                      ? const Icon(
                        Icons.check_rounded,
                        color: Colors.white,
                        size: 16,
                      )
                      : null,
            ),
            AppSpacing.gapHorizontalSM,
            Expanded(
              child: Text(
                'أوافق على الشروط والأحكام وسياسة الخصوصية',
                style: AppTypography.small.copyWith(color: AppColors.textDark),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ============= LOGIN LINK =============
  Widget _buildLoginLink() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        TextButton(
          onPressed: () => context.pop(),
          child: Text(
            'تسجيل الدخول',
            style: AppTypography.body.copyWith(
              color: AppColors.primary,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        Text(
          'لديك حساب بالفعل؟',
          style: AppTypography.body.copyWith(color: AppColors.textLight),
        ),
      ],
    );
  }

  // ============= DIVIDER =============
  Widget _buildDivider() {
    return Row(
      children: [
        Expanded(
          child: Container(
            height: 1,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.transparent, AppColors.greyBorder],
              ),
            ),
          ),
        ),
        Padding(
          padding: AppSpacing.paddingHorizontalMD,
          child: Text(
            'أو التسجيل باستخدام',
            style: AppTypography.small.copyWith(color: AppColors.textLight),
          ),
        ),
        Expanded(
          child: Container(
            height: 1,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [AppColors.greyBorder, Colors.transparent],
              ),
            ),
          ),
        ),
      ],
    );
  }

  // ============= SOCIAL REGISTRATION =============
  Widget _buildSocialRegistration() {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: _handleGoogleSignUp,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.greyBorder),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'التسجيل بحساب جوجل',
                style: AppTypography.body.copyWith(
                  fontWeight: FontWeight.w600,
                  color: AppColors.textDark,
                ),
              ),
              const SizedBox(width: 12),
              Image.asset(
                'assets/img/googleIcon.png',
                width: 24,
                height: 24,
                errorBuilder: (context, error, stackTrace) {
                  return Icon(Icons.g_mobiledata, size: 24, color: Colors.red);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ============= HANDLE REGISTER =============
  Future<void> _handleRegister() async {
    // Dismiss keyboard
    FocusScope.of(context).unfocus();

    // Validate form
    if (!_formKey.currentState!.validate()) {
      HapticFeedback.mediumImpact();
      return;
    }

    // Check terms
    if (!_agreeToTerms) {
      HapticFeedback.mediumImpact();
      EnhancedPopups.showWarning(
        context: context,
        title: 'تنبيه',
        message: 'يجب الموافقة على الشروط والأحكام للمتابعة',
      );
      return;
    }

    setState(() => _isLoading = true);
    HapticFeedback.lightImpact();

    try {
      // Check availability first
      final checkResult = await ApiService.checkAvailability(
        username: _usernameController.text.trim(),
        email: AlNoranValidators.normalizeEmail(_emailController.text),
      );

      if (!mounted) return;

      if (!checkResult['success']) {
        setState(() => _isLoading = false);
        HapticFeedback.mediumImpact();

        EnhancedPopups.showError(
          context: context,
          title: 'خطأ',
          message: checkResult['message'] ?? 'خطأ في الاتصال بالسيرفر',
        );
        return;
      }

      if (!checkResult['available']) {
        setState(() => _isLoading = false);
        HapticFeedback.mediumImpact();

        String fieldName =
            checkResult['field'] == 'username'
                ? 'اسم المستخدم'
                : 'البريد الإلكتروني';

        EnhancedPopups.showError(
          context: context,
          title: 'غير متاح',
          message: '$fieldName مستخدم بالفعل. من فضلك اختر $fieldName آخر',
        );
        return;
      }

      // Prepare user data
      final userData = {
        'fullname': _nameController.text.trim(),
        'username': _usernameController.text.trim(),
        'email': AlNoranValidators.normalizeEmail(_emailController.text),
        'phone': _phoneController.text.trim(),
        'password': _passwordController.text.trim(),
        'accountType': _selectedAccountType,
      };

      if (!mounted) return;

      setState(() => _isLoading = false);

      // Navigate to appropriate registration page
      switch (_selectedAccountType) {
        case 'personal':
          context.push('/personal-registration', extra: userData);
          break;
        case 'commercial':
          context.push('/commercial-registration', extra: userData);
          break;
        case 'factory':
          context.push('/factory-registration', extra: userData);
          break;
      }

      HapticFeedback.lightImpact();
    } catch (e) {
      if (!mounted) return;

      setState(() => _isLoading = false);
      HapticFeedback.mediumImpact();

      EnhancedPopups.showError(
        context: context,
        title: 'خطأ',
        message: 'حدث خطأ غير متوقع. تأكد من اتصالك بالإنترنت',
      );
    }
  }

  // ============= GOOGLE SIGN UP =============
  Future<void> _handleGoogleSignUp() async {
    setState(() => _isLoading = true);
    HapticFeedback.lightImpact();

    try {
      final googleUser = await GoogleSignInService.signIn();

      if (googleUser == null) {
        setState(() => _isLoading = false);
        return;
      }

      if (!mounted) return;

      setState(() => _isLoading = false);

      // Navigate to registration with pre-filled data
      context.push('/register', extra: {'googleData': googleUser});
    } catch (e) {
      if (!mounted) return;

      setState(() => _isLoading = false);
      HapticFeedback.mediumImpact();

      EnhancedPopups.showError(
        context: context,
        title: 'خطأ',
        message: 'حدث خطأ أثناء التسجيل بجوجل',
      );
    }
  }
}
