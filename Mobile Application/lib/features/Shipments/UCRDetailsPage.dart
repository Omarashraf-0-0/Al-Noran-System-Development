import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/network/api_service.dart';
import '../../core/widgets/unified_top_bar.dart';
import '../../core/services/user_cache_service.dart';
import '../../core/services/notification_service.dart';
import '../../Pop-ups/al_noran_popups.dart';
import '../../util/file_picker_helper.dart';

class UcrDetailsPage extends StatefulWidget {
  final String ucrRequestId;

  const UcrDetailsPage({super.key, required this.ucrRequestId});

  @override
  State<UcrDetailsPage> createState() => _UcrDetailsPageState();
}

class _UcrDetailsPageState extends State<UcrDetailsPage> {
  // Colors
  static const Color primaryDark = Color(0xFF690000);
  static const Color primaryLight = Color(0xFFA40000);
  static const Color accent = Color(0xFF1BA3B6);

  // User cache service
  final UserCacheService _userCache = UserCacheService();

  // Loading state
  bool _isLoading = true;
  Map<String, dynamic>? _ucrData;
  Map<String, dynamic>? _exportShipmentData;
  List<Map<String, dynamic>> _uploadedDocuments = [];

  // Expansion states for dropdown menus
  bool _isDetailsExpanded = true;
  bool _isTrackingExpanded = false;
  bool _isDocumentsExpanded = false;
  bool _isItemsExpanded = false;
  bool _isShipmentTrackingExpanded = false;

  // UCR Status mapping - Arabic status display (UCR Request stages only)
  final Map<String, int> _statusIndexMap = <String, int>{
    'pending': 0,
    'under_review': 1,
    'approved': 2,
    'ucr_issued': 3,
    'rejected': -1,
    'needs_revision': -1,
  };

  // Export Shipment Status mapping
  final Map<String, int> _shipmentStatusIndexMap = <String, int>{
    'documents_verification': 0,
    'regulatory_inspection': 1,
    'payment_cleared': 2,
    'goods_loaded': 3,
    'in_transit': 4,
    'delivered': 5,
    'completed': 6,
    'cancelled': -1,
  };

  final List<Map<String, dynamic>> _trackingSteps = [
    {
      'title': 'في انتظار المراجعة',
      'status': 'pending',
      'icon': Icons.hourglass_empty,
    },
    {'title': 'قيد التدقيق', 'status': 'under_review', 'icon': Icons.search},
    {'title': 'معتمد', 'status': 'approved', 'icon': Icons.thumb_up},
    {'title': 'تم إصدار UCR', 'status': 'ucr_issued', 'icon': Icons.verified},
  ];

  // Export Shipment Tracking Steps (after UCR is issued)
  final List<Map<String, dynamic>> _shipmentTrackingSteps = [
    {
      'title': 'التحقق من المستندات',
      'status': 'documents_verification',
      'icon': Icons.description_outlined,
    },
    {
      'title': 'فحص الجهات الرقابية',
      'status': 'regulatory_inspection',
      'icon': Icons.policy_outlined,
    },
    {
      'title': 'تم السداد',
      'status': 'payment_cleared',
      'icon': Icons.payment_outlined,
    },
    {
      'title': 'تم التحميل',
      'status': 'goods_loaded',
      'icon': Icons.inventory_2_outlined,
    },
    {
      'title': 'في الطريق',
      'status': 'in_transit',
      'icon': Icons.local_shipping_outlined,
    },
    {
      'title': 'تم التسليم',
      'status': 'delivered',
      'icon': Icons.check_circle_outline,
    },
    {'title': 'مكتمل', 'status': 'completed', 'icon': Icons.done_all},
  ];

  @override
  void initState() {
    super.initState();
    _initializeData();
  }

  Future<void> _initializeData() async {
    try {
      // Initialize user cache (will use cached data if available)
      await _userCache.initialize();

      // Load UCR request data
      await _loadUcrData();
    } catch (e) {
      print('❌ [UcrDetails] Error loading data: $e');
    }
  }

  Future<void> _loadUcrData() async {
    try {
      print('📦 [UcrDetails] Loading UCR request: ${widget.ucrRequestId}');

      final response = await ApiService.getUcrRequestById(
        id: widget.ucrRequestId,
      );

      if (response['success'] == true && response['data'] != null) {
        final ucrData = response['data'];

        // Check if export shipment exists and load it
        Map<String, dynamic>? exportShipment;
        if (ucrData['hasExportShipment'] == true &&
            ucrData['exportShipmentId'] != null) {
          try {
            final shipmentId =
                ucrData['exportShipmentId'] is Map
                    ? ucrData['exportShipmentId']['_id']
                    : ucrData['exportShipmentId'];

            print('🚢 [UcrDetails] Loading export shipment: $shipmentId');
            final shipmentResponse = await ApiService.getExportShipmentById(
              id: shipmentId,
            );

            if (shipmentResponse['success'] == true &&
                shipmentResponse['data'] != null) {
              exportShipment = shipmentResponse['data'];
              print(
                '🚢 [UcrDetails] Export shipment loaded: ${exportShipment?['currentStatus']}',
              );
            }
          } catch (e) {
            print('⚠️ [UcrDetails] Error loading export shipment: $e');
          }
        }

        if (mounted) {
          setState(() {
            _ucrData = ucrData;
            _exportShipmentData = exportShipment;
            _isLoading = false;
            // Extract uploaded documents
            _extractUploadedDocuments();
          });
        }
        print('📦 [UcrDetails] Loaded: $_ucrData');
      } else {
        if (mounted) {
          setState(() => _isLoading = false);
          AlNoranPopups.showError(
            context: context,
            message: response['message'] ?? 'فشل تحميل بيانات الطلب',
          );
        }
      }
    } catch (e) {
      print('❌ [UcrDetails] Error: $e');
      if (mounted) {
        setState(() => _isLoading = false);
        AlNoranPopups.showError(
          context: context,
          message: 'حدث خطأ أثناء تحميل بيانات الطلب',
        );
      }
    }
  }

  void _extractUploadedDocuments() {
    if (_ucrData == null) return;

    final uploads = _ucrData!['uploads'] as List<dynamic>? ?? [];
    _uploadedDocuments =
        uploads.map((upload) {
          if (upload is Map<String, dynamic>) {
            return upload;
          } else if (upload is String) {
            return {'_id': upload, 'filename': 'مستند'};
          }
          return <String, dynamic>{};
        }).toList();

    print('📄 [UcrDetails] Extracted ${_uploadedDocuments.length} documents');
  }

  int get _currentStatusIndex {
    if (_ucrData == null) return 0;
    final status = (_ucrData!['status'] ?? 'pending').toString().toLowerCase();
    if (status == 'rejected' || status == 'needs_revision')
      return -1; // Special case for rejected/needs revision
    return _statusIndexMap[status] ?? 0;
  }

  int get _currentShipmentStatusIndex {
    if (_exportShipmentData == null) return 0;
    final status =
        (_exportShipmentData!['currentStatus'] ?? 'documents_verification')
            .toString()
            .toLowerCase();
    if (status == 'cancelled') return -1;
    return _shipmentStatusIndexMap[status] ?? 0;
  }

  String _translateShipmentStatus(String status) {
    final statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'documents_verification':
        return 'التحقق من المستندات';
      case 'regulatory_inspection':
        return 'فحص الجهات الرقابية';
      case 'payment_cleared':
        return 'تم السداد';
      case 'goods_loaded':
        return 'تم التحميل';
      case 'in_transit':
        return 'في الطريق';
      case 'delivered':
        return 'تم التسليم';
      case 'completed':
        return 'مكتمل';
      case 'cancelled':
        return 'ملغي';
      default:
        return status;
    }
  }

  String _translateStatus(String status) {
    final statusLower = status.toLowerCase();
    switch (statusLower) {
      // UCR Request Statuses
      case 'pending':
        return 'في انتظار المراجعة';
      case 'under_review':
        return 'قيد التدقيق';
      case 'approved':
        return 'معتمد';
      case 'needs_revision':
        return 'يحتاج تعديل';
      case 'ucr_issued':
        return 'تم إصدار UCR';
      case 'rejected':
        return 'مرفوض';
      default:
        return status;
    }
  }

  // Mapping Arabic document names to valid enum values
  String _mapDocumentTypeToEnum(String arabicName) {
    final mappings = {
      // UCR/Export documents
      'التنازل البنكي': 'bank_waiver',
      'تنازل بنكي': 'bank_waiver',
      'الفاتورة الأصلية': 'export_invoice',
      'فاتورة التصدير': 'export_invoice',
      'كشف العبوة': 'export_packing_list',
      'قائمة التعبئة': 'export_packing_list',
      'إذن الشحن': 'shipping_permit',
      'بوليصة الشحن الجوي': 'awb',
      'AWB': 'awb',
      'بوليصة الشحن البحري': 'bl',
      'B/L': 'bl',
      // Other documents
      'السجل التجاري': 'commercial_register',
      'البطاقة الضريبية': 'tax_card',
      'العقد': 'contract',
      'السجل الصناعي': 'industrial_register',
      'شهادة القيمة المضافة': 'certificate_vat',
      'مستلزمات الإنتاج': 'production_supplies',
      'التوكيل': 'power_of_attorney',
      'البطاقة الشخصية': 'personal_id',
      'أخرى': 'other',
      'اخرى': 'other',
      'مستند': 'other',
    };

    // Try exact match first
    if (mappings.containsKey(arabicName)) {
      return mappings[arabicName]!;
    }

    // Try partial match
    for (var entry in mappings.entries) {
      if (arabicName.contains(entry.key) || entry.key.contains(arabicName)) {
        return entry.value;
      }
    }

    // Default to 'other' if no match found
    print('⚠️ [DocumentType] No mapping found for: $arabicName, using "other"');
    return 'other';
  }

  Future<void> _handleDocumentUpload(String documentName) async {
    try {
      // Pick file
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

      // Get the UCR request ID for relatedId
      final ucrId = _ucrData?['_id'];
      if (ucrId == null) {
        context.pop();
        if (mounted) {
          AlNoranPopups.showError(
            context: context,
            message: 'معرف الطلب غير متوفر',
          );
        }
        return;
      }

      // Map Arabic document name to valid enum value
      final documentType = _mapDocumentTypeToEnum(documentName);
      print('📤 [Upload] Document name: $documentName -> Type: $documentType');

      final uploadResult = await ApiService.uploadFile(
        filePath: file.path,
        category: 'ucr_request',
        documentType: documentType,
        relatedId: ucrId,
      );

      print('📤 [Upload] Result: $uploadResult');

      if (uploadResult['success'] == true) {
        context.pop(); // Close loading

        if (mounted) {
          await AlNoranPopups.showSuccess(
            context: context,
            title: 'تم الرفع بنجاح',
            message: 'تم رفع المستند بنجاح',
          );
        }
        // Refresh notifications
        NotificationService().refresh();
        _loadUcrData(); // Reload data
      } else {
        context.pop(); // Close loading
        if (mounted) {
          AlNoranPopups.showError(
            context: context,
            message: uploadResult['message'] ?? 'فشل رفع المستند',
          );
        }
      }
    } catch (e) {
      if (mounted) {
        try {
          context.pop(); // Close loading if open
        } catch (_) {}
      }
      print('❌ [UcrDetails] Upload error: $e');
      if (mounted) {
        AlNoranPopups.showError(
          context: context,
          message: 'حدث خطأ أثناء رفع المستند',
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: const Color(0xFFF5F5F5),
        body: Column(
          children: [
            // Using UnifiedTopBar for consistent UI and cached user data
            UnifiedTopBar(showBackButton: true, showMenu: false),
            Expanded(
              child: _isLoading ? _buildLoadingState() : _buildContent(),
            ),
          ],
        ),
        floatingActionButton:
            _ucrData != null
                ? FloatingActionButton.extended(
                  onPressed: () {
                    context.push(
                      '/chat/${widget.ucrRequestId}',
                      extra: {
                        'employeeName': _userCache.userName,
                        'isUcr': true,
                      },
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

  Widget _buildLoadingState() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(color: primaryDark),
          SizedBox(height: 16),
          Text(
            'جاري تحميل بيانات الطلب...',
            style: TextStyle(
              color: Colors.grey,
              fontSize: 16,
              fontFamily: 'Cairo',
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    if (_ucrData == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            const Text(
              'لم يتم العثور على الطلب',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                fontFamily: 'Cairo',
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'الطلب رقم: ${widget.ucrRequestId}',
              style: TextStyle(color: Colors.grey[600], fontFamily: 'Cairo'),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.pop(),
              style: ElevatedButton.styleFrom(
                backgroundColor: primaryDark,
                foregroundColor: Colors.white,
              ),
              child: const Text(
                'العودة',
                style: TextStyle(fontFamily: 'Cairo'),
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadUcrData,
      color: primaryDark,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 16),

            // Header with UCR info
            _buildHeader(),

            const SizedBox(height: 16),

            // UCR Number (if issued)
            if (_ucrData!['ucrNumber'] != null) ...[
              _buildUcrNumberCard(),
              const SizedBox(height: 16),
            ],

            // Note: After UCR issued, shipment will be created
            if (_ucrData!['status']?.toString().toLowerCase() == 'ucr_issued' &&
                _ucrData!['hasExportShipment'] == true) ...[
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.green.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.green.shade200),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.info_outline,
                      color: Colors.green.shade700,
                      size: 24,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'تم إنشاء شحنة التصدير',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'Cairo',
                              color: Colors.green.shade900,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'تم تحويل طلب UCR إلى شحنة تصدير. يمكنك متابعة مراحل الشحن من صفحة الصادر.',
                            style: TextStyle(
                              fontSize: 12,
                              fontFamily: 'Cairo',
                              color: Colors.green.shade700,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Expandable Section 1: Request Details
            _buildExpandableSection(
              title: 'تفاصيل الطلب',
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
              title: 'تتبع طلب UCR',
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

            // Expandable Section 2.5: Export Shipment Tracking (if shipment exists)
            if (_exportShipmentData != null) ...[
              _buildExpandableSection(
                title: 'تتبع الشحنة',
                icon: Icons.local_shipping_outlined,
                isExpanded: _isShipmentTrackingExpanded,
                onTap: () {
                  setState(() {
                    _isShipmentTrackingExpanded = !_isShipmentTrackingExpanded;
                  });
                },
                child: _buildShipmentTrackingSection(),
              ),
              const SizedBox(height: 12),
            ],

            // Expandable Section 3: Items
            if (_ucrData!['items'] != null &&
                (_ucrData!['items'] as List).isNotEmpty) ...[
              _buildExpandableSection(
                title: 'تفاصيل البنود',
                icon: Icons.list_alt,
                isExpanded: _isItemsExpanded,
                onTap: () {
                  setState(() {
                    _isItemsExpanded = !_isItemsExpanded;
                  });
                },
                child: _buildItemsSection(),
              ),
              const SizedBox(height: 12),
            ],

            // Expandable Section 4: Uploaded Documents
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
    final status = _ucrData?['status'] ?? 'Pending';
    final statusColor = _getStatusColor(status);
    final certificationType = _ucrData?['certificationType'] ?? 'noran';
    final shippingMethod = _ucrData?['shippingMethod'] ?? 'sea';
    final isSea = shippingMethod == 'sea';

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
          // Header Row with Icon and Info
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  isSea
                      ? Icons.directions_boat_rounded
                      : Icons.flight_takeoff_rounded,
                  color: Colors.white,
                  size: 28,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'طلب تصدير',
                            style: TextStyle(
                              color: primaryDark,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'Cairo',
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: (isSea ? accent : Colors.orange).withOpacity(
                              0.3,
                            ),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                isSea
                                    ? Icons.directions_boat
                                    : Icons.flight_takeoff,
                                size: 12,
                                color: Colors.white,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                isSea ? 'بحري' : 'جوي',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  fontFamily: 'Cairo',
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    // Certification Type
                    Row(
                      children: [
                        Icon(
                          certificationType == 'noran'
                              ? Icons.business
                              : Icons.person,
                          color: Colors.white70,
                          size: 14,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          certificationType == 'noran'
                              ? 'على بطاقة الشركة'
                              : 'على بطاقتي',
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 12,
                            fontFamily: 'Cairo',
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    // Destination
                    Text(
                      _ucrData?['destinationCountry'] ?? 'غير محدد',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
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
          // Status Badge
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
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  _translateStatus(status),
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

  Widget _buildUcrNumberCard() {
    final ucrNumber = _ucrData!['ucrNumber'];
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.green.shade400, Colors.green.shade600],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.green.withOpacity(0.3),
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
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.verified, color: Colors.white, size: 28),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'رقم UCR',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                    fontFamily: 'Cairo',
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  ucrNumber,
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
          IconButton(
            onPressed: () {
              // Copy to clipboard
              // Clipboard.setData(ClipboardData(text: ucrNumber));
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text(
                    'تم نسخ رقم UCR',
                    style: TextStyle(fontFamily: 'Cairo'),
                  ),
                  backgroundColor: Colors.green,
                  duration: Duration(seconds: 2),
                ),
              );
            },
            icon: const Icon(Icons.copy, color: Colors.white),
            tooltip: 'نسخ',
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    final statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'completed':
        return Colors.green;
      case 'approved':
      case 'ucr_issued':
      case 'ready_to_ship':
        return Colors.teal;
      case 'pending':
      case 'needs_revision':
      case 'awaiting_regulatory_approval':
      case 'certificate_of_origin_pending':
        return Colors.orange;
      case 'under_review':
      case 'documents_prepared':
      case 'customs_entry_46':
        return Colors.blue;
      case 'rejected':
        return Colors.red;
      default:
        return accent;
    }
  }

  Widget _buildDetailsSection() {
    final shippingMethod = _ucrData!['shippingMethod'] ?? 'sea';
    final seaShipmentType = _ucrData!['seaShipmentType'] ?? 'fcl';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Destination
        _buildDetailCard(
          icon: Icons.public,
          label: 'بلد الوجهة',
          value: _ucrData!['destinationCountry'] ?? 'غير محدد',
        ),
        if (_ucrData!['destinationPort'] != null)
          _buildDetailCard(
            icon: Icons.anchor,
            label: 'ميناء الوصول',
            value: _ucrData!['destinationPort'],
          ),

        // Goods Info
        _buildDetailCard(
          icon: Icons.description,
          label: 'وصف البضاعة',
          value: _ucrData!['generalDescription'] ?? 'غير محدد',
        ),
        _buildDetailCard(
          icon: Icons.scale,
          label: 'الوزن الكلي',
          value:
              '${_ucrData!['totalWeight'] ?? 0} ${_ucrData!['weightUnit'] == 'tons' ? 'طن' : 'كجم'}',
        ),

        // Packages count (if available)
        if (_ucrData!['packagesCount'] != null)
          _buildDetailCard(
            icon: Icons.inventory,
            label: 'عدد الطرود',
            value: '${_ucrData!['packagesCount']}',
          ),

        // Sea shipment specific
        if (shippingMethod == 'sea') ...[
          _buildDetailCard(
            icon: Icons.directions_boat,
            label: 'نوع الشحنة البحرية',
            value: _translateSeaShipmentType(seaShipmentType),
          ),
          if (seaShipmentType == 'fcl' && _ucrData!['containersCount'] != null)
            _buildDetailCard(
              icon: Icons.view_in_ar,
              label: 'عدد الحاويات',
              value: '${_ucrData!['containersCount']}',
            ),
        ],

        // Invoice Info
        _buildDetailCard(
          icon: Icons.attach_money,
          label: 'القيمة بالجنيه المصري',
          value: '${_formatNumber(_ucrData!['valueInEGP'] ?? 0)} ج.م',
        ),
        if (_ucrData!['originalInvoiceNumber'] != null)
          _buildDetailCard(
            icon: Icons.receipt,
            label: 'رقم الفاتورة',
            value: _ucrData!['originalInvoiceNumber'],
          ),
        if (_ucrData!['invoiceDate'] != null)
          _buildDetailCard(
            icon: Icons.calendar_today,
            label: 'تاريخ الفاتورة',
            value: _formatDate(_ucrData!['invoiceDate']),
          ),

        // Fee (for noran certification)
        if (_ucrData!['calculatedFee'] != null)
          _buildDetailCard(
            icon: Icons.payment,
            label: 'رسوم التصدير',
            value: '${_formatNumber(_ucrData!['calculatedFee'])} ج.م',
            valueColor: Colors.green,
          ),

        // Notes
        if (_ucrData!['clientNotes'] != null &&
            _ucrData!['clientNotes'].toString().isNotEmpty)
          _buildDetailCard(
            icon: Icons.note,
            label: 'ملاحظات',
            value: _ucrData!['clientNotes'],
          ),

        // Created Date
        if (_ucrData!['createdAt'] != null)
          _buildDetailCard(
            icon: Icons.access_time,
            label: 'تاريخ إنشاء الطلب',
            value: _formatDate(_ucrData!['createdAt']),
          ),
      ],
    );
  }

  String _translateSeaShipmentType(String type) {
    switch (type) {
      case 'fcl':
        return 'حاويات كاملة (FCL)';
      case 'lcl':
        return 'بضايع عامة (LCL)';
      case 'parcels':
        return 'طرود';
      default:
        return type;
    }
  }

  Widget _buildDetailCard({
    required IconData icon,
    required String label,
    required String value,
    Color? valueColor,
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
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    fontFamily: 'Cairo',
                    color: valueColor ?? Colors.black87,
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
    final status = (_ucrData?['status'] ?? 'pending').toString().toLowerCase();
    final isRejected = status == 'rejected';

    if (isRejected || status == 'needs_revision') {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.red.shade50,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.red.shade200),
        ),
        child: Row(
          children: [
            Icon(Icons.cancel, color: Colors.red.shade600, size: 32),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'تم رفض الطلب',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Cairo',
                      color: Colors.red.shade700,
                    ),
                  ),
                  if (_ucrData?['rejectionReason'] != null)
                    Text(
                      _ucrData!['rejectionReason'],
                      style: TextStyle(
                        fontSize: 13,
                        fontFamily: 'Cairo',
                        color: Colors.red.shade600,
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      );
    }

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
            icon: step['icon'],
            isCompleted: isCompleted,
            isCurrent: isCurrent,
            isLast: isLast,
          );
        }),
      ],
    );
  }

  /// Build Export Shipment Tracking Section
  Widget _buildShipmentTrackingSection() {
    if (_exportShipmentData == null) {
      return const Center(
        child: Text(
          'لا توجد بيانات شحنة',
          style: TextStyle(fontFamily: 'Cairo'),
        ),
      );
    }

    final status =
        (_exportShipmentData!['currentStatus'] ?? 'documents_verification')
            .toString()
            .toLowerCase();
    final isCancelled = status == 'cancelled';

    if (isCancelled) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.red.shade50,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.red.shade200),
        ),
        child: Row(
          children: [
            Icon(Icons.cancel, color: Colors.red.shade600, size: 32),
            const SizedBox(width: 12),
            const Expanded(
              child: Text(
                'تم إلغاء الشحنة',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Cairo',
                  color: Colors.red,
                ),
              ),
            ),
          ],
        ),
      );
    }

    // Show shipment info card at the top
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Shipment Number Card
        if (_exportShipmentData!['shipmentNumber'] != null)
          Container(
            margin: const EdgeInsets.only(bottom: 16),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: accent.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: accent.withOpacity(0.3)),
            ),
            child: Row(
              children: [
                Icon(Icons.local_shipping, color: accent, size: 24),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'رقم الشحنة',
                        style: TextStyle(
                          fontSize: 12,
                          fontFamily: 'Cairo',
                          color: Colors.grey,
                        ),
                      ),
                      Text(
                        _exportShipmentData!['shipmentNumber'] ?? 'غير محدد',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'Cairo',
                          color: accent,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: _getShipmentStatusColor(status),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    _translateShipmentStatus(status),
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Cairo',
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
          ),

        // Timeline
        ...List.generate(_shipmentTrackingSteps.length, (index) {
          final step = _shipmentTrackingSteps[index];
          final isLast = index == _shipmentTrackingSteps.length - 1;
          final isCurrent = index == _currentShipmentStatusIndex;
          final isCompleted = index <= _currentShipmentStatusIndex;

          return _buildTimelineItem(
            title: step['title'],
            icon: step['icon'],
            isCompleted: isCompleted,
            isCurrent: isCurrent,
            isLast: isLast,
            color: accent,
          );
        }),
      ],
    );
  }

  Color _getShipmentStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'documents_verification':
      case 'regulatory_inspection':
        return Colors.orange;
      case 'payment_cleared':
      case 'goods_loaded':
      case 'in_transit':
        return accent;
      case 'delivered':
      case 'completed':
        return Colors.green;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  Widget _buildTimelineItem({
    required String title,
    required IconData icon,
    required bool isCompleted,
    required bool isCurrent,
    required bool isLast,
    Color? color,
  }) {
    final itemColor = color ?? accent;
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Timeline indicator
          Column(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color:
                      isCompleted || isCurrent ? itemColor : Colors.grey[300],
                  border: Border.all(
                    color:
                        isCompleted || isCurrent
                            ? itemColor
                            : Colors.grey[400]!,
                    width: 2,
                  ),
                ),
                child:
                    isCompleted
                        ? const Icon(Icons.check, color: Colors.white, size: 18)
                        : Icon(
                          icon,
                          color: isCurrent ? Colors.white : Colors.grey[500],
                          size: 16,
                        ),
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 2,
                    margin: const EdgeInsets.symmetric(vertical: 4),
                    decoration: BoxDecoration(
                      border: Border(
                        right: BorderSide(
                          color: isCompleted ? itemColor : Colors.grey[300]!,
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
                  fontFamily: 'Cairo',
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

  Widget _buildItemsSection() {
    final items = _ucrData!['items'] as List<dynamic>? ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ...items.asMap().entries.map((entry) {
          final index = entry.key;
          final item = entry.value as Map<String, dynamic>;
          return _buildItemCard(index + 1, item);
        }).toList(),
      ],
    );
  }

  Widget _buildItemCard(int index, Map<String, dynamic> item) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF5F5F5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: primaryDark,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'البند $index',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Cairo',
                  ),
                ),
              ),
              if (item['hsCode'] != null &&
                  item['hsCode'].toString().isNotEmpty) ...[
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: accent.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    'HS: ${item['hsCode']}',
                    style: TextStyle(
                      fontSize: 11,
                      fontFamily: 'Cairo',
                      color: accent,
                    ),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 12),
          Text(
            item['description'] ?? 'غير محدد',
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              fontFamily: 'Cairo',
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              if (item['quantity'] != null)
                _buildItemDetail(
                  'الكمية',
                  '${item['quantity']} ${item['unit'] ?? ''}',
                ),
              if (item['weight'] != null)
                _buildItemDetail('الوزن', '${item['weight']} كجم'),
              if (item['value'] != null)
                _buildItemDetail(
                  'القيمة',
                  '${_formatNumber(item['value'])} ج.م',
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildItemDetail(String label, String value) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              color: Colors.grey[600],
              fontFamily: 'Cairo',
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              fontFamily: 'Cairo',
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDocumentsSection() {
    if (_uploadedDocuments.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 20),
          child: Column(
            children: [
              Icon(Icons.folder_open, size: 48, color: Colors.grey[400]),
              const SizedBox(height: 8),
              Text(
                'لا توجد مستندات مرفوعة',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                  fontFamily: 'Cairo',
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ..._uploadedDocuments.map((doc) {
          return _buildDocumentItem(doc);
        }).toList(),
      ],
    );
  }

  Widget _buildDocumentItem(Map<String, dynamic> doc) {
    final filename = doc['filename']?.toString() ?? 'مستند';
    final documentType = doc['documentType']?.toString() ?? '';
    final url = doc['url']?.toString();
    final mimetype = doc['mimetype']?.toString() ?? '';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: Colors.grey[300]!),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Document icon
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.green.shade400, Colors.green.shade600],
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.check_circle,
              color: Colors.white,
              size: 24,
            ),
          ),

          const SizedBox(width: 12),

          // Document info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _getDocumentDisplayName(documentType, filename),
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Cairo',
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  filename,
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.grey[600],
                    fontFamily: 'Cairo',
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),

          const SizedBox(width: 8),

          // View button
          if (url != null)
            Container(
              decoration: BoxDecoration(
                color: accent.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: IconButton(
                onPressed: () => _viewDocument(url, mimetype, filename),
                icon: const Icon(Icons.visibility),
                color: accent,
                tooltip: 'عرض',
              ),
            ),
        ],
      ),
    );
  }

  String _getDocumentDisplayName(String documentType, String filename) {
    final displayNames = {
      'bank_waiver': 'التنازل البنكي',
      'export_invoice': 'فاتورة التصدير',
      'export_packing_list': 'كشف العبوة',
      'shipping_permit': 'إذن الشحن',
      'awb': 'بوليصة الشحن الجوي',
      'bl': 'بوليصة الشحن البحري',
      'other': 'مستند آخر',
    };

    return displayNames[documentType] ?? filename;
  }

  Future<void> _viewDocument(
    String url,
    String mimetype,
    String filename,
  ) async {
    try {
      print('📄 [ViewDocument] Opening: $url');
      print('📄 [ViewDocument] Mimetype: $mimetype');

      // If it's an image, show in full screen viewer
      if (mimetype.contains('image')) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder:
                (context) => _ImageViewerPage(imageUrl: url, title: filename),
          ),
        );
      }
      // For PDF or other documents, open in external application
      else {
        try {
          final uri = Uri.parse(url);
          print('📄 [ViewDocument] Opening in external app: $uri');

          bool launched = await launchUrl(
            uri,
            mode: LaunchMode.externalApplication,
          );

          if (!launched) {
            launched = await launchUrl(uri);
          }

          if (!launched) {
            throw Exception('Failed to launch URL');
          }

          print('📄 [ViewDocument] Document opened successfully');
        } catch (e) {
          print('❌ [ViewDocument] Launch error: $e');
          if (mounted) {
            AlNoranPopups.showError(
              context: context,
              message: 'تعذر فتح المستند',
            );
          }
        }
      }
    } catch (e) {
      print('❌ [ViewDocument] Error: $e');
      if (mounted) {
        AlNoranPopups.showError(
          context: context,
          message: 'حدث خطأ في فتح المستند',
        );
      }
    }
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

  String _formatNumber(dynamic number) {
    if (number == null) return '0';
    try {
      final num value = number is String ? double.parse(number) : number;
      return value
          .toStringAsFixed(0)
          .replaceAllMapped(
            RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
            (Match m) => '${m[1]},',
          );
    } catch (e) {
      return number.toString();
    }
  }
}

// Image Viewer Page - Full screen image viewer with zoom
class _ImageViewerPage extends StatelessWidget {
  final String imageUrl;
  final String title;

  const _ImageViewerPage({required this.imageUrl, required this.title});

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(
          backgroundColor: Colors.black87,
          elevation: 0,
          automaticallyImplyLeading: false,
          title: Text(
            title,
            style: const TextStyle(
              fontFamily: 'Cairo',
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          centerTitle: true,
          actions: [
            Container(
              margin: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white),
                onPressed: () => Navigator.pop(context),
                tooltip: 'إغلاق',
              ),
            ),
          ],
        ),
        body: Center(
          child: InteractiveViewer(
            minScale: 0.5,
            maxScale: 4.0,
            child: Image.network(
              imageUrl,
              fit: BoxFit.contain,
              loadingBuilder: (context, child, loadingProgress) {
                if (loadingProgress == null) return child;
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      CircularProgressIndicator(
                        value:
                            loadingProgress.expectedTotalBytes != null
                                ? loadingProgress.cumulativeBytesLoaded /
                                    loadingProgress.expectedTotalBytes!
                                : null,
                        color: Colors.white,
                        strokeWidth: 3,
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'جاري تحميل الصورة...',
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          color: Colors.white70,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                );
              },
              errorBuilder: (context, error, stackTrace) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.error_outline,
                          color: Colors.white,
                          size: 64,
                        ),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'فشل تحميل الصورة',
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'تحقق من اتصال الإنترنت',
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          color: Colors.white.withOpacity(0.7),
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ),
        bottomNavigationBar: Container(
          color: Colors.black87,
          padding: const EdgeInsets.all(12),
          child: SafeArea(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.zoom_in,
                  color: Colors.white.withOpacity(0.7),
                  size: 20,
                ),
                const SizedBox(width: 8),
                Text(
                  'اسحب بإصبعين للتكبير والتصغير',
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    color: Colors.white.withOpacity(0.7),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
