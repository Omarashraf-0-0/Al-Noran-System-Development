import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../core/network/api_service.dart';
import '../../core/services/user_cache_service.dart';
import '../../core/services/firebase_push_service.dart';
import '../../core/services/notification_service.dart';
import '../../core/services/google_sign_in_service.dart';
import '../../core/widgets/widgets.dart';
import '../../theme/theme.dart';
import '../../util/validators.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage>
    with SingleTickerProviderStateMixin {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;
  bool _obscurePassword = true;

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
    _emailController.dispose();
    _passwordController.dispose();
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
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        AppSpacing.gapVerticalLG,

                        // Logo with animation
                        _buildAnimatedLogo(),

                        AppSpacing.gapVerticalLG,

                        // Title & Subtitle
                        _buildHeader(),

                        AppSpacing.gapVerticalXL,

                        // Form Card
                        _buildFormCard(),

                        AppSpacing.gapVerticalLG,

                        // Divider
                        _buildDivider(),

                        AppSpacing.gapVerticalLG,

                        // Social Login
                        _buildSocialLogin(),

                        AppSpacing.gapVerticalXL,

                        // Sign Up Link
                        _buildSignUpLink(),

                        AppSpacing.gapVerticalLG,
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

  // ============= ANIMATED LOGO =============
  Widget _buildAnimatedLogo() {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: const Duration(milliseconds: 800),
      curve: Curves.elasticOut,
      builder: (context, value, child) {
        return Transform.scale(
          scale: value,
          child: Center(
            child: Container(
              width: 130,
              height: 130,
              padding: AppSpacing.paddingMD,
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
              child: Image.asset(
                'assets/img/logo.png',
                fit: BoxFit.contain,
                errorBuilder: (context, error, stackTrace) {
                  return Icon(
                    Icons.local_shipping_rounded,
                    size: 65,
                    color: AppColors.primary,
                  );
                },
              ),
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
          'مرحباً بعودتك',
          style: AppTypography.h1.copyWith(
            color: AppColors.primary,
            fontSize: 28,
          ),
        ),
        AppSpacing.gapVerticalXS,
        Text(
          'سجّل دخولك للوصول إلى حسابك',
          style: AppTypography.body.copyWith(color: AppColors.textLight),
          textAlign: TextAlign.center,
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
          // Email Field
          _buildLabeledTextField(
            controller: _emailController,
            label: 'البريد الإلكتروني',
            hint: 'example@email.com',
            icon: Icons.email_rounded,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
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

          // Password Field
          _buildLabeledTextField(
            controller: _passwordController,
            label: 'كلمة المرور',
            hint: '••••••••',
            icon: Icons.lock_rounded,
            isPassword: true,
            textInputAction: TextInputAction.done,
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'من فضلك أدخل كلمة المرور';
              }
              if (value.length < 6) {
                return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
              }
              return null;
            },
            onSubmitted: (_) => _handleLogin(),
          ),

          AppSpacing.gapVerticalSM,

          // Forgot Password - على الشمال (RTL)
          Align(
            alignment: AlignmentDirectional.centerStart,
            child: TextButton(
              onPressed: () => context.push('/forgot-password'),
              style: TextButton.styleFrom(
                padding: EdgeInsets.zero,
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'نسيت كلمة المرور؟',
                    style: AppTypography.small.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Icon(
                    Icons.arrow_back_ios_rounded,
                    size: 12,
                    color: AppColors.primary,
                  ),
                ],
              ),
            ),
          ),

          AppSpacing.gapVerticalLG,

          // Login Button
          AppPrimaryButton(
            text: 'تسجيل الدخول',
            onPressed: _handleLogin,
            isLoading: _isLoading,
            icon: Icons.login_rounded,
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
    TextInputType? keyboardType,
    TextInputAction? textInputAction,
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
          obscureText: isPassword ? _obscurePassword : false,
          keyboardType: keyboardType,
          textInputAction: textInputAction,
          textAlign: TextAlign.right,
          textDirection: isPassword ? null : TextDirection.ltr,
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
                        _obscurePassword
                            ? Icons.visibility_off_rounded
                            : Icons.visibility_rounded,
                        color: AppColors.textGrey,
                        size: 22,
                      ),
                      onPressed: () {
                        setState(() => _obscurePassword = !_obscurePassword);
                      },
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

  // ============= DIVIDER =============
  Widget _buildDivider() {
    return Row(
      children: [
        Expanded(child: Container(height: 1, color: AppColors.greyBorder)),
        Padding(
          padding: AppSpacing.paddingHorizontalMD,
          child: Text(
            'أو',
            style: AppTypography.body.copyWith(color: AppColors.textLight),
          ),
        ),
        Expanded(child: Container(height: 1, color: AppColors.greyBorder)),
      ],
    );
  }

  // ============= SOCIAL LOGIN =============
  Widget _buildSocialLogin() {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: _handleGoogleSignIn,
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
                'المتابعة بحساب جوجل',
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

  // ============= SIGN UP LINK =============
  Widget _buildSignUpLink() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        TextButton(
          onPressed: () => context.push('/register'),
          child: Text(
            'إنشاء حساب جديد',
            style: AppTypography.body.copyWith(
              color: AppColors.primary,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        Text(
          'ليس لديك حساب؟',
          style: AppTypography.body.copyWith(color: AppColors.textLight),
        ),
      ],
    );
  }

  // ============= HANDLE LOGIN =============
  Future<void> _handleLogin() async {
    FocusScope.of(context).unfocus();

    if (!_formKey.currentState!.validate()) {
      HapticFeedback.mediumImpact();
      return;
    }

    setState(() => _isLoading = true);
    HapticFeedback.lightImpact();

    try {
      final result = await ApiService.login(
        email: AlNoranValidators.normalizeEmail(_emailController.text),
        password: _passwordController.text.trim(),
      );

      if (!mounted) return;

      if (result['success'] == true) {
        await UserCacheService().initialize(forceRefresh: true);

        try {
          await FirebasePushService().initialize();
          await NotificationService().initialize(forceRefresh: true);
        } catch (e) {
          print('⚠️ Service init error: $e');
        }

        if (!mounted) return;

        final userData = result['data']?['user'];
        String userName =
            userData?['fullname'] ?? userData?['username'] ?? 'مستخدم';
        String userEmail = userData?['email'] ?? '';

        HapticFeedback.heavyImpact();
        EnhancedPopups.showSuccess(
          context: context,
          title: 'تم بنجاح',
          message: 'مرحباً بك $userName',
        );

        await Future.delayed(const Duration(milliseconds: 1500));
        if (!mounted) return;

        context.go(
          '/home',
          extra: {'userName': userName, 'userEmail': userEmail},
        );
      } else {
        setState(() => _isLoading = false);
        HapticFeedback.mediumImpact();

        EnhancedPopups.showError(
          context: context,
          title: 'فشل تسجيل الدخول',
          message:
              result['message'] ?? 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
        );
      }
    } catch (e) {
      if (!mounted) return;

      setState(() => _isLoading = false);
      HapticFeedback.mediumImpact();

      EnhancedPopups.showError(
        context: context,
        title: 'خطأ',
        message: 'حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى',
      );
    }
  }

  // ============= GOOGLE SIGN IN =============
  Future<void> _handleGoogleSignIn() async {
    setState(() => _isLoading = true);
    HapticFeedback.lightImpact();

    try {
      final googleUser = await GoogleSignInService.signIn();

      if (googleUser == null) {
        setState(() => _isLoading = false);
        return;
      }

      final result = await ApiService.googleSignIn(
        email: googleUser['email'] ?? '',
        displayName: googleUser['displayName'] ?? '',
        googleId: googleUser['id'] ?? '',
        idToken: googleUser['idToken'],
        accessToken: googleUser['accessToken'],
      );

      if (!mounted) return;

      if (result['success'] == true) {
        if (result['isNewUser'] == true) {
          setState(() => _isLoading = false);
          context.push(
            '/register',
            extra: {'googleData': result['data']['googleData']},
          );
        } else {
          await UserCacheService().initialize(forceRefresh: true);

          try {
            await FirebasePushService().initialize();
            await NotificationService().initialize(forceRefresh: true);
          } catch (e) {
            print('⚠️ Service init error: $e');
          }

          if (!mounted) return;

          final userData = result['data']?['user'];
          String userName =
              userData?['fullname'] ?? userData?['username'] ?? 'مستخدم';
          String userEmail = userData?['email'] ?? '';

          HapticFeedback.heavyImpact();
          EnhancedPopups.showSuccess(
            context: context,
            title: 'تم بنجاح',
            message: 'مرحباً بك $userName',
          );

          await Future.delayed(const Duration(milliseconds: 1500));
          if (!mounted) return;

          context.go(
            '/home',
            extra: {'userName': userName, 'userEmail': userEmail},
          );
        }
      } else {
        setState(() => _isLoading = false);
        HapticFeedback.mediumImpact();

        EnhancedPopups.showError(
          context: context,
          title: 'فشل تسجيل الدخول',
          message: result['message'] ?? 'فشل تسجيل الدخول بجوجل',
        );
      }
    } catch (e) {
      if (!mounted) return;

      setState(() => _isLoading = false);
      HapticFeedback.mediumImpact();

      EnhancedPopups.showError(
        context: context,
        title: 'خطأ',
        message: 'حدث خطأ أثناء تسجيل الدخول بجوجل',
      );
    }
  }
}
