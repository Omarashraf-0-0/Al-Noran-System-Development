import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/network/api_service.dart';
import '../../core/widgets/unified_top_bar.dart';
import '../../core/services/user_cache_service.dart';
import '../../core/services/notification_service.dart';
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

  // Status mapping - 10 حالات للشحنة (عربي فقط)
  final Map<String, int> _statusIndexMap = <String, int>{
    'في انتظار الشحن': 0,
    'في الطريق': 1,
    'تم وصول البضاعة': 2,
    'في انتظار وصول الإذن': 3,
    'في انتظار وصول الاذن': 3,
    'تم وصول الإذن': 4,
    'التخليص الجمركي': 5,
    'التخليص الجمركى': 5,
    'جارى ادراج الشحنة واستكمال الاجراءات': 6,
    'جاري ادراج الشحنة واستكمال الاجراءات': 6,
    'جاري الكشف والتثمين': 7,
    'جارى الكشف والتثمين': 7,
    'مكتملة': 8,
    'تمت بنجاح': 9,
  };

  final List<Map<String, dynamic>> _trackingSteps = [
    {'title': 'في انتظار الشحن', 'status': 'في انتظار الشحن'},
    {'title': 'في الطريق', 'status': 'في الطريق'},
    {'title': 'تم وصول البضاعة', 'status': 'تم وصول البضاعة'},
    {'title': 'في انتظار وصول الإذن', 'status': 'في انتظار وصول الإذن'},
    {'title': 'تم وصول الإذن', 'status': 'تم وصول الإذن'},
    {'title': 'التخليص الجمركي', 'status': 'التخليص الجمركي'},
    {
      'title': 'جارى ادراج الشحنة واستكمال الاجراءات',
      'status': 'جارى ادراج الشحنة واستكمال الاجراءات',
    },
    {'title': 'جاري الكشف والتثمين', 'status': 'جاري الكشف والتثمين'},
    {'title': 'مكتملة', 'status': 'مكتملة'},
    {'title': 'تمت بنجاح', 'status': 'تمت بنجاح'},
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

      // بعد تحميل بيانات الشحنة، نحمل المستندات المطلوبة
      if (_shipmentData != null) {
        await _loadRequiredDocuments();
      }
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

  Future<void> _loadRequiredDocuments() async {
    try {
      if (_shipmentData == null) {
        print('⚠️ [ShipmentDetails] No shipment data available yet');
        return;
      }

      final shipmentId = _shipmentData!['_id'];
      if (shipmentId == null) {
        print('⚠️ [ShipmentDetails] No shipment ID available');
        return;
      }

      print('📋 [ShipmentDetails] Loading required documents for: $shipmentId');

      final response = await ApiService.getRequiredDocuments(
        shipmentId: shipmentId,
      );

      if (response['success'] == true) {
        final docs = List<Map<String, dynamic>>.from(
          response['requiredDocuments'] ?? [],
        );

        // Fetch file details for uploaded documents
        for (var doc in docs) {
          if (doc['uploaded'] == true && doc['fileId'] != null) {
            final fileId = doc['fileId'].toString();
            print('📄 [ShipmentDetails] Fetching file details for: $fileId');

            try {
              final fileResponse = await ApiService.getUploadById(
                uploadId: fileId,
              );
              if (fileResponse['success'] == true &&
                  fileResponse['upload'] != null) {
                doc['uploadData'] = fileResponse['upload'];
                print(
                  '✅ [ShipmentDetails] Got file data: ${fileResponse['upload']}',
                );
              }
            } catch (e) {
              print('❌ [ShipmentDetails] Error fetching file $fileId: $e');
            }
          }
        }

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
    final status = _shipmentData!['status'] ?? 'في انتظار الشحن';
    return _statusIndexMap[status] ?? 0;
  }

  // Mapping Arabic document names to valid enum values
  String _mapDocumentTypeToEnum(String arabicName) {
    final mappings = {
      // Shipment documents
      'بوليصة الشحن': 'bill_of_lading',
      'بوليصة شحن': 'bill_of_lading',
      'إذن التسليم': 'delivery_permit',
      'اذن التسليم': 'delivery_permit',
      'مستندات التفريغ': 'discharge_docs',
      'الفاتورة المبدئية': 'proforma_invoice',
      'فاتورة مبدئية': 'proforma_invoice',
      'فاتورة': 'invoice',
      'الفاتورة': 'invoice',
      // Factory documents
      'السجل التجاري': 'commercial_register',
      'البطاقة الضريبية': 'tax_card',
      'العقد': 'contract',
      'السجل الصناعي': 'industrial_register',
      'شهادة القيمة المضافة': 'certificate_vat',
      'مستلزمات الإنتاج': 'production_supplies',
      'التوكيل': 'power_of_attorney',
      'بطاقة المندوب': 'personal_id_of_representative',
      // Commercial documents
      'بطاقة استيراد': 'import_export_card',
      'بطاقة استيراد/تصدير': 'import_export_card',
      'شهادات تجارية': 'trade_certificates',
      // Personal documents
      'البطاقة الشخصية': 'personal_id',
      'مستند داعم': 'sample_document',
      // Other
      'تقرير': 'report',
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

  Future<void> _handleDocumentUpload(
    String documentName, {
    String? documentId,
  }) async {
    try {
      // Pick file directly using FilePickerHelper (it already has its own UI)
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

      // Get the MongoDB _id of the shipment for relatedId
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

      // Upload file with relatedId for shipment category
      // Map Arabic document name to valid enum value
      final documentType = _mapDocumentTypeToEnum(documentName);
      print('📤 [Upload] Document name: $documentName -> Type: $documentType');
      print('📤 [Upload] Document ID: $documentId');

      final uploadResult = await ApiService.uploadFile(
        filePath: file.path,
        category: 'shipment',
        documentType: documentType,
        relatedId: shipmentId,
      );

      print('📤 [Upload] Result: $uploadResult');

      if (uploadResult['success'] == true) {
        // Get the uploaded file ID
        final uploadedFileId =
            uploadResult['upload']?['id']?.toString() ??
            uploadResult['upload']?['_id']?.toString();

        print('📤 [Upload] Uploaded file ID: $uploadedFileId');

        // Mark document as uploaded in the shipment's requiredDocuments
        if (documentId != null && uploadedFileId != null) {
          print('📝 [Upload] Marking document as uploaded...');
          final markResult = await ApiService.markDocumentAsUploaded(
            shipmentId: shipmentId,
            documentId: documentId,
            fileId: uploadedFileId,
          );
          print('📝 [Upload] Mark result: $markResult');

          if (markResult['success'] != true) {
            print('⚠️ [Upload] Failed to mark document, but file was uploaded');
          }
        }

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
        _loadRequiredDocuments(); // Reload documents
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
      print('❌ [ShipmentDetails] Upload error: $e');
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
            _shipmentData != null
                ? FloatingActionButton.extended(
                  onPressed: () {
                    context.push(
                      '/chat/${widget.shipmentId}',
                      extra: {'employeeName': _userCache.userName},
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
    final shipmentCode = _shipmentData?['shipmentCode']?.toString() ?? '';

    // Determine shipment type for icon
    final shipmentType =
        _shipmentData?['shipment_type']?.toString().toLowerCase() ?? '';
    final isSea = shipmentType.contains('بحري') || shipmentType.contains('sea');
    final typeIcon =
        isSea ? Icons.directions_boat_rounded : Icons.flight_takeoff_rounded;
    final typeText = isSea ? 'بحري' : 'جوي';
    final typeColor = isSea ? const Color(0xFF1ba3b6) : Colors.orange;

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
                    // Shipment Code (if available)
                    if (shipmentCode.isNotEmpty) ...[
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
                              shipmentCode,
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
                    // ACID Number
                    const Text(
                      'رقم ACID',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 12,
                        fontFamily: 'Cairo',
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      widget.shipmentId,
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
      case 'مكتملة':
      case 'تمت بنجاح':
        return Colors.green;
      case 'في انتظار الشحن':
        return Colors.orange;
      case 'في الطريق':
        return Colors.blue;
      case 'تم وصول البضاعة':
        return Colors.cyan;
      case 'في انتظار وصول الإذن':
      case 'تم وصول الإذن':
        return Colors.purple;
      case 'التخليص الجمركي':
      case 'جارى ادراج الشحنة واستكمال الاجراءات':
      case 'جاري الكشف والتثمين':
        return Colors.indigo;
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
            final uploadData = doc['uploadData']; // بيانات الملف المرفوع

            // Debug logging
            print('📄 [DocumentItem] Doc: $docName');
            print('📄 [DocumentItem] isUploaded: $isUploaded');
            print('📄 [DocumentItem] uploadData: $uploadData');
            print('📄 [DocumentItem] Full doc data: $doc');

            return _buildDocumentItem(
              doc: {
                'title': docName,
                'status': isUploaded ? 'uploaded' : 'pending',
                'required': true,
                'uploadDate':
                    uploadedAt != null ? _formatDate(uploadedAt) : null,
                'type':
                    docName, // استخدام اسم المستند الفعلي بدلاً من 'required'
                '_id': doc['_id'],
              },
              uploadData: uploadData,
            );
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
              // Document icon (يمين)
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

              // Document info (وسط)
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
                    else if (isRequired)
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
                        'اختياري',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                          fontFamily: 'Cairo',
                        ),
                      ),
                  ],
                ),
              ),

              const SizedBox(width: 8),

              // Action icon (شمال)
              if (!isUploaded)
                Container(
                  decoration: BoxDecoration(
                    color: primaryDark.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: IconButton(
                    onPressed:
                        () => _handleDocumentUpload(
                          doc['type'],
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
          if (isUploaded) ...[
            const SizedBox(height: 12),
            Divider(height: 1, color: Colors.grey[200]),
            const SizedBox(height: 8),
            if (uploadData != null)
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _buildDocumentActionButton(
                    icon: Icons.visibility,
                    label: 'عرض',
                    color: accent,
                    onPressed: () => _viewShipmentDocument(uploadData),
                  ),
                  Container(width: 1, height: 30, color: Colors.grey[200]),
                  _buildDocumentActionButton(
                    icon: Icons.edit,
                    label: 'تعديل',
                    color: primaryDark,
                    onPressed:
                        () => _editShipmentDocument(
                          uploadData,
                          documentId: doc['_id']?.toString(),
                        ),
                  ),
                ],
              )
            else
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Text(
                  'تم الرفع - بيانات المستند غير متوفرة',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.orange[700],
                    fontFamily: 'Cairo',
                  ),
                  textAlign: TextAlign.center,
                ),
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

  Future<void> _viewShipmentDocument(Map<String, dynamic> uploadData) async {
    try {
      final url = uploadData['url']?.toString();
      final mimetype = uploadData['mimetype']?.toString() ?? '';
      final filename = uploadData['filename']?.toString() ?? 'مستند';

      if (url == null || url.isEmpty) {
        AlNoranPopups.showError(
          context: context,
          message: 'رابط المستند غير متوفر',
        );
        return;
      }

      print('📄 [ViewShipmentDocument] Opening: $url');
      print('📄 [ViewShipmentDocument] Mimetype: $mimetype');

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
          print('📄 [ViewShipmentDocument] Opening in external app: $uri');

          // Use external application for PDF - works better on mobile
          bool launched = await launchUrl(
            uri,
            mode: LaunchMode.externalApplication,
          );

          if (!launched) {
            // Fallback to platform default
            launched = await launchUrl(uri);
          }

          if (!launched) {
            throw Exception('Failed to launch URL');
          }

          print('📄 [ViewShipmentDocument] Document opened successfully');
        } catch (e) {
          print('❌ [ViewShipmentDocument] Launch error: $e');
          AlNoranPopups.showError(
            context: context,
            message: 'تعذر فتح المستند',
          );
        }
      }
    } catch (e) {
      print('❌ [ViewShipmentDocument] Error: $e');
      AlNoranPopups.showError(
        context: context,
        message: 'حدث خطأ في فتح المستند',
      );
    }
  }

  Future<void> _editShipmentDocument(
    Map<String, dynamic> uploadData, {
    String? documentId,
  }) async {
    final filename = uploadData['filename']?.toString() ?? 'مستند';
    final docType = uploadData['documentType']?.toString() ?? '';

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
                          colors: [primaryDark, primaryDark.withOpacity(0.8)],
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
                              Icons.edit_document,
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
                                  'تعديل المستند',
                                  style: TextStyle(
                                    fontFamily: 'Cairo',
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                                SizedBox(height: 4),
                                Text(
                                  'اختر ما تريد فعله',
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
                          // Document name badge
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              color: accent.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: accent.withOpacity(0.3),
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(
                                  Icons.description,
                                  size: 18,
                                  color: accent,
                                ),
                                const SizedBox(width: 8),
                                Flexible(
                                  child: Text(
                                    filename,
                                    style: const TextStyle(
                                      fontFamily: 'Cairo',
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                      color: accent,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 24),

                          // Replace file button
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton.icon(
                              onPressed:
                                  () => Navigator.pop(dialogContext, 'replace'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: primaryDark,
                                padding: const EdgeInsets.symmetric(
                                  vertical: 16,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              icon: const Icon(
                                Icons.upload_file,
                                color: Colors.white,
                              ),
                              label: const Text(
                                'استبدال الملف',
                                style: TextStyle(
                                  fontFamily: 'Cairo',
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),

                          // View file button
                          SizedBox(
                            width: double.infinity,
                            child: OutlinedButton.icon(
                              onPressed:
                                  () => Navigator.pop(dialogContext, 'view'),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(
                                  vertical: 16,
                                ),
                                side: const BorderSide(
                                  color: accent,
                                  width: 1.5,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              icon: const Icon(Icons.visibility, color: accent),
                              label: const Text(
                                'عرض الملف',
                                style: TextStyle(
                                  fontFamily: 'Cairo',
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: accent,
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

    if (result == 'replace') {
      // Replace file
      await _replaceDocument(uploadData, docType, documentId: documentId);
    } else if (result == 'view') {
      // View document
      await _viewShipmentDocument(uploadData);
    }
  }

  Future<void> _replaceDocument(
    Map<String, dynamic> uploadData,
    String docType, {
    String? documentId,
  }) async {
    try {
      // Pick new file
      final file = await FilePickerHelper.pickFile(context);
      if (file == null) return;

      if (!mounted) return;
      AlNoranPopups.showLoading(
        context: context,
        message: 'جاري استبدال المستند...',
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

      // Delete old file first
      final oldUploadId = uploadData['_id']?.toString();
      if (oldUploadId != null) {
        print('🗑️ [ReplaceDocument] Deleting old file: $oldUploadId');
        await ApiService.deleteUpload(uploadId: oldUploadId);
      }

      // Upload new file - use proper enum mapping
      final mappedDocType = _mapDocumentTypeToEnum(
        docType.isNotEmpty ? docType : 'أخرى',
      );
      print(
        '📤 [ReplaceDocument] Original type: $docType -> Mapped: $mappedDocType',
      );
      print('📤 [ReplaceDocument] Document ID: $documentId');

      final uploadResult = await ApiService.uploadFile(
        filePath: file.path,
        category: 'shipment',
        documentType: mappedDocType,
        relatedId: shipmentId,
      );

      if (uploadResult['success'] == true) {
        // Get the uploaded file ID and update document status
        final uploadedFileId =
            uploadResult['upload']?['id']?.toString() ??
            uploadResult['upload']?['_id']?.toString();

        print('📤 [ReplaceDocument] Uploaded file ID: $uploadedFileId');

        // Mark document as uploaded with new file ID
        if (documentId != null && uploadedFileId != null) {
          print('📝 [ReplaceDocument] Updating document status...');
          final markResult = await ApiService.markDocumentAsUploaded(
            shipmentId: shipmentId,
            documentId: documentId,
            fileId: uploadedFileId,
          );
          print('📝 [ReplaceDocument] Mark result: $markResult');
        }

        context.pop(); // Close loading

        if (mounted) {
          await AlNoranPopups.showSuccess(
            context: context,
            title: 'تم الاستبدال بنجاح',
            message: 'تم استبدال المستند بنجاح',
          );
        }
        // Refresh notifications
        NotificationService().refresh();
        _loadRequiredDocuments(); // Reload documents
      } else {
        context.pop(); // Close loading
        if (mounted) {
          AlNoranPopups.showError(
            context: context,
            message: uploadResult['message'] ?? 'فشل استبدال المستند',
          );
        }
      }
    } catch (e) {
      if (mounted) {
        try {
          context.pop();
        } catch (_) {}
      }
      print('❌ [ReplaceDocument] Error: $e');
      if (mounted) {
        AlNoranPopups.showError(
          context: context,
          message: 'حدث خطأ أثناء استبدال المستند',
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
