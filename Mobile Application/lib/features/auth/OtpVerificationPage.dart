import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'dart:async';
import '../../core/network/api_service.dart';
import '../../core/widgets/widgets.dart';
import '../../theme/theme.dart';
import 'auth_dark_mode_mixin.dart';

class OtpVerificationPage extends StatefulWidget {
  final String email;

  const OtpVerificationPage({super.key, required this.email});

  @override
  State<OtpVerificationPage> createState() => _OtpVerificationPageState();
}

class _OtpVerificationPageState extends State<OtpVerificationPage>
    with SingleTickerProviderStateMixin, AuthDarkModeMixin {
  final List<TextEditingController> _controllers = List.generate(
    5,
    (index) => TextEditingController(),
  );
  final List<FocusNode> _focusNodes = List.generate(5, (index) => FocusNode());

  int _remainingSeconds = 300; // 5 minutes
  Timer? _timer;
  int _wrongAttempts = 0;
  int _resendCount = 0;
  bool _isLoading = false;

  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _startTimer();

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
    _timer?.cancel();
    for (var controller in _controllers) {
      controller.dispose();
    }
    for (var node in _focusNodes) {
      node.dispose();
    }
    _animationController.dispose();
    super.dispose();
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_remainingSeconds > 0) {
        setState(() => _remainingSeconds--);
      } else {
        timer.cancel();
      }
    });
  }

  String _formatTime(int seconds) {
    int minutes = seconds ~/ 60;
    int remainingSeconds = seconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${remainingSeconds.toString().padLeft(2, '0')}';
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
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: backgroundGradient,
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
                color: decorativeCircleColorSmall,
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
                    Color(0xFFD4AF37).withValues(alpha: goldenLineAlpha),
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
                    child: Column(
                      children: [
                        const SizedBox(height: 16),

                        // Back Button
                        _buildBackButton(),

                        const SizedBox(height: 32),

                        // Icon
                        _buildIcon(),

                        const SizedBox(height: 28),

                        // Title & Description
                        _buildHeader(),

                        const SizedBox(height: 32),

                        // OTP Card
                        _buildOtpCard(),

                        const SizedBox(height: 20),

                        // Timer & Resend
                        _buildTimerAndResend(),

                        const SizedBox(height: 32),
                      ],
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
          color: backButtonBgColor,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: const Color(0xFFD4AF37).withValues(alpha: 0.3),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.1),
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

  // ============= ICON =============
  Widget _buildIcon() {
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
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: logoContainerColor,
                    ),
                    child: const Icon(
                      Icons.password_rounded,
                      size: 50,
                      color: Colors.white,
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
            'رمز التحقق (OTP)',
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.bold,
              fontFamily: 'Cairo',
              color: Colors.white,
            ),
          ),
        ),
        const SizedBox(height: 12),
        Text(
          'أدخل رمز التحقق المكون من 5 أرقام\nالمرسل إلى ${widget.email}',
          style: TextStyle(
            fontSize: 14,
            fontFamily: 'Cairo',
            color: Colors.white.withValues(alpha: 0.85),
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  // ============= OTP CARD =============
  Widget _buildOtpCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: cardDecoration,
      child: Column(
        children: [
          // OTP Boxes (LTR)
          Directionality(
            textDirection: TextDirection.ltr,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: List.generate(5, (index) => _buildOtpBox(index)),
            ),
          ),

          const SizedBox(height: 28),

          // Premium Verify Button
          _buildPremiumVerifyButton(),
        ],
      ),
    );
  }

  // ============= PREMIUM VERIFY BUTTON =============
  Widget _buildPremiumVerifyButton() {
    return Container(
      width: double.infinity,
      height: 56,
      decoration: BoxDecoration(
        gradient: buttonGradient,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: buttonShadowColor,
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: _isLoading ? null : _verifyOtp,
          borderRadius: BorderRadius.circular(16),
          child: Center(
            child:
                _isLoading
                    ? SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        color: buttonTextColor,
                        strokeWidth: 2.5,
                      ),
                    )
                    : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.check_circle_rounded,
                          color: buttonTextColor,
                          size: 22,
                        ),
                        const SizedBox(width: 10),
                        Text(
                          'تحقق',
                          style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Cairo',
                            color: buttonTextColor,
                          ),
                        ),
                      ],
                    ),
          ),
        ),
      ),
    );
  }

  // ============= OTP BOX =============
  Widget _buildOtpBox(int index) {
    final boxFillColor =
        isDark ? AppColors.darkSurface : const Color(0xFFF8F9FA);
    final boxBorderColor =
        _controllers[index].text.isNotEmpty
            ? (isDark ? AppColors.gold : const Color(0xFF690000))
            : (isDark ? AppColors.darkBorder : Colors.grey[300]!);
    final textColor = isDark ? AppColors.gold : const Color(0xFF690000);

    return GestureDetector(
      onTap: () => _focusNodes[index].requestFocus(),
      child: Container(
        width: 56,
        height: 60,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: boxFillColor,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: boxBorderColor, width: 2),
          boxShadow: [
            BoxShadow(
              color:
                  isDark
                      ? Colors.black.withValues(alpha: 0.2)
                      : const Color(0xFF690000).withValues(alpha: 0.08),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: TextField(
          controller: _controllers[index],
          focusNode: _focusNodes[index],
          textAlign: TextAlign.center,
          keyboardType: TextInputType.number,
          maxLength: 1,
          style: TextStyle(
            color: textColor,
            fontSize: 26,
            fontWeight: FontWeight.bold,
          ),
          decoration: const InputDecoration(
            border: InputBorder.none,
            enabledBorder: InputBorder.none,
            focusedBorder: InputBorder.none,
            counterText: '',
            contentPadding: EdgeInsets.zero,
            filled: false,
          ),
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          onChanged: (value) {
            if (value.isNotEmpty && index < 4) {
              _focusNodes[index + 1].requestFocus();
            } else if (value.isEmpty && index > 0) {
              _focusNodes[index - 1].requestFocus();
            }
            setState(() {});
          },
        ),
      ),
    );
  }

  // ============= TIMER & RESEND =============
  Widget _buildTimerAndResend() {
    final timerBgColor = isDark ? AppColors.darkCard : Colors.white;
    final timerIconColor =
        _remainingSeconds > 60
            ? (isDark ? AppColors.gold : const Color(0xFF690000))
            : Colors.red;
    final timerIconBgColor =
        _remainingSeconds > 60
            ? (isDark
                ? AppColors.gold.withValues(alpha: 0.15)
                : const Color(0xFF690000).withValues(alpha: 0.1))
            : Colors.red.withValues(alpha: 0.1);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: timerBgColor,
        borderRadius: BorderRadius.circular(16),
        border:
            isDark
                ? Border.all(color: AppColors.darkBorder.withValues(alpha: 0.5))
                : null,
        boxShadow: [
          BoxShadow(
            color:
                isDark
                    ? Colors.black.withValues(alpha: 0.3)
                    : Colors.black.withValues(alpha: 0.1),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: timerIconBgColor,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  Icons.timer_outlined,
                  color: timerIconColor,
                  size: 20,
                ),
              ),
              const SizedBox(width: 10),
              Text(
                _formatTime(_remainingSeconds),
                style: TextStyle(
                  fontSize: 16,
                  fontFamily: 'Cairo',
                  color: timerIconColor,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          if (_resendCount < 3)
            TextButton(
              onPressed: _remainingSeconds == 0 ? _resendCode : null,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'إعادة الإرسال',
                    style: TextStyle(
                      fontSize: 14,
                      fontFamily: 'Cairo',
                      color:
                          _remainingSeconds == 0
                              ? const Color(0xFFD4AF37)
                              : (isDark
                                  ? AppColors.darkTextMuted
                                  : Colors.grey),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  if (_resendCount > 0) ...[
                    const SizedBox(width: 4),
                    Text(
                      '($_resendCount/3)',
                      style: TextStyle(
                        fontSize: 12,
                        fontFamily: 'Cairo',
                        color: isDark ? AppColors.darkTextMuted : Colors.grey,
                      ),
                    ),
                  ],
                ],
              ),
            )
          else
            const Text(
              'الحد الأقصى للإرسال',
              style: TextStyle(
                fontSize: 12,
                fontFamily: 'Cairo',
                color: Colors.red,
              ),
            ),
        ],
      ),
    );
  }

  // ============= VERIFY OTP =============
  Future<void> _verifyOtp() async {
    FocusScope.of(context).unfocus();

    String otp = _controllers.map((c) => c.text).join();

    if (otp.length != 5) {
      HapticFeedback.mediumImpact();
      EnhancedPopups.showWarning(
        context: context,
        title: 'تنبيه',
        message: 'الرجاء إدخال الكود كاملاً (5 أرقام)',
      );
      return;
    }

    if (_wrongAttempts >= 5) {
      HapticFeedback.mediumImpact();
      EnhancedPopups.showError(
        context: context,
        title: 'تم إلغاء العملية',
        message: 'لقد تجاوزت الحد الأقصى للمحاولات الخاطئة (5 مرات)',
      );
      if (mounted) context.go('/forgot-password');
      return;
    }

    setState(() => _isLoading = true);
    HapticFeedback.lightImpact();

    try {
      final result = await ApiService.verifyOTP(email: widget.email, otp: otp);

      setState(() => _isLoading = false);

      if (!mounted) return;

      if (result['success'] == true) {
        HapticFeedback.heavyImpact();
        EnhancedPopups.showSuccess(
          context: context,
          title: 'تم التحقق',
          message: 'تم التحقق من الكود بنجاح',
        );

        await Future.delayed(const Duration(milliseconds: 1000));
        if (!mounted) return;

        context.go('/reset-password', extra: {'email': widget.email});
      } else {
        setState(() => _wrongAttempts++);
        HapticFeedback.mediumImpact();

        EnhancedPopups.showError(
          context: context,
          title: 'كود خاطئ',
          message: 'الكود المدخل غير صحيح ($_wrongAttempts/5)',
        );

        for (var controller in _controllers) {
          controller.clear();
        }
        _focusNodes[0].requestFocus();
      }
    } catch (e) {
      setState(() => _isLoading = false);
      HapticFeedback.mediumImpact();

      if (mounted) {
        EnhancedPopups.showError(
          context: context,
          title: 'خطأ',
          message: 'حدث خطأ في الاتصال بالسيرفر',
        );
      }
    }
  }

  // ============= RESEND CODE =============
  Future<void> _resendCode() async {
    if (_resendCount >= 3) {
      HapticFeedback.mediumImpact();
      EnhancedPopups.showError(
        context: context,
        title: 'تنبيه',
        message: 'لقد تجاوزت الحد الأقصى لإعادة إرسال الكود (3 مرات)',
      );
      return;
    }

    setState(() => _isLoading = true);
    HapticFeedback.lightImpact();

    try {
      final result = await ApiService.resendOTP(email: widget.email);

      setState(() => _isLoading = false);

      if (!mounted) return;

      if (result['success'] == true) {
        setState(() {
          _resendCount++;
          _remainingSeconds = 300;
          _wrongAttempts = 0;
        });

        _timer?.cancel();
        _startTimer();

        HapticFeedback.heavyImpact();
        EnhancedPopups.showSuccess(
          context: context,
          title: 'تم بنجاح',
          message: 'تم إعادة إرسال الكود ($_resendCount/3)',
        );
      } else {
        HapticFeedback.mediumImpact();
        EnhancedPopups.showError(
          context: context,
          title: 'خطأ',
          message: result['message'] ?? 'فشل إعادة إرسال الكود',
        );
      }
    } catch (e) {
      setState(() => _isLoading = false);
      HapticFeedback.mediumImpact();

      if (mounted) {
        EnhancedPopups.showError(
          context: context,
          title: 'خطأ',
          message: 'حدث خطأ في الاتصال بالسيرفر',
        );
      }
    }
  }
}
