import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../core/network/api_service.dart';
import '../../core/widgets/widgets.dart';
import '../../theme/theme.dart';
import '../../util/validators.dart';
import '../../util/file_picker_helper.dart';
import 'auth_dark_mode_mixin.dart';

class PersonalRegistrationPage extends StatefulWidget {
  final Map<String, dynamic> userData;

  const PersonalRegistrationPage({super.key, required this.userData});

  @override
  State<PersonalRegistrationPage> createState() =>
      _PersonalRegistrationPageState();
}

class _PersonalRegistrationPageState extends State<PersonalRegistrationPage>
    with SingleTickerProviderStateMixin, AuthDarkModeMixin {
  final TextEditingController _nationalIdController = TextEditingController();
  File? _powerOfAttorneyFile;
  File? _nationalIdCardFile;
  bool _isLoading = false;

  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();

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
    _nationalIdController.dispose();
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // ============= PREMIUM GRADIENT BACKGROUND =============
          Container(
            width: double.infinity,
            height: double.infinity,
            decoration: BoxDecoration(gradient: backgroundGradientFull),
          ),

          // ============= DECORATIVE CIRCLES =============
          Positioned(
            top: -80,
            right: -60,
            child: Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: decorativeCircleColor,
              ),
            ),
          ),
          Positioned(
            bottom: -100,
            left: -80,
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: decorativeCircleColorSmall,
              ),
            ),
          ),

          // ============= GOLDEN ACCENT LINE =============
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: Container(
              height: 3,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Colors.transparent,
                    Color(0xFFD4AF37),
                    Color(0xFFF5E7A3),
                    Color(0xFFD4AF37),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          // ============= MAIN CONTENT =============
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

                        const SizedBox(height: 24),

                        // Icon
                        _buildIcon(),

                        const SizedBox(height: 20),

                        // Title & Subtitle
                        _buildHeader(),

                        const SizedBox(height: 28),

                        // Form Card
                        _buildFormCard(),

                        const SizedBox(height: 16),

                        // Info Box
                        _buildInfoBox(),

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

  // ============= PREMIUM BACK BUTTON =============
  Widget _buildBackButton() {
    return Align(
      alignment: Alignment.centerLeft,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => context.pop(),
          borderRadius: BorderRadius.circular(14),
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: backButtonBgColor,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: const Color(0xFFD4AF37).withValues(alpha: 0.4),
                width: 1.5,
              ),
            ),
            child: const Icon(
              Icons.arrow_forward_rounded,
              color: Colors.white,
              size: 24,
            ),
          ),
        ),
      ),
    );
  }

  // ============= PREMIUM ICON WITH GOLD RING =============
  Widget _buildIcon() {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: const Duration(milliseconds: 800),
      curve: Curves.elasticOut,
      builder: (context, value, child) {
        return Transform.scale(
          scale: value,
          child: Container(
            width: 100,
            height: 100,
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
            child: Container(
              margin: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: logoContainerColor,
              ),
              child: const Icon(
                Icons.person_rounded,
                size: 48,
                color: Color(0xFFD4AF37),
              ),
            ),
          ),
        );
      },
    );
  }

  // ============= PREMIUM HEADER WITH GOLD TEXT =============
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
            'حساب شخصي',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              fontFamily: 'Cairo',
              color: Colors.white,
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'أدخل الرقم القومي وارفق المستندات المطلوبة',
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

  // ============= PREMIUM FORM CARD =============
  Widget _buildFormCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: cardDecoration,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // National ID Field
          _buildLabeledTextField(
            controller: _nationalIdController,
            label: 'الرقم القومي',
            hint: 'أدخل الرقم القومي (14 رقم)',
            icon: Icons.credit_card_rounded,
            keyboardType: TextInputType.number,
          ),

          const SizedBox(height: 20),

          // National ID Card Upload
          _buildDocumentUpload(
            title: 'صورة البطاقة الشخصية',
            subtitle: 'صورة واضحة للبطاقة من الوجهين',
            file: _nationalIdCardFile,
            onTap: _pickNationalIdCard,
            onRemove: () => setState(() => _nationalIdCardFile = null),
          ),

          const SizedBox(height: 20),

          // Power of Attorney Upload
          _buildDocumentUpload(
            title: 'التوكيل',
            subtitle: 'صورة أو ملف PDF للتوكيل',
            file: _powerOfAttorneyFile,
            onTap: _pickPowerOfAttorney,
            onRemove: () => setState(() => _powerOfAttorneyFile = null),
          ),

          const SizedBox(height: 28),

          // Premium Submit Button
          _buildPremiumSubmitButton(),
        ],
      ),
    );
  }

  // ============= PREMIUM SUBMIT BUTTON =============
  Widget _buildPremiumSubmitButton() {
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
          onTap: _isLoading ? null : _handleSubmit,
          borderRadius: BorderRadius.circular(16),
          child: Center(
            child:
                _isLoading
                    ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2.5,
                      ),
                    )
                    : const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.check_circle_rounded,
                          color: Colors.white,
                          size: 22,
                        ),
                        SizedBox(width: 10),
                        Text(
                          'إتمام التسجيل',
                          style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Cairo',
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
          ),
        ),
      ),
    );
  }

  // ============= PREMIUM LABELED TEXT FIELD =============
  Widget _buildLabeledTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    TextInputType? keyboardType,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 10, right: 4),
          child: Row(
            children: [
              Container(
                width: 4,
                height: 16,
                decoration: BoxDecoration(
                  color: const Color(0xFFD4AF37),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                label,
                style: TextStyle(
                  fontSize: 15,
                  fontFamily: 'Cairo',
                  fontWeight: FontWeight.w700,
                  color: labelColor,
                ),
              ),
            ],
          ),
        ),
        Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
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
          child: TextFormField(
            controller: controller,
            keyboardType: keyboardType,
            textAlign: TextAlign.right,
            style: TextStyle(
              fontSize: 15,
              fontFamily: 'Cairo',
              fontWeight: FontWeight.w500,
              color: inputTextColor,
            ),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: TextStyle(
                fontSize: 14,
                fontFamily: 'Cairo',
                color: hintColor,
              ),
              filled: true,
              fillColor: fillColor,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 18,
                vertical: 18,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide.none,
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide(color: borderColor, width: 1.5),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide(color: focusBorderColor, width: 2),
              ),
              suffixIcon: Icon(icon, color: iconColor, size: 22),
            ),
          ),
        ),
      ],
    );
  }

  // ============= PREMIUM DOCUMENT UPLOAD =============
  Widget _buildDocumentUpload({
    required String title,
    required String subtitle,
    required File? file,
    required VoidCallback onTap,
    required VoidCallback onRemove,
  }) {
    final bool hasFile = file != null;
    final uploadBgColor =
        isDark ? AppColors.darkSurface : const Color(0xFFF8F9FA);
    final uploadBorderColor =
        hasFile
            ? const Color(0xFFD4AF37)
            : (isDark ? AppColors.darkBorder : Colors.grey[200]!);
    final iconBgColor =
        hasFile
            ? const Color(0xFFD4AF37).withValues(alpha: 0.15)
            : (isDark
                ? AppColors.darkCard
                : const Color(0xFF690000).withValues(alpha: 0.1));
    final uploadIconColor =
        hasFile ? const Color(0xFFD4AF37) : const Color(0xFF690000);
    final fileTextColor =
        hasFile
            ? const Color(0xFFD4AF37)
            : (isDark ? AppColors.darkTextMuted : Colors.grey[500]);
    final arrowColor = isDark ? AppColors.darkTextMuted : Colors.grey[400];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 10, right: 4),
          child: Row(
            children: [
              Container(
                width: 4,
                height: 16,
                decoration: BoxDecoration(
                  color: const Color(0xFFD4AF37),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                title,
                style: TextStyle(
                  fontSize: 15,
                  fontFamily: 'Cairo',
                  fontWeight: FontWeight.w700,
                  color: labelColor,
                ),
              ),
            ],
          ),
        ),
        Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(14),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: uploadBgColor,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: uploadBorderColor,
                  width: hasFile ? 2 : 1.5,
                ),
                boxShadow: [
                  BoxShadow(
                    color:
                        hasFile
                            ? const Color(0xFFD4AF37).withValues(alpha: 0.1)
                            : (isDark
                                ? Colors.black.withValues(alpha: 0.2)
                                : const Color(
                                  0xFF690000,
                                ).withValues(alpha: 0.05)),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: iconBgColor,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      hasFile
                          ? Icons.check_circle_rounded
                          : Icons.upload_file_rounded,
                      color: uploadIconColor,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Text(
                      hasFile ? file.path.split('/').last : subtitle,
                      style: TextStyle(
                        fontSize: 14,
                        fontFamily: 'Cairo',
                        color: fileTextColor,
                        fontWeight:
                            hasFile ? FontWeight.w600 : FontWeight.normal,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  if (hasFile)
                    IconButton(
                      icon: Icon(
                        Icons.close_rounded,
                        color: const Color(0xFF690000),
                        size: 20,
                      ),
                      onPressed: onRemove,
                    )
                  else
                    Icon(
                      Icons.arrow_forward_ios_rounded,
                      color: arrowColor,
                      size: 16,
                    ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  // ============= PREMIUM INFO BOX =============
  Widget _buildInfoBox() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: const Color(0xFFD4AF37).withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFFD4AF37).withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(
              Icons.info_outline_rounded,
              color: Color(0xFFD4AF37),
              size: 22,
            ),
          ),
          const SizedBox(width: 14),
          const Expanded(
            child: Text(
              'سيتم مراجعة المستندات المرفوعة وتفعيل حسابك خلال 24 ساعة',
              style: TextStyle(
                fontSize: 13,
                fontFamily: 'Cairo',
                color: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ============= PICK FILES =============
  Future<void> _pickNationalIdCard() async {
    try {
      final File? pickedFile = await FilePickerHelper.pickFile(context);
      if (pickedFile != null) {
        setState(() => _nationalIdCardFile = pickedFile);
        HapticFeedback.lightImpact();
      }
    } catch (e) {
      EnhancedPopups.showError(
        context: context,
        title: 'خطأ',
        message: 'حدث خطأ أثناء اختيار الصورة',
      );
    }
  }

  Future<void> _pickPowerOfAttorney() async {
    try {
      final File? pickedFile = await FilePickerHelper.pickFile(context);
      if (pickedFile != null) {
        setState(() => _powerOfAttorneyFile = pickedFile);
        HapticFeedback.lightImpact();
      }
    } catch (e) {
      EnhancedPopups.showError(
        context: context,
        title: 'خطأ',
        message: 'حدث خطأ أثناء اختيار الملف',
      );
    }
  }

  // ============= HANDLE SUBMIT =============
  Future<void> _handleSubmit() async {
    FocusScope.of(context).unfocus();

    // Validation
    if (_nationalIdController.text.trim().isEmpty) {
      HapticFeedback.mediumImpact();
      EnhancedPopups.showError(
        context: context,
        title: 'تنبيه',
        message: 'من فضلك أدخل الرقم القومي',
      );
      return;
    }

    if (!AlNoranValidators.isValidEgyptianNationalId(
      _nationalIdController.text,
    )) {
      HapticFeedback.mediumImpact();
      EnhancedPopups.showError(
        context: context,
        title: 'خطأ',
        message: AlNoranValidators.getNationalIdErrorMessage(
          _nationalIdController.text,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);
    HapticFeedback.lightImpact();

    try {
      // Create user account
      final registerResult = await ApiService.register(
        name: widget.userData['fullname'] ?? widget.userData['name'],
        username: widget.userData['username'],
        email: widget.userData['email'],
        phone: widget.userData['phone'],
        password: widget.userData['password'],
        clientType: 'personal',
        ssn: _nationalIdController.text.trim(),
      );

      if (!registerResult['success']) {
        setState(() => _isLoading = false);
        HapticFeedback.mediumImpact();
        EnhancedPopups.showError(
          context: context,
          title: 'خطأ',
          message: registerResult['message'] ?? 'فشل إنشاء الحساب',
        );
        return;
      }

      await Future.delayed(const Duration(milliseconds: 500));

      final savedToken = await ApiService.getToken();
      if (savedToken == null || savedToken.isEmpty) {
        setState(() => _isLoading = false);
        EnhancedPopups.showWarning(
          context: context,
          title: 'تنبيه',
          message: 'تم إنشاء الحساب لكن حدث خطأ في الجلسة. يرجى تسجيل الدخول',
        );
        if (mounted) context.go('/login');
        return;
      }

      // Upload documents
      if (_nationalIdCardFile != null) {
        final idCardResult = await ApiService.uploadToS3(
          file: _nationalIdCardFile!,
          category: 'registration',
          documentType: 'personal_id',
          description: 'صورة البطاقة الشخصية - حساب شخصي',
          tags: ['personal_id', 'personal', 'registration'],
          userType: 'client',
          clientType: 'personal',
        );

        if (!idCardResult['success']) {
          setState(() => _isLoading = false);
          EnhancedPopups.showWarning(
            context: context,
            title: 'تنبيه',
            message: 'تم إنشاء الحساب لكن فشل رفع صورة البطاقة',
          );
          if (mounted) context.go('/login');
          return;
        }
      }

      if (_powerOfAttorneyFile != null) {
        final uploadResult = await ApiService.uploadToS3(
          file: _powerOfAttorneyFile!,
          category: 'registration',
          documentType: 'power_of_attorney',
          description: 'التوكيل - حساب شخصي',
          tags: ['power_of_attorney', 'personal', 'registration'],
          userType: 'client',
          clientType: 'personal',
        );

        if (!uploadResult['success']) {
          setState(() => _isLoading = false);
          EnhancedPopups.showWarning(
            context: context,
            title: 'تنبيه',
            message: 'تم إنشاء الحساب لكن فشل رفع التوكيل',
          );
          if (mounted) context.go('/login');
          return;
        }
      }

      setState(() => _isLoading = false);
      HapticFeedback.heavyImpact();

      EnhancedPopups.showSuccess(
        context: context,
        title: 'تم التسجيل بنجاح',
        message: 'سيتم مراجعة حسابك وتفعيله خلال 24 ساعة',
      );

      await Future.delayed(const Duration(milliseconds: 1500));
      if (mounted) context.go('/login');
    } catch (e) {
      setState(() => _isLoading = false);
      HapticFeedback.mediumImpact();

      if (mounted) {
        EnhancedPopups.showError(
          context: context,
          title: 'خطأ',
          message: 'حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى',
        );
      }
    }
  }
}
