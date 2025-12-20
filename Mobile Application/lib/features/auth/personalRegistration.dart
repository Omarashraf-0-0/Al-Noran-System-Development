import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../core/network/api_service.dart';
import '../../core/widgets/widgets.dart';
import '../../theme/theme.dart';
import '../../util/validators.dart';
import '../../util/file_picker_helper.dart';

class PersonalRegistrationPage extends StatefulWidget {
  final Map<String, dynamic> userData;

  const PersonalRegistrationPage({super.key, required this.userData});

  @override
  State<PersonalRegistrationPage> createState() =>
      _PersonalRegistrationPageState();
}

class _PersonalRegistrationPageState extends State<PersonalRegistrationPage>
    with SingleTickerProviderStateMixin {
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

                      AppSpacing.gapVerticalLG,

                      // Icon
                      _buildIcon(),

                      AppSpacing.gapVerticalLG,

                      // Title & Subtitle
                      _buildHeader(),

                      AppSpacing.gapVerticalLG,

                      // Form Card
                      _buildFormCard(),

                      AppSpacing.gapVerticalMD,

                      // Info Box
                      _buildInfoBox(),

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
              Icons.arrow_forward_rounded,
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
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.15),
                  blurRadius: 25,
                  spreadRadius: 3,
                ),
              ],
            ),
            child: Icon(
              Icons.person_rounded,
              size: 50,
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
          'حساب شخصي',
          style: AppTypography.h1.copyWith(
            color: AppColors.primary,
            fontSize: 26,
          ),
        ),
        AppSpacing.gapVerticalXS,
        Text(
          'أدخل الرقم القومي وارفق المستندات المطلوبة',
          style: AppTypography.body.copyWith(color: AppColors.textLight),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  // ============= FORM CARD =============
  Widget _buildFormCard() {
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

          AppSpacing.gapVerticalMD,

          // National ID Card Upload
          _buildDocumentUpload(
            title: 'صورة البطاقة الشخصية',
            subtitle: 'صورة واضحة للبطاقة من الوجهين',
            file: _nationalIdCardFile,
            onTap: _pickNationalIdCard,
            onRemove: () => setState(() => _nationalIdCardFile = null),
          ),

          AppSpacing.gapVerticalMD,

          // Power of Attorney Upload
          _buildDocumentUpload(
            title: 'التوكيل',
            subtitle: 'صورة أو ملف PDF للتوكيل',
            file: _powerOfAttorneyFile,
            onTap: _pickPowerOfAttorney,
            onRemove: () => setState(() => _powerOfAttorneyFile = null),
          ),

          AppSpacing.gapVerticalLG,

          // Submit Button
          AppPrimaryButton(
            text: 'إتمام التسجيل',
            onPressed: _handleSubmit,
            isLoading: _isLoading,
            icon: Icons.check_circle_rounded,
          ),
        ],
      ),
    );
  }

  // ============= LABELED TEXT FIELD =============
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
          padding: const EdgeInsets.only(bottom: 8, right: 4),
          child: Text(
            label,
            style: AppTypography.body.copyWith(
              fontWeight: FontWeight.w600,
              color: AppColors.textDark,
            ),
          ),
        ),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          textAlign: TextAlign.right,
          style: AppTypography.body.copyWith(color: AppColors.textDark),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: AppTypography.body.copyWith(color: AppColors.textGrey),
            filled: true,
            fillColor: AppColors.background,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 16,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppColors.greyBorder, width: 1),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppColors.primary, width: 2),
            ),
            suffixIcon: Icon(icon, color: AppColors.textGrey, size: 22),
          ),
        ),
      ],
    );
  }

  // ============= DOCUMENT UPLOAD =============
  Widget _buildDocumentUpload({
    required String title,
    required String subtitle,
    required File? file,
    required VoidCallback onTap,
    required VoidCallback onRemove,
  }) {
    final bool hasFile = file != null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 8, right: 4),
          child: Text(
            title,
            style: AppTypography.body.copyWith(
              fontWeight: FontWeight.w600,
              color: AppColors.textDark,
            ),
          ),
        ),
        Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(12),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color:
                      hasFile ? const Color(0xFF1ba3b6) : AppColors.greyBorder,
                  width: hasFile ? 2 : 1,
                ),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color:
                          hasFile
                              ? const Color(0xFF1ba3b6).withValues(alpha: 0.1)
                              : AppColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      hasFile
                          ? Icons.check_circle_rounded
                          : Icons.upload_file_rounded,
                      color:
                          hasFile ? const Color(0xFF1ba3b6) : AppColors.primary,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      hasFile ? file.path.split('/').last : subtitle,
                      style: AppTypography.body.copyWith(
                        color:
                            hasFile
                                ? const Color(0xFF1ba3b6)
                                : AppColors.textGrey,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  if (hasFile)
                    IconButton(
                      icon: Icon(
                        Icons.close_rounded,
                        color: AppColors.error,
                        size: 20,
                      ),
                      onPressed: onRemove,
                    )
                  else
                    Icon(
                      Icons.arrow_back_ios_rounded,
                      color: AppColors.textGrey,
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

  // ============= INFO BOX =============
  Widget _buildInfoBox() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1ba3b6).withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: const Color(0xFF1ba3b6).withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        children: [
          Icon(
            Icons.info_outline_rounded,
            color: const Color(0xFF1ba3b6),
            size: 24,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'سيتم مراجعة المستندات المرفوعة وتفعيل حسابك خلال 24 ساعة',
              style: AppTypography.small.copyWith(
                color: const Color(0xFF1ba3b6),
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
