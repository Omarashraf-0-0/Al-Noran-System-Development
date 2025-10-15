import 'package:flutter/material.dart';
import '../../core/network/api_service.dart';
import '../../Pop-ups/al_noran_popups.dart';
import 'OtpVerificationPage.dart';

class ForgotPasswordPage extends StatefulWidget {
  const ForgotPasswordPage({Key? key}) : super(key: key);

  @override
  State<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends State<ForgotPasswordPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  bool _isLoading = false;

  // Colors
  static const Color primaryDark = Color(0xFF690000);
  static const Color primaryLight = Color(0xFFA40000);

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final result = await ApiService.forgotPassword(
        email: _emailController.text.trim(),
      );

      setState(() => _isLoading = false);

      if (!mounted) return;

      if (result['success']) {
        // Navigate to OTP page
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder:
                (context) =>
                    OtpVerificationPage(email: _emailController.text.trim()),
          ),
        );
      } else {
        // Show error message
        await AlNoranPopups.showError(
          context: context,
          title: 'خطأ',
          message: result['message'] ?? 'حدث خطأ أثناء إرسال الكود',
        );
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (!mounted) return;

      await AlNoranPopups.showError(
        context: context,
        title: 'خطأ',
        message: 'حدث خطأ في الاتصال بالسيرفر',
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: const Color(0xFFF5F5F5),
        body: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: Form(
              key: _formKey,
              child: Column(
                children: [
                  const SizedBox(height: 60),

                  // Password Icon
                  Icon(Icons.lock_reset, size: 100, color: primaryDark),

                  const SizedBox(height: 40),

                  // Title
                  const Text(
                    'نسيت كلمة المرور',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: primaryDark,
                      fontFamily: 'Cairo',
                    ),
                  ),

                  const SizedBox(height: 8),

                  // Description
                  const Text(
                    'يرجى إدخال البريد الإلكتروني المسجل لدينا',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 16,
                      color: primaryLight,
                      fontFamily: 'Cairo',
                    ),
                  ),

                  const SizedBox(height: 40),

                  // Email Input
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      textDirection: TextDirection.ltr,
                      textAlign: TextAlign.right,
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
                          color: primaryDark,
                        ),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'الرجاء إدخال البريد الإلكتروني';
                        }
                        if (!value.contains('@')) {
                          return 'الرجاء إدخال بريد إلكتروني صحيح';
                        }
                        return null;
                      },
                    ),
                  ),

                  const SizedBox(height: 30),

                  // Submit Button
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _handleSubmit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: primaryDark,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 2,
                        disabledBackgroundColor: primaryDark.withOpacity(0.6),
                      ),
                      child:
                          _isLoading
                              ? const SizedBox(
                                width: 24,
                                height: 24,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.5,
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    Colors.white,
                                  ),
                                ),
                              )
                              : const Text(
                                'إرسال الكود',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  fontFamily: 'Cairo',
                                ),
                              ),
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Back to Login
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text(
                      'العودة لتسجيل الدخول',
                      style: TextStyle(
                        color: Color(0xFF757575),
                        fontSize: 16,
                        fontFamily: 'Cairo',
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
