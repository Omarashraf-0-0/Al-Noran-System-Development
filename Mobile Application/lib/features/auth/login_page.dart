import 'package:flutter/material.dart';
import 'register_page.dart';
import 'ForgotPasswordPage.dart';
import '../../core/network/api_service.dart';
import '../../Pop-ups/al_noran_popups.dart';
import '../../core/widgets/al_noran_loading.dart';
import '../../util/validators.dart';
import '../home/homePage.dart';

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
          child: Center(
            child: SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const SizedBox(height: 20),

                    // Logo
                    Image.asset('assets/img/logo.png', width: 150, height: 150),

                    const SizedBox(height: 20),

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

                    const SizedBox(height: 6),

                    // Subtitle
                    const Text(
                      'أهلاً بك في النوران',
                      style: TextStyle(
                        fontSize: 16,
                        color: Color(0xFFa40000),
                        fontFamily: 'Cairo',
                      ),
                    ),

                    const SizedBox(height: 30),

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

                    const SizedBox(height: 14),

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

                    const SizedBox(height: 12),

                    // OR Divider
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

                    const SizedBox(height: 12),

                    // Social Login Buttons
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // Google Button (على اليمين)
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

                        const SizedBox(width: 16),

                        // Apple Button (على الشمال)
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
                      ],
                    ),

                    const SizedBox(height: 16),

                    // Forgot Password - على اليمين
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton.icon(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => const ForgotPasswordPage(),
                            ),
                          );
                        },
                        icon: const Icon(
                          Icons.lock_outline,
                          color: Color(0xFF690000),
                          size: 18,
                        ),
                        label: const Text(
                          'نسيت كلمة المرور؟',
                          style: TextStyle(
                            color: Color(0xFF690000),
                            fontFamily: 'Cairo',
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            decoration: TextDecoration.underline,
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 8),

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
                                ? const AlNoranButtonLoading()
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

                    const SizedBox(height: 20),
                  ],
                ), // Column
              ), // Padding
            ), // SingleScrollView
          ), // Center
        ), // SafeArea
      ), // Scaffold
    ); // Directionality
  }

  // Handle Login
  Future<void> _handleLogin() async {
    // Validation
    if (_emailController.text.trim().isEmpty) {
      AlNoranPopups.showError(
        context: context,
        message: 'من فضلك أدخل البريد الإلكتروني',
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

    // Show loading
    AlNoranPopups.showLoading(
      context: context,
      message: 'جاري تسجيل الدخول...',
    );

    try {
      // Call API (normalize email to lowercase)
      final result = await ApiService.login(
        email: AlNoranValidators.normalizeEmail(_emailController.text),
        password: _passwordController.text.trim(),
      );

      // Hide loading
      if (mounted) {
        AlNoranPopups.hideLoading(context);
      }

      if (result['success']) {
        // نجح تسجيل الدخول
        if (mounted) {
          // Debug: Print the response data
          print('🔐 [Login] Full response: $result');
          print('🔐 [Login] User data: ${result['data']?['user']}');
          print(
            '🔐 [Login] ClientDetails: ${result['data']?['user']?['clientDetails']}',
          );

          // Save token and user data to SecureStorage
          if (result['data'] != null) {
            if (result['data']['token'] != null) {
              await ApiService.saveToken(result['data']['token']);
            }
            if (result['data']['user'] != null) {
              await ApiService.saveUserData(result['data']['user']);
              print('✅ [Login] User data saved to storage');
            }
          }

          // الحصول على اسم المستخدم من البيانات
          String userName = 'مستخدم';
          if (result['data'] != null && result['data']['user'] != null) {
            userName =
                result['data']['user']['fullname'] ??
                result['data']['user']['username'] ??
                'مستخدم';
          }

          // الانتقال للصفحة الرئيسية
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder:
                  (context) => HomePage(
                    userName: userName,
                    userEmail: _emailController.text,
                  ),
            ),
          );
        }
      } else {
        // فشل تسجيل الدخول
        if (mounted) {
          AlNoranPopups.showError(
            context: context,
            message: result['message'] ?? 'فشل تسجيل الدخول',
          );
        }
      }
    } catch (e) {
      // Hide loading
      if (mounted) {
        AlNoranPopups.hideLoading(context);
      }

      if (mounted) {
        AlNoranPopups.showError(
          context: context,
          title: 'خطأ في الاتصال',
          message:
              'حدث خطأ غير متوقع. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.',
        );
      }
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
}
