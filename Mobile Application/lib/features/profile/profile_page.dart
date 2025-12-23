import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../Pop-ups/al_noran_popups.dart';
import '../../core/network/api_service.dart';
import '../../core/services/user_cache_service.dart';
import '../../core/storage/secure_storage.dart';
import '../../util/file_picker_helper.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({Key? key}) : super(key: key);

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  // Premium Colors
  static const Color primaryDark = Color(0xFF690000);
  static const Color primaryLight = Color(0xFF8B0000);
  static const Color accentColor = Color(0xFF1ba3b6);
  static const Color goldAccent = Color(0xFFD4AF37);
  static const Color bgColor = Color(0xFFF8F9FA);

  Map<String, dynamic>? _userData;
  List<Map<String, dynamic>> _uploadedDocuments = [];
  bool _isLoading = true;
  String? _profilePhotoUrl;
  bool _isUploadingPhoto = false;
  bool _isFirstLoad = true;

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  Future<void> _loadUserData() async {
    try {
      // Only show loading on first load, not on refresh
      if (_isFirstLoad) {
        setState(() => _isLoading = true);
      }

      // Try to get from cache first (fast)
      final userCache = UserCacheService();
      if (userCache.isInitialized && _isFirstLoad) {
        setState(() {
          _userData = userCache.fullUserData;
          _profilePhotoUrl = userCache.profilePhotoUrl;
          _isLoading = false;
        });
        print('📱 [ProfilePage] Loaded from cache: ${userCache.userName}');

        // Load documents in background
        final userId = _userData?['_id'] ?? _userData?['id'];
        if (userId != null) {
          _loadDocuments(userId);
        }
        _isFirstLoad = false;
        return;
      }

      // Get user profile from API (includes profile photo URL)
      final profileResponse = await ApiService.getUserProfile();
      if (profileResponse['success'] == true &&
          profileResponse['user'] != null) {
        final user = profileResponse['user'];
        setState(() {
          _userData = user;
          _profilePhotoUrl = user['profilePhotoUrl'];
        });

        // Update cache
        userCache.updateProfilePhoto(user['profilePhotoUrl']);
        print('📱 [ProfilePage] Profile loaded with photo: $_profilePhotoUrl');
      } else {
        // Fallback to local storage
        final userDataJson = await SecureStorage.getUserData();
        print('📱 [ProfilePage] User Data from Storage: $userDataJson');
        if (userDataJson != null) {
          setState(() => _userData = userDataJson);
        }
      }

      if (_userData != null) {
        // Debug: print clientDetails
        print('📱 [ProfilePage] ClientDetails: ${_userData?['clientDetails']}');
        print(
          '📱 [ProfilePage] ClientType: ${_userData?['clientDetails']?['clientType']}',
        );

        // Fetch uploaded documents
        final userId = _userData?['_id'] ?? _userData?['id'];
        print('📱 [ProfilePage] User ID: $userId');

        if (userId != null) {
          await _loadDocuments(userId);
        }
      } else {
        print('⚠️ [ProfilePage] No user data found!');
      }

      setState(() => _isLoading = false);
      _isFirstLoad = false;
    } catch (e) {
      print('❌ [ProfilePage] Error loading user data: $e');
      setState(() => _isLoading = false);
      _isFirstLoad = false;
      if (mounted) {
        AlNoranPopups.showError(
          context: context,
          message: 'حدث خطأ في تحميل البيانات',
        );
      }
    }
  }

  Future<void> _pickAndUploadProfilePhoto() async {
    try {
      final File? pickedFile = await FilePickerHelper.pickFile(context);
      if (pickedFile == null) return;

      setState(() => _isUploadingPhoto = true);

      final result = await ApiService.uploadProfilePhoto(file: pickedFile);

      setState(() => _isUploadingPhoto = false);

      if (result['success'] == true) {
        setState(() {
          _profilePhotoUrl = result['photoUrl'];
        });
        if (mounted) {
          AlNoranPopups.showSuccess(
            context: context,
            message: 'تم تحديث صورة البروفايل بنجاح',
          );
        }
      } else {
        if (mounted) {
          AlNoranPopups.showError(
            context: context,
            message: result['message'] ?? 'فشل رفع صورة البروفايل',
          );
        }
      }
    } catch (e) {
      setState(() => _isUploadingPhoto = false);
      print('❌ [ProfilePage] Error uploading photo: $e');
      if (mounted) {
        AlNoranPopups.showError(
          context: context,
          message: 'حدث خطأ أثناء رفع الصورة',
        );
      }
    }
  }

  Future<void> _deleteProfilePhoto() async {
    final confirm = await AlNoranPopups.showConfirmation(
      context: context,
      title: 'حذف صورة البروفايل',
      message: 'هل أنت متأكد من حذف صورة البروفايل؟',
      confirmText: 'حذف',
      cancelText: 'إلغاء',
    );

    if (confirm == true) {
      try {
        setState(() => _isUploadingPhoto = true);
        final result = await ApiService.deleteProfilePhoto();
        setState(() => _isUploadingPhoto = false);

        if (result['success'] == true) {
          setState(() {
            _profilePhotoUrl = null;
          });
          if (mounted) {
            AlNoranPopups.showSuccess(
              context: context,
              message: 'تم حذف صورة البروفايل',
            );
          }
        } else {
          if (mounted) {
            AlNoranPopups.showError(
              context: context,
              message: result['message'] ?? 'فشل حذف الصورة',
            );
          }
        }
      } catch (e) {
        setState(() => _isUploadingPhoto = false);
        print('❌ [ProfilePage] Error deleting photo: $e');
      }
    }
  }

  void _showPhotoOptions() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder:
          (ctx) => Directionality(
            textDirection: TextDirection.rtl,
            child: Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(20),
                  topRight: Radius.circular(20),
                ),
              ),
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'صورة البروفايل',
                    style: TextStyle(
                      fontFamily: 'Cairo',
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 20),
                  ListTile(
                    leading: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1ba3b6).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(
                        Icons.photo_camera,
                        color: Color(0xFF1ba3b6),
                      ),
                    ),
                    title: const Text(
                      'اختيار صورة جديدة',
                      style: TextStyle(fontFamily: 'Cairo'),
                    ),
                    onTap: () {
                      Navigator.pop(ctx);
                      _pickAndUploadProfilePhoto();
                    },
                  ),
                  if (_profilePhotoUrl != null) ...[
                    const Divider(),
                    ListTile(
                      leading: Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.red.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.delete, color: Colors.red),
                      ),
                      title: const Text(
                        'حذف الصورة',
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          color: Colors.red,
                        ),
                      ),
                      onTap: () {
                        Navigator.pop(ctx);
                        _deleteProfilePhoto();
                      },
                    ),
                  ],
                  const SizedBox(height: 10),
                ],
              ),
            ),
          ),
    );
  }

  Future<void> _loadDocuments(String userId) async {
    try {
      print('📂 [ProfilePage] Loading documents for user: $userId');

      final response = await ApiService.getUploads(
        userId: userId,
        category: 'registration',
      );

      print('📂 [ProfilePage] Documents response: $response');
      print('📂 [ProfilePage] Success: ${response['success']}');
      print('📂 [ProfilePage] Uploads: ${response['uploads']}');

      if (response['success'] == true) {
        final uploads = response['uploads'] ?? response['data'] ?? [];
        print('📂 [ProfilePage] Found ${uploads.length} documents');

        setState(() {
          _uploadedDocuments = List<Map<String, dynamic>>.from(uploads);
        });

        print('📂 [ProfilePage] Documents loaded: $_uploadedDocuments');
      } else {
        print(
          '⚠️ [ProfilePage] Failed to load documents: ${response['message']}',
        );
      }
    } catch (e) {
      print('❌ [ProfilePage] Error loading documents: $e');
    }
  }

  String _getClientTypeName(String? type) {
    if (type == null || type.isEmpty) return 'حساب عام';

    switch (type.toLowerCase()) {
      case 'factory':
        return 'مصنع';
      case 'commercial':
        return 'تجاري';
      case 'personal':
        return 'فردي';
      case 'client':
        return 'عميل';
      case 'employee':
        return 'موظف';
      default:
        return type; // Return the original value if not matched
    }
  }

  String _getDocumentTypeName(String? type) {
    switch (type) {
      case 'contract':
        return 'العقد';
      case 'tax_card':
        return 'البطاقة الضريبية';
      case 'commercial_register':
        return 'السجل التجاري';
      case 'certificate_vat':
        return 'شهادة القيمة المضافة';
      case 'industrial_register':
        return 'السجل الصناعي';
      case 'production_supplies':
        return 'مستلزمات الإنتاج';
      case 'import_export_card':
        return 'بطاقة استيراد/تصدير';
      case 'power_of_attorney':
        return 'التوكيل';
      default:
        return type ?? 'مستند';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: bgColor,
        body:
            _isLoading
                ? const Center(
                  child: CircularProgressIndicator(color: primaryDark),
                )
                : RefreshIndicator(
                  onRefresh: _loadUserData,
                  color: primaryDark,
                  child: CustomScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    slivers: [
                      // Premium App Bar
                      SliverAppBar(
                        expandedHeight: 280,
                        pinned: true,
                        backgroundColor: primaryDark,
                        automaticallyImplyLeading: false,
                        actions: [
                          IconButton(
                            icon: const Icon(
                              Icons.arrow_forward_rounded,
                              color: Colors.white,
                            ),
                            onPressed: () {
                              HapticFeedback.lightImpact();
                              if (GoRouter.of(context).canPop()) {
                                context.pop();
                              } else {
                                context.go('/home');
                              }
                            },
                          ),
                        ],
                        flexibleSpace: FlexibleSpaceBar(
                          background: _buildPremiumHeader(),
                        ),
                      ),

                      // Content
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            children: [
                              // Personal Info Card
                              _buildPremiumInfoCard(),
                              const SizedBox(height: 16),

                              // Documents Section
                              _buildPremiumDocumentsSection(),
                              const SizedBox(height: 100),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
      ),
    );
  }

  Widget _buildPremiumHeader() {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [primaryDark, primaryLight, primaryDark.withOpacity(0.9)],
        ),
      ),
      child: Stack(
        children: [
          // Decorative circles
          Positioned(
            top: -50,
            right: -50,
            child: Container(
              width: 150,
              height: 150,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withOpacity(0.05),
              ),
            ),
          ),
          Positioned(
            bottom: -30,
            left: -30,
            child: Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withOpacity(0.05),
              ),
            ),
          ),
          Positioned(
            top: 50,
            left: 20,
            child: Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withOpacity(0.03),
              ),
            ),
          ),

          // Content - Centered with SingleChildScrollView to prevent overflow
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  const SizedBox(height: 30),
                  // Profile Picture - Centered
                  Center(
                    child: GestureDetector(
                      onTap: _showPhotoOptions,
                      child: Stack(
                        children: [
                          Container(
                            width: 120,
                            height: 120,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: LinearGradient(
                                colors: [accentColor, goldAccent],
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.3),
                                  blurRadius: 20,
                                  offset: const Offset(0, 10),
                                ),
                              ],
                            ),
                            padding: const EdgeInsets.all(4),
                            child: Container(
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.white,
                              ),
                              child:
                                  _isUploadingPhoto
                                      ? const Center(
                                        child: CircularProgressIndicator(
                                          color: primaryDark,
                                          strokeWidth: 3,
                                        ),
                                      )
                                      : ClipOval(
                                        child:
                                            _profilePhotoUrl != null
                                                ? Image.network(
                                                  _profilePhotoUrl!,
                                                  width: 112,
                                                  height: 112,
                                                  fit: BoxFit.cover,
                                                  errorBuilder:
                                                      (_, __, ___) => Icon(
                                                        Icons.person_rounded,
                                                        size: 55,
                                                        color: primaryDark,
                                                      ),
                                                )
                                                : Icon(
                                                  Icons.person_rounded,
                                                  size: 55,
                                                  color: primaryDark,
                                                ),
                                      ),
                            ),
                          ),
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    accentColor,
                                    accentColor.withOpacity(0.8),
                                  ],
                                ),
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: Colors.white,
                                  width: 3,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: accentColor.withOpacity(0.4),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: const Icon(
                                Icons.camera_alt_rounded,
                                color: Colors.white,
                                size: 18,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  // User Name - Centered
                  Center(
                    child: Text(
                      _userData?['fullname'] ?? 'المستخدم',
                      style: const TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 26,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  const SizedBox(height: 12),
                  // Email - Centered with icon
                  Center(
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 10,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(25),
                        border: Border.all(
                          color: Colors.white.withOpacity(0.2),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.email_rounded,
                            size: 18,
                            color: Colors.white.withOpacity(0.9),
                          ),
                          const SizedBox(width: 10),
                          Text(
                            _userData?['email'] ?? '',
                            style: TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                              color: Colors.white.withOpacity(0.95),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  // Account type badge - Centered
                  if (_userData?['clientDetails']?['clientType'] != null) ...[
                    Center(
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [goldAccent, goldAccent.withOpacity(0.8)],
                          ),
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: goldAccent.withOpacity(0.4),
                              blurRadius: 8,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.verified_rounded,
                              color: Colors.white,
                              size: 16,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              _getClientTypeName(
                                _userData?['clientDetails']?['clientType'],
                              ),
                              style: const TextStyle(
                                fontFamily: 'Cairo',
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPremiumInfoCard() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: primaryDark.withOpacity(0.08),
            blurRadius: 20,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [primaryDark.withOpacity(0.05), Colors.transparent],
              ),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(20),
                topRight: Radius.circular(20),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [primaryDark, primaryLight],
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.person_rounded,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                const Text(
                  'المعلومات الشخصية',
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: primaryDark,
                  ),
                ),
              ],
            ),
          ),

          // Info Items
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                _buildPremiumInfoRow(
                  icon: Icons.badge_rounded,
                  label: 'اسم المستخدم',
                  value: _userData?['username'] ?? '-',
                  color: accentColor,
                ),
                const SizedBox(height: 16),
                _buildPremiumInfoRow(
                  icon: Icons.phone_rounded,
                  label: 'رقم الهاتف',
                  value: _userData?['phone'] ?? '-',
                  color: goldAccent,
                ),
                if (_userData?['nationalId'] != null) ...[
                  const SizedBox(height: 16),
                  _buildPremiumInfoRow(
                    icon: Icons.credit_card_rounded,
                    label: 'الرقم القومي',
                    value: _userData?['nationalId'] ?? '-',
                    color: primaryDark,
                  ),
                ],
                if (_userData?['clientDetails']?['clientType'] != null) ...[
                  const SizedBox(height: 16),
                  _buildPremiumInfoRow(
                    icon: Icons.category_rounded,
                    label: 'نوع الحساب',
                    value: _getClientTypeName(
                      _userData?['clientDetails']?['clientType'],
                    ),
                    color: Colors.purple,
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPremiumInfoRow({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withOpacity(0.1), width: 1),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 11,
                    color: Colors.grey[500],
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: const TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF2D2D2D),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPremiumDocumentsSection() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: primaryDark.withOpacity(0.08),
            blurRadius: 20,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [accentColor.withOpacity(0.05), Colors.transparent],
              ),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(20),
                topRight: Radius.circular(20),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [accentColor, accentColor.withOpacity(0.8)],
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.folder_rounded,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                const Text(
                  'المستندات المرفوعة',
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: primaryDark,
                  ),
                ),
                const Spacer(),
                if (_uploadedDocuments.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: accentColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      '${_uploadedDocuments.length}',
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: accentColor,
                      ),
                    ),
                  ),
              ],
            ),
          ),

          // Documents List
          Padding(
            padding: const EdgeInsets.all(16),
            child:
                _uploadedDocuments.isEmpty
                    ? _buildEmptyDocuments()
                    : Column(
                      children:
                          _uploadedDocuments
                              .map((doc) => _buildPremiumDocumentCard(doc))
                              .toList(),
                    ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyDocuments() {
    return Container(
      padding: const EdgeInsets.all(32),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.grey.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.folder_off_rounded,
              size: 40,
              color: Colors.grey[400],
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'لا توجد مستندات مرفوعة',
            style: TextStyle(
              fontFamily: 'Cairo',
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Colors.grey[500],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPremiumDocumentCard(Map<String, dynamic> doc) {
    final isPDF = doc['mimetype']?.toString().contains('pdf') ?? false;
    final color = isPDF ? Colors.red : Colors.blue;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withOpacity(0.1), width: 1),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [color.withOpacity(0.1), color.withOpacity(0.05)],
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              isPDF ? Icons.picture_as_pdf_rounded : Icons.image_rounded,
              color: color,
              size: 24,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _getDocumentTypeName(doc['documentType']),
                  style: const TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: primaryDark,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  doc['filename'] ?? 'مستند',
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 11,
                    color: Colors.grey[500],
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          Icon(Icons.check_circle_rounded, color: Colors.green, size: 20),
        ],
      ),
    );
  }
}
