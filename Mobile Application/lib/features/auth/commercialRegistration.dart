import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../core/network/api_service.dart';
import '../../core/widgets/widgets.dart';
import '../../theme/theme.dart';
import '../../util/file_picker_helper.dart';
import 'auth_dark_mode_mixin.dart';

class CommercialRegistrationPage extends StatefulWidget {
  final Map<String, dynamic> userData;

  const CommercialRegistrationPage({super.key, required this.userData});

  @override
  State<CommercialRegistrationPage> createState() =>
      _CommercialRegistrationPageState();
}

class _CommercialRegistrationPageState extends State<CommercialRegistrationPage>
    with SingleTickerProviderStateMixin, AuthDarkModeMixin {
  File? _contractFile;
  File? _taxCardFile;
  File? _commercialRegisterFile;
  File? _valueAddedCertificateFile;
  File? _importCertificateFile;
  File? _exportCardFile;

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

                        // Form Card - Required Documents
                        _buildRequiredDocsCard(),

                        const SizedBox(height: 16),

                        // Optional Documents Card
                        _buildOptionalDocsCard(),

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
                Icons.business_rounded,
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
            'حساب تجاري',
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
          'ارفق المستندات المطلوبة لإتمام التسجيل',
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

  // ============= PREMIUM REQUIRED DOCS CARD =============
  Widget _buildRequiredDocsCard() {
    final sectionTitleColor = const Color(0xFF690000);

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: cardDecoration,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 4,
                height: 20,
                decoration: BoxDecoration(
                  color: const Color(0xFFD4AF37),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 10),
              Text(
                'المستندات المطلوبة',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: sectionTitleColor,
                  fontSize: 17,
                  fontFamily: 'Cairo',
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),

          _buildDocumentUpload(
            title: 'العقد',
            subtitle: 'صورة أو ملف PDF للعقد',
            file: _contractFile,
            onTap: () => _pickFile('contract'),
            onRemove: () => setState(() => _contractFile = null),
            isRequired: true,
          ),

          const SizedBox(height: 16),

          _buildDocumentUpload(
            title: 'البطاقة الضريبية',
            subtitle: 'صورة أو ملف PDF للبطاقة الضريبية',
            file: _taxCardFile,
            onTap: () => _pickFile('taxCard'),
            onRemove: () => setState(() => _taxCardFile = null),
            isRequired: true,
          ),

          const SizedBox(height: 16),

          _buildDocumentUpload(
            title: 'السجل التجاري',
            subtitle: 'صورة أو ملف PDF للسجل التجاري',
            file: _commercialRegisterFile,
            onTap: () => _pickFile('commercialRegister'),
            onRemove: () => setState(() => _commercialRegisterFile = null),
            isRequired: true,
          ),

          const SizedBox(height: 16),

          _buildDocumentUpload(
            title: 'شهادة القيمة المضافة',
            subtitle: 'صورة أو ملف PDF لشهادة القيمة المضافة',
            file: _valueAddedCertificateFile,
            onTap: () => _pickFile('valueAddedCertificate'),
            onRemove: () => setState(() => _valueAddedCertificateFile = null),
            isRequired: true,
          ),

          const SizedBox(height: 16),

          _buildDocumentUpload(
            title: 'الشهادة الاستيرادية',
            subtitle: 'صورة أو ملف PDF للشهادة الاستيرادية',
            file: _importCertificateFile,
            onTap: () => _pickFile('importCertificate'),
            onRemove: () => setState(() => _importCertificateFile = null),
            isRequired: true,
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
                    : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.check_circle_rounded,
                          color: Colors.white,
                          size: 22,
                        ),
                        const SizedBox(width: 10),
                        Text(
                          'إتمام التسجيل',
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

  // ============= PREMIUM OPTIONAL DOCS CARD =============
  Widget _buildOptionalDocsCard() {
    final optionalTitleColor =
        isDark ? AppColors.darkTextSecondary : Colors.grey[600];
    final optionalBarColor =
        isDark ? AppColors.darkTextMuted : Colors.grey[400];

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: cardDecoration,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 4,
                height: 20,
                decoration: BoxDecoration(
                  color: optionalBarColor,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 10),
              Text(
                'مستندات اختيارية',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: optionalTitleColor,
                  fontSize: 17,
                  fontFamily: 'Cairo',
                ),
              ),
            ],
          ),

          const SizedBox(height: 20),

          _buildDocumentUpload(
            title: 'بطاقة التصدير',
            subtitle: 'صورة أو ملف PDF لبطاقة التصدير',
            file: _exportCardFile,
            onTap: () => _pickFile('exportCard'),
            onRemove: () => setState(() => _exportCardFile = null),
            isRequired: false,
          ),
        ],
      ),
    );
  }

  // ============= PREMIUM DOCUMENT UPLOAD =============
  Widget _buildDocumentUpload({
    required String title,
    required String subtitle,
    required File? file,
    required VoidCallback onTap,
    required VoidCallback onRemove,
    required bool isRequired,
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
    final titleTextColor =
        isDark ? AppColors.darkTextPrimary : const Color(0xFF333333);
    final fileTextColor =
        hasFile
            ? const Color(0xFFD4AF37)
            : (isDark ? AppColors.darkTextMuted : Colors.grey[500]);
    final arrowColor = isDark ? AppColors.darkTextMuted : Colors.grey[400];
    final requiredColor = const Color(0xFF690000);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.all(14),
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
                            : const Color(0xFF690000).withValues(alpha: 0.05)),
                blurRadius: 8,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: iconBgColor,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  hasFile
                      ? Icons.check_circle_rounded
                      : Icons.upload_file_rounded,
                  color: uploadIconColor,
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          title,
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            color: titleTextColor,
                            fontSize: 14,
                            fontFamily: 'Cairo',
                          ),
                        ),
                        if (isRequired)
                          Text(
                            ' *',
                            style: TextStyle(
                              color: requiredColor,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      hasFile ? file.path.split('/').last : subtitle,
                      style: TextStyle(
                        color: fileTextColor,
                        fontSize: 12,
                        fontFamily: 'Cairo',
                        fontWeight:
                            hasFile ? FontWeight.w600 : FontWeight.normal,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
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
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                )
              else
                Icon(
                  Icons.arrow_forward_ios_rounded,
                  color: arrowColor,
                  size: 14,
                ),
            ],
          ),
        ),
      ),
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
              'سيتم مراجعة المستندات المرفوعة وتفعيل حسابك خلال 24-48 ساعة',
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

  // ============= PICK FILE =============
  Future<void> _pickFile(String fileType) async {
    try {
      final File? pickedFile = await FilePickerHelper.pickFile(context);
      if (pickedFile != null) {
        HapticFeedback.lightImpact();
        setState(() {
          switch (fileType) {
            case 'contract':
              _contractFile = pickedFile;
              break;
            case 'taxCard':
              _taxCardFile = pickedFile;
              break;
            case 'commercialRegister':
              _commercialRegisterFile = pickedFile;
              break;
            case 'valueAddedCertificate':
              _valueAddedCertificateFile = pickedFile;
              break;
            case 'importCertificate':
              _importCertificateFile = pickedFile;
              break;
            case 'exportCard':
              _exportCardFile = pickedFile;
              break;
          }
        });
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
    if (_contractFile == null) {
      HapticFeedback.mediumImpact();
      EnhancedPopups.showError(
        context: context,
        title: 'تنبيه',
        message: 'من فضلك قم بإرفاق العقد',
      );
      return;
    }

    if (_taxCardFile == null) {
      HapticFeedback.mediumImpact();
      EnhancedPopups.showError(
        context: context,
        title: 'تنبيه',
        message: 'من فضلك قم بإرفاق البطاقة الضريبية',
      );
      return;
    }

    if (_commercialRegisterFile == null) {
      HapticFeedback.mediumImpact();
      EnhancedPopups.showError(
        context: context,
        title: 'تنبيه',
        message: 'من فضلك قم بإرفاق السجل التجاري',
      );
      return;
    }

    if (_valueAddedCertificateFile == null) {
      HapticFeedback.mediumImpact();
      EnhancedPopups.showError(
        context: context,
        title: 'تنبيه',
        message: 'من فضلك قم بإرفاق شهادة القيمة المضافة',
      );
      return;
    }

    if (_importCertificateFile == null) {
      HapticFeedback.mediumImpact();
      EnhancedPopups.showError(
        context: context,
        title: 'تنبيه',
        message: 'من فضلك قم بإرفاق الشهادة الاستيرادية',
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
        clientType: 'commercial',
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
      final List<Map<String, dynamic>> documentsToUpload = [
        {
          'file': _contractFile!,
          'type': 'contract',
          'description': 'العقد - حساب تجاري',
        },
        {
          'file': _taxCardFile!,
          'type': 'tax_card',
          'description': 'البطاقة الضريبية - حساب تجاري',
        },
        {
          'file': _commercialRegisterFile!,
          'type': 'commercial_register',
          'description': 'السجل التجاري - حساب تجاري',
        },
        {
          'file': _valueAddedCertificateFile!,
          'type': 'certificate_vat',
          'description': 'شهادة القيمة المضافة - حساب تجاري',
        },
        {
          'file': _importCertificateFile!,
          'type': 'import_export_card',
          'description': 'الشهادة الاستيرادية - حساب تجاري',
        },
      ];

      if (_exportCardFile != null) {
        documentsToUpload.add({
          'file': _exportCardFile!,
          'type': 'import_export_card',
          'description': 'بطاقة التصدير - حساب تجاري',
        });
      }

      bool allUploadsSuccessful = true;
      String? failedDocType;

      for (var doc in documentsToUpload) {
        final uploadResult = await ApiService.uploadToS3(
          file: doc['file'],
          category: 'registration',
          documentType: doc['type'],
          description: doc['description'],
          tags: [doc['type'], 'commercial', 'registration'],
          userType: 'client',
          clientType: 'commercial',
        );

        if (!uploadResult['success']) {
          allUploadsSuccessful = false;
          failedDocType = doc['type'];
          break;
        }
      }

      setState(() => _isLoading = false);

      if (allUploadsSuccessful) {
        HapticFeedback.heavyImpact();
        EnhancedPopups.showSuccess(
          context: context,
          title: 'تم التسجيل بنجاح',
          message: 'سيتم مراجعة حسابك وتفعيله خلال 24-48 ساعة',
        );

        await Future.delayed(const Duration(milliseconds: 1500));
        if (mounted) context.go('/login');
      } else {
        HapticFeedback.mediumImpact();
        EnhancedPopups.showWarning(
          context: context,
          title: 'تنبيه',
          message: 'تم إنشاء الحساب لكن فشل رفع مستند: $failedDocType',
        );
        if (mounted) context.go('/login');
      }
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
