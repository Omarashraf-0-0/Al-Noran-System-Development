import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../core/network/api_service.dart';
import '../../core/services/document_verification_service.dart';
import '../../core/services/notification_service.dart';
import '../../core/widgets/unified_top_bar.dart';
import '../../Pop-ups/al_noran_popups.dart';
import '../../util/file_picker_helper.dart';

class AcidRequestPage extends StatefulWidget {
  final String? userName;
  final String? userEmail;

  const AcidRequestPage({Key? key, this.userName, this.userEmail})
    : super(key: key);

  @override
  State<AcidRequestPage> createState() => _AcidRequestPageState();
}

class _AcidRequestPageState extends State<AcidRequestPage> {
  // Premium Colors
  static const Color primaryDark = Color(0xFF690000);
  static const Color primaryLight = Color(0xFF8B0000);
  static const Color accent = Color(0xFF1BA3B6);
  static const Color bgColor = Color(0xFFF8F9FA);

  // Form controllers - Required fields
  final TextEditingController _itemDescController = TextEditingController();
  final TextEditingController _customsItemController = TextEditingController();

  // Form controllers - Optional fields
  final TextEditingController _weightController = TextEditingController();
  final TextEditingController _supplierNameController = TextEditingController();
  final TextEditingController _countryController = TextEditingController();
  final TextEditingController _taxNumberController = TextEditingController();
  final TextEditingController _supplierPhoneController =
      TextEditingController();
  final TextEditingController _supplierEmailController =
      TextEditingController();

  // State
  bool _isSubmitting = false;
  bool _showSupplierSection = false;

  // Document verification
  final DocumentVerificationService _docVerification =
      DocumentVerificationService();
  bool _isCheckingDocuments = true;
  bool _canSubmitRequests = false;
  String _verificationMessage = '';

  // Selected shipment type
  String selectedType = 'بحري'; // بحري or جوي

  // Uploaded invoice
  String? _uploadedFileName;
  String? _uploadedFileId;

  @override
  void initState() {
    super.initState();
    // Check document verification status
    _checkDocumentStatus();
  }

  Future<void> _checkDocumentStatus({bool forceRefresh = false}) async {
    setState(() => _isCheckingDocuments = true);

    final result = await _docVerification.checkDocumentStatus(
      forceRefresh: forceRefresh,
    );

    if (mounted) {
      setState(() {
        _canSubmitRequests = result['canSubmitRequests'] ?? false;
        _verificationMessage = result['message'] ?? '';
        _isCheckingDocuments = false;
      });
    }
  }

  @override
  void dispose() {
    _weightController.dispose();
    _itemDescController.dispose();
    _supplierNameController.dispose();
    _countryController.dispose();
    _taxNumberController.dispose();
    _supplierPhoneController.dispose();
    _supplierEmailController.dispose();
    _customsItemController.dispose();
    super.dispose();
  }

  Future<void> _pickAndUploadInvoice() async {
    try {
      final result = await FilePickerHelper.pickFile(context);

      if (result == null) return;

      // Show loading
      if (mounted) {
        AlNoranPopups.showLoading(
          context: context,
          message: 'جاري رفع الفاتورة...',
        );
      }

      // Upload to server
      final uploadResult = await ApiService.uploadFile(
        filePath: result.path,
        category: 'acidrequest',
        documentType: 'invoice',
      );

      if (mounted) {
        context.pop(); // Close loading

        if (uploadResult['success'] == true) {
          // Get upload ID from response - try multiple paths
          final upload = uploadResult['upload'] ?? uploadResult['data'];
          final uploadId = upload?['_id'] ?? upload?['id'];

          print('📄 [ACIDReq] Upload response: $uploadResult');
          print('📄 [ACIDReq] Upload ID: $uploadId');

          if (uploadId != null) {
            setState(() {
              _uploadedFileName = result.path.split('/').last;
              if (_uploadedFileName!.contains('\\')) {
                _uploadedFileName = _uploadedFileName!.split('\\').last;
              }
              _uploadedFileId = uploadId.toString();
            });

            AlNoranPopups.showSuccess(
              context: context,
              message: 'تم رفع الفاتورة بنجاح',
            );
          } else {
            // File uploaded but no ID returned - still consider success
            setState(() {
              _uploadedFileName = result.path.split('/').last;
              if (_uploadedFileName!.contains('\\')) {
                _uploadedFileName = _uploadedFileName!.split('\\').last;
              }
              // Use a placeholder ID since upload succeeded
              _uploadedFileId = 'uploaded';
            });

            AlNoranPopups.showSuccess(
              context: context,
              message: 'تم رفع الفاتورة بنجاح',
            );
          }
        } else {
          AlNoranPopups.showError(
            context: context,
            message: uploadResult['message'] ?? 'فشل رفع الفاتورة',
          );
        }
      }
    } catch (e) {
      if (mounted) {
        context.pop(); // Close loading
        AlNoranPopups.showError(
          context: context,
          message: 'حدث خطأ أثناء رفع الفاتورة',
        );
      }
      print('❌ Upload error: $e');
    }
  }

  Future<void> _submitRequest() async {
    // Check document verification first
    if (!_canSubmitRequests) {
      _showDocumentRequiredDialog();
      return;
    }

    // Validate only required fields (customsItem, description, invoice)
    if (_customsItemController.text.trim().isEmpty ||
        _itemDescController.text.trim().isEmpty) {
      HapticFeedback.mediumImpact();
      AlNoranPopups.showError(
        context: context,
        message: 'يرجى ملء البند الجمركي ووصف البضاعة',
      );
      return;
    }

    if (_uploadedFileId == null) {
      HapticFeedback.mediumImpact();
      AlNoranPopups.showError(
        context: context,
        message: 'يرجى رفع الفاتورة المبدئية',
      );
      return;
    }

    setState(() => _isSubmitting = true);
    HapticFeedback.lightImpact();

    try {
      final requestData = {
        'supplier': {
          'name': _supplierNameController.text.trim(),
          'taxNum': _taxNumberController.text.trim(),
          'country': _countryController.text.trim(),
          'email': _supplierEmailController.text.trim(),
          'mobileNum': _supplierPhoneController.text.trim(),
        },
        'goods': {
          'description': _itemDescController.text.trim(),
          'weight':
              _weightController.text.trim().isNotEmpty
                  ? double.tryParse(_weightController.text.trim())
                  : null,
          'customsItem': _customsItemController.text.trim(),
        },
        'uploads': [_uploadedFileId],
        'shipmentType': selectedType,
      };

      final result = await ApiService.createAcidRequest(requestData);

      if (mounted) {
        if (result['success'] == true) {
          HapticFeedback.heavyImpact();
          AlNoranPopups.showSuccess(
            context: context,
            message: 'تم إرسال الطلب بنجاح',
          );

          // Refresh notifications to update badge count
          await NotificationService().refresh();

          // Clear form
          _clearForm();
        } else {
          HapticFeedback.mediumImpact();
          AlNoranPopups.showError(
            context: context,
            message: result['message'] ?? 'فشل إرسال الطلب',
          );
        }
      }
    } catch (e) {
      if (mounted) {
        HapticFeedback.mediumImpact();
        AlNoranPopups.showError(
          context: context,
          message: 'حدث خطأ أثناء إرسال الطلب',
        );
      }
      print('❌ Submit error: $e');
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  /// Show dialog when documents are not verified
  void _showDocumentRequiredDialog([Map<String, dynamic>? result]) {
    // Get document lists from result
    final missingDocs = result?['missingDocuments'] as List? ?? [];
    final pendingDocs = result?['pendingDocuments'] as List? ?? [];
    final rejectedDocs = result?['rejectedDocuments'] as List? ?? [];

    showDialog(
      context: context,
      barrierDismissible: false,
      builder:
          (dialogContext) => PopScope(
            canPop: false,
            onPopInvokedWithResult: (didPop, result) {
              if (!didPop) {
                // When back button is pressed, go to home
                Navigator.pop(dialogContext);
                context.go('/home');
              }
            },
            child: Directionality(
              textDirection: TextDirection.rtl,
              child: Dialog(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    color: Colors.white,
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Header with gradient
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                          vertical: 24,
                          horizontal: 20,
                        ),
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            colors: [Color(0xFF690000), Color(0xFF8B0000)],
                          ),
                          borderRadius: BorderRadius.only(
                            topLeft: Radius.circular(20),
                            topRight: Radius.circular(20),
                          ),
                        ),
                        child: Column(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(50),
                              ),
                              child: const Icon(
                                Icons.folder_off_outlined,
                                color: Colors.white,
                                size: 36,
                              ),
                            ),
                            const SizedBox(height: 14),
                            const Text(
                              'المستندات مطلوبة',
                              style: TextStyle(
                                fontFamily: 'Cairo',
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                            const SizedBox(height: 6),
                            const Text(
                              'لا يمكنك تقديم طلب ACID الآن',
                              style: TextStyle(
                                fontFamily: 'Cairo',
                                fontSize: 13,
                                color: Colors.white70,
                              ),
                            ),
                          ],
                        ),
                      ),
                      // Content
                      ConstrainedBox(
                        constraints: BoxConstraints(
                          maxHeight: MediaQuery.of(context).size.height * 0.4,
                        ),
                        child: SingleChildScrollView(
                          padding: const EdgeInsets.all(20),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'يجب الموافقة على جميع المستندات المطلوبة قبل تقديم الطلب:',
                                style: TextStyle(
                                  fontFamily: 'Cairo',
                                  fontSize: 14,
                                  color: Colors.black87,
                                ),
                              ),
                              const SizedBox(height: 16),

                              // Missing documents
                              if (missingDocs.isNotEmpty) ...[
                                _buildDocumentStatusSection(
                                  'مستندات مفقودة',
                                  missingDocs,
                                  const Color(0xFF690000),
                                  Icons.cancel_outlined,
                                ),
                                const SizedBox(height: 12),
                              ],

                              // Pending documents
                              if (pendingDocs.isNotEmpty) ...[
                                _buildDocumentStatusSection(
                                  'قيد المراجعة',
                                  pendingDocs,
                                  Colors.orange.shade700,
                                  Icons.hourglass_empty,
                                ),
                                const SizedBox(height: 12),
                              ],

                              // Rejected documents
                              if (rejectedDocs.isNotEmpty) ...[
                                _buildDocumentStatusSection(
                                  'مرفوضة - تحتاج إعادة رفع',
                                  rejectedDocs,
                                  Colors.red.shade700,
                                  Icons.highlight_off,
                                ),
                                const SizedBox(height: 12),
                              ],
                            ],
                          ),
                        ),
                      ),
                      // Actions
                      Container(
                        padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                        child: Column(
                          children: [
                            // Primary action - Go to documents
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: () {
                                  Navigator.pop(dialogContext);
                                  // Re-check documents when returning from documents page
                                  context.push('/documents').then((_) {
                                    if (mounted) {
                                      _checkDocumentStatus(forceRefresh: true);
                                    }
                                  });
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF690000),
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 14,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  elevation: 0,
                                ),
                                child: const Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      Icons.folder_open,
                                      color: Colors.white,
                                      size: 20,
                                    ),
                                    SizedBox(width: 10),
                                    Text(
                                      'الذهاب إلى المستندات',
                                      style: TextStyle(
                                        fontFamily: 'Cairo',
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 15,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(height: 10),
                            // Secondary action - Go home
                            SizedBox(
                              width: double.infinity,
                              child: OutlinedButton(
                                onPressed: () {
                                  Navigator.pop(dialogContext);
                                  context.go('/home');
                                },
                                style: OutlinedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 14,
                                  ),
                                  side: BorderSide(color: Colors.grey.shade300),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      Icons.home_outlined,
                                      color: Colors.grey.shade600,
                                      size: 20,
                                    ),
                                    const SizedBox(width: 10),
                                    Text(
                                      'الرجوع للرئيسية',
                                      style: TextStyle(
                                        fontFamily: 'Cairo',
                                        color: Colors.grey.shade600,
                                        fontWeight: FontWeight.w600,
                                        fontSize: 14,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
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

  Widget _buildDocumentStatusSection(
    String title,
    List docs,
    Color color,
    IconData icon,
  ) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 18),
              const SizedBox(width: 8),
              Text(
                title,
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ...docs.map(
            (doc) => Padding(
              padding: const EdgeInsets.only(right: 26, top: 4),
              child: Text(
                '• ${_getDocumentDisplayName(doc.toString())}',
                style: const TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 12,
                  color: Colors.black87,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _getDocumentDisplayName(String docType) {
    final names = {
      'personal_id': 'البطاقة الشخصية',
      'passport': 'جواز السفر',
      'power_of_attorney': 'التوكيل',
      'contract': 'العقد',
      'tax_card': 'البطاقة الضريبية',
      'commercial_register': 'السجل التجاري',
      'certificate_vat': 'شهادة القيمة المضافة',
      'import_export_card': 'بطاقة الاستيراد والتصدير',
      'production_supplies': 'مستلزمات الإنتاج',
      'industrial_register': 'السجل الصناعي',
      'personal_id_of_representative': 'بطاقة المفوض',
      'trade_certificates': 'شهادات المزاولة',
    };
    return names[docType] ?? docType;
  }

  void _clearForm() {
    _weightController.clear();
    _itemDescController.clear();
    _supplierNameController.clear();
    _countryController.clear();
    _taxNumberController.clear();
    _supplierPhoneController.clear();
    _supplierEmailController.clear();
    _customsItemController.clear();
    setState(() {
      _uploadedFileName = null;
      _uploadedFileId = null;
      selectedType = 'بحري';
      _showSupplierSection = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: bgColor,
        body: Column(
          children: [
            UnifiedTopBar(
              showBackButton: true,
              showMenu: false,
              title: 'طلب رقم ACID',
              subtitle: 'تسجيل مسبق للوارد',
              titleIcon: Icons.receipt_long_rounded,
              showWelcome: false,
            ),
            Expanded(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 20),

                      // Shipment Type Toggle
                      _buildPremiumTypeToggle(),

                      const SizedBox(height: 24),

                      // Invoice Upload Section (Required)
                      _buildSectionHeader(
                        'الفاتورة المبدئية',
                        Icons.receipt_rounded,
                        isRequired: true,
                      ),
                      const SizedBox(height: 12),
                      _buildPremiumInvoiceUpload(),

                      const SizedBox(height: 28),

                      // Goods Information Section (Required)
                      _buildSectionHeader(
                        'بيانات البضاعة',
                        Icons.inventory_2_rounded,
                        isRequired: true,
                      ),
                      const SizedBox(height: 12),
                      _buildGoodsSection(),

                      const SizedBox(height: 28),

                      // Supplier Information Section (Optional)
                      _buildSupplierToggle(),
                      if (_showSupplierSection) ...[
                        const SizedBox(height: 12),
                        _buildSupplierInfoBox(),
                        const SizedBox(height: 12),
                        _buildSupplierSection(),
                      ],

                      const SizedBox(height: 32),

                      // Submit Button
                      _buildPremiumSubmitButton(),

                      const SizedBox(height: 32),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(
    String title,
    IconData icon, {
    bool isRequired = false,
  }) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: primaryDark.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: primaryDark, size: 20),
        ),
        const SizedBox(width: 12),
        Text(
          title,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: primaryDark,
            fontFamily: 'Cairo',
          ),
        ),
        if (isRequired) ...[
          const SizedBox(width: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: Colors.red.shade50,
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              'مطلوب',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: Colors.red.shade700,
                fontFamily: 'Cairo',
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildPremiumTypeToggle() {
    return Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: _buildPremiumTypeButton(
              'بحري',
              Icons.directions_boat_rounded,
            ),
          ),
          const SizedBox(width: 6),
          Expanded(child: _buildPremiumTypeButton('جوي', Icons.flight_rounded)),
        ],
      ),
    );
  }

  Widget _buildPremiumTypeButton(String type, IconData icon) {
    final isSelected = selectedType == type;
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        setState(() => selectedType = type);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeInOut,
        height: 60,
        decoration: BoxDecoration(
          gradient:
              isSelected
                  ? LinearGradient(
                    colors: [primaryDark, primaryLight],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  )
                  : null,
          color: isSelected ? null : Colors.transparent,
          borderRadius: BorderRadius.circular(14),
          boxShadow:
              isSelected
                  ? [
                    BoxShadow(
                      color: primaryDark.withValues(alpha: 0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                  ]
                  : null,
        ),
        child: Center(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                color: isSelected ? Colors.white : Colors.grey.shade600,
                size: 24,
              ),
              const SizedBox(width: 10),
              Text(
                type,
                style: TextStyle(
                  color: isSelected ? Colors.white : Colors.grey.shade700,
                  fontSize: 17,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                  fontFamily: 'Cairo',
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPremiumInvoiceUpload() {
    final hasFile = _uploadedFileName != null;
    return GestureDetector(
      onTap: _pickAndUploadInvoice,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient:
              hasFile
                  ? LinearGradient(
                    colors: [Colors.green.shade50, Colors.green.shade100],
                  )
                  : LinearGradient(
                    colors: [
                      accent.withValues(alpha: 0.08),
                      accent.withValues(alpha: 0.15),
                    ],
                  ),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color:
                hasFile ? Colors.green.shade400 : accent.withValues(alpha: 0.4),
            width: 2,
          ),
          boxShadow: [
            BoxShadow(
              color: (hasFile ? Colors.green : accent).withValues(alpha: 0.15),
              blurRadius: 12,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: hasFile ? Colors.green : accent,
                borderRadius: BorderRadius.circular(14),
                boxShadow: [
                  BoxShadow(
                    color: (hasFile ? Colors.green : accent).withValues(
                      alpha: 0.3,
                    ),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Icon(
                hasFile
                    ? Icons.check_circle_rounded
                    : Icons.cloud_upload_rounded,
                color: Colors.white,
                size: 28,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    hasFile
                        ? 'تم الرفع بنجاح ✓'
                        : 'اضغط لرفع الفاتورة المبدئية',
                    style: TextStyle(
                      color:
                          hasFile
                              ? Colors.green.shade700
                              : Colors.grey.shade800,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Cairo',
                    ),
                  ),
                  if (hasFile) ...[
                    const SizedBox(height: 4),
                    Text(
                      _uploadedFileName!,
                      style: TextStyle(
                        color: Colors.grey.shade600,
                        fontSize: 13,
                        fontFamily: 'Cairo',
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ] else ...[
                    const SizedBox(height: 4),
                    Text(
                      'صيغ مدعومة: PDF, صور',
                      style: TextStyle(
                        color: Colors.grey.shade500,
                        fontSize: 12,
                        fontFamily: 'Cairo',
                      ),
                    ),
                  ],
                ],
              ),
            ),
            Icon(
              hasFile ? Icons.edit_rounded : Icons.add_photo_alternate_rounded,
              color: hasFile ? Colors.green.shade600 : accent,
              size: 26,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGoodsSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          _buildPremiumTextField(
            controller: _customsItemController,
            label: 'البند الجمركي',
            placeholder: 'مثال: 8471.30',
            icon: Icons.category_rounded,
            isRequired: true,
          ),
          const SizedBox(height: 16),
          _buildPremiumTextField(
            controller: _itemDescController,
            label: 'وصف البضاعة',
            placeholder: 'أدخل وصف تفصيلي للبضاعة',
            icon: Icons.description_rounded,
            isRequired: true,
            maxLines: 2,
          ),
          const SizedBox(height: 16),
          _buildPremiumTextField(
            controller: _weightController,
            label: 'الوزن المبدئي (كجم)',
            placeholder: '50',
            icon: Icons.scale_rounded,
            keyboardType: TextInputType.number,
            isRequired: false,
          ),
        ],
      ),
    );
  }

  Widget _buildSupplierToggle() {
    return GestureDetector(
      onTap: () {
        HapticFeedback.selectionClick();
        setState(() => _showSupplierSection = !_showSupplierSection);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color:
                _showSupplierSection
                    ? accent.withValues(alpha: 0.5)
                    : Colors.grey.shade200,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color:
                    _showSupplierSection
                        ? accent.withValues(alpha: 0.1)
                        : Colors.grey.shade100,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                Icons.business_rounded,
                color: _showSupplierSection ? accent : Colors.grey.shade600,
                size: 22,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'بيانات المورد (اختياري)',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                      fontFamily: 'Cairo',
                    ),
                  ),
                  Text(
                    'يمكنك إضافة بيانات المورد لاحقاً',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
                      fontFamily: 'Cairo',
                    ),
                  ),
                ],
              ),
            ),
            AnimatedRotation(
              turns: _showSupplierSection ? 0.5 : 0,
              duration: const Duration(milliseconds: 200),
              child: Icon(
                Icons.keyboard_arrow_down_rounded,
                color: _showSupplierSection ? accent : Colors.grey.shade500,
                size: 28,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSupplierInfoBox() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.blue.shade200),
      ),
      child: Row(
        children: [
          Icon(
            Icons.info_outline_rounded,
            color: Colors.blue.shade700,
            size: 22,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'يرجى إدخال بيانات المورد (المستورد) وليس بيانات العميل',
              style: TextStyle(
                fontFamily: 'Cairo',
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: Colors.blue.shade800,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSupplierSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: _buildPremiumTextField(
                  controller: _supplierNameController,
                  label: 'اسم المورد',
                  placeholder: 'الاسم',
                  icon: Icons.person_outline_rounded,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildPremiumTextField(
                  controller: _taxNumberController,
                  label: 'الرقم الضريبي',
                  placeholder: 'الرقم الضريبي',
                  icon: Icons.numbers_rounded,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildPremiumTextField(
                  controller: _countryController,
                  label: 'الدولة',
                  placeholder: 'الدولة',
                  icon: Icons.flag_rounded,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildPremiumTextField(
                  controller: _supplierEmailController,
                  label: 'البريد الإلكتروني',
                  placeholder: 'البريد',
                  icon: Icons.email_rounded,
                  keyboardType: TextInputType.emailAddress,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildPremiumTextField(
            controller: _supplierPhoneController,
            label: 'رقم الهاتف',
            placeholder: '+201234567890',
            icon: Icons.phone_rounded,
            keyboardType: TextInputType.phone,
          ),
        ],
      ),
    );
  }

  Widget _buildPremiumTextField({
    required TextEditingController controller,
    required String label,
    required String placeholder,
    required IconData icon,
    TextInputType? keyboardType,
    bool isRequired = false,
    int maxLines = 1,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: Colors.grey.shade700,
                fontFamily: 'Cairo',
              ),
            ),
            if (isRequired)
              Text(
                ' *',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Colors.red.shade600,
                  fontFamily: 'Cairo',
                ),
              ),
          ],
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: TextField(
            controller: controller,
            textAlign: TextAlign.right,
            textDirection: TextDirection.rtl,
            keyboardType: keyboardType,
            maxLines: maxLines,
            style: const TextStyle(
              fontSize: 15,
              fontFamily: 'Cairo',
              fontWeight: FontWeight.w500,
            ),
            decoration: InputDecoration(
              hintText: placeholder,
              hintStyle: TextStyle(
                color: Colors.grey.shade400,
                fontSize: 14,
                fontFamily: 'Cairo',
              ),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 14,
              ),
              suffixIcon: Icon(icon, color: Colors.grey.shade400, size: 22),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPremiumSubmitButton() {
    return Container(
      width: double.infinity,
      height: 60,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors:
              _isSubmitting
                  ? [Colors.grey.shade400, Colors.grey.shade500]
                  : [primaryDark, primaryLight],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(18),
        boxShadow:
            _isSubmitting
                ? []
                : [
                  BoxShadow(
                    color: primaryDark.withValues(alpha: 0.4),
                    blurRadius: 15,
                    offset: const Offset(0, 6),
                  ),
                ],
      ),
      child: ElevatedButton(
        onPressed: _isSubmitting ? null : _submitRequest,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          foregroundColor: Colors.white,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
        ),
        child:
            _isSubmitting
                ? Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2.5,
                      ),
                    ),
                    const SizedBox(width: 14),
                    const Text(
                      'جاري الإرسال...',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Cairo',
                      ),
                    ),
                  ],
                )
                : Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.send_rounded, size: 24),
                    const SizedBox(width: 12),
                    const Text(
                      'إرسال الطلب',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Cairo',
                      ),
                    ),
                  ],
                ),
      ),
    );
  }
}
