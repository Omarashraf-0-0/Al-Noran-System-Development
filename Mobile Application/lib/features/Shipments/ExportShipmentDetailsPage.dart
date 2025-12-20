import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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

class _ExportShipmentDetailsPageState extends State<ExportShipmentDetailsPage>
    with SingleTickerProviderStateMixin {
  // Premium Colors
  static const Color primaryDark = Color(0xFF690000);
  static const Color primaryLight = Color(0xFF8B0000);
  static const Color accent = Color(0xFF1BA3B6);
  static const Color goldAccent = Color(0xFFD4AF37);
  static const Color bgColor = Color(0xFFF8F9FA);

  // Animation controller
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

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
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOut),
    );
    _initializeData();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
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
          _animationController.forward();
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

      // Get required documents from API (documents requested by employee)
      final response = await ApiService.getExportRequiredDocuments(
        shipmentId: shipmentId,
      );

      final List<Map<String, dynamic>> mappedDocs = [];

      if (response['success'] == true) {
        final requiredDocs = response['requiredDocuments'] ?? [];

        // Process required documents and fetch file details for uploaded ones
        for (var doc in requiredDocs) {
          final docMap = Map<String, dynamic>.from(doc);

          // If document is uploaded, fetch file details
          if (docMap['uploaded'] == true && docMap['fileId'] != null) {
            final fileId = docMap['fileId'].toString();
            print(
              '📄 [ExportShipmentDetails] Fetching file details for: $fileId',
            );

            try {
              final fileResponse = await ApiService.getUploadById(
                uploadId: fileId,
              );
              if (fileResponse['success'] == true &&
                  fileResponse['upload'] != null) {
                docMap['uploadData'] = fileResponse['upload'];
                print(
                  '✅ [ExportShipmentDetails] Got file data: ${fileResponse['upload']}',
                );
              }
            } catch (e) {
              print(
                '❌ [ExportShipmentDetails] Error fetching file $fileId: $e',
              );
            }
          }

          mappedDocs.add(docMap);
        }
      }

      if (mounted) {
        setState(() => _requiredDocuments = mappedDocs);
      }
      print(
        '✅ [ExportShipmentDetails] Loaded ${mappedDocs.length} required documents',
      );
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
        backgroundColor: bgColor,
        body: Column(
          children: [
            UnifiedTopBar(showBackButton: true, showMenu: false),
            Expanded(
              child: _isLoading ? _buildLoadingState() : _buildContent(),
            ),
          ],
        ),
        floatingActionButton:
            _shipmentData != null ? _buildPremiumChatButton() : null,
        floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      ),
    );
  }

  Widget _buildPremiumChatButton() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            HapticFeedback.mediumImpact();
            context.push(
              '/chat/${widget.shipmentId}',
              extra: {'employeeName': _userCache.userName, 'isExport': true},
            );
          },
          borderRadius: BorderRadius.circular(30),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [primaryDark, primaryLight]),
              borderRadius: BorderRadius.circular(30),
              boxShadow: [
                BoxShadow(
                  color: primaryDark.withOpacity(0.4),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.chat_bubble_rounded,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                const Text(
                  'تواصل مع الدعم',
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: accent,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.arrow_back_rounded,
                    color: Colors.white,
                    size: 14,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLoadingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: primaryDark.withOpacity(0.1),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: const CircularProgressIndicator(
              color: primaryDark,
              strokeWidth: 3,
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'جاري تحميل بيانات الشحنة...',
            style: TextStyle(
              fontFamily: 'Cairo',
              color: Colors.grey,
              fontSize: 16,
              fontWeight: FontWeight.w500,
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
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.red.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.error_outline_rounded,
                size: 60,
                color: Colors.red,
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'لم يتم العثور على الشحنة',
              style: TextStyle(
                fontFamily: 'Cairo',
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'رقم الشحنة: ${widget.shipmentId}',
              style: TextStyle(
                fontFamily: 'Cairo',
                color: Colors.grey[600],
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: () => context.pop(),
              icon: const Icon(Icons.arrow_back_rounded),
              label: const Text(
                'العودة',
                style: TextStyle(fontFamily: 'Cairo'),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: primaryDark,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 32,
                  vertical: 14,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ],
        ),
      );
    }

    return FadeTransition(
      opacity: _fadeAnimation,
      child: RefreshIndicator(
        onRefresh: _loadShipmentData,
        color: primaryDark,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 16),

              // Premium Header
              _buildPremiumHeader(),

              const SizedBox(height: 20),

              // Quick Stats Row
              _buildQuickStats(),

              const SizedBox(height: 20),

              // Expandable Sections
              _buildExpandableSection(
                title: 'تفاصيل الشحنة',
                icon: Icons.inventory_2_rounded,
                isExpanded: _isDetailsExpanded,
                onTap:
                    () => setState(
                      () => _isDetailsExpanded = !_isDetailsExpanded,
                    ),
                child: _buildDetailsSection(),
              ),

              const SizedBox(height: 12),

              _buildExpandableSection(
                title: 'تتبع الشحنة',
                icon: Icons.timeline_rounded,
                isExpanded: _isTrackingExpanded,
                onTap:
                    () => setState(
                      () => _isTrackingExpanded = !_isTrackingExpanded,
                    ),
                child: _buildTrackingSection(),
              ),

              const SizedBox(height: 12),

              _buildExpandableSection(
                title: 'المستندات',
                icon: Icons.folder_rounded,
                isExpanded: _isDocumentsExpanded,
                onTap:
                    () => setState(
                      () => _isDocumentsExpanded = !_isDocumentsExpanded,
                    ),
                child: _buildDocumentsSection(),
              ),

              const SizedBox(height: 100),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuickStats() {
    final status =
        _shipmentData?['currentStatus']?.toString() ?? 'documents_verification';
    final statusArabic = _translateStatus(status);
    final shippingMethod =
        _shipmentData?['shippingMethod']?.toString().toLowerCase() ?? '';
    final isSea =
        shippingMethod.contains('sea') || shippingMethod.contains('بحري');
    final destination =
        _shipmentData?['destinationCountry']?.toString() ?? 'غير محدد';

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          Expanded(
            child: _buildStatCard(
              icon: Icons.local_shipping_rounded,
              label: 'الحالة',
              value:
                  statusArabic.length > 12
                      ? '${statusArabic.substring(0, 12)}...'
                      : statusArabic,
              color: _getStatusColor(status),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _buildStatCard(
              icon: Icons.public_rounded,
              label: 'الوجهة',
              value:
                  destination.length > 10
                      ? '${destination.substring(0, 10)}...'
                      : destination,
              color: accent,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _buildStatCard(
              icon:
                  isSea
                      ? Icons.directions_boat_rounded
                      : Icons.flight_takeoff_rounded,
              label: 'النوع',
              value: isSea ? 'بحري' : 'جوي',
              color: goldAccent,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(height: 10),
          Text(
            label,
            style: TextStyle(
              fontFamily: 'Cairo',
              fontSize: 11,
              color: Colors.grey[500],
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              fontFamily: 'Cairo',
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: Color(0xFF2D2D2D),
            ),
            textAlign: TextAlign.center,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
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
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: primaryDark.withOpacity(0.06),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        children: [
          InkWell(
            onTap: () {
              HapticFeedback.selectionClick();
              onTap();
            },
            borderRadius: BorderRadius.circular(20),
            child: Container(
              padding: const EdgeInsets.all(18),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [primaryDark, primaryLight],
                      ),
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: [
                        BoxShadow(
                          color: primaryDark.withOpacity(0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Icon(icon, color: Colors.white, size: 22),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Text(
                      title,
                      style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Cairo',
                        color: Color(0xFF2C2C2C),
                      ),
                    ),
                  ),
                  AnimatedRotation(
                    turns: isExpanded ? 0.5 : 0,
                    duration: const Duration(milliseconds: 300),
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: bgColor,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(
                        Icons.keyboard_arrow_down_rounded,
                        color: primaryDark,
                        size: 22,
                      ),
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
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 18),
                  height: 1,
                  color: Colors.grey.withOpacity(0.1),
                ),
                Padding(padding: const EdgeInsets.all(18), child: child),
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

  Widget _buildPremiumHeader() {
    final status =
        _shipmentData?['currentStatus']?.toString() ?? 'documents_verification';
    final statusArabic = _translateStatus(status);
    final statusColor = _getStatusColor(status);
    final shipmentNumber =
        _shipmentData?['shipmentNumber']?.toString() ??
        _shipmentData?['shipmentCode']?.toString() ??
        '';
    final ucrNumber = _shipmentData?['ucrNumber']?.toString() ?? 'N/A';
    final shippingMethod =
        _shipmentData?['shippingMethod']?.toString().toLowerCase() ?? '';
    final isSea =
        shippingMethod.contains('sea') || shippingMethod.contains('بحري');
    final typeIcon =
        isSea ? Icons.directions_boat_rounded : Icons.flight_takeoff_rounded;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [primaryDark, primaryLight, primaryDark.withOpacity(0.9)],
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: primaryDark.withOpacity(0.4),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Stack(
        children: [
          // Decorative elements
          Positioned(
            top: -30,
            right: -30,
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
            bottom: -20,
            left: -20,
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withOpacity(0.05),
              ),
            ),
          ),
          // Export badge
          Positioned(
            top: 16,
            left: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: goldAccent,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.upload_rounded, color: Colors.white, size: 14),
                  SizedBox(width: 4),
                  Text(
                    'تصدير',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Cairo',
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Content
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    // Icon
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Icon(typeIcon, color: Colors.white, size: 30),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (shipmentNumber.isNotEmpty) ...[
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 5,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(10),
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
                            const SizedBox(height: 8),
                          ],
                          Text(
                            'رقم UCR',
                            style: TextStyle(
                              color: Colors.white.withOpacity(0.7),
                              fontSize: 12,
                              fontFamily: 'Cairo',
                            ),
                          ),
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
                    // Type badge
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: (isSea ? accent : Colors.orange).withOpacity(
                          0.3,
                        ),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(typeIcon, size: 14, color: Colors.white),
                          const SizedBox(width: 4),
                          Text(
                            isSea ? 'بحري' : 'جوي',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'Cairo',
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                // Status Badge
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(30),
                    border: Border.all(color: Colors.white.withOpacity(0.3)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 10,
                        height: 10,
                        decoration: BoxDecoration(
                          color: statusColor,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: statusColor.withOpacity(0.5),
                              blurRadius: 6,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 10),
                      Flexible(
                        child: Text(
                          statusArabic,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            fontFamily: 'Cairo',
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    // Keep for backward compatibility - now redirects to premium header
    return _buildPremiumHeader();
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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // زر رفع مستند جديد
        _buildAddNewDocumentButton(),

        const SizedBox(height: 16),

        if (_requiredDocuments.isEmpty)
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
          )
        else
          ..._requiredDocuments.map((doc) {
            final docName = doc['name'] ?? doc['documentType'] ?? 'مستند';
            final isUploaded = doc['uploaded'] == true;
            final uploadedAt = doc['uploadedAt'];
            final uploadData = doc['uploadData'];

            return _buildDocumentItem(
              doc: {
                'title': docName,
                'status': isUploaded ? 'uploaded' : 'pending',
                'required': true,
                'uploadDate':
                    uploadedAt != null ? _formatDate(uploadedAt) : null,
                'type': docName,
                '_id': doc['_id'],
              },
              uploadData: uploadData,
            );
          }).toList(),
      ],
    );
  }

  /// زر رفع مستند جديد مع اختيار الاسم
  Widget _buildAddNewDocumentButton() {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [accent, accent.withOpacity(0.8)]),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: accent.withOpacity(0.3),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: _showNewDocumentDialog,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(
                    Icons.add_circle_outline,
                    color: Colors.white,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                const Text(
                  'رفع مستند جديد',
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// عرض popup لرفع مستند جديد مع اختيار الاسم
  Future<void> _showNewDocumentDialog() async {
    final TextEditingController documentNameController =
        TextEditingController();

    final result = await showDialog<String>(
      context: context,
      barrierDismissible: true,
      builder:
          (dialogContext) => Directionality(
            textDirection: TextDirection.rtl,
            child: Dialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(25),
              ),
              elevation: 0,
              backgroundColor: Colors.transparent,
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(25),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Header
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [accent, accent.withOpacity(0.8)],
                        ),
                        borderRadius: const BorderRadius.only(
                          topLeft: Radius.circular(25),
                          topRight: Radius.circular(25),
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(
                              Icons.upload_file,
                              color: Colors.white,
                              size: 28,
                            ),
                          ),
                          const SizedBox(width: 16),
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'رفع مستند جديد',
                                  style: TextStyle(
                                    fontFamily: 'Cairo',
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                                SizedBox(height: 4),
                                Text(
                                  'أدخل اسم المستند ثم اختر الملف',
                                  style: TextStyle(
                                    fontFamily: 'Cairo',
                                    fontSize: 13,
                                    color: Colors.white70,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Content
                    Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Document name input
                          const Text(
                            'اسم المستند',
                            style: TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: Colors.black87,
                            ),
                          ),
                          const SizedBox(height: 8),
                          TextField(
                            controller: documentNameController,
                            textDirection: TextDirection.rtl,
                            decoration: InputDecoration(
                              hintText: 'مثال: فاتورة، شهادة منشأ، بوليصة شحن',
                              hintStyle: TextStyle(
                                fontFamily: 'Cairo',
                                fontSize: 14,
                                color: Colors.grey[400],
                              ),
                              filled: true,
                              fillColor: Colors.grey[50],
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(
                                  color: Colors.grey[300]!,
                                ),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(
                                  color: Colors.grey[300]!,
                                ),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(
                                  color: accent,
                                  width: 2,
                                ),
                              ),
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 14,
                              ),
                              prefixIcon: Icon(
                                Icons.description,
                                color: Colors.grey[400],
                              ),
                            ),
                            style: const TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 15,
                            ),
                          ),
                          const SizedBox(height: 24),

                          // Upload button
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton.icon(
                              onPressed: () {
                                final name = documentNameController.text.trim();
                                if (name.isEmpty) {
                                  AlNoranPopups.showError(
                                    context: dialogContext,
                                    message: 'يرجى إدخال اسم المستند',
                                  );
                                  return;
                                }
                                Navigator.pop(dialogContext, name);
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: accent,
                                padding: const EdgeInsets.symmetric(
                                  vertical: 16,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                elevation: 0,
                              ),
                              icon: const Icon(
                                Icons.upload_file,
                                color: Colors.white,
                              ),
                              label: const Text(
                                'اختيار الملف ورفعه',
                                style: TextStyle(
                                  fontFamily: 'Cairo',
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Cancel button
                    Padding(
                      padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
                      child: SizedBox(
                        width: double.infinity,
                        child: TextButton(
                          onPressed: () => Navigator.pop(dialogContext, null),
                          child: Text(
                            'إلغاء',
                            style: TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 14,
                              color: Colors.grey[600],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
    );

    // If user entered a name, proceed to file upload
    if (result != null && result.isNotEmpty) {
      await _uploadNewDocument(result);
    }
  }

  /// رفع مستند جديد باسم محدد
  Future<void> _uploadNewDocument(String documentName) async {
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

      // Map document name to enum
      final documentType = _mapDocumentTypeToEnum(documentName);
      print(
        '📤 [NewUpload] Document name: $documentName -> Type: $documentType',
      );

      // Upload file
      final uploadResult = await ApiService.uploadFile(
        filePath: file.path,
        category: 'export_shipment',
        documentType: documentType,
        relatedId: shipmentId,
      );

      print('📤 [NewUpload] Result: $uploadResult');

      if (uploadResult['success'] == true) {
        // Get the uploaded file ID
        final uploadedFileId =
            uploadResult['upload']?['id']?.toString() ??
            uploadResult['upload']?['_id']?.toString();

        print('📤 [NewUpload] Uploaded file ID: $uploadedFileId');

        // Add document to shipment's documents list
        if (uploadedFileId != null) {
          await _addDocumentToExportShipment(
            shipmentId: shipmentId,
            documentName: documentName,
            fileId: uploadedFileId,
          );
        }

        context.pop(); // Close loading

        if (mounted) {
          await AlNoranPopups.showSuccess(
            context: context,
            title: 'تم الرفع بنجاح',
            message: 'تم رفع المستند "$documentName" بنجاح',
          );
        }
        // Refresh notifications and documents
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
      print('❌ [NewUpload] Error: $e');
      if (mounted) {
        AlNoranPopups.showError(
          context: context,
          message: 'حدث خطأ أثناء رفع المستند',
        );
      }
    }
  }

  /// إضافة المستند لقائمة مستندات الشحنة
  Future<void> _addDocumentToExportShipment({
    required String shipmentId,
    required String documentName,
    required String fileId,
  }) async {
    try {
      print(
        '📝 [AddDocument] Adding "$documentName" to export shipment $shipmentId',
      );

      // استخدام API لإضافة المستند للشحنة
      final result = await ApiService.addDocumentToExportShipment(
        shipmentId: shipmentId,
        documentName: documentName,
        fileId: fileId,
      );

      print('📝 [AddDocument] Result: $result');
    } catch (e) {
      print('❌ [AddDocument] Error: $e');
      // لا نعرض خطأ للمستخدم لأن الملف تم رفعه بنجاح
    }
  }

  Widget _buildDocumentItem({
    required Map<String, dynamic> doc,
    Map<String, dynamic>? uploadData,
  }) {
    final isUploaded = doc['status'] == 'uploaded';
    final isRequired = doc['required'] == true;

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
      child: Column(
        children: [
          Row(
            children: [
              // Document icon
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors:
                        isUploaded
                            ? [Colors.green.shade400, Colors.green.shade600]
                            : isRequired
                            ? [primaryLight, primaryDark]
                            : [Colors.grey.shade300, Colors.grey.shade400],
                  ),
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    if (isUploaded || isRequired)
                      BoxShadow(
                        color: (isUploaded ? Colors.green : primaryDark)
                            .withOpacity(0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 4),
                      ),
                  ],
                ),
                child: Icon(
                  isUploaded ? Icons.check_circle : Icons.description,
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
                      doc['title'],
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Cairo',
                      ),
                    ),
                    const SizedBox(height: 4),
                    if (doc['uploadDate'] != null)
                      Row(
                        children: [
                          Icon(
                            Icons.calendar_today,
                            size: 12,
                            color: Colors.grey[600],
                          ),
                          const SizedBox(width: 4),
                          Text(
                            'تم الرفع في ${doc['uploadDate']}',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                              fontFamily: 'Cairo',
                            ),
                          ),
                        ],
                      )
                    else if (isRequired && !isUploaded)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.red.shade50,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text(
                          'مطلوب',
                          style: TextStyle(
                            fontSize: 11,
                            color: Colors.red,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Cairo',
                          ),
                        ),
                      )
                    else
                      Text(
                        isUploaded ? 'تم الرفع' : 'اختياري',
                        style: TextStyle(
                          fontSize: 12,
                          color: isUploaded ? Colors.green : Colors.grey[600],
                          fontFamily: 'Cairo',
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              // Action button
              if (!isUploaded)
                Container(
                  decoration: BoxDecoration(
                    color: primaryDark.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: IconButton(
                    onPressed:
                        () => _handleRequiredDocumentUpload(
                          doc['title'],
                          documentId: doc['_id']?.toString(),
                        ),
                    icon: const Icon(Icons.upload_file),
                    color: primaryDark,
                    tooltip: 'رفع المستند',
                  ),
                ),
            ],
          ),

          // Actions for uploaded documents
          if (isUploaded && uploadData != null) ...[
            const SizedBox(height: 12),
            Divider(height: 1, color: Colors.grey[200]),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildDocumentActionButton(
                  icon: Icons.visibility,
                  label: 'عرض',
                  color: accent,
                  onPressed: () => _viewUploadedDocument(uploadData),
                ),
                Container(width: 1, height: 30, color: Colors.grey[200]),
                _buildDocumentActionButton(
                  icon: Icons.edit,
                  label: 'تعديل',
                  color: primaryDark,
                  onPressed:
                      () => _editUploadedDocument(
                        uploadData,
                        doc['title'],
                        documentId: doc['_id']?.toString(),
                      ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildDocumentActionButton({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onPressed,
  }) {
    return Expanded(
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, color: color, size: 20),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: color,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// رفع مستند مطلوب من الموظف
  Future<void> _handleRequiredDocumentUpload(
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
      print(
        '📤 [RequiredUpload] Document name: $documentName -> Type: $documentType',
      );

      // Upload file first
      final uploadResult = await ApiService.uploadFile(
        filePath: file.path,
        category: 'export_shipment',
        documentType: documentType,
        relatedId: shipmentId,
      );

      if (uploadResult['success'] == true) {
        final uploadedFileId =
            uploadResult['upload']?['id']?.toString() ??
            uploadResult['upload']?['_id']?.toString();

        print('📤 [RequiredUpload] Uploaded file ID: $uploadedFileId');

        // Mark as uploaded using the specific API
        if (uploadedFileId != null) {
          final markResult = await ApiService.uploadExportRequiredDocument(
            shipmentId: shipmentId,
            documentName: documentName,
            uploadId: uploadedFileId,
          );
          print('📝 [RequiredUpload] Mark result: $markResult');
        }

        context.pop();

        if (mounted) {
          await AlNoranPopups.showSuccess(
            context: context,
            title: 'تم الرفع بنجاح',
            message: 'تم رفع المستند "$documentName" بنجاح',
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
      print('❌ [RequiredUpload] Error: $e');
      if (mounted) {
        AlNoranPopups.showError(
          context: context,
          message: 'حدث خطأ أثناء رفع المستند',
        );
      }
    }
  }

  /// عرض مستند مرفوع
  Future<void> _viewUploadedDocument(Map<String, dynamic> uploadData) async {
    try {
      final url =
          uploadData['url']?.toString() ??
          uploadData['presignedUrl']?.toString();
      final mimetype = uploadData['mimetype']?.toString() ?? '';
      final filename = uploadData['filename']?.toString() ?? 'مستند';

      if (url == null || url.isEmpty) {
        AlNoranPopups.showError(
          context: context,
          message: 'رابط المستند غير متوفر',
        );
        return;
      }

      print('📄 [ViewDocument] Opening: $url');

      // If it's an image, show in full screen viewer
      if (mimetype.contains('image')) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder:
                (context) => _ImageViewerPage(imageUrl: url, title: filename),
          ),
        );
      } else {
        // For PDF or other documents, open externally
        final uri = Uri.parse(url);
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

  /// تعديل مستند مرفوع
  Future<void> _editUploadedDocument(
    Map<String, dynamic> uploadData,
    String docName, {
    String? documentId,
  }) async {
    final filename = uploadData['filename']?.toString() ?? 'مستند';

    final result = await showDialog<String>(
      context: context,
      builder:
          (dialogContext) => Directionality(
            textDirection: TextDirection.rtl,
            child: AlertDialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              title: const Text(
                'تعديل المستند',
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontWeight: FontWeight.bold,
                ),
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'المستند: $filename',
                    style: const TextStyle(fontFamily: 'Cairo', fontSize: 14),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'ماذا تريد أن تفعل؟',
                    style: TextStyle(
                      fontFamily: 'Cairo',
                      fontSize: 14,
                      color: Colors.grey,
                    ),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(dialogContext, null),
                  child: const Text(
                    'إلغاء',
                    style: TextStyle(fontFamily: 'Cairo'),
                  ),
                ),
                TextButton(
                  onPressed: () => Navigator.pop(dialogContext, 'view'),
                  child: const Text(
                    'عرض',
                    style: TextStyle(fontFamily: 'Cairo', color: accent),
                  ),
                ),
                ElevatedButton(
                  onPressed: () => Navigator.pop(dialogContext, 'replace'),
                  style: ElevatedButton.styleFrom(backgroundColor: primaryDark),
                  child: const Text(
                    'استبدال',
                    style: TextStyle(fontFamily: 'Cairo', color: Colors.white),
                  ),
                ),
              ],
            ),
          ),
    );

    if (result == 'replace') {
      await _handleRequiredDocumentUpload(docName, documentId: documentId);
    } else if (result == 'view') {
      await _viewUploadedDocument(uploadData);
    }
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

/// Image Viewer Page
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
          title: Text(
            title,
            style: const TextStyle(fontFamily: 'Cairo', color: Colors.white),
          ),
          centerTitle: true,
          leading: IconButton(
            icon: const Icon(Icons.close, color: Colors.white),
            onPressed: () => Navigator.pop(context),
          ),
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
                return const Center(
                  child: CircularProgressIndicator(color: Colors.white),
                );
              },
              errorBuilder: (context, error, stackTrace) {
                return const Center(
                  child: Icon(
                    Icons.error_outline,
                    color: Colors.white,
                    size: 64,
                  ),
                );
              },
            ),
          ),
        ),
      ),
    );
  }
}
