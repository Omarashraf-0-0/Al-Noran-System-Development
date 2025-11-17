import 'package:flutter/material.dart';
import '../../Pop-ups/al_noran_popups.dart';
import '../../core/network/api_service.dart';
import '../../core/storage/secure_storage.dart';
import '../auth/login_page.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({Key? key}) : super(key: key);

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  Map<String, dynamic>? _userData;
  List<Map<String, dynamic>> _uploadedDocuments = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  Future<void> _loadUserData() async {
    try {
      setState(() => _isLoading = true);

      // Get user data from storage
      final userDataJson = await SecureStorage.getUserData();
      print('📱 [ProfilePage] User Data from Storage: $userDataJson');

      if (userDataJson != null) {
        setState(() => _userData = userDataJson);

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
        print('⚠️ [ProfilePage] No user data found in storage!');
      }

      setState(() => _isLoading = false);
    } catch (e) {
      print('❌ [ProfilePage] Error loading user data: $e');
      setState(() => _isLoading = false);
      AlNoranPopups.showError(
        context: context,
        message: 'حدث خطأ في تحميل البيانات',
      );
    }
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

  Future<void> _logout() async {
    final confirm = await AlNoranPopups.showConfirmDialog(
      context: context,
      title: 'تسجيل الخروج',
      message: 'هل أنت متأكد من تسجيل الخروج؟',
      confirmText: 'تسجيل الخروج',
      cancelText: 'إلغاء',
    );

    if (confirm == true) {
      await SecureStorage.deleteToken();
      await SecureStorage.deleteUserData();

      if (mounted) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (context) => const LoginPage()),
          (route) => false,
        );
      }
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
        backgroundColor: const Color(0xFFF5F5F5),
        appBar: AppBar(
          backgroundColor: const Color(0xFF690000),
          elevation: 0,
          title: const Text(
            'الملف الشخصي',
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
          actions: [
            IconButton(
              icon: const Icon(Icons.logout, color: Colors.white),
              onPressed: _logout,
              tooltip: 'تسجيل الخروج',
            ),
          ],
        ),
        body:
            _isLoading
                ? const Center(child: CircularProgressIndicator())
                : RefreshIndicator(
                  onRefresh: _loadUserData,
                  color: const Color(0xFF690000),
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: Column(
                      children: [
                        // Header Section
                        _buildHeaderSection(),

                        const SizedBox(height: 16),

                        // Personal Info Card
                        _buildPersonalInfoCard(),

                        const SizedBox(height: 16),

                        // Company/Business Info Card (if applicable)
                        if (_userData?['clientDetails'] != null)
                          _buildCompanyInfoCard(),

                        const SizedBox(height: 16),

                        // Documents Section
                        _buildDocumentsSection(),

                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
                ),
      ),
    );
  }

  Widget _buildHeaderSection() {
    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        color: Color(0xFF690000),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(30),
          bottomRight: Radius.circular(30),
        ),
      ),
      child: Column(
        children: [
          const SizedBox(height: 24),
          // Profile Picture
          Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0xFF1ba3b6), width: 3),
            ),
            child: const Icon(Icons.person, size: 60, color: Color(0xFF690000)),
          ),
          const SizedBox(height: 16),
          // User Name
          Text(
            _userData?['fullname'] ?? 'المستخدم',
            style: const TextStyle(
              fontFamily: 'Cairo',
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          // Account Type Badge
          if (_userData?['clientDetails']?['clientType'] != null ||
              _userData?['type'] != null) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFF1ba3b6),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                _getClientTypeName(
                  _userData?['clientDetails']?['clientType'] ??
                      _userData?['type'],
                ),
                style: const TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ),
          ] else ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.grey.shade400,
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Text(
                'حساب عام',
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ),
          ],
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildPersonalInfoCard() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
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
            children: const [
              Icon(Icons.person_outline, color: Color(0xFF690000), size: 24),
              SizedBox(width: 8),
              Text(
                'المعلومات الشخصية',
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF690000),
                ),
              ),
            ],
          ),
          const Divider(height: 24, thickness: 1),
          _buildInfoRow(
            Icons.badge,
            'اسم المستخدم',
            _userData?['username'] ?? '-',
          ),
          const SizedBox(height: 12),
          _buildInfoRow(
            Icons.email,
            'البريد الإلكتروني',
            _userData?['email'] ?? '-',
          ),
          const SizedBox(height: 12),
          _buildInfoRow(Icons.phone, 'رقم الهاتف', _userData?['phone'] ?? '-'),
          if (_userData?['nationalId'] != null) ...[
            const SizedBox(height: 12),
            _buildInfoRow(
              Icons.credit_card,
              'الرقم القومي',
              _userData?['nationalId'] ?? '-',
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildCompanyInfoCard() {
    final clientDetails = _userData?['clientDetails'];
    if (clientDetails == null) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
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
            children: const [
              Icon(Icons.business, color: Color(0xFF1ba3b6), size: 24),
              SizedBox(width: 8),
              Text(
                'معلومات الشركة',
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF690000),
                ),
              ),
            ],
          ),
          const Divider(height: 24, thickness: 1),
          if (clientDetails['companyName'] != null) ...[
            _buildInfoRow(
              Icons.apartment,
              'اسم الشركة',
              clientDetails['companyName'],
            ),
            const SizedBox(height: 12),
          ],
          if (clientDetails['commercialRegisterNumber'] != null) ...[
            _buildInfoRow(
              Icons.numbers,
              'رقم السجل التجاري',
              clientDetails['commercialRegisterNumber'],
            ),
            const SizedBox(height: 12),
          ],
          if (clientDetails['taxCardNumber'] != null) ...[
            _buildInfoRow(
              Icons.receipt,
              'رقم البطاقة الضريبية',
              clientDetails['taxCardNumber'],
            ),
            const SizedBox(height: 12),
          ],
          if (clientDetails['address'] != null) ...[
            _buildInfoRow(
              Icons.location_on,
              'العنوان',
              clientDetails['address'],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildDocumentsSection() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
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
            children: const [
              Icon(Icons.folder_open, color: Color(0xFF1ba3b6), size: 24),
              SizedBox(width: 8),
              Text(
                'المستندات المرفوعة',
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF690000),
                ),
              ),
            ],
          ),
          const Divider(height: 24, thickness: 1),
          if (_uploadedDocuments.isEmpty)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(24.0),
                child: Text(
                  'لا توجد مستندات مرفوعة',
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 16,
                    color: Colors.grey,
                  ),
                ),
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _uploadedDocuments.length,
              separatorBuilder: (context, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final doc = _uploadedDocuments[index];
                return _buildDocumentCard(doc);
              },
            ),
        ],
      ),
    );
  }

  Widget _buildDocumentCard(Map<String, dynamic> doc) {
    final isPDF = doc['mimetype']?.toString().contains('pdf') ?? false;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF5F5F5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: isPDF ? Colors.red.shade50 : Colors.blue.shade50,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              isPDF ? Icons.picture_as_pdf : Icons.image,
              color: isPDF ? Colors.red : Colors.blue,
              size: 28,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _getDocumentTypeName(doc['documentType']),
                  style: const TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF690000),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  doc['filename'] ?? 'مستند',
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 13,
                    color: Colors.grey.shade600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: const Color(0xFF1ba3b6)),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 13,
                  color: Colors.grey.shade600,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: const TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 15,
                  color: Color(0xFF2D2D2D),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
