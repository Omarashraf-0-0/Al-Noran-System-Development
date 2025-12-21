import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/network/api_service.dart';
import '../../core/widgets/unified_top_bar.dart';
import '../../core/services/user_cache_service.dart';
import '../../core/services/notification_service.dart';
import '../../Pop-ups/al_noran_popups.dart';
import '../../util/file_picker_helper.dart';

/// Export Shipment Details Page
/// Similar to ShipmentsDetailsPage but for export shipments (after UCR is issued)
class ExportShipmentDetailsPage extends StatefulWidget {
  final String shipmentId;

  const ExportShipmentDetailsPage({super.key, required this.shipmentId});

  @override
  State<ExportShipmentDetailsPage> createState() =>
      _ExportShipmentDetailsPageState();
}

class _ExportShipmentDetailsPageState extends State<ExportShipmentDetailsPage> {
  // Colors
  static const Color primaryDark = Color(0xFF690000);
  static const Color primaryLight = Color(0xFFA40000);
  static const Color accent = Color(0xFF1BA3B6);

  // User cache service
  final UserCacheService _userCache = UserCacheService();

  // Loading state
  bool _isLoading = true;
  Map<String, dynamic>? _shipmentData;
  List<Map<String, dynamic>> _requiredDocuments = [];

  // Expansion states for dropdown menus
  bool _isDetailsExpanded = true;
  bool _isTrackingExpanded = false;
  bool _isDocumentsExpanded = false;

  // Export Shipment Status mapping - 7 stages
  final Map<String, int> _statusIndexMap = <String, int>{
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

      // Load shipment data
      await _loadShipmentData();

      // Load required documents after shipment data
      if (_shipmentData != null) {
        await _loadRequiredDocuments();
      }
    } catch (e) {
      print('❌ [ExportShipmentDetails] Error loading data: $e');
    }
  }

  Future<void> _loadShipmentData() async {
    try {
      print(
        '📦 [ExportShipmentDetails] Loading shipment: ${widget.shipmentId}',
      );

      final response = await ApiService.getExportShipmentById(
        id: widget.shipmentId,
      );

      if (response['success'] == true && response['data'] != null) {
        if (mounted) {
          setState(() {
            _shipmentData = response['data'];
            _isLoading = false;
          });
        }
        print('📦 [ExportShipmentDetails] Loaded: $_shipmentData');
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
      print('❌ [ExportShipmentDetails] Error: $e');
      if (mounted) {
        setState(() => _isLoading = false);
        AlNoranPopups.showError(
          context: context,
          message: 'حدث خطأ أثناء تحميل بيانات الشحنة',
        );
      }
    }
  }

  Future<void> _loadRequiredDocuments() async {
    try {
      if (_shipmentData == null) {
        print('⚠️ [ExportShipmentDetails] No shipment data available yet');
        return;
      }

      final shipmentId = _shipmentData!['_id'];
      if (shipmentId == null) {
        print('⚠️ [ExportShipmentDetails] No shipment ID available');
        return;
      }

      print(
        '📋 [ExportShipmentDetails] Loading required documents for: $shipmentId',
      );

      // Try to get required documents from shipment data
      final docs = _shipmentData!['documents'] as List<dynamic>? ?? [];
      final mappedDocs = <Map<String, dynamic>>[];

      for (var doc in docs) {
        if (doc is Map<String, dynamic>) {
          mappedDocs.add(doc);
        }
      }

      if (mounted) {
        setState(() => _requiredDocuments = mappedDocs);
      }
      print('✅ [ExportShipmentDetails] Loaded ${mappedDocs.length} documents');
    } catch (e) {
      print('❌ [ExportShipmentDetails] Error loading documents: $e');
    }
  }

  int get _currentStatusIndex {
    if (_shipmentData == null) return 0;
    final status =
        (_shipmentData!['currentStatus'] ?? 'documents_verification')
            .toString()
            .toLowerCase();
    if (status == 'cancelled') return -1;
    return _statusIndexMap[status] ?? 0;
  }

  String _translateStatus(String status) {
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

  // Mapping Arabic document names to valid enum values
  String _mapDocumentTypeToEnum(String arabicName) {
    final mappings = {
      // Export documents
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
      'شهادة المنشأ': 'certificate_of_origin',
      'شهادة الجودة': 'quality_certificate',
      // Other documents
      'السجل التجاري': 'commercial_register',
      'البطاقة الضريبية': 'tax_card',
      'العقد': 'contract',
      'أخرى': 'other',
      'اخرى': 'other',
      'مستند': 'other',
    };

    if (mappings.containsKey(arabicName)) {
      return mappings[arabicName]!;
    }

    for (var entry in mappings.entries) {
      if (arabicName.contains(entry.key) || entry.key.contains(arabicName)) {
        return entry.value;
      }
    }

    print('⚠️ [DocumentType] No mapping found for: $arabicName, using "other"');
    return 'other';
  }

  Future<void> _handleDocumentUpload(
    String documentName, {
    String? documentId,
  }) async {
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

      final shipmentId = _shipmentData?['_id'];
      if (shipmentId == null) {
        context.pop();
        if (mounted) {
          AlNoranPopups.showError(
            context: context,
            message: 'معرف الشحنة غير متوفر',
          );
        }
        return;
      }

      final documentType = _mapDocumentTypeToEnum(documentName);
      print('📤 [Upload] Document name: $documentName -> Type: $documentType');

      final uploadResult = await ApiService.uploadFile(
        filePath: file.path,
        category: 'export_shipment',
        documentType: documentType,
        relatedId: shipmentId,
      );

      print('📤 [Upload] Result: $uploadResult');

      if (uploadResult['success'] == true) {
        context.pop();

        if (mounted) {
          await AlNoranPopups.showSuccess(
            context: context,
            title: 'تم الرفع بنجاح',
            message: 'تم رفع المستند بنجاح',
          );
        }
        NotificationService().refresh();
        _loadRequiredDocuments();
      } else {
        context.pop();
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
          context.pop();
        } catch (_) {}
      }
      print('❌ [ExportShipmentDetails] Upload error: $e');
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
            UnifiedTopBar(showBackButton: true, showMenu: false),
            Expanded(
              child: _isLoading ? _buildLoadingState() : _buildContent(),
            ),
          ],
        ),
        floatingActionButton:
            _shipmentData != null
                ? FloatingActionButton.extended(
                  onPressed: () {
                    context.push(
                      '/chat/${widget.shipmentId}',
                      extra: {
                        'employeeName': _userCache.userName,
                        'isExport': true,
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
            'جاري تحميل بيانات الشحنة...',
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
    if (_shipmentData == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            const Text(
              'لم يتم العثور على الشحنة',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                fontFamily: 'Cairo',
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'الشحنة رقم: ${widget.shipmentId}',
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

          // Expandable Section 3: Documents
          _buildExpandableSection(
            title: 'المستندات',
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
    final status =
        _shipmentData?['currentStatus']?.toString() ?? 'documents_verification';
    final statusArabic = _translateStatus(status);
    final statusColor = _getStatusColor(status);
    final shipmentNumber =
        _shipmentData?['shipmentNumber']?.toString() ??
        _shipmentData?['shipmentCode']?.toString() ??
        '';
    final ucrNumber = _shipmentData?['ucrNumber']?.toString() ?? 'N/A';

    // Determine shipment type for icon
    final shippingMethod =
        _shipmentData?['shippingMethod']?.toString().toLowerCase() ?? '';
    final isSea =
        shippingMethod.contains('sea') || shippingMethod.contains('بحري');
    final typeIcon =
        isSea ? Icons.directions_boat_rounded : Icons.flight_takeoff_rounded;
    final typeText = isSea ? 'بحري' : 'جوي';
    final typeColor = isSea ? accent : Colors.orange;

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
          // Header Row with Icon and Shipment Info
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(typeIcon, color: Colors.white, size: 28),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Shipment Number (if available)
                    if (shipmentNumber.isNotEmpty) ...[
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              shipmentNumber,
                              style: TextStyle(
                                color: primaryDark,
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'Cairo',
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: typeColor.withOpacity(0.3),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(typeIcon, size: 12, color: Colors.white),
                                const SizedBox(width: 4),
                                Text(
                                  typeText,
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
                    ],
                    // UCR Number
                    const Text(
                      'رقم UCR',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 12,
                        fontFamily: 'Cairo',
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      ucrNumber,
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
                  statusArabic,
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
    final statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'completed':
      case 'delivered':
        return Colors.green;
      case 'documents_verification':
      case 'regulatory_inspection':
        return Colors.orange;
      case 'payment_cleared':
      case 'goods_loaded':
      case 'in_transit':
        return accent;
      case 'cancelled':
        return Colors.red;
      default:
        return accent;
    }
  }

  Widget _buildDetailsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // UCR Number
        if (_shipmentData!['ucrNumber'] != null)
          _buildDetailCard(
            icon: Icons.qr_code_2,
            label: 'رقم UCR',
            value: _shipmentData!['ucrNumber'],
          ),
        // Destination Country
        if (_shipmentData!['destinationCountry'] != null)
          _buildDetailCard(
            icon: Icons.public,
            label: 'بلد الوصول',
            value: _shipmentData!['destinationCountry'],
          ),
        // Destination Port
        if (_shipmentData!['destinationPort'] != null)
          _buildDetailCard(
            icon: Icons.anchor,
            label: 'ميناء الوصول',
            value: _shipmentData!['destinationPort'],
          ),
        // General Description
        if (_shipmentData!['generalDescription'] != null)
          _buildDetailCard(
            icon: Icons.description,
            label: 'وصف البضاعة',
            value: _shipmentData!['generalDescription'],
          ),
        // Exporter Name
        if (_shipmentData!['exporterName'] != null)
          _buildDetailCard(
            icon: Icons.business,
            label: 'اسم المصدر',
            value: _shipmentData!['exporterName'],
          ),
        // Total Weight
        if (_shipmentData!['totalWeight'] != null)
          _buildDetailCard(
            icon: Icons.scale,
            label: 'الوزن الإجمالي',
            value: '${_shipmentData!['totalWeight']} كجم',
          ),
        // Packages Count
        if (_shipmentData!['packagesCount'] != null)
          _buildDetailCard(
            icon: Icons.inventory_2_outlined,
            label: 'عدد الطرود',
            value: _shipmentData!['packagesCount'].toString(),
          ),
        // Value in EGP
        if (_shipmentData!['valueInEGP'] != null)
          _buildDetailCard(
            icon: Icons.attach_money,
            label: 'القيمة بالجنيه',
            value: '${_shipmentData!['valueInEGP']} ج.م',
          ),
        // Invoice Number
        if (_shipmentData!['invoiceNumber'] != null)
          _buildDetailCard(
            icon: Icons.receipt,
            label: 'رقم الفاتورة',
            value: _shipmentData!['invoiceNumber'],
          ),
        // Created At
        if (_shipmentData!['createdAt'] != null)
          _buildDetailCard(
            icon: Icons.calendar_today,
            label: 'تاريخ الإنشاء',
            value: _formatDate(_shipmentData!['createdAt']),
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
        // Progress percentage
        if (_shipmentData?['progressPercentage'] != null)
          Container(
            margin: const EdgeInsets.only(bottom: 16),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: accent.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: accent.withOpacity(0.3)),
            ),
            child: Row(
              children: [
                Icon(Icons.pie_chart, color: accent, size: 24),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'نسبة الإنجاز',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey,
                          fontFamily: 'Cairo',
                        ),
                      ),
                      const SizedBox(height: 4),
                      LinearProgressIndicator(
                        value:
                            (_shipmentData!['progressPercentage'] ?? 0) / 100,
                        backgroundColor: Colors.grey[300],
                        valueColor: AlwaysStoppedAnimation<Color>(accent),
                        minHeight: 8,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  '${_shipmentData!['progressPercentage']}%',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: accent,
                    fontFamily: 'Cairo',
                  ),
                ),
              ],
            ),
          ),
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

  Widget _buildTimelineItem({
    required String title,
    required IconData icon,
    required bool isCompleted,
    required bool isCurrent,
    required bool isLast,
  }) {
    final itemColor = isCompleted || isCurrent ? accent : Colors.grey[400]!;

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Timeline indicator
          Column(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isCompleted || isCurrent ? accent : Colors.grey[300],
                  border: Border.all(
                    color:
                        isCompleted || isCurrent ? accent : Colors.grey[400]!,
                    width: 2,
                  ),
                ),
                child: Icon(
                  isCompleted ? Icons.check : icon,
                  color: Colors.white,
                  size: 18,
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
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
                decoration: BoxDecoration(
                  color: isCurrent ? accent.withOpacity(0.1) : Colors.grey[100],
                  borderRadius: BorderRadius.circular(10),
                  border:
                      isCurrent
                          ? Border.all(color: accent.withOpacity(0.3))
                          : null,
                ),
                child: Row(
                  children: [
                    Icon(icon, size: 20, color: itemColor),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        title,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight:
                              isCurrent ? FontWeight.bold : FontWeight.w500,
                          color:
                              isCompleted || isCurrent
                                  ? Colors.black
                                  : Colors.grey[600],
                          fontFamily: 'Cairo',
                        ),
                      ),
                    ),
                    if (isCompleted && !isCurrent)
                      Icon(Icons.check_circle, size: 18, color: Colors.green),
                    if (isCurrent)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: accent,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Text(
                          'الحالي',
                          style: TextStyle(
                            fontSize: 10,
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Cairo',
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDocumentsSection() {
    if (_requiredDocuments.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 20),
        child: Center(
          child: Text(
            'لا توجد مستندات مرفقة',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey,
              fontFamily: 'Cairo',
            ),
          ),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children:
          _requiredDocuments.map((doc) {
            final docName = doc['name'] ?? doc['documentType'] ?? 'مستند';
            final isUploaded = doc['uploaded'] == true || doc['url'] != null;

            return _buildDocumentItem(
              doc: {
                'title': docName,
                'status': isUploaded ? 'uploaded' : 'pending',
                'url': doc['url'],
                '_id': doc['_id'],
              },
            );
          }).toList(),
    );
  }

  Widget _buildDocumentItem({required Map<String, dynamic> doc}) {
    final isUploaded = doc['status'] == 'uploaded';

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
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors:
                    isUploaded
                        ? [Colors.green.shade400, Colors.green.shade600]
                        : [primaryLight, primaryDark],
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              isUploaded ? Icons.check_circle : Icons.description,
              color: Colors.white,
              size: 24,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  doc['title'],
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Cairo',
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  isUploaded ? 'تم الرفع' : 'مطلوب',
                  style: TextStyle(
                    fontSize: 12,
                    color: isUploaded ? Colors.green : Colors.orange,
                    fontFamily: 'Cairo',
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          if (isUploaded && doc['url'] != null)
            IconButton(
              onPressed: () => _viewDocument(doc['url']),
              icon: const Icon(Icons.visibility),
              color: accent,
              tooltip: 'عرض',
            )
          else if (!isUploaded)
            Container(
              decoration: BoxDecoration(
                color: primaryDark.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: IconButton(
                onPressed: () => _handleDocumentUpload(doc['title']),
                icon: const Icon(Icons.upload_file),
                color: primaryDark,
                tooltip: 'رفع المستند',
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _viewDocument(String url) async {
    try {
      final uri = Uri.parse(url);
      final launched = await launchUrl(
        uri,
        mode: LaunchMode.externalApplication,
      );
      if (!launched) {
        throw Exception('Failed to launch URL');
      }
    } catch (e) {
      print('❌ [ViewDocument] Error: $e');
      if (mounted) {
        AlNoranPopups.showError(context: context, message: 'تعذر فتح المستند');
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
}
