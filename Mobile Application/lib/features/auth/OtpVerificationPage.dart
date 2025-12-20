import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'dart:async';
import '../../core/network/api_service.dart';
import '../../core/widgets/widgets.dart';
import '../../theme/theme.dart';

class OtpVerificationPage extends StatefulWidget {
  final String email;

  const OtpVerificationPage({super.key, required this.email});

  @override
  State<OtpVerificationPage> createState() => _OtpVerificationPageState();
}

class _OtpVerificationPageState extends State<OtpVerificationPage>
    with SingleTickerProviderStateMixin {
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
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              AppColors.primary.withValues(alpha: 0.08),
              AppColors.background,
              AppColors.background,
            ],
            stops: const [0.0, 0.3, 1.0],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: SlideTransition(
                position: _slideAnimation,
                child: Padding(
                  padding: AppSpacing.paddingHorizontalLG,
                  child: Column(
                    children: [
                      AppSpacing.gapVerticalSM,

                      // Back Button - على الشمال ويبص للشمال
                      _buildBackButton(),

                      AppSpacing.gapVerticalXL,

                      // Icon
                      _buildIcon(),

                      AppSpacing.gapVerticalLG,

                      // Title & Description
                      _buildHeader(),

                      AppSpacing.gapVerticalXL,

                      // OTP Card
                      _buildOtpCard(),

                      AppSpacing.gapVerticalMD,

                      // Timer & Resend
                      _buildTimerAndResend(),

                      AppSpacing.gapVerticalXL,
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  // ============= BACK BUTTON =============
  Widget _buildBackButton() {
    return Align(
      alignment: Alignment.centerLeft,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => context.pop(),
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Icon(
              Icons.arrow_back_rounded,
              color: AppColors.primary,
              size: 24,
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
          child: Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.15),
                  blurRadius: 30,
                  spreadRadius: 5,
                ),
              ],
            ),
            child: Icon(
              Icons.password_rounded,
              size: 60,
              color: AppColors.primary,
            ),
          ),
        );
      },
    );
  }

  // ============= HEADER =============
  Widget _buildHeader() {
    return Column(
      children: [
        Text(
          'رمز التحقق (OTP)',
          style: AppTypography.h1.copyWith(
            color: AppColors.primary,
            fontSize: 28,
          ),
        ),
        AppSpacing.gapVerticalXS,
        Text(
          'أدخل رمز التحقق المكون من 5 أرقام\nالمرسل إلى ${widget.email}',
          style: AppTypography.body.copyWith(color: AppColors.textLight),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  // ============= OTP CARD =============
  Widget _buildOtpCard() {
    return Container(
      padding: AppSpacing.paddingLG,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: AppSpacing.borderRadiusLG,
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.08),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
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

          AppSpacing.gapVerticalLG,

          // Verify Button
          AppPrimaryButton(
            text: 'تحقق',
            onPressed: _verifyOtp,
            isLoading: _isLoading,
            icon: Icons.check_circle_rounded,
          ),
        ],
      ),
    );
  }

  // ============= OTP BOX =============
  Widget _buildOtpBox(int index) {
    return GestureDetector(
      onTap: () => _focusNodes[index].requestFocus(),
      child: Container(
        width: 60,
        height: 60,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color:
                _controllers[index].text.isNotEmpty
                    ? AppColors.primary
                    : Colors.grey[300]!,
            width: 2,
          ),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.05),
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
            color: Colors.black,
            fontSize: 24,
            fontWeight: FontWeight.w600,
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
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Icon(
                Icons.timer_outlined,
                color:
                    _remainingSeconds > 60
                        ? AppColors.primary
                        : AppColors.error,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                _formatTime(_remainingSeconds),
                style: AppTypography.body.copyWith(
                  color:
                      _remainingSeconds > 60
                          ? AppColors.primary
                          : AppColors.error,
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
                    style: AppTypography.body.copyWith(
                      color:
                          _remainingSeconds == 0
                              ? AppColors.primary
                              : AppColors.textGrey,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  if (_resendCount > 0) ...[
                    const SizedBox(width: 4),
                    Text(
                      '($_resendCount/3)',
                      style: AppTypography.small.copyWith(
                        color: AppColors.textGrey,
                      ),
                    ),
                  ],
                ],
              ),
            )
          else
            Text(
              'الحد الأقصى للإرسال',
              style: AppTypography.small.copyWith(color: AppColors.error),
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
