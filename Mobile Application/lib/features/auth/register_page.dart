import 'package:flutter/material.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({Key? key}) : super(key: key);

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController =
      TextEditingController();

  bool _isPasswordVisible = false;
  bool _isConfirmPasswordVisible = false;

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: Colors.white,
        extendBodyBehindAppBar: true,
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Color(0xFF690000)),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        body: SafeArea(
          child: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0),
              child: Column(
                children: [
                  const SizedBox(height: 20),

                  // Logo
                  Image.asset(
                    'assets/img/logo.png',
                    width: 150,
                    height: 150,
                    errorBuilder: (context, error, stackTrace) {
                      return const Icon(
                        Icons.local_shipping_rounded,
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

                  const SizedBox(height: 30),

                  // Register Button
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: () {
                        // TODO: Implement register logic
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('جاري إنشاء الحساب...'),
                            backgroundColor: Color(0xFF690000),
                          ),
                        );
                      },
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
                ],
              ),
            ),
          ),
        ),
      ),
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
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }
}
