import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/network/api_service.dart';
import '../../core/services/shipments_cache_service.dart';
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
  StreamSubscription<List<Map<String, dynamic>>>? _shipmentsSubscription;

  int _selectedIndex = 1; // الوارد (index 1)
  String _selectedFilter = 'الكل';
  String _selectedSort = 'الأحدث';

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

    // Listen to shipments cache updates
    _shipmentsSubscription = _shipmentsCache.shipmentsStream.listen((_) {
      if (mounted) {
        _loadShipmentsAndRequests();
      }
    });
  }

  @override
  void dispose() {
    _searchController.removeListener(_onSearchChanged);
    _searchController.dispose();
    _tabController.dispose();
    _shipmentsSubscription?.cancel();
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
    final type = shipment['type']?.toString() ?? '';
    return type;
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
          'type': _getShipmentType(shipment['acid']),
          'polNumber': shipment['number46'] ?? 'غير محدد',
          'date': _formatDate(shipment['arrivalDate'] ?? shipment['createdAt']),
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
        backgroundColor: const Color(0xFFF5F5F5),
        body: Column(
          children: [
            UnifiedTopBar(showBackButton: true, showMenu: false),
            Expanded(
              child: SafeArea(
                top: false,
                child: Column(
                  children: [
                    _buildSearchBar(),
                    const SizedBox(height: 12),
                    _buildTabs(),
                    const SizedBox(height: 16),
                    Expanded(
                      child:
                          _isLoading
                              ? const Center(
                                child: CircularProgressIndicator(
                                  color: Color(0xFF690000),
                                ),
                              )
                              : TabBarView(
                                controller: _tabController,
                                children: [
                                  _buildShipmentsList(_currentShipments, true),
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
        floatingActionButton: _buildFloatingActionButton(),
        floatingActionButtonLocation: FloatingActionButtonLocation.startFloat,
        bottomNavigationBar: _buildBottomNavigationBar(),
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.symmetric(horizontal: 4),
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
      child: Row(
        children: [
          const SizedBox(width: 4),
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: const Color(0xFFF5F5F5),
                borderRadius: BorderRadius.circular(12),
              ),
              child: TextField(
                controller: _searchController,
                textAlign: TextAlign.right,
                style: const TextStyle(fontFamily: 'Cairo', fontSize: 14),
                decoration: const InputDecoration(
                  hintText: 'البحث برقم الشحنة',
                  hintStyle: TextStyle(
                    color: Color(0xFFBDBDBD),
                    fontFamily: 'Cairo',
                    fontSize: 13,
                  ),
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  suffixIcon: Icon(
                    Icons.search_rounded,
                    color: Color(0xFFBDBDBD),
                    size: 22,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          InkWell(
            onTap: _showFilterBottomSheet,
            borderRadius: BorderRadius.circular(12),
            child: Container(
              padding: const EdgeInsets.all(10),
              margin: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: const Color(0xFF1ba3b6).withOpacity(0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                Icons.filter_list_rounded,
                color: const Color(0xFF1ba3b6),
                size: 22,
              ),
            ),
          ),
          const SizedBox(width: 4),
          InkWell(
            onTap: _showSortBottomSheet,
            borderRadius: BorderRadius.circular(12),
            child: Container(
              padding: const EdgeInsets.all(10),
              margin: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: const Color(0xFF690000).withOpacity(0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.sort_rounded,
                color: Color(0xFF690000),
                size: 22,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabs() {
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
      child: TabBar(
        controller: _tabController,
        labelColor: Colors.white,
        unselectedLabelColor: const Color(0xFF690000),
        indicator: BoxDecoration(
          color: const Color(0xFF690000),
          borderRadius: BorderRadius.circular(12),
        ),
        indicatorSize: TabBarIndicatorSize.tab,
        indicatorPadding: const EdgeInsets.all(4),
        labelStyle: const TextStyle(
          fontFamily: 'Cairo',
          fontSize: 15,
          fontWeight: FontWeight.bold,
        ),
        unselectedLabelStyle: const TextStyle(
          fontFamily: 'Cairo',
          fontSize: 15,
          fontWeight: FontWeight.w600,
        ),
        tabs: const [
          Tab(text: 'الجارية'),
          Tab(text: 'المكتملة'),
          Tab(text: 'طلبات ACID'),
        ],
      ),
    );
  }

  Widget _buildShipmentsList(
    List<Map<String, dynamic>> shipments,
    bool isCurrent,
  ) {
    // Combine shipments and ACID requests
    final combinedList = <Map<String, dynamic>>[];

    // If a type filter is selected (بحري/جوي), show from both current and completed
    if (_selectedFilter == 'بحري' || _selectedFilter == 'جوي') {
      // Add filtered shipments from both current and completed
      combinedList.addAll(_currentShipments);
      combinedList.addAll(_completedShipments);
      print(
        '🔍 [MyShipments] Type Filter "$_selectedFilter" - Total: ${combinedList.length}',
      );
    } else if (isCurrent) {
      combinedList.addAll(_currentShipments);
      combinedList.addAll(_currentAcidRequests);
      print(
        '🔍 [MyShipments] Current - Shipments: ${_currentShipments.length}, ACID Requests: ${_currentAcidRequests.length}',
      );
    } else {
      combinedList.addAll(_completedShipments);
      combinedList.addAll(_completedAcidRequests);
      print(
        '🔍 [MyShipments] Completed - Shipments: ${_completedShipments.length}, ACID Requests: ${_completedAcidRequests.length}',
      );
    }

    print(
      '🔍 [MyShipments] Combined list total: ${combinedList.length}, Filter: $_selectedFilter',
    );

    if (combinedList.isEmpty) {
      // Determine the empty message based on filter
      String emptyMessage;
      IconData emptyIcon;

      if (_selectedFilter == 'طلبات ACID') {
        emptyIcon = Icons.receipt_long_outlined;
        emptyMessage =
            isCurrent
                ? 'لا توجد طلبات ACID جارية'
                : 'لا توجد طلبات ACID مكتملة';
      } else if (_selectedFilter == 'بحري') {
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
            isCurrent
                ? 'لا توجد شحنات أو طلبات جارية'
                : 'لا توجد شحنات أو طلبات مكتملة';
      }

      return RefreshIndicator(
        onRefresh: _loadShipmentsAndRequests,
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
      onRefresh: _loadShipmentsAndRequests,
      color: const Color(0xFF690000),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: combinedList.length,
        itemBuilder: (context, index) {
          final item = combinedList[index];
          if (item['itemType'] == 'acidRequest') {
            return _buildAcidRequestCard(item);
          } else {
            return _buildShipmentCard(item);
          }
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
                    Icons.receipt_long_outlined,
                    size: 80,
                    color: Colors.grey[300],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'لا توجد طلبات ACID',
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
    return InkWell(
      onTap: () {
        // Navigate to shipment details page
        context.push('/shipment-details/${shipment['id']}');
      },
      borderRadius: BorderRadius.circular(16),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.withOpacity(0.1), width: 1),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.03),
              blurRadius: 8,
              offset: const Offset(0, 2),
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
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFF690000).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        shipment['id'],
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'Cairo',
                          color: Color(0xFF690000),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        color:
                            shipment['type'] == 'بحري'
                                ? const Color(0xFF1ba3b6).withOpacity(0.1)
                                : Colors.orange.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            shipment['type'] == 'بحري'
                                ? Icons.directions_boat_rounded
                                : Icons.flight_takeoff_rounded,
                            size: 14,
                            color:
                                shipment['type'] == 'بحري'
                                    ? const Color(0xFF1ba3b6)
                                    : Colors.orange[700],
                          ),
                          const SizedBox(width: 4),
                          Text(
                            shipment['type'],
                            style: TextStyle(
                              fontSize: 11,
                              fontFamily: 'Cairo',
                              fontWeight: FontWeight.bold,
                              color:
                                  shipment['type'] == 'بحري'
                                      ? const Color(0xFF1ba3b6)
                                      : Colors.orange[700],
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (shipment['isUrgent']) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.red.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Row(
                          children: const [
                            Icon(
                              Icons.priority_high,
                              size: 14,
                              color: Colors.red,
                            ),
                            SizedBox(width: 2),
                            Text(
                              'عاجل',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'Cairo',
                                color: Colors.red,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
                Icon(
                  Icons.arrow_forward_ios,
                  size: 16,
                  color: Colors.grey.withOpacity(0.4),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Icon(
                  Icons.description_outlined,
                  size: 18,
                  color: Colors.grey[600],
                ),
                const SizedBox(width: 8),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'رقم البوليصة',
                      style: TextStyle(
                        fontSize: 11,
                        fontFamily: 'Cairo',
                        color: Colors.grey[500],
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      shipment['polNumber'],
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        fontFamily: 'Cairo',
                        color: Color(0xFF424242),
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),
            const Divider(height: 1, thickness: 1),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: Colors.orange.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Icon(
                          Icons.access_time,
                          size: 14,
                          color: Colors.orange[700],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          shipment['status'],
                          style: TextStyle(
                            fontSize: 12,
                            fontFamily: 'Cairo',
                            fontWeight: FontWeight.w600,
                            color: Colors.orange[700],
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Row(
                  children: [
                    Icon(
                      Icons.calendar_today_outlined,
                      size: 13,
                      color: Colors.grey[500],
                    ),
                    const SizedBox(width: 6),
                    Text(
                      shipment['date'],
                      style: TextStyle(
                        fontSize: 11,
                        fontFamily: 'Cairo',
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ],
            ),
            // Always show view details button
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  context.push('/shipment-details/${shipment['id']}');
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF690000),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  elevation: 0,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: const [
                    Text(
                      'عرض تفاصيل الشحنة',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Cairo',
                      ),
                    ),
                    SizedBox(width: 8),
                    Icon(Icons.visibility_rounded, size: 18),
                  ],
                ),
              ),
            ),
          ],
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
            const Color(0xFF1ba3b6).withOpacity(0.05),
            const Color(0xFF1ba3b6).withOpacity(0.02),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFF1ba3b6).withOpacity(0.3),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1ba3b6).withOpacity(0.08),
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
                      color: const Color(0xFF1ba3b6),
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
                          color: Color(0xFF1ba3b6),
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
              const Icon(
                Icons.business_outlined,
                size: 18,
                color: Color(0xFF1ba3b6),
              ),
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
                color: Color(0xFF1ba3b6),
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
                      color: Color(0xFF1ba3b6),
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
      case 'قيد المراجعة':
      case 'Pending':
        return Colors.orange;
      case 'تم إصدار ACID':
      case 'ACID Issued':
        return Colors.green;
      case 'مرفوض':
      case 'Rejected':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  Widget _buildFloatingActionButton() {
    return FloatingActionButton.extended(
      onPressed: () {
        // Navigate directly to ACID request page
        context.push(
          '/acid-request',
          extra: {'userName': widget.userName, 'userEmail': widget.userEmail},
        );
      },
      backgroundColor: const Color(0xFF690000),
      elevation: 4,
      label: const Text(
        'طلب ACID',
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.bold,
          fontFamily: 'Cairo',
          color: Colors.white,
        ),
      ),
      icon: const Icon(
        Icons.receipt_long_rounded,
        size: 24,
        color: Colors.white,
      ),
    );
  }

  Widget _buildBottomNavigationBar() {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF690000),
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(25),
          topRight: Radius.circular(25),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.2),
            blurRadius: 15,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(25),
          topRight: Radius.circular(25),
        ),
        child: SafeArea(
          child: SizedBox(
            height: 65,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildNavItem(0, Icons.home_rounded, 'الرئيسية'),
                _buildNavItem(1, Icons.flight_land_rounded, 'الوارد'),
                _buildNavItem(2, Icons.flight_takeoff_rounded, 'الصادر'),
                _buildNavItem(3, Icons.receipt_long_rounded, 'الفواتير'),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(int index, IconData icon, String label) {
    final isSelected = _selectedIndex == index;
    return Expanded(
      child: InkWell(
        onTap: () {
          if (index == 0) {
            // الرئيسية - navigate back
            context.go(
              '/home',
              extra: {
                'userName': widget.userName,
                'userEmail': widget.userEmail,
              },
            );
          } else if (index == 1) {
            // الوارد - already here, ensure state is correct
            if (_selectedIndex != 1) {
              setState(() => _selectedIndex = 1);
            }
          } else if (index == 2) {
            // الصادر - قيد التطوير (don't change state)
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('قسم الشحنات الصادرة قيد التطوير'),
                backgroundColor: Color(0xFF1ba3b6),
                duration: Duration(seconds: 2),
              ),
            );
          } else if (index == 3) {
            // الفواتير (don't change state)
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('قسم الفواتير قيد التطوير'),
                backgroundColor: Color(0xFF1ba3b6),
                duration: Duration(seconds: 2),
              ),
            );
          }
        },
        borderRadius: BorderRadius.circular(15),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 5),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(
                  color:
                      isSelected
                          ? const Color(0xFF1ba3b6)
                          : Colors.white.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  boxShadow:
                      isSelected
                          ? [
                            BoxShadow(
                              color: const Color(0xFF1ba3b6).withOpacity(0.3),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ]
                          : [],
                ),
                child: Icon(
                  icon,
                  color: isSelected ? Colors.white : Colors.white70,
                  size: 23,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                label,
                style: TextStyle(
                  fontSize: 10.5,
                  fontFamily: 'Cairo',
                  color: isSelected ? Colors.white : Colors.white70,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                  height: 1.1,
                ),
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
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
