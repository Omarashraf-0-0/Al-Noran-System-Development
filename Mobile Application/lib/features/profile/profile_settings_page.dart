import 'package:flutter/material.dart';
import '../../Pop-ups/al_noran_popups.dart';
import '../../core/network/api_service.dart';
import '../../core/storage/secure_storage.dart';

class ProfileSettingsPage extends StatefulWidget {
  const ProfileSettingsPage({Key? key}) : super(key: key);

  @override
  State<ProfileSettingsPage> createState() => _ProfileSettingsPageState();
}

class _ProfileSettingsPageState extends State<ProfileSettingsPage> {
  final _formKey = GlobalKey<FormState>();

  // Text Controllers - Personal Info
  final TextEditingController _fullnameController = TextEditingController();
  final TextEditingController _usernameController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _nationalIdController = TextEditingController();

  // Text Controllers - Company Info
  final TextEditingController _companyNameController = TextEditingController();
  final TextEditingController _commercialRegisterController =
      TextEditingController();
  final TextEditingController _taxCardController = TextEditingController();
  final TextEditingController _addressController = TextEditingController();

  // Password Change
  final TextEditingController _currentPasswordController =
      TextEditingController();
  final TextEditingController _newPasswordController = TextEditingController();
  final TextEditingController _confirmPasswordController =
      TextEditingController();

  Map<String, dynamic>? _userData;
  bool _isLoading = true;
  bool _isSaving = false;
  bool _obscureCurrentPassword = true;
  bool _obscureNewPassword = true;
  bool _obscureConfirmPassword = true;

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
    _companyNameController.dispose();
    _commercialRegisterController.dispose();
    _taxCardController.dispose();
    _addressController.dispose();
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
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

        final clientDetails = _userData?['clientDetails'];
        if (clientDetails != null) {
          _companyNameController.text = clientDetails['companyName'] ?? '';
          _commercialRegisterController.text =
              clientDetails['commercialRegisterNumber'] ?? '';
          _taxCardController.text = clientDetails['taxCardNumber'] ?? '';
          _addressController.text = clientDetails['address'] ?? '';
        }
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

  Future<void> _savePersonalInfo() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);

    try {
      final userId = _userData?['userId'] ?? _userData?['_id'];

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

      if (response['success'] == true) {
        // Update local storage
        _userData?['fullname'] = _fullnameController.text.trim();
        _userData?['email'] = _emailController.text.trim();
        _userData?['phone'] = _phoneController.text.trim();
        if (_nationalIdController.text.trim().isNotEmpty) {
          _userData?['nationalId'] = _nationalIdController.text.trim();
        }
        await SecureStorage.saveUserData(_userData!);

        AlNoranPopups.showSuccess(
          context: context,
          message: 'تم تحديث البيانات الشخصية بنجاح',
        );
      } else {
        throw Exception(response['message'] ?? 'فشل التحديث');
      }
    } catch (e) {
      print('Error updating personal info: $e');
      AlNoranPopups.showError(
        context: context,
        message: 'حدث خطأ أثناء تحديث البيانات',
      );
    } finally {
      setState(() => _isSaving = false);
    }
  }

  Future<void> _saveCompanyInfo() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);

    try {
      final userId = _userData?['userId'] ?? _userData?['_id'];

      final response = await ApiService.updateClientDetails(
        userId: userId,
        companyName: _companyNameController.text.trim(),
        commercialRegisterNumber: _commercialRegisterController.text.trim(),
        taxCardNumber: _taxCardController.text.trim(),
        address: _addressController.text.trim(),
      );

      if (response['success'] == true) {
        // Update local storage
        if (_userData?['clientDetails'] == null) {
          _userData?['clientDetails'] = {};
        }
        _userData?['clientDetails']['companyName'] =
            _companyNameController.text.trim();
        _userData?['clientDetails']['commercialRegisterNumber'] =
            _commercialRegisterController.text.trim();
        _userData?['clientDetails']['taxCardNumber'] =
            _taxCardController.text.trim();
        _userData?['clientDetails']['address'] = _addressController.text.trim();
        await SecureStorage.saveUserData(_userData!);

        AlNoranPopups.showSuccess(
          context: context,
          message: 'تم تحديث بيانات الشركة بنجاح',
        );
      } else {
        throw Exception(response['message'] ?? 'فشل التحديث');
      }
    } catch (e) {
      print('Error updating company info: $e');
      AlNoranPopups.showError(
        context: context,
        message: 'حدث خطأ أثناء تحديث بيانات الشركة',
      );
    } finally {
      setState(() => _isSaving = false);
    }
  }

  Future<void> _changePassword() async {
    if (_currentPasswordController.text.trim().isEmpty) {
      AlNoranPopups.showError(
        context: context,
        message: 'يرجى إدخال كلمة المرور الحالية',
      );
      return;
    }

    if (_newPasswordController.text.trim().isEmpty) {
      AlNoranPopups.showError(
        context: context,
        message: 'يرجى إدخال كلمة المرور الجديدة',
      );
      return;
    }

    if (_newPasswordController.text.length < 6) {
      AlNoranPopups.showError(
        context: context,
        message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
      );
      return;
    }

    if (_newPasswordController.text != _confirmPasswordController.text) {
      AlNoranPopups.showError(
        context: context,
        message: 'كلمة المرور الجديدة غير متطابقة',
      );
      return;
    }

    setState(() => _isSaving = true);

    try {
      final userId = _userData?['userId'] ?? _userData?['_id'];

      final response = await ApiService.changePassword(
        userId: userId,
        currentPassword: _currentPasswordController.text.trim(),
        newPassword: _newPasswordController.text.trim(),
      );

      if (response['success'] == true) {
        _currentPasswordController.clear();
        _newPasswordController.clear();
        _confirmPasswordController.clear();

        AlNoranPopups.showSuccess(
          context: context,
          message: 'تم تغيير كلمة المرور بنجاح',
        );
      } else {
        throw Exception(response['message'] ?? 'فشل تغيير كلمة المرور');
      }
    } catch (e) {
      print('Error changing password: $e');
      AlNoranPopups.showError(
        context: context,
        message: 'كلمة المرور الحالية غير صحيحة',
      );
    } finally {
      setState(() => _isSaving = false);
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
            'إعدادات الملف الشخصي',
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
                : Form(
                  key: _formKey,
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      // Personal Information Section
                      _buildSectionCard(
                        icon: Icons.person_outline,
                        title: 'المعلومات الشخصية',
                        children: [
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
                            enabled: false, // Username can't be changed
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
                          const SizedBox(height: 16),
                          _buildTextField(
                            controller: _nationalIdController,
                            label: 'الرقم القومي (اختياري)',
                            icon: Icons.credit_card,
                            keyboardType: TextInputType.number,
                          ),
                          const SizedBox(height: 24),
                          _buildActionButton(
                            label: 'حفظ المعلومات الشخصية',
                            icon: Icons.save,
                            onPressed: _savePersonalInfo,
                          ),
                        ],
                      ),

                      const SizedBox(height: 16),

                      // Company Information Section
                      if (_userData?['clientDetails'] != null)
                        _buildSectionCard(
                          icon: Icons.business,
                          title: 'معلومات الشركة',
                          iconColor: const Color(0xFF1ba3b6),
                          children: [
                            _buildTextField(
                              controller: _companyNameController,
                              label: 'اسم الشركة',
                              icon: Icons.apartment,
                            ),
                            const SizedBox(height: 16),
                            _buildTextField(
                              controller: _commercialRegisterController,
                              label: 'رقم السجل التجاري',
                              icon: Icons.numbers,
                              keyboardType: TextInputType.number,
                            ),
                            const SizedBox(height: 16),
                            _buildTextField(
                              controller: _taxCardController,
                              label: 'رقم البطاقة الضريبية',
                              icon: Icons.receipt,
                              keyboardType: TextInputType.number,
                            ),
                            const SizedBox(height: 16),
                            _buildTextField(
                              controller: _addressController,
                              label: 'العنوان',
                              icon: Icons.location_on,
                              maxLines: 3,
                            ),
                            const SizedBox(height: 24),
                            _buildActionButton(
                              label: 'حفظ بيانات الشركة',
                              icon: Icons.save,
                              onPressed: _saveCompanyInfo,
                              color: const Color(0xFF1ba3b6),
                            ),
                          ],
                        ),

                      const SizedBox(height: 16),

                      // Password Change Section
                      _buildSectionCard(
                        icon: Icons.lock_outline,
                        title: 'تغيير كلمة المرور',
                        iconColor: Colors.orange,
                        children: [
                          _buildPasswordField(
                            controller: _currentPasswordController,
                            label: 'كلمة المرور الحالية',
                            obscureText: _obscureCurrentPassword,
                            onToggle:
                                () => setState(
                                  () =>
                                      _obscureCurrentPassword =
                                          !_obscureCurrentPassword,
                                ),
                          ),
                          const SizedBox(height: 16),
                          _buildPasswordField(
                            controller: _newPasswordController,
                            label: 'كلمة المرور الجديدة',
                            obscureText: _obscureNewPassword,
                            onToggle:
                                () => setState(
                                  () =>
                                      _obscureNewPassword =
                                          !_obscureNewPassword,
                                ),
                          ),
                          const SizedBox(height: 16),
                          _buildPasswordField(
                            controller: _confirmPasswordController,
                            label: 'تأكيد كلمة المرور الجديدة',
                            obscureText: _obscureConfirmPassword,
                            onToggle:
                                () => setState(
                                  () =>
                                      _obscureConfirmPassword =
                                          !_obscureConfirmPassword,
                                ),
                          ),
                          const SizedBox(height: 24),
                          _buildActionButton(
                            label: 'تغيير كلمة المرور',
                            icon: Icons.lock_reset,
                            onPressed: _changePassword,
                            color: Colors.orange,
                          ),
                        ],
                      ),

                      const SizedBox(height: 24),
                    ],
                  ),
                ),
      ),
    );
  }

  Widget _buildSectionCard({
    required IconData icon,
    required String title,
    required List<Widget> children,
    Color? iconColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: iconColor ?? const Color(0xFF690000), size: 24),
              const SizedBox(width: 8),
              Text(
                title,
                style: const TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF690000),
                ),
              ),
            ],
          ),
          const Divider(height: 24, thickness: 1),
          ...children,
        ],
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
    int maxLines = 1,
    bool enabled = true,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      validator: validator,
      maxLines: maxLines,
      enabled: enabled,
      style: const TextStyle(fontFamily: 'Cairo', fontSize: 15),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(fontFamily: 'Cairo', color: Colors.grey.shade700),
        prefixIcon: Icon(icon, color: const Color(0xFF1ba3b6)),
        filled: true,
        fillColor: enabled ? Colors.grey.shade50 : Colors.grey.shade200,
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

  Widget _buildPasswordField({
    required TextEditingController controller,
    required String label,
    required bool obscureText,
    required VoidCallback onToggle,
  }) {
    return TextFormField(
      controller: controller,
      obscureText: obscureText,
      style: const TextStyle(fontFamily: 'Cairo', fontSize: 15),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(fontFamily: 'Cairo', color: Colors.grey.shade700),
        prefixIcon: const Icon(Icons.lock, color: Colors.orange),
        suffixIcon: IconButton(
          icon: Icon(
            obscureText ? Icons.visibility_off : Icons.visibility,
            color: Colors.grey.shade600,
          ),
          onPressed: onToggle,
        ),
        filled: true,
        fillColor: Colors.grey.shade50,
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
          borderSide: const BorderSide(color: Colors.orange, width: 2),
        ),
      ),
    );
  }

  Widget _buildActionButton({
    required String label,
    required IconData icon,
    required VoidCallback onPressed,
    Color? color,
  }) {
    return SizedBox(
      width: double.infinity,
      height: 50,
      child: ElevatedButton.icon(
        onPressed: _isSaving ? null : onPressed,
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
                : Icon(icon, color: Colors.white),
        label: Text(
          _isSaving ? 'جاري الحفظ...' : label,
          style: const TextStyle(
            fontFamily: 'Cairo',
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        style: ElevatedButton.styleFrom(
          backgroundColor: color ?? const Color(0xFF690000),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 2,
        ),
      ),
    );
  }
}
