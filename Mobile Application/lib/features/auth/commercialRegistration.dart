import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../core/network/api_service.dart';
import '../../core/widgets/widgets.dart';
import '../../theme/theme.dart';
import '../../util/file_picker_helper.dart';

class CommercialRegistrationPage extends StatefulWidget {
  final Map<String, dynamic> userData;

  const CommercialRegistrationPage({super.key, required this.userData});

  @override
  State<CommercialRegistrationPage> createState() =>
      _CommercialRegistrationPageState();
}

class _CommercialRegistrationPageState extends State<CommercialRegistrationPage>
    with SingleTickerProviderStateMixin {
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

                      // Back Button
                      _buildBackButton(),

                      AppSpacing.gapVerticalLG,

                      // Icon
                      _buildIcon(),

                      AppSpacing.gapVerticalLG,

                      // Title & Subtitle
                      _buildHeader(),

                      AppSpacing.gapVerticalLG,

                      // Form Card - Required Documents
                      _buildRequiredDocsCard(),

                      AppSpacing.gapVerticalMD,

                      // Optional Documents Card
                      _buildOptionalDocsCard(),

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
              Icons.business_rounded,
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
          'حساب تجاري',
          style: AppTypography.h1.copyWith(
            color: AppColors.primary,
            fontSize: 26,
          ),
        ),
        AppSpacing.gapVerticalXS,
        Text(
          'ارفق المستندات المطلوبة لإتمام التسجيل',
          style: AppTypography.body.copyWith(color: AppColors.textLight),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  // ============= REQUIRED DOCS CARD =============
  Widget _buildRequiredDocsCard() {
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
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'المستندات المطلوبة',
            style: AppTypography.body.copyWith(
              fontWeight: FontWeight.bold,
              color: AppColors.primary,
              fontSize: 16,
            ),
          ),

          AppSpacing.gapVerticalMD,

          _buildDocumentUpload(
            title: 'العقد',
            subtitle: 'صورة أو ملف PDF للعقد',
            file: _contractFile,
            onTap: () => _pickFile('contract'),
            onRemove: () => setState(() => _contractFile = null),
            isRequired: true,
          ),

          AppSpacing.gapVerticalMD,

          _buildDocumentUpload(
            title: 'البطاقة الضريبية',
            subtitle: 'صورة أو ملف PDF للبطاقة الضريبية',
            file: _taxCardFile,
            onTap: () => _pickFile('taxCard'),
            onRemove: () => setState(() => _taxCardFile = null),
            isRequired: true,
          ),

          AppSpacing.gapVerticalMD,

          _buildDocumentUpload(
            title: 'السجل التجاري',
            subtitle: 'صورة أو ملف PDF للسجل التجاري',
            file: _commercialRegisterFile,
            onTap: () => _pickFile('commercialRegister'),
            onRemove: () => setState(() => _commercialRegisterFile = null),
            isRequired: true,
          ),

          AppSpacing.gapVerticalMD,

          _buildDocumentUpload(
            title: 'شهادة القيمة المضافة',
            subtitle: 'صورة أو ملف PDF لشهادة القيمة المضافة',
            file: _valueAddedCertificateFile,
            onTap: () => _pickFile('valueAddedCertificate'),
            onRemove: () => setState(() => _valueAddedCertificateFile = null),
            isRequired: true,
          ),

          AppSpacing.gapVerticalMD,

          _buildDocumentUpload(
            title: 'الشهادة الاستيرادية',
            subtitle: 'صورة أو ملف PDF للشهادة الاستيرادية',
            file: _importCertificateFile,
            onTap: () => _pickFile('importCertificate'),
            onRemove: () => setState(() => _importCertificateFile = null),
            isRequired: true,
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

  // ============= OPTIONAL DOCS CARD =============
  Widget _buildOptionalDocsCard() {
    return Container(
      padding: AppSpacing.paddingLG,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: AppSpacing.borderRadiusLG,
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.05),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'مستندات اختيارية',
            style: AppTypography.body.copyWith(
              fontWeight: FontWeight.bold,
              color: AppColors.textLight,
              fontSize: 16,
            ),
          ),

          AppSpacing.gapVerticalMD,

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

  // ============= DOCUMENT UPLOAD =============
  Widget _buildDocumentUpload({
    required String title,
    required String subtitle,
    required File? file,
    required VoidCallback onTap,
    required VoidCallback onRemove,
    required bool isRequired,
  }) {
    final bool hasFile = file != null;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.background,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: hasFile ? const Color(0xFF1ba3b6) : AppColors.greyBorder,
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
                  color: hasFile ? const Color(0xFF1ba3b6) : AppColors.primary,
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
                          style: AppTypography.body.copyWith(
                            fontWeight: FontWeight.w600,
                            color: AppColors.textDark,
                          ),
                        ),
                        if (isRequired)
                          Text(
                            ' *',
                            style: TextStyle(
                              color: AppColors.error,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      hasFile ? file.path.split('/').last : subtitle,
                      style: AppTypography.small.copyWith(
                        color:
                            hasFile
                                ? const Color(0xFF1ba3b6)
                                : AppColors.textGrey,
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
                    color: AppColors.error,
                    size: 20,
                  ),
                  onPressed: onRemove,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                )
              else
                Icon(
                  Icons.arrow_back_ios_rounded,
                  color: AppColors.textGrey,
                  size: 14,
                ),
            ],
          ),
        ),
      ),
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
              'سيتم مراجعة المستندات المرفوعة وتفعيل حسابك خلال 24-48 ساعة',
              style: AppTypography.small.copyWith(
                color: const Color(0xFF1ba3b6),
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
