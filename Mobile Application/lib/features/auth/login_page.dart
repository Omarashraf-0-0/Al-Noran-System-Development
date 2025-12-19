import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/network/api_service.dart';
import '../../core/services/user_cache_service.dart';
import '../../core/services/firebase_push_service.dart';
import '../../core/services/notification_service.dart';
import '../../core/services/google_sign_in_service.dart';
import '../../Pop-ups/al_noran_popups.dart';
import '../../core/widgets/al_noran_loading.dart';
import '../../util/validators.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _isPasswordVisible = false;
  final bool _isLoading = false;

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
                        InkWell(
                          onTap: _handleGoogleSignIn,
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            width: 140,
                            height: 56,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: const Color(0xFFE0E0E0),
                              ),
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
                          context.push('/forgot-password');
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
                            context.push('/register');
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

          // Save token and user data in parallel for faster performance
          if (result['data'] != null) {
            await Future.wait([
              if (result['data']['token'] != null)
                ApiService.saveToken(result['data']['token']),
              if (result['data']['user'] != null)
                ApiService.saveUserData(result['data']['user']),
            ]);
            print('✅ [Login] Token and user data saved to storage');

            // Initialize user cache after login
            await UserCacheService().initialize(forceRefresh: true);
            print('✅ [Login] User cache initialized');

            // Initialize Firebase Push Notifications (after login)
            try {
              await FirebasePushService().initialize();
              print('✅ [Login] Firebase Push Service initialized');
            } catch (e) {
              print('⚠️ [Login] Firebase init error: $e');
            }

            // Initialize Notification Service to get unread count
            try {
              await NotificationService().initialize(forceRefresh: true);
              print('✅ [Login] Notification Service initialized');
            } catch (e) {
              print('⚠️ [Login] Notification Service error: $e');
            }
          }

          // الحصول على اسم المستخدم والبريد الإلكتروني من البيانات
          String userName = 'مستخدم';
          String userEmail = _emailController.text.trim();

          if (result['data'] != null && result['data']['user'] != null) {
            userName =
                result['data']['user']['fullname'] ??
                result['data']['user']['username'] ??
                'مستخدم';
            userEmail = result['data']['user']['email'] ?? userEmail;
          }

          // الانتقال للصفحة الرئيسية
          context.go(
            '/home',
            extra: {'userName': userName, 'userEmail': userEmail},
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

  /// Handle Google Sign In
  Future<void> _handleGoogleSignIn() async {
    try {
      // Show loading
      AlNoranPopups.showLoading(
        context: context,
        message: 'جاري تسجيل الدخول...',
      );

      // Sign in with Google
      final googleUser = await GoogleSignInService.signIn();

      if (googleUser == null) {
        // User cancelled
        if (mounted) {
          AlNoranPopups.hideLoading(context);
        }
        return;
      }

      // Call API to verify/register
      final result = await ApiService.googleSignIn(
        email: googleUser['email'] ?? '',
        displayName: googleUser['displayName'] ?? '',
        googleId: googleUser['id'] ?? '',
        idToken: googleUser['idToken'],
        accessToken: googleUser['accessToken'],
      );

      // Hide loading
      if (mounted) {
        AlNoranPopups.hideLoading(context);
      }

      if (result['success'] == true) {
        if (result['isNewUser'] == true) {
          // New user - redirect to registration with pre-filled data
          if (mounted) {
            context.push(
              '/register',
              extra: {'googleData': result['data']['googleData']},
            );
          }
        } else {
          // Existing user - login successful
          if (mounted) {
            AlNoranPopups.showSuccess(
              context: context,
              message: 'تم تسجيل الدخول بنجاح',
            );
          }

          // Initialize services
          await UserCacheService().initialize(forceRefresh: true);
          try {
            await FirebasePushService().initialize();
          } catch (e) {
            print('⚠️ [GoogleSignIn] Firebase init error: $e');
          }
          try {
            await NotificationService().initialize(forceRefresh: true);
          } catch (e) {
            print('⚠️ [GoogleSignIn] Notification Service error: $e');
          }

          // Get user info
          final userData = result['data']?['user'];
          String userName =
              userData?['fullname'] ?? userData?['username'] ?? 'مستخدم';
          String userEmail = userData?['email'] ?? '';

          // Navigate to home
          if (mounted) {
            context.go(
              '/home',
              extra: {'userName': userName, 'userEmail': userEmail},
            );
          }
        }
      } else {
        if (mounted) {
          AlNoranPopups.showError(
            context: context,
            message: result['message'] ?? 'فشل تسجيل الدخول بجوجل',
          );
        }
      }
    } catch (e) {
      print('❌ [GoogleSignIn] Error: $e');
      if (mounted) {
        AlNoranPopups.hideLoading(context);
        AlNoranPopups.showError(
          context: context,
          message: 'حدث خطأ أثناء تسجيل الدخول بجوجل',
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
