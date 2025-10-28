import 'dart:io';
import 'package:flutter/material.dart';
import '../../Pop-ups/al_noran_popups.dart';
import '../../core/network/api_service.dart';
import '../../util/file_picker_helper.dart'; // FilePickerHelper for PDF support

class FactoryRegistrationPage extends StatefulWidget {
  final Map<String, dynamic> userData;

  const FactoryRegistrationPage({Key? key, required this.userData})
    : super(key: key);

  @override
  State<FactoryRegistrationPage> createState() =>
      _FactoryRegistrationPageState();
}

class _FactoryRegistrationPageState extends State<FactoryRegistrationPage> {
  File? _contractFile; // العقد
  File? _taxCardFile; // البطاقة الضريبية
  File? _commercialRegisterFile; // السجل التجاري
  File? _valueAddedCertificateFile; // شهادة القيمة المضافة
  File? _productionRequirementsFile; // مستلزمات الإنتاج
  File? _industrialRegisterFile; // السجل الصناعي

  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: Colors.white,
        appBar: AppBar(
          backgroundColor: const Color(0xFF690000),
          elevation: 0,
          title: const Text(
            'التسجيل - حساب مصنع',
            style: TextStyle(
              fontFamily: 'Cairo',
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          centerTitle: true,
          leading: IconButton(
            icon: const Icon(Icons.arrow_forward, color: Colors.white),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        body: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Icon
                Center(
                  child: Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      color: const Color(0xFF690000).withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.factory,
                      size: 50,
                      color: Color(0xFF690000),
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // Title
                const Text(
                  'إكمال بيانات حساب المصنع',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Cairo',
                    color: Color(0xFF690000),
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'يرجى إرفاق المستندات المطلوبة',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14,
                    fontFamily: 'Cairo',
                    color: Colors.grey,
                  ),
                ),
                const SizedBox(height: 32),

                // Required Documents
                _buildSectionTitle('المستندات المطلوبة'),
                const SizedBox(height: 16),

                _buildDocumentUpload(
                  title: 'العقد *',
                  subtitle: 'صورة أو ملف PDF للعقد',
                  file: _contractFile,
                  onTap: () => _pickFile('contract'),
                  onRemove: () => setState(() => _contractFile = null),
                ),
                const SizedBox(height: 16),

                _buildDocumentUpload(
                  title: 'البطاقة الضريبية *',
                  subtitle: 'صورة أو ملف PDF للبطاقة الضريبية',
                  file: _taxCardFile,
                  onTap: () => _pickFile('taxCard'),
                  onRemove: () => setState(() => _taxCardFile = null),
                ),
                const SizedBox(height: 16),

                _buildDocumentUpload(
                  title: 'السجل التجاري *',
                  subtitle: 'صورة أو ملف PDF للسجل التجاري',
                  file: _commercialRegisterFile,
                  onTap: () => _pickFile('commercialRegister'),
                  onRemove:
                      () => setState(() => _commercialRegisterFile = null),
                ),
                const SizedBox(height: 16),

                _buildDocumentUpload(
                  title: 'شهادة القيمة المضافة *',
                  subtitle: 'صورة أو ملف PDF لشهادة القيمة المضافة',
                  file: _valueAddedCertificateFile,
                  onTap: () => _pickFile('valueAddedCertificate'),
                  onRemove:
                      () => setState(() => _valueAddedCertificateFile = null),
                ),
                const SizedBox(height: 16),

                _buildDocumentUpload(
                  title: 'مستلزمات الإنتاج *',
                  subtitle: 'صورة أو ملف PDF لمستلزمات الإنتاج',
                  file: _productionRequirementsFile,
                  onTap: () => _pickFile('productionRequirements'),
                  onRemove:
                      () => setState(() => _productionRequirementsFile = null),
                ),
                const SizedBox(height: 16),

                _buildDocumentUpload(
                  title: 'السجل الصناعي *',
                  subtitle: 'صورة أو ملف PDF للسجل الصناعي',
                  file: _industrialRegisterFile,
                  onTap: () => _pickFile('industrialRegister'),
                  onRemove:
                      () => setState(() => _industrialRegisterFile = null),
                ),
                const SizedBox(height: 32),

                // Submit Button
                ElevatedButton(
                  onPressed: _isLoading ? null : _handleSubmit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF690000),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 2,
                  ),
                  child:
                      _isLoading
                          ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                          : const Text(
                            'إتمام التسجيل',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'Cairo',
                              color: Colors.white,
                            ),
                          ),
                ),
                const SizedBox(height: 16),

                // Info Box
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1ba3b6).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: const Color(0xFF1ba3b6).withOpacity(0.3),
                      width: 1,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.info_outline,
                        color: const Color(0xFF1ba3b6),
                        size: 24,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'سيتم مراجعة المستندات المرفوعة وتفعيل حسابك خلال 24-48 ساعة',
                          style: TextStyle(
                            fontSize: 13,
                            fontFamily: 'Cairo',
                            color: const Color(0xFF1ba3b6),
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
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.bold,
        fontFamily: 'Cairo',
        color: Color(0xFF690000),
      ),
    );
  }

  Widget _buildDocumentUpload({
    required String title,
    required String subtitle,
    required File? file,
    required VoidCallback onTap,
    required VoidCallback onRemove,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF5F5F5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color:
              file != null ? const Color(0xFF1ba3b6) : const Color(0xFFE0E0E0),
          width: 1,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color:
                        file != null
                            ? const Color(0xFF1ba3b6).withOpacity(0.1)
                            : const Color(0xFF690000).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    file != null ? Icons.check_circle : Icons.upload_file,
                    color:
                        file != null
                            ? const Color(0xFF1ba3b6)
                            : const Color(0xFF690000),
                    size: 28,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'Cairo',
                          color: Color(0xFF424242),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        file != null ? file.path.split('/').last : subtitle,
                        style: TextStyle(
                          fontSize: 13,
                          fontFamily: 'Cairo',
                          color:
                              file != null
                                  ? const Color(0xFF1ba3b6)
                                  : const Color(0xFFBDBDBD),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                if (file != null)
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.red, size: 20),
                    onPressed: onRemove,
                  )
                else
                  const Icon(
                    Icons.arrow_back_ios,
                    color: Color(0xFFBDBDBD),
                    size: 16,
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _pickFile(String fileType) async {
    try {
      // استخدام FilePickerHelper الجديد اللي بيدعم PDF
      final File? pickedFile = await FilePickerHelper.pickFile(context);

      if (pickedFile != null) {
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
      AlNoranPopups.showError(
        context: context,
        message: 'حدث خطأ أثناء اختيار الملف',
      );
    }
  }

  Future<void> _handleSubmit() async {
    // Validation - check all required documents
    if (_contractFile == null) {
      AlNoranPopups.showError(
        context: context,
        message: 'من فضلك قم بإرفاق العقد',
      );
      return;
    }

    if (_taxCardFile == null) {
      AlNoranPopups.showError(
        context: context,
        message: 'من فضلك قم بإرفاق البطاقة الضريبية',
      );
      return;
    }

    if (_commercialRegisterFile == null) {
      AlNoranPopups.showError(
        context: context,
        message: 'من فضلك قم بإرفاق السجل التجاري',
      );
      return;
    }

    if (_valueAddedCertificateFile == null) {
      AlNoranPopups.showError(
        context: context,
        message: 'من فضلك قم بإرفاق شهادة القيمة المضافة',
      );
      return;
    }

    if (_productionRequirementsFile == null) {
      AlNoranPopups.showError(
        context: context,
        message: 'من فضلك قم بإرفاق مستلزمات الإنتاج',
      );
      return;
    }

    if (_industrialRegisterFile == null) {
      AlNoranPopups.showError(
        context: context,
        message: 'من فضلك قم بإرفاق السجل الصناعي',
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      // First, create the user account
      final registerResult = await ApiService.register(
        name: widget.userData['name'],
        username: widget.userData['username'],
        email: widget.userData['email'],
        phone: widget.userData['phone'],
        password: widget.userData['password'],
        clientType: 'factory',
      );

      if (!registerResult['success']) {
        setState(() {
          _isLoading = false;
        });
        AlNoranPopups.showError(
          context: context,
          message: registerResult['message'] ?? 'فشل إنشاء الحساب',
        );
        return;
      }

      // JWT Token is automatically saved by ApiService.register
      // Now upload all required documents to S3

      // Prepare documents list with their metadata
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
          'type': 'certificate_vat', // Fixed: match backend enum
          'description': 'شهادة القيمة المضافة - حساب مصنع',
        },
        {
          'file': _productionRequirementsFile!,
          'type': 'production_supplies', // Fixed: match backend enum
          'description': 'مستلزمات الإنتاج - حساب مصنع',
        },
        {
          'file': _industrialRegisterFile!,
          'type': 'industrial_register',
          'description': 'السجل الصناعي - حساب مصنع',
        },
      ];

      // Upload documents to S3
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

      setState(() {
        _isLoading = false;
      });

      if (allUploadsSuccessful) {
        await AlNoranPopups.showSuccess(
          context: context,
          title: 'تم التسجيل بنجاح',
          message:
              'تم إنشاء حساب المصنع وتحميل جميع المستندات إلى السحابة بنجاح. سيتم مراجعة حسابك وتفعيله خلال 24-48 ساعة',
        );

        if (mounted) {
          Navigator.of(
            context,
          ).pushNamedAndRemoveUntil('/login', (route) => false);
        }
      } else {
        AlNoranPopups.showError(
          context: context,
          title: 'تحذير',
          message:
              'تم إنشاء الحساب ولكن فشل رفع مستند: $failedDocType. يرجى تسجيل الدخول ورفع المستند من الإعدادات',
        );
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      AlNoranPopups.showError(
        context: context,
        title: 'خطأ في الاتصال',
        message: 'حدث خطأ أثناء الاتصال بالسيرفر. يرجى المحاولة مرة أخرى',
      );
    }
  }
}
