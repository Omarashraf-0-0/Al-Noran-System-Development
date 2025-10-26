import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../Pop-ups/al_noran_popups.dart';
import '../../core/network/api_service.dart';

class CommercialRegistrationPage extends StatefulWidget {
  final Map<String, dynamic> userData;

  const CommercialRegistrationPage({Key? key, required this.userData})
    : super(key: key);

  @override
  State<CommercialRegistrationPage> createState() =>
      _CommercialRegistrationPageState();
}

class _CommercialRegistrationPageState
    extends State<CommercialRegistrationPage> {
  File? _contractFile; // العقد
  File? _taxCardFile; // البطاقة الضريبية
  File? _commercialRegisterFile; // السجل التجاري
  File? _valueAddedCertificateFile; // شهادة القيمة المضافة
  File? _importCertificateFile; // الشهادة الاستيرادية
  File? _exportCardFile; // بطاقة التصدير (اختياري)

  final ImagePicker _picker = ImagePicker();
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
            'التسجيل - حساب تجاري',
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
                      Icons.business,
                      size: 50,
                      color: Color(0xFF690000),
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // Title
                const Text(
                  'إكمال بيانات الحساب التجاري',
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
                  title: 'الشهادة الاستيرادية *',
                  subtitle: 'صورة أو ملف PDF للشهادة الاستيرادية',
                  file: _importCertificateFile,
                  onTap: () => _pickFile('importCertificate'),
                  onRemove: () => setState(() => _importCertificateFile = null),
                ),
                const SizedBox(height: 24),

                // Optional Documents
                _buildSectionTitle('مستندات اختيارية'),
                const SizedBox(height: 16),

                _buildDocumentUpload(
                  title: 'بطاقة التصدير (اختياري)',
                  subtitle: 'صورة أو ملف PDF لبطاقة التصدير',
                  file: _exportCardFile,
                  onTap: () => _pickFile('exportCard'),
                  onRemove: () => setState(() => _exportCardFile = null),
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
    // Show bottom sheet to choose between camera or gallery
    final ImageSource? source = await showModalBottomSheet<ImageSource>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (BuildContext context) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(20),
              topRight: Radius.circular(20),
            ),
          ),
          child: SafeArea(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const SizedBox(height: 16),
                Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 24),
                const Text(
                  'اختر طريقة رفع الملف',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Cairo',
                    color: Color(0xFF690000),
                  ),
                ),
                const SizedBox(height: 24),
                ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1ba3b6).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(
                      Icons.camera_alt,
                      color: Color(0xFF1ba3b6),
                      size: 28,
                    ),
                  ),
                  title: const Text(
                    'التقاط صورة',
                    style: TextStyle(
                      fontSize: 16,
                      fontFamily: 'Cairo',
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  onTap: () => Navigator.pop(context, ImageSource.camera),
                ),
                ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFF690000).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(
                      Icons.photo_library,
                      color: Color(0xFF690000),
                      size: 28,
                    ),
                  ),
                  title: const Text(
                    'اختيار من المعرض',
                    style: TextStyle(
                      fontSize: 16,
                      fontFamily: 'Cairo',
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  onTap: () => Navigator.pop(context, ImageSource.gallery),
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        );
      },
    );

    if (source != null) {
      try {
        final XFile? pickedFile = await _picker.pickImage(
          source: source,
          imageQuality: 80,
        );

        if (pickedFile != null) {
          setState(() {
            switch (fileType) {
              case 'contract':
                _contractFile = File(pickedFile.path);
                break;
              case 'taxCard':
                _taxCardFile = File(pickedFile.path);
                break;
              case 'commercialRegister':
                _commercialRegisterFile = File(pickedFile.path);
                break;
              case 'valueAddedCertificate':
                _valueAddedCertificateFile = File(pickedFile.path);
                break;
              case 'importCertificate':
                _importCertificateFile = File(pickedFile.path);
                break;
              case 'exportCard':
                _exportCardFile = File(pickedFile.path);
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
  }

  Future<void> _handleSubmit() async {
    // Validation - check required documents
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

    if (_importCertificateFile == null) {
      AlNoranPopups.showError(
        context: context,
        message: 'من فضلك قم بإرفاق الشهادة الاستيرادية',
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
        clientType: 'commercial',
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

      // Get user ID from response
      final userId = registerResult['data']?['user']?['_id'];

      if (userId != null) {
        // Upload all required documents
        final List<Map<String, dynamic>> documentsToUpload = [
          {
            'file': _contractFile!,
            'description': 'العقد - حساب تجاري',
            'tags': ['contract', 'commercial', 'registration'],
          },
          {
            'file': _taxCardFile!,
            'description': 'البطاقة الضريبية - حساب تجاري',
            'tags': ['tax_card', 'commercial', 'registration'],
          },
          {
            'file': _commercialRegisterFile!,
            'description': 'السجل التجاري - حساب تجاري',
            'tags': ['commercial_register', 'commercial', 'registration'],
          },
          {
            'file': _valueAddedCertificateFile!,
            'description': 'شهادة القيمة المضافة - حساب تجاري',
            'tags': ['value_added_certificate', 'commercial', 'registration'],
          },
          {
            'file': _importCertificateFile!,
            'description': 'الشهادة الاستيرادية - حساب تجاري',
            'tags': ['import_certificate', 'commercial', 'registration'],
          },
        ];

        // Add optional export card if provided
        if (_exportCardFile != null) {
          documentsToUpload.add({
            'file': _exportCardFile!,
            'description': 'بطاقة التصدير - حساب تجاري',
            'tags': ['export_card', 'commercial', 'registration', 'optional'],
          });
        }

        // Upload documents
        bool allUploadsSuccessful = true;
        for (var doc in documentsToUpload) {
          final uploadResult = await ApiService.uploadDocument(
            file: doc['file'],
            uploadType: 'users',
            userId: userId,
            relatedTo: {'model': 'User', 'id': userId},
            description: doc['description'],
            tags: List<String>.from(doc['tags']),
          );

          if (!uploadResult['success']) {
            allUploadsSuccessful = false;
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
                'تم إنشاء حسابك التجاري بنجاح. سيتم مراجعة المستندات وتفعيل حسابك خلال 24-48 ساعة',
          );

          if (mounted) {
            Navigator.of(
              context,
            ).pushNamedAndRemoveUntil('/login', (route) => false);
          }
        } else {
          AlNoranPopups.showError(
            context: context,
            message:
                'تم إنشاء الحساب ولكن فشل رفع بعض المستندات. يرجى المحاولة مرة أخرى',
          );
        }
      } else {
        setState(() {
          _isLoading = false;
        });
        AlNoranPopups.showError(
          context: context,
          message: 'حدث خطأ أثناء إنشاء الحساب',
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
