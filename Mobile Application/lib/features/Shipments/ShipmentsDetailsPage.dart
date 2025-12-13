import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/network/api_service.dart';
import '../../Pop-ups/al_noran_popups.dart';
import '../../util/file_picker_helper.dart';

class ShipmentDetailsPage extends StatefulWidget {
  final String shipmentId; // ACID number

  const ShipmentDetailsPage({super.key, required this.shipmentId});

  @override
  State<ShipmentDetailsPage> createState() => _ShipmentDetailsPageState();
}

class _ShipmentDetailsPageState extends State<ShipmentDetailsPage> {
  // Colors
  static const Color primaryDark = Color(0xFF690000);
  static const Color primaryLight = Color(0xFFA40000);
  static const Color accent = Color(0xFF1BA3B6);

  // Loading state
  bool _isLoading = true;
  Map<String, dynamic>? _shipmentData;
  Map<String, dynamic>? _userData;
  List<Map<String, dynamic>> _requiredDocuments = [];

  // Expansion states for dropdown menus
  bool _isDetailsExpanded = true;
  bool _isTrackingExpanded = false;
  bool _isDocumentsExpanded = false;

  // Status mapping - 9 حالات للشحنة
  final Map<String, int> _statusIndexMap = <String, int>{
    'قيد الانتظار': 0,
    'Pending': 0,
    'في انتظار الشحن': 1,
    'في الطريق': 2,
    'تم وصول البضاعة': 3,
    'Arrived': 3,
    'في انتظار وصول الاذن': 4,
    'في انتظار وصول الإذن': 4,
    'التخليص الجمركى': 5,
    'Customs Clearance': 5,
    'جارى الكشف و التثمين': 6,
    'جاري الكشف والتثمين': 6,
    'مكتملة': 7,
    'Completed': 7,
    'تمت بنجاح': 8,
  };

  final List<Map<String, dynamic>> _trackingSteps = [
    {'title': 'قيد الانتظار', 'status': 'قيد الانتظار'},
    {'title': 'في انتظار الشحن', 'status': 'في انتظار الشحن'},
    {'title': 'في الطريق', 'status': 'في الطريق'},
    {'title': 'تم وصول البضاعة', 'status': 'تم وصول البضاعة'},
    {'title': 'في انتظار وصول الاذن', 'status': 'في انتظار وصول الاذن'},
    {'title': 'التخليص الجمركى', 'status': 'التخليص الجمركى'},
    {'title': 'جارى الكشف و التثمين', 'status': 'جارى الكشف و التثمين'},
    {'title': 'مكتملة', 'status': 'مكتملة'},
    {'title': 'تمت بنجاح', 'status': 'تمت بنجاح'},
  ];

  @override
  void initState() {
    super.initState();
    _loadAllData();
  }

  Future<void> _loadAllData() async {
    try {
      // تحميل جميع البيانات بالتوازي لتسريع الصفحة
      await Future.wait([
        _loadShipmentData(),
        _loadUserData(),
        _loadRequiredDocuments(),
      ]);
    } catch (e) {
      print('❌ [ShipmentDetails] Error loading data: $e');
    }
  }

  Future<void> _loadShipmentData() async {
    try {
      print('📦 [ShipmentDetails] Loading shipment: ${widget.shipmentId}');

      final response = await ApiService.getShipmentByAcid(
        acid: widget.shipmentId,
      );

      if (response['success'] == true && response['shipment'] != null) {
        if (mounted) {
          setState(() {
            _shipmentData = response['shipment'];
            _isLoading = false;
          });
        }
        print('📦 [ShipmentDetails] Loaded: $_shipmentData');
      } else {
        if (mounted) {
          setState(() => _isLoading = false);
          AlNoranPopups.showError(
            context: context,
            message: response['message'] ?? 'فشل تحميل بيانات الشحنة',
          );
        }
      }
    } catch (e) {
      print('❌ [ShipmentDetails] Error: $e');
      if (mounted) {
        setState(() => _isLoading = false);
        AlNoranPopups.showError(
          context: context,
          message: 'حدث خطأ أثناء تحميل بيانات الشحنة',
        );
      }
    }
  }

  Future<void> _loadUserData() async {
    try {
      final userData = await ApiService.getUserData();
      if (mounted) {
        setState(() => _userData = userData);
      }
    } catch (e) {
      print('❌ [ShipmentDetails] Error loading user: $e');
    }
  }

  Future<void> _loadRequiredDocuments() async {
    try {
      if (_shipmentData == null) {
        // إذا لم يتم تحميل بيانات الشحنة بعد، انتظر قليلاً
        await Future.delayed(const Duration(milliseconds: 500));
        if (_shipmentData == null) return;
      }

      final shipmentId = _shipmentData!['_id'];
      if (shipmentId == null) return;

      print('📋 [ShipmentDetails] Loading required documents for: $shipmentId');

      final response = await ApiService.getRequiredDocuments(
        shipmentId: shipmentId,
      );

      if (response['success'] == true) {
        final docs = List<Map<String, dynamic>>.from(
          response['requiredDocuments'] ?? [],
        );

        if (mounted) {
          setState(() => _requiredDocuments = docs);
        }
        print('✅ [ShipmentDetails] Loaded ${docs.length} required documents');
      }
    } catch (e) {
      print('❌ [ShipmentDetails] Error loading required documents: $e');
    }
  }

  int get _currentStatusIndex {
    if (_shipmentData == null) return 0;
    final status = _shipmentData!['status'] ?? 'Pending';
    return _statusIndexMap[status] ?? 0;
  }

  Future<void> _handleDocumentUpload(String documentType) async {
    try {
      final file = await FilePickerHelper.pickFile(context);
      if (file == null) return;

      if (!mounted) return;
      AlNoranPopups.showLoading(
        context: context,
        message: 'جاري رفع المستند...',
      );

      final userData = await ApiService.getUserData();
      final userId = userData['id'];
      if (userId == null) {
        context.pop();
        if (mounted) {
          AlNoranPopups.showError(
            context: context,
            message: 'يجب تسجيل الدخول أولاً',
          );
        }
        return;
      }

      final uploadResult = await ApiService.uploadToS3(
        file: file,
        category: 'shipment',
        documentType: documentType,
        description: 'مستند للشحنة ${widget.shipmentId}',
        tags: [documentType, widget.shipmentId],
        userType: 'client',
      );

      context.pop(); // Close loading

      if (uploadResult['success'] == true) {
        if (mounted) {
          await AlNoranPopups.showSuccess(
            context: context,
            title: 'تم الرفع بنجاح',
            message: 'تم رفع المستند بنجاح',
          );
        }
        _loadRequiredDocuments(); // Reload documents
      } else {
        if (mounted) {
          AlNoranPopups.showError(
            context: context,
            message: uploadResult['message'] ?? 'فشل رفع المستند',
          );
        }
      }
    } catch (e) {
      if (mounted) {
        context.pop(); // Close loading if open
      }
      print('❌ [ShipmentDetails] Upload error: $e');
      if (mounted) {
        AlNoranPopups.showError(
          context: context,
          message: 'حدث خطأ أثناء رفع المستند',
        );
      }
    }
  }

  void _showUploadDialog(String documentTitle, String documentType) {
    showDialog(
      context: context,
      builder: (BuildContext dialogContext) {
        return Dialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Close button
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        'ارفع $documentTitle',
                        textAlign: TextAlign.right,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(dialogContext),
                      icon: const Icon(Icons.close),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                  ],
                ),

                const SizedBox(height: 32),

                // Upload options
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    // Camera option
                    _buildUploadOption(
                      icon: Icons.camera_alt,
                      label: 'التقط صورة $documentTitle',
                      onTap: () async {
                        Navigator.pop(dialogContext);
                        await _handleDocumentUpload(documentType);
                      },
                    ),

                    // Gallery option
                    _buildUploadOption(
                      icon: Icons.photo_library,
                      label: 'تصفح الملفات',
                      onTap: () async {
                        Navigator.pop(dialogContext);
                        await _handleDocumentUpload(documentType);
                      },
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                // Confirm button
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(dialogContext),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primaryDark,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: const Text(
                      'إلغاء',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: const Color(0xFFF5F5F5),
        body: SafeArea(
          child: Column(
            children: [
              _buildTopBar(),
              Expanded(
                child: _isLoading ? _buildLoadingState() : _buildContent(),
              ),
            ],
          ),
        ),
        floatingActionButton:
            _shipmentData != null
                ? FloatingActionButton.extended(
                  onPressed: () {
                    context.push(
                      '/chat/${widget.shipmentId}',
                      extra: {'employeeName': _userData?['name'] ?? 'مستخدم'},
                    );
                  },
                  backgroundColor: primaryDark,
                  icon: const Icon(Icons.chat_bubble, color: Colors.white),
                  label: const Text(
                    'تواصل مع الدعم',
                    style: TextStyle(fontFamily: 'Cairo', color: Colors.white),
                  ),
                )
                : null,
        floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      ),
    );
  }

  Widget _buildTopBar() {
    final String userName =
        _userData?['fullname'] ?? _userData?['username'] ?? 'مستخدم';
    final String userEmail = _userData?['email'] ?? '';
    String firstName = userName.split(' ').first;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF690000),
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(25),
          bottomRight: Radius.circular(25),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              InkWell(
                onTap: () {
                  context.push('/profile');
                },
                borderRadius: BorderRadius.circular(50),
                child: Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: Colors.white.withOpacity(0.3),
                      width: 2,
                    ),
                  ),
                  child: const CircleAvatar(
                    radius: 20,
                    backgroundColor: Colors.white,
                    child: Icon(
                      Icons.person,
                      color: Color(0xFF690000),
                      size: 24,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Stack(
                children: [
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: IconButton(
                      icon: const Icon(
                        Icons.notifications,
                        color: Colors.white,
                        size: 24,
                      ),
                      onPressed: () {},
                    ),
                  ),
                  Positioned(
                    right: 8,
                    top: 8,
                    child: Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: const Color(0xFF1ba3b6),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
          Column(
            children: [
              Text(
                firstName,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 19,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Cairo',
                ),
              ),
              Text(
                userEmail,
                style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 12,
                  fontFamily: 'Cairo',
                ),
              ),
            ],
          ),
          Container(
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: IconButton(
              icon: const Icon(
                Icons.arrow_forward,
                color: Colors.white,
                size: 24,
              ),
              onPressed: () {
                context.pop();
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingState() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(color: primaryDark),
          SizedBox(height: 16),
          Text(
            'جاري تحميل بيانات الشحنة...',
            style: TextStyle(color: Colors.grey, fontSize: 16),
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    if (_shipmentData == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            const Text(
              'لم يتم العثور على الشحنة',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'الشحنة رقم: ${widget.shipmentId}',
              style: TextStyle(color: Colors.grey[600]),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.pop(),
              style: ElevatedButton.styleFrom(
                backgroundColor: primaryDark,
                foregroundColor: Colors.white,
              ),
              child: const Text('العودة'),
            ),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 16),

          // Header with shipment number
          _buildHeader(),

          const SizedBox(height: 16),

          // Expandable Section 1: Shipment Details
          _buildExpandableSection(
            title: 'تفاصيل الشحنة',
            icon: Icons.inventory_2_outlined,
            isExpanded: _isDetailsExpanded,
            onTap: () {
              setState(() {
                _isDetailsExpanded = !_isDetailsExpanded;
              });
            },
            child: _buildDetailsSection(),
          ),

          const SizedBox(height: 12),

          // Expandable Section 2: Tracking Timeline
          _buildExpandableSection(
            title: 'تتبع الشحنة',
            icon: Icons.timeline_outlined,
            isExpanded: _isTrackingExpanded,
            onTap: () {
              setState(() {
                _isTrackingExpanded = !_isTrackingExpanded;
              });
            },
            child: _buildTrackingSection(),
          ),

          const SizedBox(height: 12),

          // Expandable Section 3: Required Documents
          _buildExpandableSection(
            title: 'المستندات المرفوعة',
            icon: Icons.folder_outlined,
            isExpanded: _isDocumentsExpanded,
            onTap: () {
              setState(() {
                _isDocumentsExpanded = !_isDocumentsExpanded;
              });
            },
            child: _buildDocumentsSection(),
          ),

          const SizedBox(height: 80),
        ],
      ),
    );
  }

  Widget _buildExpandableSection({
    required String title,
    required IconData icon,
    required bool isExpanded,
    required VoidCallback onTap,
    required Widget child,
  }) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(16),
            child: Container(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: primaryDark.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(icon, color: primaryDark, size: 24),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      title,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Cairo',
                        color: Color(0xFF2C2C2C),
                      ),
                    ),
                  ),
                  AnimatedRotation(
                    turns: isExpanded ? 0.5 : 0,
                    duration: const Duration(milliseconds: 300),
                    child: Icon(
                      Icons.keyboard_arrow_down,
                      color: Colors.grey[600],
                      size: 28,
                    ),
                  ),
                ],
              ),
            ),
          ),
          AnimatedCrossFade(
            firstChild: const SizedBox.shrink(),
            secondChild: Column(
              children: [
                Divider(height: 1, thickness: 1, color: Colors.grey[200]),
                Padding(padding: const EdgeInsets.all(16), child: child),
              ],
            ),
            crossFadeState:
                isExpanded
                    ? CrossFadeState.showSecond
                    : CrossFadeState.showFirst,
            duration: const Duration(milliseconds: 300),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    final status = _shipmentData?['status'] ?? 'غير محدد';
    final statusColor = _getStatusColor(status);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [primaryDark, primaryDark.withOpacity(0.8)],
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: primaryDark.withOpacity(0.3),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.local_shipping,
                  color: Colors.white,
                  size: 28,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'رقم الشحنة',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 13,
                        fontFamily: 'Cairo',
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      widget.shipmentId,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Cairo',
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.2),
              border: Border.all(color: Colors.white.withOpacity(0.3)),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  status,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
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

  Color _getStatusColor(String status) {
    switch (status) {
      case 'تمت بنجاح':
      case 'Completed':
        return Colors.green;
      case 'قيد الانتظار':
      case 'Pending':
        return Colors.orange;
      case 'في الطريق':
        return Colors.blue;
      default:
        return accent;
    }
  }

  Widget _buildDetailsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_shipmentData!['shipmentDescription'] != null)
          _buildDetailCard(
            icon: Icons.description,
            label: 'وصف الشحنة',
            value: _shipmentData!['shipmentDescription'],
          ),
        if (_shipmentData!['importerName'] != null)
          _buildDetailCard(
            icon: Icons.business,
            label: 'اسم المورد',
            value: _shipmentData!['importerName'],
          ),
        if (_shipmentData!['number46'] != null)
          _buildDetailCard(
            icon: Icons.confirmation_number,
            label: 'رقم 46',
            value: _shipmentData!['number46'],
          ),
        if (_shipmentData!['employerName'] != null)
          _buildDetailCard(
            icon: Icons.person_outline,
            label: 'اسم صاحب العمل',
            value: _shipmentData!['employerName'],
          ),
        if (_shipmentData!['country'] != null)
          _buildDetailCard(
            icon: Icons.public,
            label: 'البلد',
            value: _shipmentData!['country'],
          ),
        if (_shipmentData!['port_name'] != null)
          _buildDetailCard(
            icon: Icons.anchor,
            label: 'اسم الميناء',
            value: _shipmentData!['port_name'],
          ),
        if (_shipmentData!['num_of_containers'] != null)
          _buildDetailCard(
            icon: Icons.inventory_2_outlined,
            label: 'عدد الحاويات',
            value: _shipmentData!['num_of_containers'].toString(),
          ),
        if (_shipmentData!['type_of_containers'] != null &&
            (_shipmentData!['type_of_containers'] as List).isNotEmpty)
          _buildDetailCard(
            icon: Icons.category,
            label: 'نوع الحاويات',
            value: (_shipmentData!['type_of_containers'] as List).join(', '),
          ),
        if (_shipmentData!['third_gomroky'] != null &&
            (_shipmentData!['third_gomroky'] as List).isNotEmpty)
          _buildDetailCard(
            icon: Icons.format_list_numbered,
            label: 'البنود الجمركية',
            value: (_shipmentData!['third_gomroky'] as List).join(', '),
          ),
        if (_shipmentData!['arrivalDate'] != null)
          _buildDetailCard(
            icon: Icons.calendar_today,
            label: 'تاريخ الوصول',
            value: _formatDate(_shipmentData!['arrivalDate']),
          ),
      ],
    );
  }

  Widget _buildDetailCard({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF5F5F5),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: accent.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: accent, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                    fontFamily: 'Cairo',
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
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

  Widget _buildTrackingSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Timeline
        ...List.generate(_trackingSteps.length, (index) {
          final step = _trackingSteps[index];
          final isLast = index == _trackingSteps.length - 1;
          final isCurrent = index == _currentStatusIndex;
          final isCompleted = index <= _currentStatusIndex;

          return _buildTimelineItem(
            title: step['title'],
            isCompleted: isCompleted,
            isCurrent: isCurrent,
            isLast: isLast,
          );
        }),
      ],
    );
  }

  Widget _buildTimelineItem({
    required String title,
    required bool isCompleted,
    required bool isCurrent,
    required bool isLast,
  }) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Timeline indicator
          Column(
            children: [
              Container(
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isCompleted || isCurrent ? accent : Colors.grey[300],
                  border: Border.all(
                    color:
                        isCompleted || isCurrent ? accent : Colors.grey[400]!,
                    width: 2,
                  ),
                ),
                child:
                    isCompleted
                        ? const Icon(Icons.check, color: Colors.white, size: 14)
                        : null,
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 2,
                    margin: const EdgeInsets.symmetric(vertical: 4),
                    decoration: BoxDecoration(
                      border: Border(
                        right: BorderSide(
                          color: isCompleted ? accent : Colors.grey[300]!,
                          width: 2,
                          style: BorderStyle.solid,
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),

          const SizedBox(width: 16),

          // Title
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 24),
              child: Text(
                title,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
                  color:
                      isCompleted || isCurrent
                          ? Colors.black
                          : Colors.grey[600],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDocumentsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // عرض المستندات المطلوبة من الموظف
        if (_requiredDocuments.isNotEmpty)
          ..._requiredDocuments.map((doc) {
            final docName = doc['name'] ?? 'مستند';
            final isUploaded = doc['uploaded'] == true;
            final uploadedAt = doc['uploadedAt'];

            return _buildDocumentItem({
              'title': docName,
              'status': isUploaded ? 'uploaded' : 'pending',
              'required': true,
              'uploadDate': uploadedAt != null ? _formatDate(uploadedAt) : null,
              'type': 'required',
              '_id': doc['_id'],
            });
          }).toList()
        else
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 20),
            child: Center(
              child: Text(
                'لا توجد مستندات مطلوبة حالياً',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey,
                  fontFamily: 'Cairo',
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildDocumentItem(Map<String, dynamic> doc) {
    final isUploaded = doc['status'] == 'uploaded';
    final isRequired = doc['required'] == true;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: Colors.grey[300]!),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          // Document icon (يمين)
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color:
                  isUploaded
                      ? Colors.green
                      : (isRequired ? primaryLight : Colors.grey[300]),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Icon(
              Icons.description,
              color: isUploaded || isRequired ? Colors.white : Colors.grey[600],
            ),
          ),

          const SizedBox(width: 12),

          // Document info (وسط)
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  doc['title'],
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (doc['uploadDate'] != null)
                  Text(
                    'تم الرفع في ${doc['uploadDate']}',
                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                  )
                else if (isRequired)
                  const Text(
                    'مطلوب',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.red,
                      fontWeight: FontWeight.bold,
                    ),
                  )
                else
                  Text(
                    'اختياري',
                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                  ),
              ],
            ),
          ),

          const SizedBox(width: 12),

          // Action icon (شمال)
          GestureDetector(
            onTap:
                isUploaded
                    ? null
                    : () => _showUploadDialog(doc['title'], doc['type']),
            child: Icon(
              isUploaded ? Icons.check_circle : Icons.upload_file,
              color: isUploaded ? Colors.green : primaryDark,
              size: 24,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUploadOption({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: accent.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, size: 40, color: accent),
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: 120,
            child: Text(
              label,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 12, height: 1.3),
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(dynamic date) {
    if (date == null) return 'غير محدد';
    try {
      final DateTime dateTime = DateTime.parse(date.toString());
      final months = [
        'يناير',
        'فبراير',
        'مارس',
        'أبريل',
        'مايو',
        'يونيو',
        'يوليو',
        'أغسطس',
        'سبتمبر',
        'أكتوبر',
        'نوفمبر',
        'ديسمبر',
      ];
      return '${dateTime.day} ${months[dateTime.month - 1]} ${dateTime.year}';
    } catch (e) {
      return 'غير محدد';
    }
  }
}
