import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/network/api_service.dart';
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
  // Colors
  static const Color primaryDark = Color(0xFF690000);
  static const Color accent = Color(0xFF1BA3B6);

  // Form controllers
  final TextEditingController _weightController = TextEditingController();
  final TextEditingController _itemDescController = TextEditingController();
  final TextEditingController _supplierNameController = TextEditingController();
  final TextEditingController _countryController = TextEditingController();
  final TextEditingController _taxNumberController = TextEditingController();
  final TextEditingController _supplierPhoneController =
      TextEditingController();
  final TextEditingController _supplierEmailController =
      TextEditingController();
  final TextEditingController _customsItemController = TextEditingController();

  // State
  bool _isSubmitting = false;

  // Selected shipment type
  String selectedType = 'بحري'; // بحري or جوي

  // Uploaded invoice
  String? _uploadedFileName;
  String? _uploadedFileId;

  @override
  void initState() {
    super.initState();
    // No need to load user data - UnifiedTopBar handles it
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
    // Validate
    if (_supplierNameController.text.trim().isEmpty ||
        _taxNumberController.text.trim().isEmpty ||
        _countryController.text.trim().isEmpty ||
        _supplierEmailController.text.trim().isEmpty ||
        _supplierPhoneController.text.trim().isEmpty ||
        _itemDescController.text.trim().isEmpty ||
        _weightController.text.trim().isEmpty ||
        _customsItemController.text.trim().isEmpty) {
      AlNoranPopups.showError(
        context: context,
        message: 'يرجى ملء جميع الحقول المطلوبة',
      );
      return;
    }

    if (_uploadedFileId == null) {
      AlNoranPopups.showError(
        context: context,
        message: 'يرجى رفع الفاتورة المبدئية',
      );
      return;
    }

    setState(() => _isSubmitting = true);

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
          'weight': double.parse(_weightController.text.trim()),
          'customsItem': _customsItemController.text.trim(),
        },
        'uploads': [_uploadedFileId],
        'shipmentType': selectedType,
      };

      final result = await ApiService.createAcidRequest(requestData);

      if (mounted) {
        if (result['success'] == true) {
          AlNoranPopups.showSuccess(
            context: context,
            message: 'تم إرسال الطلب بنجاح',
          );

          // Clear form
          _clearForm();
        } else {
          AlNoranPopups.showError(
            context: context,
            message: result['message'] ?? 'فشل إرسال الطلب',
          );
        }
      }
    } catch (e) {
      if (mounted) {
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
    });
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: const Color(0xFFF5F5F5),
        body: Column(
          children: [
            UnifiedTopBar(showBackButton: true, showMenu: false),
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    const SizedBox(height: 24),

                    // Logo and Title
                    _buildHeader(),

                    const SizedBox(height: 24),

                    // Shipment Type Toggle
                    _buildTypeToggle(),

                    const SizedBox(height: 24),

                    // Invoice Upload Section
                    _buildInvoiceUpload(),

                    const SizedBox(height: 16),

                    // Form Fields
                    _buildFormFields(),

                    const SizedBox(height: 32),

                    // Submit Button
                    _buildSubmitButton(),

                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
          colors: [primaryDark, primaryDark.withOpacity(0.8)],
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: primaryDark.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(
              Icons.receipt_long,
              color: Colors.white,
              size: 36,
            ),
          ),
          const SizedBox(width: 16),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'طلب رقم ACID',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                    fontFamily: 'Cairo',
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  'املأ البيانات المطلوبة بدقة',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.white70,
                    fontFamily: 'Cairo',
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTypeToggle() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: Colors.grey[200],
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            Expanded(child: _buildTypeButton('جوي', Icons.flight)),
            const SizedBox(width: 4),
            Expanded(child: _buildTypeButton('بحري', Icons.directions_boat)),
          ],
        ),
      ),
    );
  }

  Widget _buildTypeButton(String type, IconData icon) {
    final isSelected = selectedType == type;
    return GestureDetector(
      onTap: () {
        setState(() {
          selectedType = type;
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        height: 56,
        decoration: BoxDecoration(
          gradient:
              isSelected
                  ? LinearGradient(
                    colors: [primaryDark, primaryDark.withOpacity(0.8)],
                  )
                  : null,
          color: isSelected ? null : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          boxShadow:
              isSelected
                  ? [
                    BoxShadow(
                      color: primaryDark.withOpacity(0.3),
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
                color: isSelected ? Colors.white : Colors.grey[600],
                size: 22,
              ),
              const SizedBox(width: 8),
              Text(
                type,
                style: TextStyle(
                  color: isSelected ? Colors.white : Colors.grey[700],
                  fontSize: 16,
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

  Widget _buildInvoiceUpload() {
    final hasFile = _uploadedFileName != null;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.receipt, color: primaryDark, size: 20),
              const SizedBox(width: 8),
              const Text(
                'فاتورة مبدأية',
                textAlign: TextAlign.right,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: primaryDark,
                  fontFamily: 'Cairo',
                ),
              ),
              const SizedBox(width: 4),
              const Text(
                '*',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.red,
                  fontFamily: 'Cairo',
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          GestureDetector(
            onTap: _pickAndUploadInvoice,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient:
                    hasFile
                        ? LinearGradient(
                          colors: [Colors.green.shade50, Colors.green.shade100],
                        )
                        : LinearGradient(
                          colors: [
                            accent.withOpacity(0.05),
                            accent.withOpacity(0.1),
                          ],
                        ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: hasFile ? Colors.green : accent.withOpacity(0.3),
                  width: 2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: (hasFile ? Colors.green : accent).withOpacity(0.1),
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
                      color: hasFile ? Colors.green : accent,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      hasFile ? Icons.check_circle : Icons.upload_file,
                      color: Colors.white,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          hasFile ? 'تم الرفع بنجاح' : 'اضغط لرفع الفاتورة',
                          textAlign: TextAlign.right,
                          style: TextStyle(
                            color:
                                hasFile
                                    ? Colors.green.shade700
                                    : Colors.grey[700],
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Cairo',
                          ),
                        ),
                        if (hasFile) ...[
                          const SizedBox(height: 4),
                          Text(
                            _uploadedFileName!,
                            textAlign: TextAlign.right,
                            style: TextStyle(
                              color: Colors.grey[600],
                              fontSize: 12,
                              fontFamily: 'Cairo',
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Icon(
                    Icons.camera_alt,
                    color: hasFile ? Colors.green : accent,
                    size: 22,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFormFields() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: _buildTextField(
                  controller: _weightController,
                  label: 'الوزن المبدئي *',
                  placeholder: '50',
                  icon: Icons.scale,
                  keyboardType: TextInputType.number,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildTextField(
                  controller: _itemDescController,
                  label: 'وصف البضاعة *',
                  placeholder: 'وصف البضاعة',
                  icon: Icons.info_outline,
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          Row(
            children: [
              Expanded(
                child: _buildTextField(
                  controller: _customsItemController,
                  label: 'بند جمركي *',
                  placeholder: 'بند رقم 21',
                  icon: Icons.assignment_outlined,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildTextField(
                  controller: _supplierNameController,
                  label: 'اسم المورد *',
                  placeholder: 'اسم المورد',
                  icon: Icons.person_outline,
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          Row(
            children: [
              Expanded(
                child: _buildTextField(
                  controller: _taxNumberController,
                  label: 'الرقم الضريبي *',
                  placeholder: 'الرقم الضريبي',
                  icon: Icons.numbers,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildTextField(
                  controller: _countryController,
                  label: 'الدولة *',
                  placeholder: 'الدولة',
                  icon: Icons.flag_outlined,
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          Row(
            children: [
              Expanded(
                child: _buildTextField(
                  controller: _supplierEmailController,
                  label: 'ايميل المورد *',
                  placeholder: 'ايميل المورد',
                  icon: Icons.email_outlined,
                  keyboardType: TextInputType.emailAddress,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildTextField(
                  controller: _supplierPhoneController,
                  label: 'رقم تليفون المورد *',
                  placeholder: 'رقم تليفون المورد',
                  icon: Icons.phone_outlined,
                  keyboardType: TextInputType.phone,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String placeholder,
    required IconData icon,
    TextInputType? keyboardType,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: primaryDark, size: 16),
            const SizedBox(width: 6),
            Text(
              label.replaceAll(' *', ''),
              textAlign: TextAlign.right,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: primaryDark,
                fontFamily: 'Cairo',
              ),
            ),
            if (label.contains('*'))
              const Text(
                ' *',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Colors.red,
                  fontFamily: 'Cairo',
                ),
              ),
          ],
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey[300]!),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.03),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: TextField(
            controller: controller,
            textAlign: TextAlign.right,
            textDirection: TextDirection.rtl,
            keyboardType: keyboardType,
            style: const TextStyle(
              fontSize: 14,
              fontFamily: 'Cairo',
              fontWeight: FontWeight.w500,
            ),
            decoration: InputDecoration(
              hintText: placeholder,
              hintStyle: TextStyle(
                color: Colors.grey[400],
                fontSize: 13,
                fontFamily: 'Cairo',
              ),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 16,
              ),
              suffixIcon: Icon(icon, color: Colors.grey[400], size: 20),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSubmitButton() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Container(
        width: double.infinity,
        height: 60,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors:
                _isSubmitting
                    ? [Colors.grey, Colors.grey.shade400]
                    : [primaryDark, primaryDark.withOpacity(0.8)],
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow:
              _isSubmitting
                  ? []
                  : [
                    BoxShadow(
                      color: primaryDark.withOpacity(0.4),
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
              borderRadius: BorderRadius.circular(16),
            ),
          ),
          child:
              _isSubmitting
                  ? const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2.5,
                        ),
                      ),
                      SizedBox(width: 12),
                      Text(
                        'جاري الإرسال...',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'Cairo',
                        ),
                      ),
                    ],
                  )
                  : const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'إرسال الطلب',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'Cairo',
                        ),
                      ),
                      SizedBox(width: 12),
                      Icon(Icons.send, size: 22),
                    ],
                  ),
        ),
      ),
    );
  }
}
