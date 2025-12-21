import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../core/network/api_service.dart';
import '../../core/widgets/widgets.dart';
import '../../theme/theme.dart';
import '../../util/file_picker_helper.dart';

class FactoryRegistrationPage extends StatefulWidget {
  final Map<String, dynamic> userData;

  const FactoryRegistrationPage({super.key, required this.userData});

  @override
  State<FactoryRegistrationPage> createState() =>
      _FactoryRegistrationPageState();
}

class _FactoryRegistrationPageState extends State<FactoryRegistrationPage>
    with SingleTickerProviderStateMixin {
  File? _contractFile;
  File? _taxCardFile;
  File? _commercialRegisterFile;
  File? _valueAddedCertificateFile;
  File? _productionRequirementsFile;
  File? _industrialRegisterFile;

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
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Color(0xFF690000),
                  Color(0xFF8B0000),
                  Color(0xFF4A0000),
                ],
                stops: [0.0, 0.5, 1.0],
              ),
            ),
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
                color: Colors.white.withValues(alpha: 0.08),
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
                color: Colors.white.withValues(alpha: 0.05),
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
              color: Colors.white.withValues(alpha: 0.15),
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
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Color(0xFF690000),
              ),
              child: const Icon(
                Icons.factory_rounded,
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
            'حساب مصنع',
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

  // ============= PREMIUM FORM CARD =============
  Widget _buildFormCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 30,
            offset: const Offset(0, 15),
          ),
          BoxShadow(
            color: const Color(0xFFD4AF37).withValues(alpha: 0.1),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
      ),
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
              const Text(
                'المستندات المطلوبة',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF690000),
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
          ),

          const SizedBox(height: 16),

          _buildDocumentUpload(
            title: 'البطاقة الضريبية',
            subtitle: 'صورة أو ملف PDF للبطاقة الضريبية',
            file: _taxCardFile,
            onTap: () => _pickFile('taxCard'),
            onRemove: () => setState(() => _taxCardFile = null),
          ),

          const SizedBox(height: 16),

          _buildDocumentUpload(
            title: 'السجل التجاري',
            subtitle: 'صورة أو ملف PDF للسجل التجاري',
            file: _commercialRegisterFile,
            onTap: () => _pickFile('commercialRegister'),
            onRemove: () => setState(() => _commercialRegisterFile = null),
          ),

          const SizedBox(height: 16),

          _buildDocumentUpload(
            title: 'شهادة القيمة المضافة',
            subtitle: 'صورة أو ملف PDF لشهادة القيمة المضافة',
            file: _valueAddedCertificateFile,
            onTap: () => _pickFile('valueAddedCertificate'),
            onRemove: () => setState(() => _valueAddedCertificateFile = null),
          ),

          const SizedBox(height: 16),

          _buildDocumentUpload(
            title: 'مستلزمات الإنتاج',
            subtitle: 'صورة أو ملف PDF لمستلزمات الإنتاج',
            file: _productionRequirementsFile,
            onTap: () => _pickFile('productionRequirements'),
            onRemove: () => setState(() => _productionRequirementsFile = null),
          ),

          const SizedBox(height: 16),

          _buildDocumentUpload(
            title: 'السجل الصناعي',
            subtitle: 'صورة أو ملف PDF للسجل الصناعي',
            file: _industrialRegisterFile,
            onTap: () => _pickFile('industrialRegister'),
            onRemove: () => setState(() => _industrialRegisterFile = null),
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
        gradient: const LinearGradient(
          colors: [Color(0xFF690000), Color(0xFF8B0000)],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF690000).withValues(alpha: 0.4),
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

  // ============= PREMIUM DOCUMENT UPLOAD =============
  Widget _buildDocumentUpload({
    required String title,
    required String subtitle,
    required File? file,
    required VoidCallback onTap,
    required VoidCallback onRemove,
  }) {
    final bool hasFile = file != null;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFFF8F9FA),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: hasFile ? const Color(0xFFD4AF37) : Colors.grey[200]!,
              width: hasFile ? 2 : 1.5,
            ),
            boxShadow: [
              BoxShadow(
                color:
                    hasFile
                        ? const Color(0xFFD4AF37).withValues(alpha: 0.1)
                        : const Color(0xFF690000).withValues(alpha: 0.05),
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
                  color:
                      hasFile
                          ? const Color(0xFFD4AF37).withValues(alpha: 0.15)
                          : const Color(0xFF690000).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  hasFile
                      ? Icons.check_circle_rounded
                      : Icons.upload_file_rounded,
                  color:
                      hasFile
                          ? const Color(0xFFD4AF37)
                          : const Color(0xFF690000),
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
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF333333),
                            fontSize: 14,
                            fontFamily: 'Cairo',
                          ),
                        ),
                        const Text(
                          ' *',
                          style: TextStyle(
                            color: Color(0xFF690000),
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      hasFile ? file.path.split('/').last : subtitle,
                      style: TextStyle(
                        color:
                            hasFile
                                ? const Color(0xFFD4AF37)
                                : Colors.grey[500],
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
                  icon: const Icon(
                    Icons.close_rounded,
                    color: Color(0xFF690000),
                    size: 20,
                  ),
                  onPressed: onRemove,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                )
              else
                Icon(
                  Icons.arrow_forward_ios_rounded,
                  color: Colors.grey[400],
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
            case 'productionRequirements':
              _productionRequirementsFile = pickedFile;
              break;
            case 'industrialRegister':
              _industrialRegisterFile = pickedFile;
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

    if (_productionRequirementsFile == null) {
      HapticFeedback.mediumImpact();
      EnhancedPopups.showError(
        context: context,
        title: 'تنبيه',
        message: 'من فضلك قم بإرفاق مستلزمات الإنتاج',
      );
      return;
    }

    if (_industrialRegisterFile == null) {
      HapticFeedback.mediumImpact();
      EnhancedPopups.showError(
        context: context,
        title: 'تنبيه',
        message: 'من فضلك قم بإرفاق السجل الصناعي',
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
        clientType: 'factory',
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
          'description': 'العقد - حساب مصنع',
        },
        {
          'file': _taxCardFile!,
          'type': 'tax_card',
          'description': 'البطاقة الضريبية - حساب مصنع',
        },
        {
          'file': _commercialRegisterFile!,
          'type': 'commercial_register',
          'description': 'السجل التجاري - حساب مصنع',
        },
        {
          'file': _valueAddedCertificateFile!,
          'type': 'certificate_vat',
          'description': 'شهادة القيمة المضافة - حساب مصنع',
        },
        {
          'file': _productionRequirementsFile!,
          'type': 'production_requirements',
          'description': 'مستلزمات الإنتاج - حساب مصنع',
        },
        {
          'file': _industrialRegisterFile!,
          'type': 'industrial_register',
          'description': 'السجل الصناعي - حساب مصنع',
        },
      ];

      bool allUploadsSuccessful = true;
      String? failedDocType;

      for (var doc in documentsToUpload) {
        final uploadResult = await ApiService.uploadToS3(
          file: doc['file'],
          category: 'registration',
          documentType: doc['type'],
          description: doc['description'],
          tags: [doc['type'], 'factory', 'registration'],
          userType: 'client',
          clientType: 'factory',
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
