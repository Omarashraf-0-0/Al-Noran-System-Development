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
      body: Stack(
        children: [
          // Premium Gradient Background
          Container(
            width: double.infinity,
            height: double.infinity,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFF690000),
                  Color(0xFF8B0000),
                  Color(0xFF4A0000),
                ],
                stops: [0.0, 0.5, 1.0],
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
                color: Colors.white.withValues(alpha: 0.08),
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
                color: Colors.white.withValues(alpha: 0.05),
              ),
            ),
          ),
          // Golden Accent Line
          Positioned(
            top: 120,
            left: 0,
            right: 0,
            child: Container(
              height: 2,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.transparent,
                    const Color(0xFFD4AF37).withValues(alpha: 0.5),
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
                        children: [
                          const SizedBox(height: 16),

                          // Back Button
                          _buildBackButton(),

                          const SizedBox(height: 16),

                          // Premium Logo
                          _buildAnimatedLogo(),

                          const SizedBox(height: 24),

                          // Title & Subtitle
                          _buildHeader(),

                          const SizedBox(height: 28),

                          // Form Card
                          _buildFormCard(),

                          const SizedBox(height: 24),

                          // Login Link
                          _buildLoginLink(),

                          const SizedBox(height: 24),

                          // Divider
                          _buildDivider(),

                          const SizedBox(height: 24),

                          // Social Registration
                          _buildSocialRegistration(),

                          const SizedBox(height: 32),
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

  // ============= BACK BUTTON =============
  Widget _buildBackButton() {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: const Color(0xFFD4AF37).withValues(alpha: 0.3),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.1),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () => context.pop(),
            borderRadius: BorderRadius.circular(14),
            child: const Padding(
              padding: EdgeInsets.all(12),
              child: Icon(
                Icons.arrow_forward_rounded,
                color: Colors.white,
                size: 24,
              ),
            ),
          ),
        ),
      ),
    );
  }

  // ============= FORM CARD =============
  Widget _buildFormCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 30,
            offset: const Offset(0, 15),
          ),
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

          const SizedBox(height: 18),

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

          const SizedBox(height: 18),

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

          const SizedBox(height: 18),

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

          const SizedBox(height: 18),

          // Account Type Selector
          _buildAccountTypeSelector(),

          const SizedBox(height: 18),

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

          const SizedBox(height: 18),

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

          const SizedBox(height: 18),

          // Terms Checkbox
          _buildTermsCheckbox(),

          const SizedBox(height: 24),

          // Premium Register Button
          _buildPremiumRegisterButton(),
        ],
      ),
    );
  }

  // ============= PREMIUM REGISTER BUTTON =============
  Widget _buildPremiumRegisterButton() {
    return Container(
      height: 56,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF690000), Color(0xFF8B0000)],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF690000).withValues(alpha: 0.4),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: _isLoading ? null : _handleRegister,
          borderRadius: BorderRadius.circular(16),
          child: Center(
            child:
                _isLoading
                    ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2.5,
                      ),
                    )
                    : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.person_add_rounded,
                          color: Colors.white,
                          size: 22,
                        ),
                        const SizedBox(width: 10),
                        const Text(
                          'إنشاء الحساب',
                          style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Cairo',
                            color: Colors.white,
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
                  color: const Color(0xFF333333),
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
                color: const Color(0xFF690000).withValues(alpha: 0.08),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: TextFormField(
            controller: controller,
            obscureText: isPassword ? obscureText : false,
            keyboardType: keyboardType,
            textInputAction: textInputAction,
            textAlign: TextAlign.right,
            textDirection: textDirection,
            validator: validator,
            onFieldSubmitted: onSubmitted,
            style: AppTypography.body.copyWith(
              color: const Color(0xFF333333),
              fontWeight: FontWeight.w500,
            ),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: AppTypography.body.copyWith(color: Colors.grey[400]),
              filled: true,
              fillColor: const Color(0xFFF8F9FA),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 18,
                vertical: 16,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide.none,
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide(color: Colors.grey[200]!, width: 1.5),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(
                  color: Color(0xFF690000),
                  width: 2,
                ),
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
                          obscureText
                              ? Icons.visibility_off_rounded
                              : Icons.visibility_rounded,
                          color: Colors.grey[500],
                          size: 22,
                        ),
                        onPressed: onToggleObscure,
                      )
                      : Icon(icon, color: const Color(0xFF690000), size: 22),
              prefixIcon:
                  isPassword
                      ? Icon(icon, color: const Color(0xFF690000), size: 22)
                      : null,
            ),
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
          child: Stack(
            alignment: Alignment.center,
            children: [
              // Outer Glow Ring
              Container(
                width: 140,
                height: 140,
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
                      color: const Color(0xFFD4AF37).withValues(alpha: 0.4),
                      blurRadius: 20,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                child: Padding(
                  padding: const EdgeInsets.all(4),
                  child: Container(
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: Color(0xFF690000),
                    ),
                    padding: const EdgeInsets.all(18),
                    child: Image.asset(
                      'assets/img/logo.png',
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) {
                        return const Icon(
                          Icons.local_shipping_rounded,
                          size: 50,
                          color: Colors.white,
                        );
                      },
                    ),
                  ),
                ),
              ),
            ],
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
              fontSize: 28,
              fontWeight: FontWeight.bold,
              fontFamily: 'Cairo',
              color: Colors.white,
              letterSpacing: 2,
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'إنشاء حساب جديد',
          style: AppTypography.h1.copyWith(color: Colors.white, fontSize: 24),
        ),
        const SizedBox(height: 8),
        Text(
          'انضم إلى عائلة النوران للخدمات اللوجستية',
          style: AppTypography.body.copyWith(
            color: Colors.white.withValues(alpha: 0.8),
          ),
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
                'نوع الحساب',
                style: AppTypography.body.copyWith(
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF333333),
                ),
              ),
            ],
          ),
        ),
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: const Color(0xFFF8F9FA),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey[200]!, width: 1.5),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF690000).withValues(alpha: 0.06),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              _buildAccountTypeButton('شخصي', 'personal', Icons.person_rounded),
              const SizedBox(width: 6),
              _buildAccountTypeButton(
                'تجاري',
                'commercial',
                Icons.business_rounded,
              ),
              const SizedBox(width: 6),
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
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            gradient:
                isSelected
                    ? const LinearGradient(
                      colors: [Color(0xFF690000), Color(0xFF8B0000)],
                    )
                    : null,
            color: isSelected ? null : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
            boxShadow:
                isSelected
                    ? [
                      BoxShadow(
                        color: const Color(0xFF690000).withValues(alpha: 0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 3),
                      ),
                    ]
                    : null,
          ),
          child: Column(
            children: [
              Icon(
                icon,
                color: isSelected ? Colors.white : Colors.grey[500],
                size: 24,
              ),
              const SizedBox(height: 6),
              Text(
                label,
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 13,
                  color: isSelected ? Colors.white : Colors.grey[600],
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
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
    return GestureDetector(
      onTap: () {
        setState(() => _agreeToTerms = !_agreeToTerms);
        HapticFeedback.selectionClick();
      },
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color:
              _agreeToTerms
                  ? const Color(0xFF690000).withValues(alpha: 0.08)
                  : const Color(0xFFF8F9FA),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: _agreeToTerms ? const Color(0xFF690000) : Colors.grey[200]!,
            width: _agreeToTerms ? 2 : 1.5,
          ),
        ),
        child: Row(
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 26,
              height: 26,
              decoration: BoxDecoration(
                gradient:
                    _agreeToTerms
                        ? const LinearGradient(
                          colors: [Color(0xFF690000), Color(0xFF8B0000)],
                        )
                        : null,
                color: _agreeToTerms ? null : Colors.transparent,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color:
                      _agreeToTerms
                          ? const Color(0xFF690000)
                          : Colors.grey[400]!,
                  width: 2,
                ),
              ),
              child:
                  _agreeToTerms
                      ? const Icon(
                        Icons.check_rounded,
                        color: Colors.white,
                        size: 18,
                      )
                      : null,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                'أوافق على الشروط والأحكام وسياسة الخصوصية',
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 13,
                  color: const Color(0xFF333333),
                  fontWeight: _agreeToTerms ? FontWeight.w600 : FontWeight.w500,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ============= LOGIN LINK =============
  Widget _buildLoginLink() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 20),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          GestureDetector(
            onTap: () => context.pop(),
            child: const Text(
              'تسجيل الدخول',
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
            'لديك حساب بالفعل؟',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.9),
              fontFamily: 'Cairo',
            ),
          ),
        ],
      ),
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
            'أو التسجيل باستخدام',
            style: TextStyle(
              color: Colors.white,
              fontFamily: 'Cairo',
              fontSize: 13,
              fontWeight: FontWeight.w500,
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

  // ============= SOCIAL REGISTRATION =============
  Widget _buildSocialRegistration() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.15),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: _handleGoogleSignUp,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'التسجيل بحساب جوجل',
                  style: AppTypography.body.copyWith(
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF333333),
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
