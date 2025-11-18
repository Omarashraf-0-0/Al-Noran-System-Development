import 'package:flutter/material.dart';
import '../../Pop-ups/al_noran_popups.dart';
import '../../core/network/api_service.dart';
import '../../core/storage/secure_storage.dart';

class ChangePasswordPage extends StatefulWidget {
  const ChangePasswordPage({Key? key}) : super(key: key);

  @override
  State<ChangePasswordPage> createState() => _ChangePasswordPageState();
}

class _ChangePasswordPageState extends State<ChangePasswordPage> {
  final _formKey = GlobalKey<FormState>();

  final TextEditingController _currentPasswordController =
      TextEditingController();
  final TextEditingController _newPasswordController = TextEditingController();
  final TextEditingController _confirmPasswordController =
      TextEditingController();

  bool _obscureCurrentPassword = true;
  bool _obscureNewPassword = true;
  bool _obscureConfirmPassword = true;
  bool _isChanging = false;
  double _passwordStrength = 0.0;
  String _passwordStrengthText = '';
  Color _passwordStrengthColor = Colors.grey;

  @override
  void initState() {
    super.initState();
    _newPasswordController.addListener(_checkPasswordStrength);
  }

  @override
  void dispose() {
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _checkPasswordStrength() {
    final password = _newPasswordController.text;
    double strength = 0;
    String text = '';
    Color color = Colors.grey;

    if (password.isEmpty) {
      strength = 0;
      text = '';
    } else if (password.length < 6) {
      strength = 0.25;
      text = 'ضعيفة جداً';
      color = Colors.red;
    } else if (password.length < 8) {
      strength = 0.5;
      text = 'ضعيفة';
      color = Colors.orange;
    } else {
      bool hasUpperCase = password.contains(RegExp(r'[A-Z]'));
      bool hasLowerCase = password.contains(RegExp(r'[a-z]'));
      bool hasDigits = password.contains(RegExp(r'[0-9]'));
      bool hasSpecialChars = password.contains(
        RegExp(r'[!@#$%^&*(),.?":{}|<>]'),
      );

      int criteriaCount =
          [
            hasUpperCase,
            hasLowerCase,
            hasDigits,
            hasSpecialChars,
          ].where((criteria) => criteria).length;

      if (criteriaCount >= 3 && password.length >= 10) {
        strength = 1.0;
        text = 'قوية جداً';
        color = Colors.green;
      } else if (criteriaCount >= 2) {
        strength = 0.75;
        text = 'جيدة';
        color = Colors.lightGreen;
      } else {
        strength = 0.5;
        text = 'مقبولة';
        color = Colors.orange;
      }
    }

    setState(() {
      _passwordStrength = strength;
      _passwordStrengthText = text;
      _passwordStrengthColor = color;
    });
  }

  Future<void> _changePassword() async {
    if (!_formKey.currentState!.validate()) return;

    if (_newPasswordController.text != _confirmPasswordController.text) {
      AlNoranPopups.showError(
        context: context,
        message: 'كلمة المرور الجديدة غير متطابقة',
      );
      return;
    }

    setState(() => _isChanging = true);

    try {
      final userData = await SecureStorage.getUserData();
      final userId = userData?['_id'] ?? userData?['id'];

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
          onPressed: () => Navigator.pop(context),
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
      setState(() => _isChanging = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: const Color(0xFFF5F5F5),
        body: CustomScrollView(
          slivers: [
            SliverAppBar(
              expandedHeight: 180,
              floating: false,
              pinned: true,
              elevation: 0,
              backgroundColor: const Color(0xFF690000),
              automaticallyImplyLeading: false,
              actions: [
                Container(
                  margin: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: IconButton(
                    icon: const Icon(Icons.arrow_forward, color: Colors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
                ),
              ],
              flexibleSpace: FlexibleSpaceBar(
                centerTitle: true,
                background: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topRight,
                      end: Alignment.bottomLeft,
                      colors: [
                        const Color(0xFF690000),
                        const Color(0xFF8B0000),
                      ],
                    ),
                    borderRadius: const BorderRadius.only(
                      bottomLeft: Radius.circular(25),
                      bottomRight: Radius.circular(25),
                    ),
                  ),
                  child: SafeArea(
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          const SizedBox(height: 20),
                          Container(
                            width: 70,
                            height: 70,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(15),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.2),
                                  blurRadius: 15,
                                  offset: const Offset(0, 5),
                                ),
                              ],
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(15),
                              child: Image.asset(
                                'assets/img/logo.png',
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) {
                                  return const Icon(
                                    Icons.lock,
                                    color: Color(0xFF690000),
                                    size: 40,
                                  );
                                },
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          const Text(
                            'تغيير كلمة المرور',
                            style: TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Form(
                  key: _formKey,
                  child: Column(
                    children: [
                      const SizedBox(height: 8),

                      // Header Card
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              Colors.orange.shade50,
                              Colors.orange.shade100.withOpacity(0.3),
                            ],
                          ),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: Colors.orange.withOpacity(0.3),
                            width: 1,
                          ),
                        ),
                        child: Column(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(20),
                              decoration: BoxDecoration(
                                color: Colors.orange,
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.orange.withOpacity(0.4),
                                    blurRadius: 15,
                                    offset: const Offset(0, 5),
                                  ),
                                ],
                              ),
                              child: const Icon(
                                Icons.lock_reset,
                                size: 50,
                                color: Colors.white,
                              ),
                            ),
                            const SizedBox(height: 16),
                            const Text(
                              'تغيير كلمة المرور',
                              style: TextStyle(
                                fontFamily: 'Cairo',
                                fontSize: 22,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF2D2D2D),
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'قم بتغيير كلمة مرورك بشكل دوري للحفاظ على أمان حسابك',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontFamily: 'Cairo',
                                fontSize: 13,
                                color: Colors.grey[600],
                                height: 1.4,
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 32),

                      // Section Title
                      Row(
                        children: [
                          Container(
                            width: 4,
                            height: 20,
                            decoration: BoxDecoration(
                              color: Colors.orange,
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                          const SizedBox(width: 8),
                          const Text(
                            'بيانات كلمة المرور',
                            style: TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 17,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF2D2D2D),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 16),
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
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'يرجى إدخال كلمة المرور الحالية';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      _buildPasswordField(
                        controller: _newPasswordController,
                        label: 'كلمة المرور الجديدة',
                        obscureText: _obscureNewPassword,
                        onToggle:
                            () => setState(
                              () => _obscureNewPassword = !_obscureNewPassword,
                            ),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'يرجى إدخال كلمة المرور الجديدة';
                          }
                          if (value.length < 6) {
                            return 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
                          }
                          return null;
                        },
                      ),

                      // Password Strength Indicator
                      if (_newPasswordController.text.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: _passwordStrengthColor.withOpacity(0.3),
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text(
                                    'قوة كلمة المرور:',
                                    style: TextStyle(
                                      fontFamily: 'Cairo',
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  Text(
                                    _passwordStrengthText,
                                    style: TextStyle(
                                      fontFamily: 'Cairo',
                                      fontSize: 13,
                                      fontWeight: FontWeight.bold,
                                      color: _passwordStrengthColor,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 10),
                              ClipRRect(
                                borderRadius: BorderRadius.circular(10),
                                child: LinearProgressIndicator(
                                  value: _passwordStrength,
                                  backgroundColor: Colors.grey[200],
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    _passwordStrengthColor,
                                  ),
                                  minHeight: 8,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
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
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'يرجى تأكيد كلمة المرور الجديدة';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 32),
                      _buildChangeButton(),
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              Colors.blue.shade50,
                              Colors.blue.shade100.withOpacity(0.3),
                            ],
                          ),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: Colors.blue.shade200),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: Colors.blue,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Icon(
                                    Icons.info_outline,
                                    color: Colors.white,
                                    size: 20,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                const Text(
                                  'نصائح لكلمة مرور قوية',
                                  style: TextStyle(
                                    fontFamily: 'Cairo',
                                    fontSize: 15,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF2D2D2D),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 14),
                            _buildPasswordTip('استخدم 8 أحرف على الأقل'),
                            _buildPasswordTip(
                              'اجمع بين الأحرف الكبيرة والصغيرة',
                            ),
                            _buildPasswordTip('أضف أرقام ورموز خاصة'),
                            _buildPasswordTip('تجنب استخدام معلومات شخصية'),
                          ],
                        ),
                      ),
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

  Widget _buildPasswordField({
    required TextEditingController controller,
    required String label,
    required bool obscureText,
    required VoidCallback onToggle,
    String? Function(String?)? validator,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: TextFormField(
        controller: controller,
        obscureText: obscureText,
        validator: validator,
        textAlign: TextAlign.right,
        style: const TextStyle(
          fontFamily: 'Cairo',
          fontSize: 15,
          fontWeight: FontWeight.w500,
        ),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: const TextStyle(
            fontFamily: 'Cairo',
            color: Colors.orange,
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
          floatingLabelStyle: const TextStyle(
            fontFamily: 'Cairo',
            color: Colors.orange,
            fontSize: 15,
            fontWeight: FontWeight.bold,
          ),
          suffixIcon: Container(
            margin: const EdgeInsets.all(10),
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.orange.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(
              Icons.lock_outline,
              color: Colors.orange,
              size: 22,
            ),
          ),
          prefixIcon: IconButton(
            icon: Icon(
              obscureText ? Icons.visibility_off : Icons.visibility,
              color: Colors.grey[600],
              size: 22,
            ),
            onPressed: onToggle,
          ),
          filled: true,
          fillColor: Colors.white,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 18,
            vertical: 18,
          ),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: BorderSide.none,
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: BorderSide(color: Colors.grey.shade200, width: 1),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: Colors.orange, width: 2),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: Colors.red, width: 1.5),
          ),
          focusedErrorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: Colors.red, width: 2),
          ),
          errorStyle: const TextStyle(
            fontFamily: 'Cairo',
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    );
  }

  Widget _buildPasswordTip(String tip) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: const BoxDecoration(
              color: Colors.blue,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              tip,
              style: TextStyle(
                fontFamily: 'Cairo',
                fontSize: 12,
                color: Colors.grey[700],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChangeButton() {
    return Container(
      width: double.infinity,
      height: 58,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors:
              _isChanging
                  ? [Colors.grey, Colors.grey.shade400]
                  : [Colors.orange, Colors.deepOrange],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow:
            _isChanging
                ? []
                : [
                  BoxShadow(
                    color: Colors.orange.withOpacity(0.4),
                    blurRadius: 15,
                    offset: const Offset(0, 6),
                  ),
                ],
      ),
      child: ElevatedButton(
        onPressed: _isChanging ? null : _changePassword,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          foregroundColor: Colors.white,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
        child:
            _isChanging
                ? const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    ),
                    SizedBox(width: 14),
                    Text(
                      'جاري التغيير...',
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 17,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                )
                : const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.lock_reset, size: 24),
                    SizedBox(width: 12),
                    Text(
                      'تغيير كلمة المرور',
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 17,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
      ),
    );
  }
}
