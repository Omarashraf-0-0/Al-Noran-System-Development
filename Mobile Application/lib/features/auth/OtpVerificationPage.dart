import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:async';
import '../../core/network/api_service.dart';
import '../../Pop-ups/al_noran_popups.dart';
import 'reset_password_page.dart';

class OtpVerificationPage extends StatefulWidget {
  final String email;

  const OtpVerificationPage({super.key, required this.email});

  @override
  State<OtpVerificationPage> createState() => _OtpVerificationPageState();
}

class _OtpVerificationPageState extends State<OtpVerificationPage> {
  final List<TextEditingController> _controllers = List.generate(
    5,
    (index) => TextEditingController(),
  );
  final List<FocusNode> _focusNodes = List.generate(5, (index) => FocusNode());

  // Colors
  static const Color primaryDark = Color(0xFF690000);
  static const Color primaryLight = Color(0xFFA40000);
  static const Color accent = Color(0xFF1BA3B6);

  // Timer
  int _remainingSeconds = 300; // 5 minutes
  Timer? _timer;

  // Limits
  int _wrongAttempts = 0;
  int _resendCount = 0;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  @override
  void dispose() {
    _timer?.cancel();
    for (var controller in _controllers) {
      controller.dispose();
    }
    for (var node in _focusNodes) {
      node.dispose();
    }
    super.dispose();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_remainingSeconds > 0) {
        setState(() {
          _remainingSeconds--;
        });
      } else {
        timer.cancel();
      }
    });
  }

  Future<void> _resendCode() async {
    // Check resend limit (3 times max)
    if (_resendCount >= 3) {
      await AlNoranPopups.showError(
        context: context,
        title: 'تنبيه',
        message: 'لقد تجاوزت الحد الأقصى لإعادة إرسال الكود (3 مرات)',
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final result = await ApiService.resendOTP(email: widget.email);

      setState(() => _isLoading = false);

      if (!mounted) return;

      if (result['success']) {
        setState(() {
          _resendCount++;
          _remainingSeconds = 300; // Reset timer
          _wrongAttempts = 0; // Reset wrong attempts
        });

        _timer?.cancel();
        _startTimer();

        await AlNoranPopups.showSuccess(
          context: context,
          title: 'تم بنجاح',
          message: 'تم إعادة إرسال الكود ($_resendCount/3)',
        );
      } else {
        await AlNoranPopups.showError(
          context: context,
          title: 'خطأ',
          message: result['message'] ?? 'فشل إعادة إرسال الكود',
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

  String _formatTime(int seconds) {
    int minutes = seconds ~/ 60;
    int remainingSeconds = seconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${remainingSeconds.toString().padLeft(2, '0')}';
  }

  Future<void> _verifyOtp() async {
    // Read OTP from left to right (LTR)
    String otp = _controllers.map((c) => c.text).join();

    if (otp.length != 5) {
      await AlNoranPopups.showWarning(
        context: context,
        title: 'تنبيه',
        message: 'الرجاء إدخال الكود كاملاً (5 أرقام)',
      );
      return;
    }

    // Check wrong attempts limit (5 times max)
    if (_wrongAttempts >= 5) {
      await AlNoranPopups.showError(
        context: context,
        title: 'تم إلغاء العملية',
        message: 'لقد تجاوزت الحد الأقصى للمحاولات الخاطئة (5 مرات)',
      );

      if (!mounted) return;

      // العودة لصفحة نسيت كلمة المرور
      Navigator.of(context).pop();
      return;
    }

    setState(() => _isLoading = true);

    try {
      final result = await ApiService.verifyOTP(email: widget.email, otp: otp);

      setState(() => _isLoading = false);

      if (!mounted) return;

      if (result['success']) {
        // Navigate to reset password page
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => ResetPasswordPage(email: widget.email),
          ),
        );
      } else {
        setState(() => _wrongAttempts++);

        await AlNoranPopups.showError(
          context: context,
          title: 'كود خاطئ',
          message: 'الكود المدخل غير صحيح ($_wrongAttempts/5)',
        );

        // Clear OTP fields
        for (var controller in _controllers) {
          controller.clear();
        }
        _focusNodes[0].requestFocus();
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
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Back Button - على الشمال
                Align(
                  alignment: Alignment.centerLeft,
                  child: GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Directionality(
                      textDirection: TextDirection.ltr,
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.arrow_back, color: primaryDark, size: 20),
                          SizedBox(width: 8),
                          Text(
                            'الرجوع',
                            style: TextStyle(
                              color: primaryDark,
                              fontSize: 16,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 60),

                // Password Icon
                Center(
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          _buildAsterisk(),
                          const SizedBox(width: 12),
                          _buildAsterisk(),
                          const SizedBox(width: 12),
                          _buildAsterisk(),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Container(
                        width: 100,
                        height: 8,
                        decoration: BoxDecoration(
                          color: primaryLight,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 40),

                // Title
                const Text(
                  'رمز التحقق ( OTP )',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: primaryDark,
                  ),
                ),

                const SizedBox(height: 12),

                // Description
                Text(
                  'أدخل رمز التحقق المرسل على جوالك',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                    height: 1.5,
                  ),
                ),

                const SizedBox(height: 40),

                // OTP Input Fields (LTR - من اليسار لليمين)
                Directionality(
                  textDirection: TextDirection.ltr,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(5, (index) {
                      return Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 6),
                        child: _buildOtpBox(index),
                      );
                    }),
                  ),
                ),

                const SizedBox(height: 60),

                // Resend Timer & Limits Info
                Center(
                  child: Column(
                    children: [
                      Text(
                        'إعادة إرسال الكود بعد ${_formatTime(_remainingSeconds)}',
                        style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'المحاولات المتبقية: ${3 - _resendCount} إعادة إرسال | ${5 - _wrongAttempts} محاولات تحقق',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[500],
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Verify Button
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _verifyOtp,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primaryDark,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 4,
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
                              'تأكيد الكود',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                  ),
                ),

                const SizedBox(height: 16),

                // Resend Button (if timer expired)
                if (_remainingSeconds == 0 && !_isLoading)
                  Center(
                    child: TextButton(
                      onPressed: _resendCount >= 3 ? null : _resendCode,
                      child: const Text(
                        'إعادة إرسال الكود',
                        style: TextStyle(
                          color: accent,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          decoration: TextDecoration.underline,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildOtpBox(int index) {
    return Container(
      width: 50,
      height: 60,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: _controllers[index].text.isEmpty ? Colors.grey[300]! : accent,
          width: 2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: TextField(
        controller: _controllers[index],
        focusNode: _focusNodes[index],
        textAlign: TextAlign.center,
        keyboardType: TextInputType.number,
        maxLength: 1,
        style: const TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.bold,
          color: primaryDark,
        ),
        decoration: const InputDecoration(
          counterText: '',
          border: InputBorder.none,
        ),
        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
        onChanged: (value) {
          if (value.isNotEmpty && index < 4) {
            // Move to next field (LTR: من اليسار لليمين)
            _focusNodes[index + 1].requestFocus();
          } else if (value.isEmpty && index > 0) {
            // Move to previous field (LTR: الرجوع لليسار)
            _focusNodes[index - 1].requestFocus();
          }
          setState(() {});
        },
      ),
    );
  }

  Widget _buildAsterisk() {
    return const Text(
      '*',
      style: TextStyle(
        fontSize: 50,
        color: primaryLight,
        fontWeight: FontWeight.bold,
        height: 1,
      ),
    );
  }
}
