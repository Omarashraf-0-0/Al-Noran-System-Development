import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../core/network/api_service.dart';
import '../../core/services/recent_shipments_service.dart';
import '../../core/widgets/unified_top_bar.dart';

class MyExportsPage extends StatefulWidget {
  final String userName;
  final String userEmail;

  const MyExportsPage({
    super.key,
    required this.userName,
    required this.userEmail,
  });

  @override
  State<MyExportsPage> createState() => _MyExportsPageState();
}

class _MyExportsPageState extends State<MyExportsPage>
    with SingleTickerProviderStateMixin {
  // Premium Color Palette
  static const Color primaryDark = Color(0xFF690000);
  static const Color primaryLight = Color(0xFF8B0000);
  static const Color accentColor = Color(0xFF1ba3b6);
  static const Color goldAccent = Color(0xFFD4AF37);
  static const Color bgColor = Color(0xFFF8F9FA);

  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();

  int _selectedIndex = 2; // الصادر (index 2)
  String _selectedFilter = 'الكل';
  String _selectedSort = 'الأحدث';

  // UCR Requests
  List<Map<String, dynamic>> _allCurrentUcrRequests = [];
  List<Map<String, dynamic>> _allCompletedUcrRequests = [];
  List<Map<String, dynamic>> _currentUcrRequests = [];
  List<Map<String, dynamic>> _completedUcrRequests = [];

  // UCR Shipments (shipments created from issued UCR)
  List<Map<String, dynamic>> _allCurrentUcrShipments = [];
  List<Map<String, dynamic>> _allCompletedUcrShipments = [];
  List<Map<String, dynamic>> _currentUcrShipments = [];
  List<Map<String, dynamic>> _completedUcrShipments = [];

  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _searchController.addListener(_onSearchChanged);
    _loadUcrRequests();
  }

  @override
  void dispose() {
    _searchController.removeListener(_onSearchChanged);
    _searchController.dispose();
    _tabController.dispose();
    super.dispose();
  }

  void _onSearchChanged() {
    _applyFiltersAndSearch();
  }

  void _applyFiltersAndSearch() {
    final searchQuery = _searchController.text.toLowerCase().trim();

    if (!mounted) return;
    setState(() {
      // Filter current UCR requests
      _currentUcrRequests =
          _allCurrentUcrRequests.where((request) {
            final matchesSearch =
                searchQuery.isEmpty ||
                (request['destinationCountry']?.toString() ?? '')
                    .toLowerCase()
                    .contains(searchQuery) ||
                (request['destinationPort']?.toString() ?? '')
                    .toLowerCase()
                    .contains(searchQuery) ||
                (request['generalDescription']?.toString() ?? '')
                    .toLowerCase()
                    .contains(searchQuery) ||
                (request['id']?.toString() ?? '').toLowerCase().contains(
                  searchQuery,
                );

            final matchesFilter =
                _selectedFilter == 'الكل' ||
                _getShippingMethodFilter(request) == _selectedFilter;

            return matchesSearch && matchesFilter;
          }).toList();

      // Filter completed UCR requests
      _completedUcrRequests =
          _allCompletedUcrRequests.where((request) {
            final matchesSearch =
                searchQuery.isEmpty ||
                (request['destinationCountry']?.toString() ?? '')
                    .toLowerCase()
                    .contains(searchQuery) ||
                (request['destinationPort']?.toString() ?? '')
                    .toLowerCase()
                    .contains(searchQuery) ||
                (request['generalDescription']?.toString() ?? '')
                    .toLowerCase()
                    .contains(searchQuery) ||
                (request['id']?.toString() ?? '').toLowerCase().contains(
                  searchQuery,
                );

            final matchesFilter =
                _selectedFilter == 'الكل' ||
                _getShippingMethodFilter(request) == _selectedFilter;

            return matchesSearch && matchesFilter;
          }).toList();

      // Filter current export shipments
      _currentUcrShipments =
          _allCurrentUcrShipments.where((shipment) {
            final matchesSearch =
                searchQuery.isEmpty ||
                (shipment['destinationCountry']?.toString() ?? '')
                    .toLowerCase()
                    .contains(searchQuery) ||
                (shipment['destinationPort']?.toString() ?? '')
                    .toLowerCase()
                    .contains(searchQuery) ||
                (shipment['generalDescription']?.toString() ?? '')
                    .toLowerCase()
                    .contains(searchQuery) ||
                (shipment['ucrNumber']?.toString() ?? '')
                    .toLowerCase()
                    .contains(searchQuery) ||
                (shipment['shipmentCode']?.toString() ?? '')
                    .toLowerCase()
                    .contains(searchQuery);

            final matchesFilter =
                _selectedFilter == 'الكل' ||
                _getShippingMethodFilter(shipment) == _selectedFilter;

            return matchesSearch && matchesFilter;
          }).toList();

      // Filter completed export shipments
      _completedUcrShipments =
          _allCompletedUcrShipments.where((shipment) {
            final matchesSearch =
                searchQuery.isEmpty ||
                (shipment['destinationCountry']?.toString() ?? '')
                    .toLowerCase()
                    .contains(searchQuery) ||
                (shipment['destinationPort']?.toString() ?? '')
                    .toLowerCase()
                    .contains(searchQuery) ||
                (shipment['generalDescription']?.toString() ?? '')
                    .toLowerCase()
                    .contains(searchQuery) ||
                (shipment['ucrNumber']?.toString() ?? '')
                    .toLowerCase()
                    .contains(searchQuery) ||
                (shipment['shipmentCode']?.toString() ?? '')
                    .toLowerCase()
                    .contains(searchQuery);

            final matchesFilter =
                _selectedFilter == 'الكل' ||
                _getShippingMethodFilter(shipment) == _selectedFilter;

            return matchesSearch && matchesFilter;
          }).toList();

      // Apply sorting
      _applySorting();
    });
  }

  String _getShippingMethodFilter(Map<String, dynamic> request) {
    final method = request['shippingMethod']?.toString() ?? '';
    if (method == 'sea') return 'بحري';
    if (method == 'air') return 'جوي';
    return 'غير محدد';
  }

  void _applySorting() {
    switch (_selectedSort) {
      case 'الأحدث':
        _currentUcrRequests.sort(
          (a, b) => (b['createdAt'] ?? '').toString().compareTo(
            (a['createdAt'] ?? '').toString(),
          ),
        );
        _completedUcrRequests.sort(
          (a, b) => (b['createdAt'] ?? '').toString().compareTo(
            (a['createdAt'] ?? '').toString(),
          ),
        );
        _currentUcrShipments.sort(
          (a, b) => (b['createdAt'] ?? '').toString().compareTo(
            (a['createdAt'] ?? '').toString(),
          ),
        );
        _completedUcrShipments.sort(
          (a, b) => (b['createdAt'] ?? '').toString().compareTo(
            (a['createdAt'] ?? '').toString(),
          ),
        );
        break;
      case 'الأقدم':
        _currentUcrRequests.sort(
          (a, b) => (a['createdAt'] ?? '').toString().compareTo(
            (b['createdAt'] ?? '').toString(),
          ),
        );
        _completedUcrRequests.sort(
          (a, b) => (a['createdAt'] ?? '').toString().compareTo(
            (b['createdAt'] ?? '').toString(),
          ),
        );
        _currentUcrShipments.sort(
          (a, b) => (a['createdAt'] ?? '').toString().compareTo(
            (b['createdAt'] ?? '').toString(),
          ),
        );
        _completedUcrShipments.sort(
          (a, b) => (a['createdAt'] ?? '').toString().compareTo(
            (b['createdAt'] ?? '').toString(),
          ),
        );
        break;
      case 'البلد':
        _currentUcrRequests.sort(
          (a, b) => (a['destinationCountry'] ?? '').toString().compareTo(
            (b['destinationCountry'] ?? '').toString(),
          ),
        );
        _completedUcrRequests.sort(
          (a, b) => (a['destinationCountry'] ?? '').toString().compareTo(
            (b['destinationCountry'] ?? '').toString(),
          ),
        );
        _currentUcrShipments.sort(
          (a, b) => (a['destinationCountry'] ?? '').toString().compareTo(
            (b['destinationCountry'] ?? '').toString(),
          ),
        );
        _completedUcrShipments.sort(
          (a, b) => (a['destinationCountry'] ?? '').toString().compareTo(
            (b['destinationCountry'] ?? '').toString(),
          ),
        );
        break;
    }
  }

  Future<void> _loadUcrRequests() async {
    try {
      if (!mounted) return;
      setState(() => _isLoading = true);

      print('📦 [MyExports] Loading UCR requests and export shipments...');

      // Load UCR requests and export shipments in parallel
      final results = await Future.wait([
        ApiService.getMyUcrRequests(),
        ApiService.getMyExportShipments(),
      ]);

      final ucrResponse = results[0] as Map<String, dynamic>;
      final exportShipmentsData = results[1] as Map<String, dynamic>;

      // Extract export shipments list from response
      final exportShipments = <Map<String, dynamic>>[];
      if (exportShipmentsData['success'] == true &&
          exportShipmentsData['data'] != null) {
        exportShipments.addAll(
          List<Map<String, dynamic>>.from(exportShipmentsData['data'] ?? []),
        );
      }

      print('📦 [MyExports] UCR Response: $ucrResponse');
      print('🚢 [MyExports] Got ${exportShipments.length} export shipments');

      // Process UCR Requests
      final current = <Map<String, dynamic>>[];
      final completed = <Map<String, dynamic>>[];

      if (ucrResponse['success'] == true) {
        final requests = List<Map<String, dynamic>>.from(
          ucrResponse['data'] ?? [],
        );

        print('📦 [MyExports] Found ${requests.length} UCR requests');

        for (var request in requests) {
          final status = request['status']?.toString() ?? 'Pending';

          final mappedRequest = {
            'id': request['_id'] ?? '',
            'shippingMethod': request['shippingMethod'] ?? 'sea',
            'certificationType': request['certificationType'] ?? 'noran',
            'destinationCountry': request['destinationCountry'] ?? 'غير محدد',
            'destinationPort': request['destinationPort'] ?? 'غير محدد',
            'generalDescription': request['generalDescription'] ?? 'غير محدد',
            'totalWeight': request['totalWeight']?.toString() ?? '0',
            'packagesCount': request['packagesCount']?.toString() ?? '0',
            'valueInEGP': request['valueInEGP']?.toString() ?? '0',
            'invoiceNumber': request['invoiceNumber'] ?? 'غير محدد',
            'invoiceDate': request['invoiceDate'],
            'containersCount': request['containersCount']?.toString() ?? '0',
            'status': _translateUcrStatus(status),
            'statusRaw': status,
            'createdAt': request['createdAt'],
            'notes': request['notes'] ?? '',
            'rawData': request,
          };

          // Completed UCR requests go to completed list, others to current
          final statusLower = status.toLowerCase();
          if (statusLower == 'completed') {
            completed.add(mappedRequest);
          } else {
            current.add(mappedRequest);
          }
        }
      }

      // Process Export Shipments (created from approved UCR requests)
      final currentShipments = <Map<String, dynamic>>[];
      final completedShipments = <Map<String, dynamic>>[];

      for (var shipment in exportShipments) {
        // Export shipment uses currentStatus, not status
        final status =
            shipment['currentStatus']?.toString() ??
            shipment['status']?.toString() ??
            'documents_verification';

        final mappedShipment = {
          'id': shipment['_id'] ?? '',
          'ucrNumber': shipment['ucrNumber'] ?? 'N/A',
          'shipmentCode':
              shipment['shipmentNumber'] ?? shipment['shipmentCode'] ?? '',
          'type': 'Export',
          'shipment_type': 'Export',
          'shippingMethod': shipment['shippingMethod'] ?? 'sea',
          'destinationCountry': shipment['destinationCountry'] ?? 'غير محدد',
          'destinationPort': shipment['destinationPort'] ?? 'غير محدد',
          'generalDescription': shipment['generalDescription'] ?? 'غير محدد',
          'totalWeight': shipment['totalWeight']?.toString() ?? '0',
          'packagesCount': shipment['packagesCount']?.toString() ?? '0',
          'valueInEGP': shipment['valueInEGP']?.toString() ?? '0',
          'invoiceNumber': shipment['invoiceNumber'] ?? 'غير محدد',
          'invoiceDate': shipment['invoiceDate'],
          'containersCount': shipment['containersCount']?.toString() ?? '0',
          'date': _formatDate(shipment['updatedAt'] ?? shipment['createdAt']),
          'status': _translateUcrStatus(status),
          'statusRaw': status,
          'isUrgent': _isUrgent(status),
          'hasDocuments':
              shipment['documents'] != null &&
              (shipment['documents'] as List?)?.isNotEmpty == true,
          'exporterName': shipment['exporterName'] ?? 'غير محدد',
          'exporterAddress': shipment['exporterAddress'] ?? '',
          'exporterPhone': shipment['exporterPhone'] ?? '',
          'ucrRequestId': shipment['ucrRequestId'],
          'rawData': shipment,
          'itemType': 'exportShipment',
          'createdAt': shipment['createdAt'],
        };

        // Check status for categorization (lowercase for consistency)
        final statusLower = status.toLowerCase();
        if (statusLower == 'completed' ||
            statusLower == 'delivered' ||
            status == 'تمت بنجاح' ||
            status == 'تم التسليم' ||
            status == 'مكتمل') {
          completedShipments.add(mappedShipment);
        } else {
          currentShipments.add(mappedShipment);
        }
      }

      print(
        '🚢 [MyExports] Export Shipments - Current: ${currentShipments.length}, Completed: ${completedShipments.length}',
      );

      if (!mounted) return;
      setState(() {
        _allCurrentUcrRequests = current;
        _allCompletedUcrRequests = completed;
        _currentUcrRequests = current;
        _completedUcrRequests = completed;

        _allCurrentUcrShipments = currentShipments;
        _allCompletedUcrShipments = completedShipments;
        _currentUcrShipments = currentShipments;
        _completedUcrShipments = completedShipments;

        _isLoading = false;
      });

      print(
        '📦 [MyExports] UCR Requests - Current: ${current.length}, Completed: ${completed.length}',
      );
    } catch (e) {
      print('❌ [MyExports] Error: $e');
      if (!mounted) return;
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('حدث خطأ في تحميل البيانات'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  String _translateUcrStatus(String status) {
    // Convert to lowercase for case-insensitive matching
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

      // Export Shipment Statuses (after UCR issued)
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

      // Legacy/Alternative formats
      case 'inprogress':
        return 'جاري التنفيذ';
      case 'processing':
        return 'جاري المعالجة';
      case 'waiting for shipment':
        return 'في انتظار الشحن';
      case 'ready':
        return 'جاهز';

      default:
        return status;
    }
  }

  String _getShipmentType(String? acid) {
    if (acid == null) return 'غير محدد';
    if (acid.toUpperCase().startsWith('SEA')) return 'بحري';
    if (acid.toUpperCase().startsWith('AIR')) return 'جوي';
    if (acid.toUpperCase().startsWith('LAND')) return 'بري';
    return 'غير محدد';
  }

  bool _isUrgent(String? status) {
    if (status == null) return false;
    final statusLower = status.toLowerCase();

    return statusLower == 'pending' ||
        statusLower == 'under_review' ||
        statusLower == 'needs_revision' ||
        statusLower == 'documents_verification' ||
        statusLower == 'regulatory_inspection' ||
        statusLower == 'waiting for shipment' ||
        status == 'في انتظار الشحن' ||
        status == 'في انتظار وصول الإذن' ||
        status == 'قيد المراجعة' ||
        status == 'في انتظار المراجعة' ||
        status == 'قيد التدقيق' ||
        status == 'يحتاج تعديل' ||
        status == 'التحقق من المستندات' ||
        status == 'فحص الجهات الرقابية';
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

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: bgColor,
        body: Stack(
          children: [
            // Premium Background with Multiple Gradient Layers
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              height: 350,
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      primaryDark.withOpacity(0.08),
                      primaryLight.withOpacity(0.04),
                      accentColor.withOpacity(0.02),
                      bgColor,
                    ],
                    stops: const [0.0, 0.3, 0.6, 1.0],
                  ),
                ),
              ),
            ),
            // Decorative Circles
            Positioned(
              top: -50,
              left: -50,
              child: Container(
                width: 200,
                height: 200,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      primaryDark.withOpacity(0.08),
                      primaryDark.withOpacity(0.0),
                    ],
                  ),
                ),
              ),
            ),
            Positioned(
              top: 100,
              right: -30,
              child: Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      accentColor.withOpacity(0.1),
                      accentColor.withOpacity(0.0),
                    ],
                  ),
                ),
              ),
            ),
            // Main Content
            Column(
              children: [
                UnifiedTopBar(
                  showBackButton: true,
                  showMenu: false,
                  title: 'الصادر',
                  subtitle: 'شحنات التصدير الخاصة بك',
                  titleIcon: Icons.upload_rounded,
                  showWelcome: false,
                ),
                Expanded(
                  child: SafeArea(
                    top: false,
                    child: Column(
                      children: [
                        _buildPremiumSearchBar(),
                        const SizedBox(height: 16),
                        _buildPremiumTabs(),
                        const SizedBox(height: 16),
                        Expanded(
                          child:
                              _isLoading
                                  ? _buildPremiumLoadingState()
                                  : TabBarView(
                                    controller: _tabController,
                                    children: [
                                      _buildCombinedCurrentList(),
                                      _buildCombinedCompletedList(),
                                      _buildAllUcrRequestsList(),
                                    ],
                                  ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
        floatingActionButton: _buildPremiumFloatingActionButton(),
        floatingActionButtonLocation: FloatingActionButtonLocation.startFloat,
        bottomNavigationBar: _buildPremiumBottomNav(),
      ),
    );
  }

  Widget _buildPremiumLoadingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: primaryDark.withOpacity(0.1),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: SizedBox(
              width: 50,
              height: 50,
              child: CircularProgressIndicator(
                color: primaryDark,
                strokeWidth: 3,
              ),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'جاري تحميل الصادرات...',
            style: TextStyle(
              fontSize: 16,
              fontFamily: 'Cairo',
              color: Colors.grey[600],
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'يرجى الانتظار',
            style: TextStyle(
              fontSize: 13,
              fontFamily: 'Cairo',
              color: Colors.grey[400],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPremiumSearchBar() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.symmetric(horizontal: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 15,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          const SizedBox(width: 4),
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: bgColor,
                borderRadius: BorderRadius.circular(16),
              ),
              child: TextField(
                controller: _searchController,
                textAlign: TextAlign.right,
                style: const TextStyle(fontFamily: 'Cairo', fontSize: 14),
                decoration: InputDecoration(
                  hintText: 'البحث في الشحنات الصادرة',
                  hintStyle: TextStyle(
                    color: Colors.grey[400],
                    fontFamily: 'Cairo',
                    fontSize: 13,
                  ),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 14,
                  ),
                  suffixIcon: Icon(
                    Icons.search_rounded,
                    color: Colors.grey[400],
                    size: 24,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          InkWell(
            onTap: _showFilterBottomSheet,
            borderRadius: BorderRadius.circular(14),
            child: Container(
              padding: const EdgeInsets.all(11),
              margin: const EdgeInsets.all(5),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [accentColor, accentColor.withOpacity(0.8)],
                ),
                borderRadius: BorderRadius.circular(14),
                boxShadow: [
                  BoxShadow(
                    color: accentColor.withOpacity(0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: const Icon(
                Icons.filter_list_rounded,
                color: Colors.white,
                size: 20,
              ),
            ),
          ),
          const SizedBox(width: 4),
          InkWell(
            onTap: _showSortBottomSheet,
            borderRadius: BorderRadius.circular(14),
            child: Container(
              padding: const EdgeInsets.all(11),
              margin: const EdgeInsets.all(5),
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [primaryDark, primaryLight]),
                borderRadius: BorderRadius.circular(14),
                boxShadow: [
                  BoxShadow(
                    color: primaryDark.withOpacity(0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: const Icon(
                Icons.sort_rounded,
                color: Colors.white,
                size: 20,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPremiumTabs() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: primaryDark.withOpacity(0.08),
            blurRadius: 20,
            offset: const Offset(0, 6),
          ),
        ],
        border: Border.all(color: primaryDark.withOpacity(0.05), width: 1),
      ),
      child: TabBar(
        controller: _tabController,
        labelColor: Colors.white,
        unselectedLabelColor: primaryDark.withOpacity(0.7),
        dividerColor: Colors.transparent,
        indicator: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [primaryDark, primaryLight],
          ),
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(
              color: primaryDark.withOpacity(0.35),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        indicatorSize: TabBarIndicatorSize.tab,
        labelStyle: const TextStyle(
          fontFamily: 'Cairo',
          fontSize: 13,
          fontWeight: FontWeight.bold,
        ),
        unselectedLabelStyle: const TextStyle(
          fontFamily: 'Cairo',
          fontSize: 13,
          fontWeight: FontWeight.w600,
        ),
        splashBorderRadius: BorderRadius.circular(18),
        overlayColor: WidgetStateProperty.all(primaryDark.withOpacity(0.05)),
        tabs: [
          Tab(
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.pending_actions_rounded, size: 16),
                  SizedBox(width: 5),
                  Flexible(
                    child: Text('الجارية', overflow: TextOverflow.ellipsis),
                  ),
                ],
              ),
            ),
          ),
          Tab(
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.check_circle_rounded, size: 16),
                  SizedBox(width: 5),
                  Flexible(
                    child: Text('المكتملة', overflow: TextOverflow.ellipsis),
                  ),
                ],
              ),
            ),
          ),
          Tab(
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.receipt_long_rounded, size: 16),
                  SizedBox(width: 5),
                  Flexible(child: Text('UCR', overflow: TextOverflow.ellipsis)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUcrRequestsList(
    List<Map<String, dynamic>> requests,
    bool isCurrent,
  ) {
    if (requests.isEmpty) {
      String emptyMessage;
      IconData emptyIcon;

      if (_selectedFilter == 'بحري') {
        emptyIcon = Icons.directions_boat_outlined;
        emptyMessage =
            isCurrent
                ? 'لا توجد طلبات تصدير بحرية جارية'
                : 'لا توجد طلبات تصدير بحرية مكتملة';
      } else if (_selectedFilter == 'جوي') {
        emptyIcon = Icons.flight_takeoff_outlined;
        emptyMessage =
            isCurrent
                ? 'لا توجد طلبات تصدير جوية جارية'
                : 'لا توجد طلبات تصدير جوية مكتملة';
      } else {
        emptyIcon = Icons.flight_takeoff_outlined;
        emptyMessage =
            isCurrent
                ? 'لا توجد طلبات تصدير جارية'
                : 'لا توجد طلبات تصدير مكتملة';
      }

      return RefreshIndicator(
        onRefresh: _loadUcrRequests,
        color: const Color(0xFF690000),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: SizedBox(
            height: MediaQuery.of(context).size.height * 0.5,
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(emptyIcon, size: 80, color: Colors.grey[300]),
                  const SizedBox(height: 16),
                  Text(
                    emptyMessage,
                    style: TextStyle(
                      fontSize: 18,
                      fontFamily: 'Cairo',
                      color: Colors.grey[500],
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'اسحب لأسفل للتحديث',
                    style: TextStyle(
                      fontSize: 14,
                      fontFamily: 'Cairo',
                      color: Colors.grey[400],
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: () {
                      context.push(
                        '/ucr-request',
                        extra: {
                          'userName': widget.userName,
                          'userEmail': widget.userEmail,
                        },
                      );
                    },
                    icon: const Icon(Icons.add),
                    label: const Text(
                      'إنشاء طلب تصدير جديد',
                      style: TextStyle(fontFamily: 'Cairo'),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF690000),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 24,
                        vertical: 12,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadUcrRequests,
      color: const Color(0xFF690000),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: requests.length,
        itemBuilder: (context, index) {
          return _buildUcrRequestCard(requests[index]);
        },
      ),
    );
  }

  Widget _buildUcrRequestCard(Map<String, dynamic> request) {
    final requestId = request['id']?.toString() ?? '';
    final statusColor = _getStatusColor(request['statusRaw']);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: primaryDark.withOpacity(0.15), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: primaryDark.withOpacity(0.08),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          onTap: () async {
            HapticFeedback.lightImpact();
            if (requestId.isNotEmpty) {
              // Add with export flag for proper display in home page
              await RecentShipmentsService.addRecentShipment({
                ...request,
                '_sourceType': 'export',
                'isExport': true,
              });
              if (mounted) {
                context.push('/ucr-details/$requestId');
              }
            }
          },
          borderRadius: BorderRadius.circular(20),
          child: Column(
            children: [
              // Premium Header with Gradient
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 18,
                  vertical: 14,
                ),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      primaryDark.withOpacity(0.08),
                      primaryDark.withOpacity(0.03),
                    ],
                  ),
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(20),
                    topRight: Radius.circular(20),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Flexible(
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
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: const Icon(
                              Icons.receipt_long,
                              color: Colors.white,
                              size: 22,
                            ),
                          ),
                          const SizedBox(width: 14),
                          Flexible(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'طلب UCR',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontFamily: 'Cairo',
                                    fontWeight: FontWeight.w600,
                                    color: primaryDark.withOpacity(0.7),
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  requestId,
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.bold,
                                    color: primaryDark,
                                    fontFamily: 'Cairo',
                                    letterSpacing: 0.5,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: statusColor.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: statusColor.withOpacity(0.3),
                          width: 1,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              color: statusColor,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: statusColor.withOpacity(0.4),
                                  blurRadius: 4,
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            request['status'] ?? '',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: statusColor,
                              fontFamily: 'Cairo',
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // Content Section
              Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Destination Row
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: bgColor,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: primaryDark.withOpacity(0.08),
                          width: 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  accentColor.withOpacity(0.15),
                                  accentColor.withOpacity(0.08),
                                ],
                              ),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(
                              Icons.location_on_outlined,
                              size: 22,
                              color: accentColor,
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'الوجهة',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontFamily: 'Cairo',
                                    color: Colors.grey[500],
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '${request['destinationCountry'] ?? ''} - ${request['destinationPort'] ?? ''}',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: accentColor,
                                    fontFamily: 'Cairo',
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 12),

                    // Description Row
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: goldAccent.withOpacity(0.05),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: goldAccent.withOpacity(0.15),
                          width: 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: goldAccent.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(
                              Icons.inventory_2_outlined,
                              size: 22,
                              color: goldAccent,
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'وصف البضاعة',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontFamily: 'Cairo',
                                    color: Colors.grey[500],
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  request['generalDescription'] ?? 'غير محدد',
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: Color(0xFF424242),
                                    fontFamily: 'Cairo',
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Weight and Date Row
                    Row(
                      children: [
                        // Weight Badge
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 10,
                            ),
                            decoration: BoxDecoration(
                              color: primaryDark.withOpacity(0.08),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.scale_outlined,
                                  size: 16,
                                  color: primaryDark,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  '${request['totalWeight'] ?? '0'} كجم',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: primaryDark,
                                    fontFamily: 'Cairo',
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        // Date Badge
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 10,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.grey.withOpacity(0.08),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.schedule_rounded,
                                size: 14,
                                color: Colors.grey[600],
                              ),
                              const SizedBox(width: 6),
                              Text(
                                _formatDate(request['createdAt']),
                                style: TextStyle(
                                  fontSize: 11,
                                  fontFamily: 'Cairo',
                                  fontWeight: FontWeight.w600,
                                  color: Colors.grey[700],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildExportShipmentCard(Map<String, dynamic> shipment) {
    // Check if it's sea or air
    final shippingMethod =
        shipment['shippingMethod']?.toString().toLowerCase() ?? '';
    final isSea =
        shippingMethod.contains('بحري') || shippingMethod.contains('sea');
    final typeText = isSea ? 'بحري' : 'جوي';
    final typeIcon =
        isSea ? Icons.directions_boat_rounded : Icons.flight_takeoff_rounded;
    final typeColor = isSea ? accentColor : goldAccent;

    // Status color
    final statusColor = _getStatusColor(
      shipment['statusRaw'] ?? shipment['status'],
    );

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: typeColor.withOpacity(0.15), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: primaryDark.withOpacity(0.06),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
          BoxShadow(
            color: typeColor.withOpacity(0.08),
            blurRadius: 20,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          onTap: () async {
            HapticFeedback.lightImpact();
            final shipmentId = shipment['id'] ?? '';
            // Add with export flag for proper display in home page
            await RecentShipmentsService.addRecentShipment({
              ...shipment,
              '_sourceType': 'export',
              'isExport': true,
            });
            if (mounted) {
              context.push('/export-shipment-details/$shipmentId');
            }
          },
          borderRadius: BorderRadius.circular(20),
          child: Column(
            children: [
              // Premium Header with Gradient
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 18,
                  vertical: 14,
                ),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      typeColor.withOpacity(0.08),
                      typeColor.withOpacity(0.03),
                    ],
                  ),
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(20),
                    topRight: Radius.circular(20),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Flexible(
                      child: Row(
                        children: [
                          // Shipment Code Badge
                          if (shipment['shipmentCode']?.toString().isNotEmpty ==
                              true) ...[
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 14,
                                vertical: 8,
                              ),
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [primaryDark, primaryLight],
                                ),
                                borderRadius: BorderRadius.circular(12),
                                boxShadow: [
                                  BoxShadow(
                                    color: primaryDark.withOpacity(0.3),
                                    blurRadius: 8,
                                    offset: const Offset(0, 3),
                                  ),
                                ],
                              ),
                              child: Text(
                                shipment['shipmentCode'],
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  fontFamily: 'Cairo',
                                  color: Colors.white,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                          ],
                          // Type Badge
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: typeColor.withOpacity(0.3),
                                width: 1.5,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: typeColor.withOpacity(0.15),
                                  blurRadius: 6,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(typeIcon, size: 16, color: typeColor),
                                const SizedBox(width: 5),
                                Text(
                                  typeText,
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontFamily: 'Cairo',
                                    fontWeight: FontWeight.bold,
                                    color: typeColor,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(10),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.05),
                            blurRadius: 5,
                          ),
                        ],
                      ),
                      child: Icon(
                        Icons.arrow_forward_ios_rounded,
                        size: 14,
                        color: primaryDark,
                      ),
                    ),
                  ],
                ),
              ),

              // Content Section
              Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // UCR Number Row
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: bgColor,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: primaryDark.withOpacity(0.08),
                          width: 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  primaryDark.withOpacity(0.1),
                                  primaryLight.withOpacity(0.05),
                                ],
                              ),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(
                              Icons.qr_code_2_rounded,
                              size: 22,
                              color: primaryDark,
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'رقم UCR',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontFamily: 'Cairo',
                                    color: Colors.grey[500],
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  shipment['ucrNumber'] ?? 'N/A',
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.bold,
                                    fontFamily: 'Cairo',
                                    color: primaryDark,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Destination Row
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: accentColor.withOpacity(0.05),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: accentColor.withOpacity(0.15),
                          width: 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: accentColor.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(
                              Icons.location_on_outlined,
                              size: 22,
                              color: accentColor,
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'الوجهة',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontFamily: 'Cairo',
                                    color: Colors.grey[500],
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '${shipment['destinationCountry'] ?? ''} - ${shipment['destinationPort'] ?? ''}',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    fontFamily: 'Cairo',
                                    color: accentColor,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Status and Date Row
                    Row(
                      children: [
                        // Status Badge
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 10,
                            ),
                            decoration: BoxDecoration(
                              color: statusColor.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: statusColor.withOpacity(0.2),
                                width: 1,
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  width: 8,
                                  height: 8,
                                  decoration: BoxDecoration(
                                    color: statusColor,
                                    shape: BoxShape.circle,
                                    boxShadow: [
                                      BoxShadow(
                                        color: statusColor.withOpacity(0.4),
                                        blurRadius: 4,
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    shipment['status'] ?? '',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontFamily: 'Cairo',
                                      fontWeight: FontWeight.bold,
                                      color: statusColor,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        // Date Badge
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 10,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.grey.withOpacity(0.08),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.schedule_rounded,
                                size: 14,
                                color: Colors.grey[600],
                              ),
                              const SizedBox(width: 6),
                              Text(
                                shipment['date'] ?? '',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontFamily: 'Cairo',
                                  fontWeight: FontWeight.w600,
                                  color: Colors.grey[700],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 16),

                    // Premium View Details Button
                    Container(
                      width: double.infinity,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [primaryDark, primaryLight],
                        ),
                        borderRadius: BorderRadius.circular(14),
                        boxShadow: [
                          BoxShadow(
                            color: primaryDark.withOpacity(0.35),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          onTap: () {
                            HapticFeedback.lightImpact();
                            final shipmentId = shipment['id'] ?? '';
                            context.push(
                              '/export-shipment-details/$shipmentId',
                            );
                          },
                          borderRadius: BorderRadius.circular(14),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: const [
                                Text(
                                  'عرض تفاصيل الشحنة',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    fontFamily: 'Cairo',
                                    color: Colors.white,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                                SizedBox(width: 10),
                                Icon(
                                  Icons.visibility_rounded,
                                  size: 18,
                                  color: Colors.white,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Build Current Shipments List (Export Shipments only)
  /// Shows current export shipments - same pattern as myShipments
  Widget _buildCombinedCurrentList() {
    // Show only current export shipments
    final shipmentsList = <Map<String, dynamic>>[];

    // If a type filter is selected (بحري/جوي), show from both current and completed
    if (_selectedFilter == 'بحري' || _selectedFilter == 'جوي') {
      shipmentsList.addAll(_currentUcrShipments);
      shipmentsList.addAll(_completedUcrShipments);
      print(
        '🔍 [MyExports] Type Filter "$_selectedFilter" - Shipments: ${shipmentsList.length}',
      );
    } else {
      shipmentsList.addAll(_currentUcrShipments);
      print('🔍 [MyExports] Current Shipments: ${_currentUcrShipments.length}');
    }

    if (shipmentsList.isEmpty) {
      String emptyMessage;
      IconData emptyIcon;

      if (_selectedFilter == 'بحري') {
        emptyIcon = Icons.directions_boat_outlined;
        emptyMessage = 'لا توجد شحنات تصدير بحرية جارية';
      } else if (_selectedFilter == 'جوي') {
        emptyIcon = Icons.flight_takeoff_outlined;
        emptyMessage = 'لا توجد شحنات تصدير جوية جارية';
      } else {
        emptyIcon = Icons.flight_takeoff_outlined;
        emptyMessage = 'لا توجد شحنات تصدير جارية';
      }

      return RefreshIndicator(
        onRefresh: _loadUcrRequests,
        color: const Color(0xFF690000),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: SizedBox(
            height: MediaQuery.of(context).size.height * 0.5,
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(emptyIcon, size: 80, color: Colors.grey[300]),
                  const SizedBox(height: 16),
                  Text(
                    emptyMessage,
                    style: TextStyle(
                      fontSize: 18,
                      fontFamily: 'Cairo',
                      color: Colors.grey[500],
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'اسحب لأسفل للتحديث',
                    style: TextStyle(
                      fontSize: 14,
                      fontFamily: 'Cairo',
                      color: Colors.grey[400],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadUcrRequests,
      color: const Color(0xFF690000),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: shipmentsList.length,
        itemBuilder: (context, index) {
          return _buildExportShipmentCard(shipmentsList[index]);
        },
      ),
    );
  }

  /// Build Completed Shipments List
  Widget _buildCombinedCompletedList() {
    // Show completed export shipments - same pattern as myShipments
    final shipmentsList = <Map<String, dynamic>>[];

    // If a type filter is selected (بحري/جوي), show from both current and completed
    if (_selectedFilter == 'بحري' || _selectedFilter == 'جوي') {
      shipmentsList.addAll(_currentUcrShipments);
      shipmentsList.addAll(_completedUcrShipments);
    } else {
      shipmentsList.addAll(_completedUcrShipments);
    }

    if (shipmentsList.isEmpty) {
      String emptyMessage;
      IconData emptyIcon;

      if (_selectedFilter == 'بحري') {
        emptyIcon = Icons.directions_boat_outlined;
        emptyMessage = 'لا توجد شحنات تصدير بحرية مكتملة';
      } else if (_selectedFilter == 'جوي') {
        emptyIcon = Icons.flight_takeoff_outlined;
        emptyMessage = 'لا توجد شحنات تصدير جوية مكتملة';
      } else {
        emptyIcon = Icons.check_circle_outline;
        emptyMessage = 'لا توجد شحنات تصدير مكتملة';
      }

      return RefreshIndicator(
        onRefresh: _loadUcrRequests,
        color: const Color(0xFF690000),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: SizedBox(
            height: MediaQuery.of(context).size.height * 0.5,
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(emptyIcon, size: 80, color: Colors.grey[300]),
                  const SizedBox(height: 16),
                  Text(
                    emptyMessage,
                    style: TextStyle(
                      fontSize: 18,
                      fontFamily: 'Cairo',
                      color: Colors.grey[500],
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'اسحب لأسفل للتحديث',
                    style: TextStyle(
                      fontSize: 14,
                      fontFamily: 'Cairo',
                      color: Colors.grey[400],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadUcrRequests,
      color: const Color(0xFF690000),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: shipmentsList.length,
        itemBuilder: (context, index) {
          return _buildExportShipmentCard(shipmentsList[index]);
        },
      ),
    );
  }

  Widget _buildAllUcrRequestsList() {
    // Show only UCR requests (current and completed)
    // Shipments are shown in other tabs
    final allItems = <Map<String, dynamic>>[];
    allItems.addAll(_currentUcrRequests);
    allItems.addAll(_completedUcrRequests);

    // Sort by date
    allItems.sort((a, b) {
      final aDate = a['createdAt'] ?? a['rawData']?['createdAt'] ?? '';
      final bDate = b['createdAt'] ?? b['rawData']?['createdAt'] ?? '';
      return bDate.toString().compareTo(aDate.toString());
    });

    if (allItems.isEmpty) {
      return RefreshIndicator(
        onRefresh: _loadUcrRequests,
        color: const Color(0xFF690000),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: SizedBox(
            height: MediaQuery.of(context).size.height * 0.5,
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.flight_takeoff_outlined,
                    size: 80,
                    color: Colors.grey[300],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'لا توجد طلبات UCR',
                    style: TextStyle(
                      fontSize: 18,
                      fontFamily: 'Cairo',
                      color: Colors.grey[500],
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'اسحب لأسفل للتحديث',
                    style: TextStyle(
                      fontSize: 14,
                      fontFamily: 'Cairo',
                      color: Colors.grey[400],
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: () {
                      context.push(
                        '/ucr-request',
                        extra: {
                          'userName': widget.userName,
                          'userEmail': widget.userEmail,
                        },
                      );
                    },
                    icon: const Icon(Icons.add),
                    label: const Text(
                      'إنشاء طلب تصدير جديد',
                      style: TextStyle(fontFamily: 'Cairo'),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF690000),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 24,
                        vertical: 12,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadUcrRequests,
      color: const Color(0xFF690000),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: allItems.length,
        itemBuilder: (context, index) {
          final item = allItems[index];
          return _buildUcrRequestCard(item);
        },
      ),
    );
  }

  Color _getStatusColor(String status) {
    // Convert to lowercase for case-insensitive matching
    final statusLower = status.toLowerCase();

    switch (statusLower) {
      // UCR Request - Pending/Waiting states (Orange)
      case 'pending':
      case 'under_review':
      case 'needs_revision':
      case 'waiting for shipment':
        return Colors.orange;

      // UCR Request - Success states (Green)
      case 'approved':
      case 'ucr_issued':
        return Colors.green;

      // UCR Request - Rejected (Red)
      case 'rejected':
        return Colors.red;

      // Export Shipment - Verification/Inspection (Orange)
      case 'documents_verification':
      case 'regulatory_inspection':
        return Colors.orange;

      // Export Shipment - In Progress (Cyan)
      case 'payment_cleared':
      case 'goods_loaded':
      case 'in_transit':
      case 'inprogress':
      case 'processing':
      case 'ready':
        return const Color(0xFF1ba3b6);

      // Export Shipment - Success states (Green)
      case 'delivered':
      case 'completed':
        return Colors.green;

      // Export Shipment - Cancelled (Red)
      case 'cancelled':
        return Colors.red;

      // Arabic status values (for display)
      case 'تمت بنجاح':
      case 'مكتمل':
      case 'تم التسليم':
      case 'معتمد':
      case 'تمت الموافقة':
      case 'تم إصدار ucr':
      case 'تم استخراج ucr':
        return Colors.green;
      case 'في انتظار الشحن':
      case 'في انتظار وصول الإذن':
      case 'قيد المراجعة':
      case 'في الطريق':
      case 'في انتظار المراجعة':
      case 'قيد التدقيق':
      case 'يحتاج تعديل':
      case 'في انتظار موافقة الجهات الرقابية':
      case 'في انتظار شهادة المنشأ':
        return Colors.orange;
      case 'جاري التنفيذ':
      case 'جاري المعالجة':
      case 'جاهز':
      case 'جاهز للشحن':
      case 'تم تجهيز المستندات':
      case 'تم الإدراج ورقم 46':
        return const Color(0xFF1ba3b6);
      case 'مرفوض':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  Widget _buildPremiumFloatingActionButton() {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [primaryDark, primaryLight],
        ),
        boxShadow: [
          BoxShadow(
            color: primaryDark.withOpacity(0.4),
            blurRadius: 15,
            offset: const Offset(0, 6),
          ),
          BoxShadow(
            color: goldAccent.withOpacity(0.2),
            blurRadius: 20,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            HapticFeedback.mediumImpact();
            context.push(
              '/ucr-request',
              extra: {
                'userName': widget.userName,
                'userEmail': widget.userEmail,
              },
            );
          },
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.add_rounded,
                    size: 20,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(width: 10),
                const Text(
                  'طلب تصدير',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Cairo',
                    color: Colors.white,
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _handleNavigationTap(int index) {
    switch (index) {
      case 0:
        // الرئيسية - navigate to home
        setState(() => _selectedIndex = index);
        context.go(
          '/home',
          extra: {'userName': widget.userName, 'userEmail': widget.userEmail},
        );
        break;
      case 1:
        // الوارد - Navigate to incoming shipments
        setState(() => _selectedIndex = index);
        context.go(
          '/shipments',
          extra: {
            'userName': widget.userName,
            'userEmail': widget.userEmail,
            'type': 'incoming',
          },
        );
        break;
      case 2:
        // الصادر - Navigate to exports page (already here)
        if (_selectedIndex != 2) {
          setState(() => _selectedIndex = 2);
        }
        break;
      case 3:
        // الفواتير - Navigate to payments page
        setState(() => _selectedIndex = index);
        context.go(
          '/payments',
          extra: {'userName': widget.userName, 'userEmail': widget.userEmail},
        );
        break;
    }
  }

  // ==================== PREMIUM BOTTOM NAVIGATION ====================
  Widget _buildPremiumBottomNav() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(30),
          topRight: Radius.circular(30),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildPremiumNavItem(0, Icons.home_rounded, 'الرئيسية'),
              _buildPremiumNavItem(1, Icons.flight_land_rounded, 'الوارد'),
              _buildPremiumNavItem(2, Icons.flight_takeoff_rounded, 'الصادر'),
              _buildPremiumNavItem(3, Icons.receipt_long_rounded, 'الفواتير'),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPremiumNavItem(int index, IconData icon, String label) {
    final isSelected = _selectedIndex == index;

    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        _handleNavigationTap(index);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: EdgeInsets.symmetric(
          horizontal: isSelected ? 20 : 16,
          vertical: 10,
        ),
        decoration: BoxDecoration(
          gradient:
              isSelected
                  ? const LinearGradient(
                    colors: [Color(0xFF690000), Color(0xFF8B0000)],
                  )
                  : null,
          color: isSelected ? null : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
          boxShadow:
              isSelected
                  ? [
                    BoxShadow(
                      color: const Color(0xFF690000).withOpacity(0.3),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ]
                  : [],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              color: isSelected ? Colors.white : Colors.grey[500],
              size: 22,
            ),
            if (isSelected) ...[
              const SizedBox(width: 8),
              Text(
                label,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  fontFamily: 'Cairo',
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _showFilterBottomSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder:
          (context) => Directionality(
            textDirection: TextDirection.rtl,
            child: Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(25)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    margin: const EdgeInsets.only(top: 12),
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Row(
                      children: const [
                        Icon(
                          Icons.filter_list_rounded,
                          color: Color(0xFF690000),
                          size: 28,
                        ),
                        SizedBox(width: 12),
                        Text(
                          'تصفية حسب',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Cairo',
                            color: Color(0xFF690000),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Divider(height: 1),
                  const SizedBox(height: 8),
                  _buildFilterOption('الكل', Icons.list_rounded),
                  _buildFilterOption('بحري', Icons.directions_boat_rounded),
                  _buildFilterOption('جوي', Icons.flight_takeoff_rounded),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),
    );
  }

  Widget _buildFilterOption(String title, IconData icon) {
    final isSelected = _selectedFilter == title;
    return InkWell(
      onTap: () {
        if (!mounted) return;
        setState(() {
          _selectedFilter = title;
        });
        Navigator.pop(context);
        _applyFiltersAndSearch();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color:
                    isSelected
                        ? const Color(0xFF690000).withOpacity(0.1)
                        : Colors.grey.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                icon,
                color: isSelected ? const Color(0xFF690000) : Colors.grey[600],
                size: 22,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                title,
                style: TextStyle(
                  fontSize: 16,
                  fontFamily: 'Cairo',
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                  color:
                      isSelected
                          ? const Color(0xFF690000)
                          : const Color(0xFF424242),
                ),
              ),
            ),
            Icon(
              isSelected
                  ? Icons.radio_button_checked_rounded
                  : Icons.radio_button_unchecked_rounded,
              color: isSelected ? const Color(0xFF690000) : Colors.grey[400],
              size: 24,
            ),
          ],
        ),
      ),
    );
  }

  void _showSortBottomSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder:
          (context) => Directionality(
            textDirection: TextDirection.rtl,
            child: Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(25)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    margin: const EdgeInsets.only(top: 12),
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Row(
                      children: const [
                        Icon(
                          Icons.sort_rounded,
                          color: Color(0xFF690000),
                          size: 28,
                        ),
                        SizedBox(width: 12),
                        Text(
                          'ترتيب حسب',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Cairo',
                            color: Color(0xFF690000),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Divider(height: 1),
                  const SizedBox(height: 8),
                  _buildSortOption('الأحدث', Icons.arrow_downward_rounded),
                  _buildSortOption('الأقدم', Icons.arrow_upward_rounded),
                  _buildSortOption('البلد', Icons.public_rounded),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),
    );
  }

  Widget _buildSortOption(String title, IconData icon) {
    final isSelected = _selectedSort == title;
    return InkWell(
      onTap: () {
        if (!mounted) return;
        setState(() {
          _selectedSort = title;
        });
        Navigator.pop(context);
        _applyFiltersAndSearch();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color:
                    isSelected
                        ? const Color(0xFF690000).withOpacity(0.1)
                        : const Color(0xFF1ba3b6).withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                icon,
                color:
                    isSelected
                        ? const Color(0xFF690000)
                        : const Color(0xFF1ba3b6),
                size: 22,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                title,
                style: TextStyle(
                  fontSize: 16,
                  fontFamily: 'Cairo',
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                  color:
                      isSelected
                          ? const Color(0xFF690000)
                          : const Color(0xFF424242),
                ),
              ),
            ),
            Icon(
              isSelected
                  ? Icons.radio_button_checked_rounded
                  : Icons.radio_button_unchecked_rounded,
              color: isSelected ? const Color(0xFF690000) : Colors.grey[400],
              size: 24,
            ),
          ],
        ),
      ),
    );
  }
}
