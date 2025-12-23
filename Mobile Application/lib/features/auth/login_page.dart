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

  // Dark Mode Helper
  bool get _isDark => Theme.of(context).brightness == Brightness.dark;

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
    // Dark Mode Colors
    final gradientColors =
        _isDark
            ? [
              const Color(0xFF1A1A2E),
              const Color(0xFF16213E),
              const Color(0xFF0F0F1A),
            ]
            : [
              const Color(0xFF690000),
              const Color(0xFF8B0000),
              const Color(0xFF4A0000),
            ];

    final decorativeCircleColor =
        _isDark
            ? AppColors.gold.withValues(alpha: 0.05)
            : Colors.white.withValues(alpha: 0.08);

    return Scaffold(
      body: Stack(
        children: [
          // Premium Gradient Background
          Container(
            width: double.infinity,
            height: double.infinity,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: gradientColors,
                stops: const [0.0, 0.5, 1.0],
              ),
            ),
          ),
          // Decorative Top Circle
          Positioned(
            top: -80,
            right: -80,
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: decorativeCircleColor,
              ),
            ),
          ),
          // Decorative Bottom Circle
          Positioned(
            bottom: -100,
            left: -60,
            child: Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color:
                    _isDark
                        ? AppColors.gold.withValues(alpha: 0.03)
                        : Colors.white.withValues(alpha: 0.05),
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
                    const Color(
                      0xFFD4AF37,
                    ).withValues(alpha: _isDark ? 0.3 : 0.5),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
          // Main Content
          SafeArea(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: SlideTransition(
                  position: _slideAnimation,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const SizedBox(height: 40),

                          // Premium Logo with Glow
                          _buildAnimatedLogo(),

                          const SizedBox(height: 32),

                          // Title & Subtitle
                          _buildHeader(),

                          const SizedBox(height: 36),

                          // Premium Form Card
                          _buildFormCard(),

                          const SizedBox(height: 24),

                          // Divider
                          _buildDivider(),

                          const SizedBox(height: 24),

                          // Social Login
                          _buildSocialLogin(),

                          const SizedBox(height: 32),

                          // Sign Up Link
                          _buildSignUpLink(),

                          const SizedBox(height: 24),
                        ],
                      ),
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
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Outer Glow Ring
                Container(
                  width: 160,
                  height: 160,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        const Color(0xFFD4AF37).withValues(alpha: 0.3),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),
                // Gold Ring
                Container(
                  width: 140,
                  height: 140,
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
                        color: const Color(0xFFD4AF37).withValues(alpha: 0.4),
                        blurRadius: 20,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(4),
                    child: Container(
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color:
                            _isDark
                                ? const Color(0xFF1A1A2E)
                                : const Color(0xFF690000),
                      ),
                      padding: const EdgeInsets.all(20),
                      child: Image.asset(
                        'assets/img/logo.png',
                        fit: BoxFit.contain,
                        errorBuilder: (context, error, stackTrace) {
                          return const Icon(
                            Icons.local_shipping_rounded,
                            size: 60,
                            color: Colors.white,
                          );
                        },
                      ),
                    ),
                  ),
                ),
              ],
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
        // App Name with Premium Style
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
            'Al Noran',
            style: TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.bold,
              fontFamily: 'Cairo',
              color: Colors.white,
              letterSpacing: 2,
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'مرحباً بعودتك',
          style: AppTypography.h1.copyWith(color: Colors.white, fontSize: 26),
        ),
        const SizedBox(height: 8),
        Text(
          'سجّل دخولك للوصول إلى حسابك',
          style: AppTypography.body.copyWith(
            color: Colors.white.withValues(alpha: 0.8),
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  // ============= FORM CARD =============
  Widget _buildFormCard() {
    final cardColor = _isDark ? AppColors.darkCard : Colors.white;
    final labelColor =
        _isDark ? AppColors.darkTextPrimary : const Color(0xFF333333);
    final forgotPasswordColor =
        _isDark ? AppColors.gold : const Color(0xFF690000);

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(24),
        border:
            _isDark
                ? Border.all(color: AppColors.darkBorder.withValues(alpha: 0.5))
                : null,
        boxShadow: [
          BoxShadow(
            color:
                _isDark
                    ? Colors.black.withValues(alpha: 0.4)
                    : Colors.black.withValues(alpha: 0.2),
            blurRadius: 30,
            offset: const Offset(0, 15),
          ),
          if (!_isDark)
            BoxShadow(
              color: const Color(0xFFD4AF37).withValues(alpha: 0.1),
              blurRadius: 20,
              offset: const Offset(0, -5),
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

          const SizedBox(height: 20),

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

          const SizedBox(height: 12),

          // Forgot Password
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
                      color: forgotPasswordColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Icon(
                    Icons.arrow_forward_ios_rounded,
                    size: 12,
                    color: forgotPasswordColor,
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 24),

          // Premium Login Button
          _buildPremiumLoginButton(),
        ],
      ),
    );
  }

  // ============= PREMIUM LOGIN BUTTON =============
  Widget _buildPremiumLoginButton() {
    final buttonGradient =
        _isDark
            ? const LinearGradient(
              colors: [Color(0xFFD4AF37), Color(0xFFB8960C)],
            )
            : const LinearGradient(
              colors: [Color(0xFF690000), Color(0xFF8B0000)],
            );
    final shadowColor =
        _isDark
            ? const Color(0xFFD4AF37).withValues(alpha: 0.3)
            : const Color(0xFF690000).withValues(alpha: 0.4);
    final textColor = _isDark ? Colors.black : Colors.white;

    return Container(
      height: 56,
      decoration: BoxDecoration(
        gradient: buttonGradient,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: shadowColor,
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: _isLoading ? null : _handleLogin,
          borderRadius: BorderRadius.circular(16),
          child: Center(
            child:
                _isLoading
                    ? SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        color: textColor,
                        strokeWidth: 2.5,
                      ),
                    )
                    : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.login_rounded, color: textColor, size: 22),
                        const SizedBox(width: 10),
                        Text(
                          'تسجيل الدخول',
                          style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Cairo',
                            color: textColor,
                          ),
                        ),
                      ],
                    ),
          ),
        ),
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
    final labelColor =
        _isDark ? AppColors.darkTextPrimary : const Color(0xFF333333);
    final inputTextColor =
        _isDark ? AppColors.darkTextPrimary : const Color(0xFF333333);
    final fillColor = _isDark ? AppColors.darkSurface : const Color(0xFFF8F9FA);
    final borderColor = _isDark ? AppColors.darkBorder : Colors.grey[200]!;
    final focusBorderColor = _isDark ? AppColors.gold : const Color(0xFF690000);
    final iconColor = _isDark ? AppColors.gold : const Color(0xFF690000);
    final hintColor = _isDark ? AppColors.darkTextMuted : Colors.grey[400];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Label with premium style
        Padding(
          padding: const EdgeInsets.only(bottom: 10, right: 4),
          child: Row(
            children: [
              Container(
                width: 4,
                height: 16,
                decoration: BoxDecoration(
                  color: const Color(0xFFD4AF37),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                label,
                style: AppTypography.body.copyWith(
                  fontWeight: FontWeight.w700,
                  color: labelColor,
                ),
              ),
            ],
          ),
        ),
        // Input field with premium styling
        Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            boxShadow: [
              BoxShadow(
                color:
                    _isDark
                        ? Colors.black.withValues(alpha: 0.2)
                        : const Color(0xFF690000).withValues(alpha: 0.08),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: TextFormField(
            controller: controller,
            obscureText: isPassword ? _obscurePassword : false,
            keyboardType: keyboardType,
            textInputAction: textInputAction,
            textAlign: TextAlign.right,
            textDirection: isPassword ? null : TextDirection.ltr,
            validator: validator,
            onFieldSubmitted: onSubmitted,
            style: AppTypography.body.copyWith(
              color: inputTextColor,
              fontWeight: FontWeight.w500,
            ),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: AppTypography.body.copyWith(color: hintColor),
              filled: true,
              fillColor: fillColor,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 18,
                vertical: 18,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide.none,
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide(color: borderColor, width: 1.5),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide(color: focusBorderColor, width: 2),
              ),
              errorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: Colors.red, width: 1.5),
              ),
              focusedErrorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: Colors.red, width: 2),
              ),
              suffixIcon:
                  isPassword
                      ? IconButton(
                        icon: Icon(
                          _obscurePassword
                              ? Icons.visibility_off_rounded
                              : Icons.visibility_rounded,
                          color:
                              _isDark
                                  ? AppColors.darkTextMuted
                                  : Colors.grey[500],
                          size: 22,
                        ),
                        onPressed: () {
                          setState(() => _obscurePassword = !_obscurePassword);
                        },
                      )
                      : Icon(icon, color: iconColor, size: 22),
              prefixIcon:
                  isPassword ? Icon(icon, color: iconColor, size: 22) : null,
            ),
          ),
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
                colors: [
                  Colors.transparent,
                  Colors.white.withValues(alpha: 0.5),
                ],
              ),
            ),
          ),
        ),
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 16),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: const Color(0xFFD4AF37).withValues(alpha: 0.3),
            ),
          ),
          child: const Text(
            'أو',
            style: TextStyle(
              color: Colors.white,
              fontFamily: 'Cairo',
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        Expanded(
          child: Container(
            height: 1,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.white.withValues(alpha: 0.5),
                  Colors.transparent,
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  // ============= SOCIAL LOGIN =============
  Widget _buildSocialLogin() {
    final cardColor = _isDark ? AppColors.darkCard : Colors.white;
    final textColor =
        _isDark ? AppColors.darkTextPrimary : const Color(0xFF333333);

    return Container(
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(16),
        border:
            _isDark
                ? Border.all(color: AppColors.darkBorder.withValues(alpha: 0.5))
                : null,
        boxShadow: [
          BoxShadow(
            color:
                _isDark
                    ? Colors.black.withValues(alpha: 0.3)
                    : Colors.black.withValues(alpha: 0.15),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: _handleGoogleSignIn,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'المتابعة بحساب جوجل',
                  style: AppTypography.body.copyWith(
                    fontWeight: FontWeight.w600,
                    color: textColor,
                  ),
                ),
                const SizedBox(width: 12),
                Image.asset(
                  'assets/img/googleIcon.png',
                  width: 24,
                  height: 24,
                  errorBuilder: (context, error, stackTrace) {
                    return const Icon(
                      Icons.g_mobiledata,
                      size: 24,
                      color: Colors.red,
                    );
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ============= SIGN UP LINK =============
  Widget _buildSignUpLink() {
    final containerColor =
        _isDark
            ? AppColors.darkCard.withValues(alpha: 0.5)
            : Colors.white.withValues(alpha: 0.1);
    final borderColor =
        _isDark
            ? AppColors.gold.withValues(alpha: 0.3)
            : Colors.white.withValues(alpha: 0.2);
    final textColor =
        _isDark
            ? AppColors.darkTextSecondary
            : Colors.white.withValues(alpha: 0.9);

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 20),
      decoration: BoxDecoration(
        color: containerColor,
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          GestureDetector(
            onTap: () => context.push('/register'),
            child: const Text(
              'إنشاء حساب جديد',
              style: TextStyle(
                color: Color(0xFFD4AF37),
                fontWeight: FontWeight.bold,
                fontFamily: 'Cairo',
                fontSize: 15,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Text(
            'ليس لديك حساب؟',
            style: TextStyle(color: textColor, fontFamily: 'Cairo'),
          ),
        ],
      ),
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
