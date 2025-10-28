import 'package:flutter/material.dart';
import '../../Pop-ups/al_noran_popups.dart';
import '../../util/validators.dart';
import '../../core/network/api_service.dart';
import 'personalRegistration.dart';
import 'commercialRegistration.dart';
import 'factoryRegistration.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _usernameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController =
      TextEditingController();

  bool _isPasswordVisible = false;
  bool _isConfirmPasswordVisible = false;
  bool _agreeToTerms = false;
  String _selectedAccountType = 'personal'; // personal, commercial, factory

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: Colors.white,
        body: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: Column(
              children: [
                const SizedBox(height: 50),

                // زرار الرجوع في أعلى الشمال
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(
                        Icons.arrow_forward,
                        color: Color(0xFF690000),
                        size: 28,
                      ),
                      onPressed: () => Navigator.pop(context),
                    ),
                    const Spacer(),
                  ],
                ),

                const SizedBox(height: 10),

                // Logo
                Image.asset(
                  'assets/img/logo.png',
                  width: 150,
                  height: 150,
                  errorBuilder: (context, error, stackTrace) {
                    return const Icon(
                      Icons.flight_takeoff_rounded,
                      size: 100,
                      color: Color(0xFF690000),
                    );
                  },
                ),

                const SizedBox(height: 30),

                // Title
                const Text(
                  'إنشاء حساب جديد',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF690000),
                  ),
                ),

                const SizedBox(height: 8),

                // Subtitle
                const Text(
                  'انضم إلى عائلة النوران',
                  style: TextStyle(fontSize: 16, color: Color(0xFFa40000)),
                ),

                const SizedBox(height: 40),

                // Name Field
                _buildTextField(
                  controller: _nameController,
                  hint: 'الاسم بالكامل',
                  icon: Icons.person_outline,
                ),

                const SizedBox(height: 16),

                // Username Field
                _buildTextField(
                  controller: _usernameController,
                  hint: 'اسم المستخدم',
                  icon: Icons.alternate_email,
                ),

                const SizedBox(height: 16),

                // Email Field
                _buildTextField(
                  controller: _emailController,
                  hint: 'البريد الإلكتروني',
                  icon: Icons.email_outlined,
                  keyboardType: TextInputType.emailAddress,
                ),

                const SizedBox(height: 16),

                // Phone Field
                _buildTextField(
                  controller: _phoneController,
                  hint: 'رقم الهاتف',
                  icon: Icons.phone_outlined,
                  keyboardType: TextInputType.phone,
                ),

                const SizedBox(height: 16),

                // Account Type Selector
                _buildAccountTypeSelector(),

                const SizedBox(height: 16),

                // Password Field
                _buildTextField(
                  controller: _passwordController,
                  hint: 'كلمة المرور',
                  icon: Icons.lock_outline,
                  isPassword: true,
                  isPasswordVisible: _isPasswordVisible,
                  onTogglePassword: () {
                    setState(() {
                      _isPasswordVisible = !_isPasswordVisible;
                    });
                  },
                ),

                const SizedBox(height: 16),

                // Confirm Password Field
                _buildTextField(
                  controller: _confirmPasswordController,
                  hint: 'تأكيد كلمة المرور',
                  icon: Icons.lock_outline,
                  isPassword: true,
                  isPasswordVisible: _isConfirmPasswordVisible,
                  onTogglePassword: () {
                    setState(() {
                      _isConfirmPasswordVisible = !_isConfirmPasswordVisible;
                    });
                  },
                ),

                const SizedBox(height: 20),

                // Terms and Conditions Checkbox
                _buildTermsCheckbox(),

                const SizedBox(height: 30),

                // Register Button
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: _handleRegister,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF690000),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 2,
                    ),
                    child: const Text(
                      'إنشاء الحساب',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 20),

                // Login Link
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text(
                      'لديك حساب بالفعل؟',
                      style: TextStyle(color: Color(0xFF757575)),
                    ),
                    TextButton(
                      onPressed: () {
                        Navigator.pop(context);
                      },
                      child: const Text(
                        'تسجيل الدخول',
                        style: TextStyle(
                          color: Color(0xFF690000),
                          fontWeight: FontWeight.bold,
                          decoration: TextDecoration.underline,
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 40),
              ], // Column children
            ), // Column
          ), // Padding
        ), // SingleChildScrollView
      ), // Scaffold body
    ); // Directionality child - Scaffold
  } // build method

  // Handle Registration
  Future<void> _handleRegister() async {
    // Validation
    if (_nameController.text.trim().isEmpty) {
      AlNoranPopups.showError(
        context: context,
        message: 'من فضلك أدخل الاسم بالكامل',
      );
      return;
    }

    if (_usernameController.text.trim().isEmpty) {
      AlNoranPopups.showError(
        context: context,
        message: 'من فضلك أدخل اسم المستخدم',
      );
      return;
    }

    // Username validation (no spaces allowed)
    if (_usernameController.text.contains(' ')) {
      AlNoranPopups.showError(
        context: context,
        message: 'اسم المستخدم لا يجب أن يحتوي على مسافات',
      );
      return;
    }

    if (_emailController.text.trim().isEmpty) {
      AlNoranPopups.showError(
        context: context,
        message: 'من فضلك أدخل البريد الإلكتروني',
      );
      return;
    }

    // Email validation (case-insensitive)
    if (!AlNoranValidators.isValidEmail(_emailController.text)) {
      AlNoranPopups.showError(
        context: context,
        message: 'البريد الإلكتروني غير صحيح',
      );
      return;
    }

    if (_phoneController.text.trim().isEmpty) {
      AlNoranPopups.showError(
        context: context,
        message: 'من فضلك أدخل رقم الهاتف',
      );
      return;
    }

    // Egyptian Phone validation
    if (!AlNoranValidators.isValidEgyptianPhone(_phoneController.text)) {
      AlNoranPopups.showError(
        context: context,
        message: AlNoranValidators.getPhoneErrorMessage(_phoneController.text),
      );
      return;
    }

    if (_passwordController.text.trim().isEmpty) {
      AlNoranPopups.showError(
        context: context,
        message: 'من فضلك أدخل كلمة المرور',
      );
      return;
    }

    if (_passwordController.text.length < 6) {
      AlNoranPopups.showError(
        context: context,
        message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
      );
      return;
    }

    if (_confirmPasswordController.text != _passwordController.text) {
      AlNoranPopups.showError(
        context: context,
        message: 'كلمة المرور غير متطابقة',
      );
      return;
    }

    // Terms and Conditions validation
    if (!_agreeToTerms) {
      AlNoranPopups.showError(
        context: context,
        message: 'يجب الموافقة على الشروط والأحكام',
      );
      return;
    }

    // ✅ التحقق من توفر اسم المستخدم والبريد الإلكتروني قبل المتابعة
    print('🔍 جاري التحقق من توفر البيانات...');

    // Show loading
    if (mounted) {
      AlNoranPopups.showLoading(
        context: context,
        message: 'جاري التحقق من البيانات...',
      );
    }

    try {
      final checkResult = await ApiService.checkAvailability(
        username: _usernameController.text.trim(),
        email: AlNoranValidators.normalizeEmail(_emailController.text),
      );

      // Dismiss loading
      if (mounted) {
        Navigator.pop(context);
      }

      print('📨 Response: $checkResult');

      if (!checkResult['success']) {
        // خطأ في الاتصال
        if (mounted) {
          AlNoranPopups.showError(
            context: context,
            message: checkResult['message'] ?? 'خطأ في الاتصال بالسيرفر',
          );
        }
        return;
      }

      if (!checkResult['available']) {
        // البيانات مستخدمة بالفعل
        String fieldName =
            checkResult['field'] == 'username'
                ? 'اسم المستخدم'
                : 'البريد الإلكتروني';

        if (mounted) {
          AlNoranPopups.showError(
            context: context,
            message: '$fieldName مستخدم بالفعل. من فضلك اختر $fieldName آخر',
          );
        }
        return;
      }

      // ✅ البيانات متاحة - يمكن المتابعة
      print('✅ البيانات متاحة - الانتقال لصفحة رفع المستندات');
    } catch (e) {
      // Dismiss loading if still showing
      if (mounted && Navigator.canPop(context)) {
        Navigator.pop(context);
      }

      print('❌ Exception during validation: $e');

      if (mounted) {
        AlNoranPopups.showError(
          context: context,
          message: 'حدث خطأ أثناء التحقق. تأكد من اتصالك بالإنترنت',
        );
      }
      return;
    }

    // Instead of creating account here, navigate to appropriate page based on account type
    final userData = {
      'name': _nameController.text.trim(),
      'username': _usernameController.text.trim(),
      'email': AlNoranValidators.normalizeEmail(_emailController.text),
      'phone': _phoneController.text.trim(),
      'password': _passwordController.text.trim(),
    };

    if (mounted) {
      // Navigate to appropriate registration page based on account type
      switch (_selectedAccountType) {
        case 'personal':
          Navigator.push(
            context,
            MaterialPageRoute(
              builder:
                  (context) => PersonalRegistrationPage(userData: userData),
            ),
          );
          break;
        case 'commercial':
          Navigator.push(
            context,
            MaterialPageRoute(
              builder:
                  (context) => CommercialRegistrationPage(userData: userData),
            ),
          );
          break;
        case 'factory':
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => FactoryRegistrationPage(userData: userData),
            ),
          );
          break;
      }
    }
  }

  // Account Type Selector
  Widget _buildAccountTypeSelector() {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF5F5F5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE0E0E0), width: 1),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.business_center, color: Color(0xFF690000)),
              const SizedBox(width: 12),
              const Text(
                'نوع الحساب',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF690000),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildAccountTypeOption(
                  title: 'شخصي',
                  value: 'personal',
                  icon: Icons.person,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildAccountTypeOption(
                  title: 'تجاري',
                  value: 'commercial',
                  icon: Icons.store,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildAccountTypeOption(
                  title: 'مصنع',
                  value: 'factory',
                  icon: Icons.factory,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAccountTypeOption({
    required String title,
    required String value,
    required IconData icon,
  }) {
    final isSelected = _selectedAccountType == value;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedAccountType = value;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF690000) : Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color:
                isSelected ? const Color(0xFF690000) : const Color(0xFFE0E0E0),
            width: 1.5,
          ),
        ),
        child: Column(
          children: [
            Icon(
              icon,
              color: isSelected ? Colors.white : const Color(0xFF690000),
              size: 24,
            ),
            const SizedBox(height: 4),
            Text(
              title,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: isSelected ? Colors.white : const Color(0xFF690000),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Terms and Conditions Checkbox
  Widget _buildTermsCheckbox() {
    return Row(
      children: [
        Checkbox(
          value: _agreeToTerms,
          onChanged: (value) {
            setState(() {
              _agreeToTerms = value ?? false;
            });
          },
          activeColor: const Color(0xFF690000),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
        ),
        Expanded(
          child: GestureDetector(
            onTap: () {
              setState(() {
                _agreeToTerms = !_agreeToTerms;
              });
            },
            child: RichText(
              textAlign: TextAlign.right,
              text: const TextSpan(
                style: TextStyle(fontSize: 14, color: Color(0xFF757575)),
                children: [
                  TextSpan(text: 'أوافق على '),
                  TextSpan(
                    text: 'الشروط والأحكام',
                    style: TextStyle(
                      color: Color(0xFF690000),
                      fontWeight: FontWeight.bold,
                      decoration: TextDecoration.underline,
                    ),
                  ),
                  TextSpan(text: ' وسياسة الخصوصية'),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    bool isPassword = false,
    bool isPasswordVisible = false,
    VoidCallback? onTogglePassword,
    TextInputType? keyboardType,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF5F5F5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE0E0E0), width: 1),
      ),
      child: TextField(
        controller: controller,
        obscureText: isPassword && !isPasswordVisible,
        textAlign: TextAlign.right,
        keyboardType: keyboardType,
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: Color(0xFFBDBDBD)),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 20,
            vertical: 18,
          ),
          prefixIcon: Icon(icon, color: const Color(0xFF690000)),
          suffixIcon:
              isPassword
                  ? IconButton(
                    icon: Icon(
                      isPasswordVisible
                          ? Icons.visibility_outlined
                          : Icons.visibility_off_outlined,
                      color: const Color(0xFFBDBDBD),
                    ),
                    onPressed: onTogglePassword,
                  )
                  : null,
        ),
      ),
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _usernameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }
}
