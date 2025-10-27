import 'package:flutter/material.dart';
import '../../core/network/api_service.dart';
import '../../Pop-ups/al_noran_popups.dart';
import 'login_page.dart';

class ResetPasswordPage extends StatefulWidget {
  final String email;

  const ResetPasswordPage({super.key, required this.email});

  @override
  State<ResetPasswordPage> createState() => _ResetPasswordPageState();
}

class _ResetPasswordPageState extends State<ResetPasswordPage> {
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _confirmPasswordController =
      TextEditingController();

  bool _isPasswordVisible = false;
  bool _isConfirmPasswordVisible = false;
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0,
          automaticallyImplyLeading: false, // إخفاء زر الرجوع
        ),
        body: SafeArea(
          child: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0),
              child: Column(
                children: [
                  const SizedBox(height: 40),

                  // Icon
                  Container(
                    width: 120,
                    height: 120,
                    decoration: BoxDecoration(
                      color: const Color(0xFF690000).withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.lock_open,
                      size: 60,
                      color: Color(0xFF690000),
                    ),
                  ),

                  const SizedBox(height: 40),

                  // Title
                  const Text(
                    'إنشاء كلمة مرور جديدة',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF690000),
                    ),
                  ),

                  const SizedBox(height: 12),

                  // Subtitle
                  const Text(
                    'أدخل كلمة المرور الجديدة لحسابك',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 16, color: Color(0xFF757575)),
                  ),

                  const SizedBox(height: 50),

                  // Password Field
                  Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFFF5F5F5),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE0E0E0)),
                    ),
                    child: TextField(
                      controller: _passwordController,
                      obscureText: !_isPasswordVisible,
                      textAlign: TextAlign.right,
                      decoration: InputDecoration(
                        hintText: 'كلمة المرور الجديدة',
                        hintStyle: const TextStyle(color: Color(0xFFBDBDBD)),
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

                  const SizedBox(height: 16),

                  // Confirm Password Field
                  Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFFF5F5F5),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE0E0E0)),
                    ),
                    child: TextField(
                      controller: _confirmPasswordController,
                      obscureText: !_isConfirmPasswordVisible,
                      textAlign: TextAlign.right,
                      decoration: InputDecoration(
                        hintText: 'تأكيد كلمة المرور',
                        hintStyle: const TextStyle(color: Color(0xFFBDBDBD)),
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
                            _isConfirmPasswordVisible
                                ? Icons.visibility_outlined
                                : Icons.visibility_off_outlined,
                            color: const Color(0xFFBDBDBD),
                          ),
                          onPressed: () {
                            setState(() {
                              _isConfirmPasswordVisible =
                                  !_isConfirmPasswordVisible;
                            });
                          },
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Password Requirements
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF5F5F5),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE0E0E0)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: const [
                            Icon(
                              Icons.info_outline,
                              size: 18,
                              color: Color(0xFF690000),
                            ),
                            SizedBox(width: 8),
                            Text(
                              'متطلبات كلمة المرور:',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF690000),
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        _buildRequirement('6 أحرف على الأقل'),
                      ],
                    ),
                  ),

                  const SizedBox(height: 40),

                  // Reset Password Button
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _handleResetPassword,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF690000),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 2,
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
                                'تغيير كلمة المرور',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                    ),
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

  Widget _buildRequirement(String text) {
    return Padding(
      padding: const EdgeInsets.only(top: 4),
      child: Row(
        children: [
          const Icon(
            Icons.check_circle_outline,
            size: 16,
            color: Color(0xFF690000),
          ),
          const SizedBox(width: 8),
          Text(
            text,
            style: const TextStyle(fontSize: 13, color: Color(0xFF757575)),
          ),
        ],
      ),
    );
  }

  Future<void> _handleResetPassword() async {
    // Validation
    if (_passwordController.text.trim().isEmpty) {
      AlNoranPopups.showError(
        context: context,
        message: 'من فضلك أدخل كلمة المرور الجديدة',
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

    setState(() => _isLoading = true);

    try {
      final result = await ApiService.resetPassword(
        email: widget.email,
        newPassword: _passwordController.text.trim(),
      );

      setState(() => _isLoading = false);

      if (result['success']) {
        if (mounted) {
          await AlNoranPopups.showSuccess(
            context: context,
            title: 'تم بنجاح!',
            message: 'تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول',
            buttonText: 'تسجيل الدخول',
            onPressed: () {
              // العودة لصفحة Login
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (context) => const LoginPage()),
                (route) => false,
              );
            },
          );
        }
      } else {
        if (mounted) {
          AlNoranPopups.showError(
            context: context,
            message: result['message'] ?? 'فشل تغيير كلمة المرور',
          );
        }
      }
    } catch (e) {
      setState(() => _isLoading = false);

      if (mounted) {
        AlNoranPopups.showError(
          context: context,
          title: 'خطأ',
          message: 'حدث خطأ غير متوقع. حاول مرة أخرى',
        );
      }
    }
  }

  @override
  void dispose() {
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }
}
