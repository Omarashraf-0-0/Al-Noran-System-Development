import 'package:flutter/material.dart';
import 'register_page.dart';
import '../../core/network/api_service.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({Key? key}) : super(key: key);

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _isPasswordVisible = false;
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0),
              child: Column(
                children: [
                  const SizedBox(height: 60),

                  // Logo
                  Image.asset('assets/img/logo.png', width: 200, height: 200),

                  const SizedBox(height: 40),

                  // Title
                  const Text(
                    'تسجيل الدخول',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF690000),
                      fontFamily: 'Cairo',
                    ),
                  ),

                  const SizedBox(height: 8),

                  // Subtitle
                  const Text(
                    'أهلاً بك في النوران',
                    style: TextStyle(
                      fontSize: 16,
                      color: Color(0xFFa40000),
                      fontFamily: 'Cairo',
                    ),
                  ),

                  const SizedBox(height: 40),

                  // Email Field
                  Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFFF5F5F5),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: TextField(
                      controller: _emailController,
                      textAlign: TextAlign.right,
                      keyboardType: TextInputType.emailAddress,
                      style: const TextStyle(fontFamily: 'Cairo'),
                      decoration: const InputDecoration(
                        hintText: 'البريد الإلكتروني',
                        hintStyle: TextStyle(
                          color: Color(0xFFBDBDBD),
                          fontFamily: 'Cairo',
                        ),
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 18,
                        ),
                        prefixIcon: Icon(
                          Icons.email_outlined,
                          color: Color(0xFF690000),
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Password Field
                  Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFFF5F5F5),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: TextField(
                      controller: _passwordController,
                      obscureText: !_isPasswordVisible,
                      textAlign: TextAlign.right,
                      style: const TextStyle(fontFamily: 'Cairo'),
                      decoration: InputDecoration(
                        hintText: 'كلمة المرور',
                        hintStyle: const TextStyle(
                          color: Color(0xFFBDBDBD),
                          fontFamily: 'Cairo',
                        ),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 18,
                        ),
                        prefixIcon: const Icon(
                          Icons.lock_outline,
                          color: Color(0xFF690000),
                        ),
                        suffixIcon: IconButton(
                          icon: Icon(
                            _isPasswordVisible
                                ? Icons.visibility_outlined
                                : Icons.visibility_off_outlined,
                            color: const Color(0xFFBDBDBD),
                          ),
                          onPressed: () {
                            setState(() {
                              _isPasswordVisible = !_isPasswordVisible;
                            });
                          },
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Divider with "او"
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          height: 1,
                          color: const Color(0xFFE0E0E0),
                        ),
                      ),
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 16),
                        child: Text(
                          'أو',
                          style: TextStyle(
                            color: Color(0xFF9E9E9E),
                            fontFamily: 'Cairo',
                          ),
                        ),
                      ),
                      Expanded(
                        child: Container(
                          height: 1,
                          color: const Color(0xFFE0E0E0),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Social Login Text
                  const Text(
                    'التسجيل من خلال',
                    style: TextStyle(
                      fontSize: 14,
                      color: Color(0xFF757575),
                      fontFamily: 'Cairo',
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Social Login Buttons
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Apple Button
                      Container(
                        width: 140,
                        height: 56,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFE0E0E0)),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: const [
                            Icon(Icons.apple, size: 28),
                            SizedBox(width: 8),
                            Text(
                              'ابل',
                              style: TextStyle(
                                fontSize: 16,
                                fontFamily: 'Cairo',
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(width: 16),

                      // Google Button
                      Container(
                        width: 140,
                        height: 56,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFFE0E0E0)),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Image.asset(
                              'assets/img/googleIcon.png',
                              width: 24,
                              height: 24,
                            ),
                            const SizedBox(width: 8),
                            const Text(
                              'جوجل',
                              style: TextStyle(
                                fontSize: 16,
                                fontFamily: 'Cairo',
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Forgot Password
                  TextButton(
                    onPressed: () {},
                    child: const Text(
                      'نسيت كلمة المرور؟',
                      style: TextStyle(
                        color: Color(0xFF757575),
                        fontFamily: 'Cairo',
                        fontSize: 14,
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Login Button
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _handleLogin,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF690000),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 0,
                      ),
                      child:
                          _isLoading
                              ? const SizedBox(
                                width: 24,
                                height: 24,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2,
                                ),
                              )
                              : const Text(
                                'تسجيل الدخول',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  fontFamily: 'Cairo',
                                  color: Colors.white,
                                ),
                              ),
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Sign Up Link
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text(
                        'ليس لديك حساب؟',
                        style: TextStyle(
                          color: Color(0xFF757575),
                          fontFamily: 'Cairo',
                        ),
                      ),
                      TextButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => const RegisterPage(),
                            ),
                          );
                        },
                        child: const Text(
                          'إنشاء حساب',
                          style: TextStyle(
                            color: Color(0xFF690000),
                            fontFamily: 'Cairo',
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

  // Handle Login
  Future<void> _handleLogin() async {
    // Validation
    if (_emailController.text.trim().isEmpty) {
      _showErrorDialog('من فضلك أدخل البريد الإلكتروني');
      return;
    }

    if (_passwordController.text.trim().isEmpty) {
      _showErrorDialog('من فضلك أدخل كلمة المرور');
      return;
    }

    // Start loading
    setState(() {
      _isLoading = true;
    });

    try {
      // Call API
      final result = await ApiService.login(
        email: _emailController.text.trim(),
        password: _passwordController.text.trim(),
      );

      // Stop loading
      setState(() {
        _isLoading = false;
      });

      if (result['success']) {
        // نجح تسجيل الدخول
        if (mounted) {
          _showSuccessDialog(result['message']);
          // هنا تقدر تنقل للصفحة الرئيسية
          // Navigator.pushReplacement(context, MaterialPageRoute(builder: (context) => HomePage()));
        }
      } else {
        // فشل تسجيل الدخول
        if (mounted) {
          _showErrorDialog(result['message']);
        }
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      _showErrorDialog('حدث خطأ غير متوقع');
    }
  }

  // Show Error Dialog
  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder:
          (context) => Directionality(
            textDirection: TextDirection.rtl,
            child: AlertDialog(
              title: const Text(
                'خطأ',
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontWeight: FontWeight.bold,
                ),
              ),
              content: Text(
                message,
                style: const TextStyle(fontFamily: 'Cairo'),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text(
                    'حسناً',
                    style: TextStyle(
                      fontFamily: 'Cairo',
                      color: Color(0xFF690000),
                    ),
                  ),
                ),
              ],
            ),
          ),
    );
  }

  // Show Success Dialog
  void _showSuccessDialog(String message) {
    showDialog(
      context: context,
      builder:
          (context) => Directionality(
            textDirection: TextDirection.rtl,
            child: AlertDialog(
              title: const Text(
                'نجح',
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF690000),
                ),
              ),
              content: Text(
                message,
                style: const TextStyle(fontFamily: 'Cairo'),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text(
                    'حسناً',
                    style: TextStyle(
                      fontFamily: 'Cairo',
                      color: Color(0xFF690000),
                    ),
                  ),
                ),
              ],
            ),
          ),
    );
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
}
