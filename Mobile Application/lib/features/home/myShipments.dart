import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../core/network/api_service.dart';
import '../../core/services/shipments_cache_service.dart';
import '../../core/services/recent_shipments_service.dart';
import '../../core/widgets/unified_top_bar.dart';

class MyShipmentsPage extends StatefulWidget {
  final String userName;
  final String userEmail;

  const MyShipmentsPage({
    super.key,
    required this.userName,
    required this.userEmail,
  });

  @override
  State<MyShipmentsPage> createState() => _MyShipmentsPageState();
}

class _MyShipmentsPageState extends State<MyShipmentsPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  final ShipmentsCacheService _shipmentsCache = ShipmentsCacheService();

  int _selectedIndex = 1; // الوارد (index 1)
  String _selectedFilter = 'الكل';
  String _selectedSort = 'الأحدث';

  // Premium Colors
  static const Color primaryDark = Color(0xFF690000);
  static const Color primaryLight = Color(0xFF8B0000);
  static const Color accentColor = Color(0xFF1ba3b6);
  static const Color goldAccent = Color(0xFFD4AF37);
  static const Color bgColor = Color(0xFFF8F9FA);

  List<Map<String, dynamic>> _allCurrentShipments = [];
  List<Map<String, dynamic>> _allCompletedShipments = [];
  List<Map<String, dynamic>> _currentShipments = [];
  List<Map<String, dynamic>> _completedShipments = [];

  // ACID Requests
  List<Map<String, dynamic>> _allCurrentAcidRequests = [];
  List<Map<String, dynamic>> _allCompletedAcidRequests = [];
  List<Map<String, dynamic>> _currentAcidRequests = [];
  List<Map<String, dynamic>> _completedAcidRequests = [];

  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _searchController.addListener(_onSearchChanged);
    _loadShipmentsAndRequests();
    // Profile photo is now handled by UnifiedTopBar via UserCacheService

    // Note: Removed shipmentsStream listener to prevent infinite reload loop
    // The cache service already handles updates internally
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
      // Filter current shipments
      _currentShipments =
          _allCurrentShipments.where((shipment) {
            final matchesSearch =
                searchQuery.isEmpty ||
                shipment['id'].toString().toLowerCase().contains(searchQuery) ||
                shipment['polNumber'].toString().toLowerCase().contains(
                  searchQuery,
                );

            final matchesFilter =
                _selectedFilter == 'الكل' ||
                _selectedFilter == 'طلبات ACID' &&
                    false || // Hide shipments when ACID filter is selected
                _getShipmentTypeFilter(shipment) == _selectedFilter;

            return matchesSearch && matchesFilter;
          }).toList();

      // Filter completed shipments
      _completedShipments =
          _allCompletedShipments.where((shipment) {
            final matchesSearch =
                searchQuery.isEmpty ||
                shipment['id'].toString().toLowerCase().contains(searchQuery) ||
                shipment['polNumber'].toString().toLowerCase().contains(
                  searchQuery,
                );

            final matchesFilter =
                _selectedFilter == 'الكل' ||
                _selectedFilter == 'طلبات ACID' &&
                    false || // Hide shipments when ACID filter is selected
                _getShipmentTypeFilter(shipment) == _selectedFilter;

            return matchesSearch && matchesFilter;
          }).toList();

      // Filter current ACID requests
      _currentAcidRequests =
          _allCurrentAcidRequests.where((request) {
            final matchesSearch =
                searchQuery.isEmpty ||
                (request['acidCode']?.toString() ?? '').toLowerCase().contains(
                  searchQuery,
                ) ||
                (request['supplier']?['name']?.toString() ?? '')
                    .toLowerCase()
                    .contains(searchQuery);

            final matchesFilter =
                _selectedFilter == 'الكل' || _selectedFilter == 'طلبات ACID';

            return matchesSearch && matchesFilter;
          }).toList();

      // Filter completed ACID requests
      _completedAcidRequests =
          _allCompletedAcidRequests.where((request) {
            final matchesSearch =
                searchQuery.isEmpty ||
                (request['acidCode']?.toString() ?? '').toLowerCase().contains(
                  searchQuery,
                ) ||
                (request['supplier']?['name']?.toString() ?? '')
                    .toLowerCase()
                    .contains(searchQuery);

            final matchesFilter =
                _selectedFilter == 'الكل' || _selectedFilter == 'طلبات ACID';

            return matchesSearch && matchesFilter;
          }).toList();

      // Apply sorting
      _applySorting();
    });
  }

  String _getShipmentTypeFilter(Map<String, dynamic> shipment) {
    // Use shipment_type field from backend
    final shipmentType =
        shipment['shipment_type']?.toString().toLowerCase() ?? '';

    // Check if it's sea/بحري or air/جوي
    if (shipmentType.contains('بحري') || shipmentType.contains('sea')) {
      return 'بحري';
    } else if (shipmentType.contains('جوي') || shipmentType.contains('air')) {
      return 'جوي';
    }

    // Fallback to type field derived from ACID prefix
    return shipment['type']?.toString() ?? 'بحري';
  }

  void _applySorting() {
    switch (_selectedSort) {
      case 'الأحدث':
        _currentShipments.sort(
          (a, b) => (b['rawData']?['createdAt'] ?? '').toString().compareTo(
            (a['rawData']?['createdAt'] ?? '').toString(),
          ),
        );
        _completedShipments.sort(
          (a, b) => (b['rawData']?['createdAt'] ?? '').toString().compareTo(
            (a['rawData']?['createdAt'] ?? '').toString(),
          ),
        );
        _currentAcidRequests.sort(
          (a, b) => (b['requestDate'] ?? '').toString().compareTo(
            (a['requestDate'] ?? '').toString(),
          ),
        );
        _completedAcidRequests.sort(
          (a, b) => (b['requestDate'] ?? '').toString().compareTo(
            (a['requestDate'] ?? '').toString(),
          ),
        );
        break;
      case 'الأقدم':
        _currentShipments.sort(
          (a, b) => (a['rawData']?['createdAt'] ?? '').toString().compareTo(
            (b['rawData']?['createdAt'] ?? '').toString(),
          ),
        );
        _completedShipments.sort(
          (a, b) => (a['rawData']?['createdAt'] ?? '').toString().compareTo(
            (b['rawData']?['createdAt'] ?? '').toString(),
          ),
        );
        _currentAcidRequests.sort(
          (a, b) => (a['requestDate'] ?? '').toString().compareTo(
            (b['requestDate'] ?? '').toString(),
          ),
        );
        _completedAcidRequests.sort(
          (a, b) => (a['requestDate'] ?? '').toString().compareTo(
            (b['requestDate'] ?? '').toString(),
          ),
        );
        break;
      case 'ACID':
        _currentShipments.sort(
          (a, b) => a['id'].toString().compareTo(b['id'].toString()),
        );
        _completedShipments.sort(
          (a, b) => a['id'].toString().compareTo(b['id'].toString()),
        );
        _currentAcidRequests.sort(
          (a, b) => (a['acidCode'] ?? '').toString().compareTo(
            (b['acidCode'] ?? '').toString(),
          ),
        );
        _completedAcidRequests.sort(
          (a, b) => (a['acidCode'] ?? '').toString().compareTo(
            (b['acidCode'] ?? '').toString(),
          ),
        );
        break;
    }
  }

  Future<void> _loadShipmentsAndRequests() async {
    try {
      if (!mounted) return;
      setState(() => _isLoading = true);

      print('🚢 [MyShipments] Loading shipments and ACID requests...');

      // Load shipments from cache and ACID requests from API in parallel
      final results = await Future.wait([
        _shipmentsCache.getAllShipments(), // Use cache service
        ApiService.getAllAcidRequests(),
      ]);

      final shipments = results[0] as List<Map<String, dynamic>>;
      final acidRequestsResponse = results[1] as Map<String, dynamic>;

      print('🚢 [MyShipments] Got ${shipments.length} shipments from cache');
      print('📦 [MyShipments] ACID Requests Response: $acidRequestsResponse');

      // Process Shipments
      final current = <Map<String, dynamic>>[];
      final completed = <Map<String, dynamic>>[];

      print('🚢 [MyShipments] Found ${shipments.length} shipments');

      for (var shipment in shipments) {
        final mappedShipment = {
          'id': shipment['acid'] ?? 'N/A',
          'shipmentCode': shipment['shipmentCode'] ?? '',
          'type': _getShipmentType(shipment['acid']),
          'shipment_type': shipment['shipment_type'] ?? 'بحري',
          'number46': shipment['number46'] ?? '',
          'polNumber': shipment['policy'] ?? 'غير محدد',
          'date': _formatDate(shipment['updatedAt'] ?? shipment['createdAt']),
          'status': shipment['status'] ?? 'غير محدد',
          'isUrgent': _isUrgent(shipment['status']),
          'hasDocuments': shipment['invoiceUrl'] != null,
          'importerName': shipment['importerName'],
          'employerName': shipment['employerName'],
          'description': shipment['shipmentDescription'],
          'rawData': shipment,
          'itemType': 'shipment',
        };

        if (shipment['status'] == 'تمت بنجاح') {
          completed.add(mappedShipment);
        } else {
          current.add(mappedShipment);
        }
      }

      // Process ACID Requests
      final currentAcid = <Map<String, dynamic>>[];
      final completedAcid = <Map<String, dynamic>>[];

      if (acidRequestsResponse['success'] == true) {
        final requests = List<Map<String, dynamic>>.from(
          acidRequestsResponse['requests'] ?? [],
        );

        print('📦 [MyShipments] Found ${requests.length} ACID requests');

        for (var request in requests) {
          final mappedRequest = {
            'id': request['acidCode'] ?? 'قيد المراجعة',
            'type': 'طلب ACID',
            'supplier': request['supplier']?['name'] ?? 'غير محدد',
            'date': _formatDate(request['requestDate']),
            'status': _translateAcidStatus(request['status'] ?? 'Pending'),
            'isUrgent': request['status'] == 'Pending',
            'hasDocuments': (request['uploads'] as List?)?.isNotEmpty ?? false,
            'goods': request['goods']?['description'] ?? 'غير محدد',
            'weight': request['goods']?['weight']?.toString() ?? '0',
            'requestDate': request['requestDate'],
            'acidCode': request['acidCode'],
            'rawData': request,
            'itemType': 'acidRequest',
          };

          if (request['status'] == 'ACID Issued') {
            completedAcid.add(mappedRequest);
          } else {
            currentAcid.add(mappedRequest);
          }
        }
      }

      if (!mounted) return;
      setState(() {
        _allCurrentShipments = current;
        _allCompletedShipments = completed;
        _currentShipments = current;
        _completedShipments = completed;

        _allCurrentAcidRequests = currentAcid;
        _allCompletedAcidRequests = completedAcid;
        _currentAcidRequests = currentAcid;
        _completedAcidRequests = completedAcid;

        _isLoading = false;
      });

      print(
        '🚢 [MyShipments] Shipments - Current: ${current.length}, Completed: ${completed.length}',
      );
      print(
        '📦 [MyShipments] ACID Requests - Current: ${currentAcid.length}, Completed: ${completedAcid.length}',
      );
    } catch (e) {
      print('❌ [MyShipments] Error: $e');
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

  String _translateAcidStatus(String status) {
    switch (status) {
      case 'Pending':
        return 'قيد المراجعة';
      case 'ACID Issued':
        return 'تم إصدار ACID';
      case 'Rejected':
        return 'مرفوض';
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
    return status == 'في انتظار الشحن' || status == 'في انتظار وصول الإذن';
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
              right: -50,
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
              left: -30,
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
                UnifiedTopBar(showBackButton: true, showMenu: false),
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
                                      _buildShipmentsList(
                                        _currentShipments,
                                        true,
                                      ),
                                      _buildShipmentsList(
                                        _completedShipments,
                                        false,
                                      ),
                                      _buildAcidRequestsList(),
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
            'جاري تحميل الشحنات...',
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
                  hintText: 'البحث برقم ACID أو رقم 46',
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
                  colors: [accentColor, accentColor.withValues(alpha: 0.8)],
                ),
                borderRadius: BorderRadius.circular(14),
                boxShadow: [
                  BoxShadow(
                    color: accentColor.withValues(alpha: 0.3),
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
                    color: primaryDark.withValues(alpha: 0.3),
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
          BoxShadow(color: Colors.white, blurRadius: 0, spreadRadius: 0),
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
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.pending_actions_rounded, size: 16),
                SizedBox(width: 4),
                Text('الجارية'),
                if (_currentShipments.isNotEmpty) ...[
                  SizedBox(width: 3),
                  Text(
                    '(${_currentShipments.length})',
                    style: TextStyle(fontSize: 11),
                  ),
                ],
              ],
            ),
          ),
          Tab(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.check_circle_rounded, size: 16),
                SizedBox(width: 4),
                Text('المكتملة'),
              ],
            ),
          ),
          Tab(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.receipt_long_rounded, size: 16),
                SizedBox(width: 4),
                Text('ACID'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildShipmentsList(
    List<Map<String, dynamic>> shipments,
    bool isCurrent,
  ) {
    // Only show SHIPMENTS in this list, not ACID requests
    final shipmentsList = <Map<String, dynamic>>[];

    // If a type filter is selected (بحري/جوي), show from both current and completed
    if (_selectedFilter == 'بحري' || _selectedFilter == 'جوي') {
      // Add filtered shipments from both current and completed
      shipmentsList.addAll(_currentShipments);
      shipmentsList.addAll(_completedShipments);
      print(
        '🔍 [MyShipments] Type Filter "$_selectedFilter" - Shipments: ${shipmentsList.length}',
      );
    } else if (isCurrent) {
      shipmentsList.addAll(_currentShipments);
      print('🔍 [MyShipments] Current Shipments: ${_currentShipments.length}');
    } else {
      shipmentsList.addAll(_completedShipments);
      print(
        '🔍 [MyShipments] Completed Shipments: ${_completedShipments.length}',
      );
    }

    print(
      '🔍 [MyShipments] Total shipments: ${shipmentsList.length}, Filter: $_selectedFilter',
    );

    if (shipmentsList.isEmpty) {
      // Determine the empty message based on filter
      String emptyMessage;
      IconData emptyIcon;

      if (_selectedFilter == 'بحري') {
        emptyIcon = Icons.directions_boat_outlined;
        emptyMessage =
            isCurrent
                ? 'لا توجد شحنات بحرية جارية'
                : 'لا توجد شحنات بحرية مكتملة';
      } else if (_selectedFilter == 'جوي') {
        emptyIcon = Icons.flight_takeoff_outlined;
        emptyMessage =
            isCurrent
                ? 'لا توجد شحنات جوية جارية'
                : 'لا توجد شحنات جوية مكتملة';
      } else {
        emptyIcon = Icons.inventory_2_outlined;
        emptyMessage =
            isCurrent ? 'لا توجد شحنات جارية' : 'لا توجد شحنات مكتملة';
      }

      return RefreshIndicator(
        onRefresh: _loadShipmentsAndRequests,
        color: primaryDark,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: SizedBox(
            height: MediaQuery.of(context).size.height * 0.5,
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(30),
                    decoration: BoxDecoration(
                      color: bgColor,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.grey[200]!, width: 2),
                    ),
                    child: Icon(emptyIcon, size: 60, color: Colors.grey[400]),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    emptyMessage,
                    style: TextStyle(
                      fontSize: 18,
                      fontFamily: 'Cairo',
                      fontWeight: FontWeight.bold,
                      color: Colors.grey[700],
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: primaryDark.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.arrow_downward_rounded,
                          size: 16,
                          color: primaryDark,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'اسحب لأسفل للتحديث',
                          style: TextStyle(
                            fontSize: 13,
                            fontFamily: 'Cairo',
                            color: primaryDark,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
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
      onRefresh: _loadShipmentsAndRequests,
      color: primaryDark,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: shipmentsList.length,
        itemBuilder: (context, index) {
          return _buildShipmentCard(shipmentsList[index]);
        },
      ),
    );
  }

  Widget _buildAcidRequestsList() {
    // Combine current and completed ACID requests
    final allAcidRequests = <Map<String, dynamic>>[];
    allAcidRequests.addAll(_currentAcidRequests);
    allAcidRequests.addAll(_completedAcidRequests);

    if (allAcidRequests.isEmpty) {
      return RefreshIndicator(
        onRefresh: _loadShipmentsAndRequests,
        color: primaryDark,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: SizedBox(
            height: MediaQuery.of(context).size.height * 0.5,
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(30),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          accentColor.withOpacity(0.1),
                          accentColor.withOpacity(0.05),
                        ],
                      ),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: accentColor.withOpacity(0.3),
                        width: 2,
                      ),
                    ),
                    child: Icon(
                      Icons.receipt_long_outlined,
                      size: 60,
                      color: accentColor,
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'لا توجد طلبات ACID',
                    style: TextStyle(
                      fontSize: 18,
                      fontFamily: 'Cairo',
                      fontWeight: FontWeight.bold,
                      color: Colors.grey[700],
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: primaryDark.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.arrow_downward_rounded,
                          size: 16,
                          color: primaryDark,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'اسحب لأسفل للتحديث',
                          style: TextStyle(
                            fontSize: 13,
                            fontFamily: 'Cairo',
                            color: primaryDark,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
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
      onRefresh: _loadShipmentsAndRequests,
      color: const Color(0xFF690000),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: allAcidRequests.length,
        itemBuilder: (context, index) {
          return _buildAcidRequestCard(allAcidRequests[index]);
        },
      ),
    );
  }

  Widget _buildShipmentCard(Map<String, dynamic> shipment) {
    // Get shipment type from shipment_type field or derive from acid prefix
    final shipmentType =
        shipment['shipment_type']?.toString().toLowerCase() ?? '';
    final isSea =
        shipmentType.contains('بحري') ||
        shipmentType.contains('sea') ||
        shipment['type'] == 'بحري';
    final typeText = isSea ? 'بحري' : 'جوي';
    final typeIcon =
        isSea ? Icons.directions_boat_rounded : Icons.flight_takeoff_rounded;
    final typeColor = isSea ? accentColor : goldAccent;

    // Get status color
    final statusColor = _getStatusColor(shipment['status']);

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
            await RecentShipmentsService.addRecentShipment(shipment);
            if (mounted) {
              context.push('/shipment-details/${shipment['id']}');
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
                    Expanded(
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
                          // Urgent Badge
                          if (shipment['isUrgent']) ...[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 5,
                              ),
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    Colors.red.shade600,
                                    Colors.red.shade400,
                                  ],
                                ),
                                borderRadius: BorderRadius.circular(8),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.red.withOpacity(0.3),
                                    blurRadius: 6,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: const [
                                  Icon(
                                    Icons.priority_high,
                                    size: 14,
                                    color: Colors.white,
                                  ),
                                  SizedBox(width: 3),
                                  Text(
                                    'عاجل',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      fontFamily: 'Cairo',
                                      color: Colors.white,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
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
                    // ACID Number Row
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
                                  'رقم ACID',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontFamily: 'Cairo',
                                    color: Colors.grey[500],
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  shipment['id'],
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

                    // Number 46 Row (if available)
                    if (shipment['number46']?.toString().isNotEmpty ==
                        true) ...[
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
                                Icons.description_outlined,
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
                                    'رقم 46',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontFamily: 'Cairo',
                                      color: Colors.grey[500],
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    shipment['number46'],
                                    style: TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.bold,
                                      fontFamily: 'Cairo',
                                      color: accentColor,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],

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
                                    shipment['status'],
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
                                shipment['date'],
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
                            context.push('/shipment-details/${shipment['id']}');
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

  Widget _buildAcidRequestCard(Map<String, dynamic> request) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
          colors: [
            accentColor.withOpacity(0.08),
            accentColor.withOpacity(0.03),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: accentColor.withOpacity(0.25), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: accentColor.withOpacity(0.1),
            blurRadius: 12,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: accentColor,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(
                      Icons.receipt_long,
                      color: Colors.white,
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'طلب ACID',
                        style: TextStyle(
                          fontSize: 14,
                          fontFamily: 'Cairo',
                          fontWeight: FontWeight.bold,
                          color: accentColor,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        request['id'],
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF424242),
                          fontFamily: 'Cairo',
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: _getStatusColor(request['status']).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  request['status'],
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: _getStatusColor(request['status']),
                    fontFamily: 'Cairo',
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          const Divider(height: 1, thickness: 1),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(Icons.business_outlined, size: 18, color: accentColor),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'المورد',
                      style: TextStyle(
                        fontSize: 12,
                        color: Color(0xFF9E9E9E),
                        fontFamily: 'Cairo',
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      request['supplier'],
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF424242),
                        fontFamily: 'Cairo',
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(
                Icons.inventory_2_outlined,
                size: 18,
                color: accentColor,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'وصف البضاعة',
                      style: TextStyle(
                        fontSize: 12,
                        color: Color(0xFF9E9E9E),
                        fontFamily: 'Cairo',
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      request['goods'],
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
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Row(
                  children: [
                    const Icon(
                      Icons.scale_outlined,
                      size: 18,
                      color: accentColor,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '${request['weight']} كجم',
                      style: const TextStyle(
                        fontSize: 13,
                        color: Color(0xFF616161),
                        fontFamily: 'Cairo',
                      ),
                    ),
                  ],
                ),
              ),
              Row(
                children: [
                  const Icon(
                    Icons.calendar_today,
                    size: 16,
                    color: Color(0xFF9E9E9E),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    request['date'],
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF9E9E9E),
                      fontFamily: 'Cairo',
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      // Shipment statuses - 10 حالات
      case 'في انتظار الشحن':
        return Colors.orange;
      case 'في الطريق':
        return Colors.blue;
      case 'تم وصول البضاعة':
        return Colors.cyan;
      case 'في انتظار وصول الإذن':
      case 'في انتظار وصول الاذن':
        return Colors.amber;
      case 'تم وصول الإذن':
        return Colors.teal;
      case 'التخليص الجمركي':
      case 'التخليص الجمركى':
        return Colors.deepOrange;
      case 'جارى ادراج الشحنة واستكمال الاجراءات':
      case 'جاري ادراج الشحنة واستكمال الاجراءات':
        return Colors.indigo;
      case 'جاري الكشف والتثمين':
      case 'جارى الكشف والتثمين':
        return Colors.purple;
      case 'مكتملة':
        return Colors.lightGreen;
      case 'تمت بنجاح':
        return Colors.green;
      // ACID Request statuses
      case 'قيد المراجعة':
        return Colors.orange;
      case 'تم إصدار ACID':
        return Colors.green;
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
              '/acid-request',
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
                  'طلب ACID',
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
        // الوارد - Navigate to incoming shipments (already here)
        if (_selectedIndex != 1) {
          setState(() => _selectedIndex = 1);
        }
        break;
      case 2:
        // الصادر - Navigate to exports page
        setState(() => _selectedIndex = index);
        context.go(
          '/exports',
          extra: {'userName': widget.userName, 'userEmail': widget.userEmail},
        );
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
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                accentColor,
                                accentColor.withValues(alpha: 0.8),
                              ],
                            ),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(
                            Icons.filter_list_rounded,
                            color: Colors.white,
                            size: 22,
                          ),
                        ),
                        const SizedBox(width: 12),
                        const Text(
                          'تصفية حسب',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Cairo',
                            color: primaryDark,
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
                  // _buildFilterOption('طلبات ACID', Icons.receipt_long_rounded),
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
                        ? primaryDark.withOpacity(0.1)
                        : Colors.grey.withOpacity(0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                icon,
                color: isSelected ? primaryDark : Colors.grey[600],
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
                            Icons.sort_rounded,
                            color: Colors.white,
                            size: 22,
                          ),
                        ),
                        const SizedBox(width: 12),
                        const Text(
                          'ترتيب حسب',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Cairo',
                            color: primaryDark,
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
                  _buildSortOption('ACID', Icons.tag_rounded),
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
                gradient:
                    isSelected
                        ? LinearGradient(colors: [primaryDark, primaryLight])
                        : null,
                color: isSelected ? null : accentColor.withOpacity(0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                icon,
                color: isSelected ? Colors.white : accentColor,
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

  void _showAddShipmentBottomSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder:
          (context) => Directionality(
            textDirection: TextDirection.rtl,
            child: Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom,
              ),
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
                            Icons.add_box_rounded,
                            color: Color(0xFF690000),
                            size: 28,
                          ),
                          SizedBox(width: 12),
                          Text(
                            'إضافة شحنة جديدة',
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
                    _buildAddShipmentOption(
                      'طلب إدراج شهادة بحرية',
                      Icons.directions_boat_rounded,
                      const Color(0xFF1ba3b6),
                      null,
                    ),
                    _buildAddShipmentOption(
                      'طلب إدراج شهادة جوية',
                      Icons.flight_takeoff_rounded,
                      Colors.orange,
                      null,
                    ),
                    _buildAddShipmentOption(
                      'طلب رقم ACID',
                      Icons.description_rounded,
                      const Color(0xFF690000),
                      () {
                        Navigator.pop(context);
                        context.push(
                          '/acid-request',
                          extra: {
                            'userName': widget.userName,
                            'userEmail': widget.userEmail,
                          },
                        );
                      },
                    ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
          ),
    );
  }

  Widget _buildAddShipmentOption(
    String title,
    IconData icon,
    Color color,
    VoidCallback? onTap,
  ) {
    return InkWell(
      onTap: onTap ?? () => Navigator.pop(context),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withOpacity(0.05),
          border: Border.all(color: color.withOpacity(0.2), width: 1.5),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 26),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                title,
                style: const TextStyle(
                  fontSize: 16,
                  fontFamily: 'Cairo',
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF424242),
                ),
              ),
            ),
            Icon(Icons.arrow_back_ios, size: 16, color: Colors.grey[400]),
          ],
        ),
      ),
    );
  }
}
