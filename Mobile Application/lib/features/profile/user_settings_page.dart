import 'package:flutter/material.dart';
import '../../Pop-ups/al_noran_popups.dart';
import '../../core/network/api_service.dart';
import '../../core/storage/secure_storage.dart';

class UserSettingsPage extends StatefulWidget {
  const UserSettingsPage({Key? key}) : super(key: key);

  @override
  State<UserSettingsPage> createState() => _UserSettingsPageState();
}

class _UserSettingsPageState extends State<UserSettingsPage> {
  final _formKey = GlobalKey<FormState>();

  // Text Controllers
  final TextEditingController _fullnameController = TextEditingController();
  final TextEditingController _usernameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _nationalIdController = TextEditingController();

  Map<String, dynamic>? _userData;
  bool _isLoading = true;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  @override
  void dispose() {
    _fullnameController.dispose();
    _usernameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _nationalIdController.dispose();
    super.dispose();
  }

  Future<void> _loadUserData() async {
    try {
      setState(() => _isLoading = true);

      final userDataJson = await SecureStorage.getUserData();
      if (userDataJson != null) {
        setState(() => _userData = userDataJson);

        // Fill text controllers
        _fullnameController.text = _userData?['fullname'] ?? '';
        _usernameController.text = _userData?['username'] ?? '';
        _emailController.text = _userData?['email'] ?? '';
        _phoneController.text = _userData?['phone'] ?? '';
        _nationalIdController.text = _userData?['nationalId'] ?? '';
      }

      setState(() => _isLoading = false);
    } catch (e) {
      print('Error loading user data: $e');
      setState(() => _isLoading = false);
      AlNoranPopups.showError(
        context: context,
        message: 'حدث خطأ في تحميل البيانات',
      );
    }
  }

  Future<void> _saveUserData() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);

    try {
      final userId = _userData?['_id'] ?? _userData?['id'];

      print('💾 [UserSettings] Saving user data...');
      print('💾 [UserSettings] User ID: $userId');
      print('💾 [UserSettings] Fullname: ${_fullnameController.text.trim()}');
      print('💾 [UserSettings] Email: ${_emailController.text.trim()}');
      print('💾 [UserSettings] Phone: ${_phoneController.text.trim()}');

      final response = await ApiService.updateUserProfile(
        userId: userId,
        fullname: _fullnameController.text.trim(),
        email: _emailController.text.trim(),
        phone: _phoneController.text.trim(),
        nationalId:
            _nationalIdController.text.trim().isNotEmpty
                ? _nationalIdController.text.trim()
                : null,
      );

      print('💾 [UserSettings] Response: $response');

      if (response['success'] == true) {
        // Update local storage
        _userData?['fullname'] = _fullnameController.text.trim();
        _userData?['email'] = _emailController.text.trim();
        _userData?['phone'] = _phoneController.text.trim();
        if (_nationalIdController.text.trim().isNotEmpty) {
          _userData?['nationalId'] = _nationalIdController.text.trim();
        }
        await SecureStorage.saveUserData(_userData!);

        print('✅ [UserSettings] Data saved successfully');

        if (mounted) {
          AlNoranPopups.showSuccess(
            context: context,
            message: 'تم تحديث البيانات بنجاح',
            onPressed: () => Navigator.pop(context),
          );
        }
      } else {
        throw Exception(response['message'] ?? 'فشل التحديث');
      }
    } catch (e) {
      print('❌ [UserSettings] Error: $e');
      if (mounted) {
        AlNoranPopups.showError(
          context: context,
          message: 'حدث خطأ أثناء تحديث البيانات: ${e.toString()}',
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: const Color(0xFFF5F5F5),
        appBar: AppBar(
          backgroundColor: const Color(0xFF690000),
          elevation: 0,
          title: const Text(
            'إعدادات المستخدم',
            style: TextStyle(
              fontFamily: 'Cairo',
              fontWeight: FontWeight.bold,
              fontSize: 20,
              color: Colors.white,
            ),
          ),
          centerTitle: true,
          leading: IconButton(
            icon: const Icon(Icons.arrow_forward_ios, color: Colors.white),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        body:
            _isLoading
                ? const Center(child: CircularProgressIndicator())
                : SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Header
                        const Text(
                          'البيانات الشخصية',
                          style: TextStyle(
                            fontFamily: 'Cairo',
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF690000),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'قم بتحديث معلوماتك الشخصية',
                          style: TextStyle(
                            fontFamily: 'Cairo',
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                        ),
                        const SizedBox(height: 24),

                        // Form Fields
                        _buildTextField(
                          controller: _fullnameController,
                          label: 'الاسم الكامل',
                          icon: Icons.badge,
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'يرجى إدخال الاسم الكامل';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),
                        _buildTextField(
                          controller: _usernameController,
                          label: 'اسم المستخدم',
                          icon: Icons.person,
                          enabled: false,
                        ),
                        const SizedBox(height: 16),
                        _buildTextField(
                          controller: _emailController,
                          label: 'البريد الإلكتروني',
                          icon: Icons.email,
                          keyboardType: TextInputType.emailAddress,
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'يرجى إدخال البريد الإلكتروني';
                            }
                            if (!value.contains('@')) {
                              return 'البريد الإلكتروني غير صحيح';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),
                        _buildTextField(
                          controller: _phoneController,
                          label: 'رقم الهاتف',
                          icon: Icons.phone,
                          keyboardType: TextInputType.phone,
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'يرجى إدخال رقم الهاتف';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 20),
                        _buildTextField(
                          controller: _nationalIdController,
                          label: 'الرقم القومي (اختياري)',
                          icon: Icons.credit_card,
                          keyboardType: TextInputType.number,
                        ),
                        const SizedBox(height: 32),
                        _buildSaveButton(),
                        const SizedBox(height: 20),
                      ],
                    ),
                  ),
                ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
    bool enabled = true,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      validator: validator,
      enabled: enabled,
      style: const TextStyle(fontFamily: 'Cairo', fontSize: 15),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(fontFamily: 'Cairo', color: Colors.grey.shade700),
        prefixIcon: Icon(icon, color: const Color(0xFF1ba3b6)),
        filled: true,
        fillColor: enabled ? Colors.white : Colors.grey.shade200,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF1ba3b6), width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.red, width: 1),
        ),
        disabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
      ),
    );
  }

  Widget _buildSaveButton() {
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: ElevatedButton.icon(
        onPressed: _isSaving ? null : _saveUserData,
        icon:
            _isSaving
                ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                )
                : const Icon(Icons.save, color: Colors.white),
        label: Text(
          _isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات',
          style: const TextStyle(
            fontFamily: 'Cairo',
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF690000),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 2,
        ),
      ),
    );
  }
}
