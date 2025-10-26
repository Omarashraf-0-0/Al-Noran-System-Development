import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../Pop-ups/al_noran_popups.dart';
import '../../core/network/api_service.dart';
import '../../util/validators.dart';

class PersonalRegistrationPage extends StatefulWidget {
  final Map<String, dynamic> userData;

  const PersonalRegistrationPage({Key? key, required this.userData})
    : super(key: key);

  @override
  State<PersonalRegistrationPage> createState() =>
      _PersonalRegistrationPageState();
}

class _PersonalRegistrationPageState extends State<PersonalRegistrationPage> {
  final TextEditingController _nationalIdController = TextEditingController();
  File? _powerOfAttorneyFile;
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
            'التسجيل - حساب شخصي',
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
                      Icons.person_outline,
                      size: 50,
                      color: Color(0xFF690000),
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // Title
                const Text(
                  'إكمال بيانات الحساب الشخصي',
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
                  'يرجى إدخال رقمك القومي وإرفاق التوكيل',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14,
                    fontFamily: 'Cairo',
                    color: Colors.grey,
                  ),
                ),
                const SizedBox(height: 32),

                // National ID Field
                _buildTextField(
                  controller: _nationalIdController,
                  hint: 'الرقم القومي (14 رقم)',
                  icon: Icons.credit_card,
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 24),

                // Power of Attorney Upload
                _buildDocumentUpload(
                  title: 'التوكيل',
                  subtitle: 'صورة أو ملف PDF للتوكيل',
                  file: _powerOfAttorneyFile,
                  onTap: _pickPowerOfAttorney,
                  onRemove: () {
                    setState(() {
                      _powerOfAttorneyFile = null;
                    });
                  },
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
                          'سيتم مراجعة المستندات المرفوعة وتفعيل حسابك خلال 24 ساعة',
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

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    TextInputType? keyboardType,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF5F5F5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE0E0E0), width: 1),
      ),
      child: TextField(
        controller: controller,
        textAlign: TextAlign.right,
        keyboardType: keyboardType,
        style: const TextStyle(fontFamily: 'Cairo', fontSize: 15),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(
            color: Color(0xFFBDBDBD),
            fontFamily: 'Cairo',
            fontSize: 14,
          ),
          prefixIcon: Icon(icon, color: const Color(0xFF690000), size: 22),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 16,
          ),
        ),
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

  Future<void> _pickPowerOfAttorney() async {
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
            _powerOfAttorneyFile = File(pickedFile.path);
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
    // Validation
    if (_nationalIdController.text.trim().isEmpty) {
      AlNoranPopups.showError(
        context: context,
        message: 'من فضلك أدخل الرقم القومي',
      );
      return;
    }

    // Egyptian National ID validation
    if (!AlNoranValidators.isValidEgyptianNationalId(
      _nationalIdController.text,
    )) {
      AlNoranPopups.showError(
        context: context,
        message: AlNoranValidators.getNationalIdErrorMessage(
          _nationalIdController.text,
        ),
      );
      return;
    }

    if (_powerOfAttorneyFile == null) {
      AlNoranPopups.showError(
        context: context,
        message: 'من فضلك قم بإرفاق التوكيل',
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
        clientType: 'personal',
        ssn: _nationalIdController.text.trim(),
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
        // Upload power of attorney document
        final uploadResult = await ApiService.uploadDocument(
          file: _powerOfAttorneyFile!,
          uploadType: 'users',
          userId: userId,
          relatedTo: {'model': 'User', 'id': userId},
          description: 'التوكيل - حساب شخصي',
          tags: ['power_of_attorney', 'personal', 'registration'],
        );

        setState(() {
          _isLoading = false;
        });

        if (uploadResult['success']) {
          await AlNoranPopups.showSuccess(
            context: context,
            title: 'تم التسجيل بنجاح',
            message:
                'تم إنشاء حسابك بنجاح. سيتم مراجعة المستندات وتفعيل حسابك خلال 24 ساعة',
          );

          if (mounted) {
            // Navigate to login page
            Navigator.of(
              context,
            ).pushNamedAndRemoveUntil('/login', (route) => false);
          }
        } else {
          AlNoranPopups.showError(
            context: context,
            message:
                'تم إنشاء الحساب ولكن فشل رفع التوكيل. يرجى المحاولة مرة أخرى',
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

  @override
  void dispose() {
    _nationalIdController.dispose();
    super.dispose();
  }
}
