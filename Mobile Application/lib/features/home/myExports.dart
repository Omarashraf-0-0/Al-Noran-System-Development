import 'package:flutter/material.dart';
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

          if (status == 'Completed' || status == 'Approved') {
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
                                  // الجارية - shows both current export shipments AND pending UCR requests
                                  _buildCombinedCurrentList(),
                                  // المكتملة - shows completed export shipments
                                  _buildCombinedCompletedList(),
                                  // طلبات UCR - shows only UCR requests
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
                  hintText: 'البحث في الشحنات الصادرة',
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
              child: const Icon(
                Icons.filter_list_rounded,
                color: Color(0xFF1ba3b6),
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
          Tab(text: 'طلبات UCR'),
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

    return GestureDetector(
      onTap: () async {
        if (requestId.isNotEmpty) {
          // Save to recent shipments before navigating
          await RecentShipmentsService.addRecentShipment(request);
          if (mounted) {
            context.push('/ucr-details/$requestId');
          }
        }
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topRight,
            end: Alignment.bottomLeft,
            colors: [
              const Color(0xFF690000).withOpacity(0.05),
              const Color(0xFF690000).withOpacity(0.02),
            ],
          ),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: const Color(0xFF690000).withOpacity(0.3),
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF690000).withOpacity(0.08),
              blurRadius: 12,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Row - Like ACID Request Card
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Flexible(
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFF690000),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(
                          Icons.receipt_long,
                          color: Colors.white,
                          size: 22,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Flexible(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'طلب UCR',
                              style: TextStyle(
                                fontSize: 14,
                                fontFamily: 'Cairo',
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF690000),
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              requestId,
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF424242),
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
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: _getStatusColor(
                      request['statusRaw'],
                    ).withOpacity(0.15),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    request['status'] ?? '',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: _getStatusColor(request['statusRaw']),
                      fontFamily: 'Cairo',
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 14),
            const Divider(height: 1, thickness: 1),
            const SizedBox(height: 12),

            // Destination Row
            Row(
              children: [
                const Icon(
                  Icons.location_on_outlined,
                  size: 18,
                  color: Color(0xFF690000),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'الوجهة',
                        style: TextStyle(
                          fontSize: 12,
                          color: Color(0xFF9E9E9E),
                          fontFamily: 'Cairo',
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${request['destinationCountry'] ?? ''} - ${request['destinationPort'] ?? ''}',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF424242),
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

            const SizedBox(height: 12),

            // Description Row
            Row(
              children: [
                const Icon(
                  Icons.inventory_2_outlined,
                  size: 18,
                  color: Color(0xFF690000),
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

            const SizedBox(height: 12),

            // Weight and Date Row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Row(
                    children: [
                      const Icon(
                        Icons.scale_outlined,
                        size: 18,
                        color: Color(0xFF690000),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '${request['totalWeight'] ?? '0'} كجم',
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
                      _formatDate(request['createdAt']),
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
    final typeColor = isSea ? const Color(0xFF1ba3b6) : Colors.orange[700]!;

    // Status color
    final statusColor = _getStatusColor(
      shipment['statusRaw'] ?? shipment['status'],
    );

    return InkWell(
      onTap: () async {
        final shipmentId = shipment['id'] ?? '';
        // Save to recent shipments before navigating
        await RecentShipmentsService.addRecentShipment(shipment);
        if (mounted) {
          context.push('/export-shipment-details/$shipmentId');
        }
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
            // Header Row - Shipment Code and Type Badge
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Flexible(
                  child: Row(
                    children: [
                      // Shipment Code Badge (if available)
                      if (shipment['shipmentCode']?.toString().isNotEmpty ==
                          true) ...[
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFF690000),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            shipment['shipmentCode'],
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'Cairo',
                              color: Colors.white,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                      ],
                      // Type Badge
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 5,
                        ),
                        decoration: BoxDecoration(
                          color: typeColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(typeIcon, size: 14, color: typeColor),
                            const SizedBox(width: 4),
                            Text(
                              typeText,
                              style: TextStyle(
                                fontSize: 11,
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
                Icon(
                  Icons.arrow_forward_ios,
                  size: 16,
                  color: Colors.grey.withOpacity(0.4),
                ),
              ],
            ),

            const SizedBox(height: 14),

            // UCR Number Row
            Row(
              children: [
                const Icon(
                  Icons.qr_code_2_rounded,
                  size: 18,
                  color: Color(0xFF690000),
                ),
                const SizedBox(width: 8),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'رقم UCR',
                      style: TextStyle(
                        fontSize: 11,
                        fontFamily: 'Cairo',
                        color: Colors.grey[500],
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      shipment['ucrNumber'] ?? 'N/A',
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

            // Destination Row
            const SizedBox(height: 10),
            Row(
              children: [
                Icon(
                  Icons.location_on_outlined,
                  size: 18,
                  color: Colors.grey[600],
                ),
                const SizedBox(width: 8),
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
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${shipment['destinationCountry'] ?? ''} - ${shipment['destinationPort'] ?? ''}',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          fontFamily: 'Cairo',
                          color: Color(0xFF424242),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),
            const Divider(height: 1, thickness: 1),
            const SizedBox(height: 12),

            // Status and Date Row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Status
                Expanded(
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: statusColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Icon(
                          Icons.info_outline,
                          size: 14,
                          color: statusColor,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          shipment['status'] ?? '',
                          style: TextStyle(
                            fontSize: 12,
                            fontFamily: 'Cairo',
                            fontWeight: FontWeight.w600,
                            color: statusColor,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                // Last Update Date
                Row(
                  children: [
                    Icon(Icons.update, size: 13, color: Colors.grey[500]),
                    const SizedBox(width: 6),
                    Text(
                      shipment['date'] ?? '',
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

            // View Details Button
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  final shipmentId = shipment['id'] ?? '';
                  context.push('/export-shipment-details/$shipmentId');
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
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
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

  /// Build Combined Current List (Export Shipments Only - Current/In Progress)
  /// Shows only current export shipments. UCR requests are shown in separate tab.
  Widget _buildCombinedCurrentList() {
    // Only show current export shipments (filtered)
    final allCurrentItems = List<Map<String, dynamic>>.from(
      _currentUcrShipments,
    );

    // Sort by date
    allCurrentItems.sort((a, b) {
      final aDate = a['createdAt'] ?? a['rawData']?['createdAt'] ?? '';
      final bDate = b['createdAt'] ?? b['rawData']?['createdAt'] ?? '';
      return bDate.toString().compareTo(aDate.toString());
    });

    if (allCurrentItems.isEmpty) {
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
                    'لا توجد شحنات صادرة جارية',
                    style: TextStyle(
                      fontSize: 18,
                      fontFamily: 'Cairo',
                      fontWeight: FontWeight.w600,
                      color: Colors.grey[600],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'الشحنات ستظهر هنا بعد إصدار UCR',
                    style: TextStyle(
                      fontSize: 14,
                      fontFamily: 'Cairo',
                      color: Colors.grey[500],
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
        itemCount: allCurrentItems.length,
        itemBuilder: (context, index) {
          final item = allCurrentItems[index];
          return _buildExportShipmentCard(item);
        },
      ),
    );
  }

  /// Build Combined Completed List (Completed Export Shipments)
  Widget _buildCombinedCompletedList() {
    // Show completed export shipments
    final allCompletedItems = <Map<String, dynamic>>[];
    allCompletedItems.addAll(_completedUcrShipments);

    // Sort by date
    allCompletedItems.sort((a, b) {
      final aDate = a['createdAt'] ?? a['rawData']?['createdAt'] ?? '';
      final bDate = b['createdAt'] ?? b['rawData']?['createdAt'] ?? '';
      return bDate.toString().compareTo(aDate.toString());
    });

    if (allCompletedItems.isEmpty) {
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
                    Icons.check_circle_outline,
                    size: 80,
                    color: Colors.grey[300],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'لا توجد شحنات مكتملة',
                    style: TextStyle(
                      fontSize: 18,
                      fontFamily: 'Cairo',
                      fontWeight: FontWeight.w600,
                      color: Colors.grey[600],
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
        itemCount: allCompletedItems.length,
        itemBuilder: (context, index) {
          final item = allCompletedItems[index];
          return _buildExportShipmentCard(item);
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

  Widget _buildFloatingActionButton() {
    return FloatingActionButton.extended(
      onPressed: () {
        context.push(
          '/ucr-request',
          extra: {'userName': widget.userName, 'userEmail': widget.userEmail},
        );
      },
      backgroundColor: const Color(0xFF690000),
      elevation: 4,
      label: const Text(
        'طلب تصدير',
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.bold,
          fontFamily: 'Cairo',
          color: Colors.white,
        ),
      ),
      icon: const Icon(
        Icons.flight_takeoff_rounded,
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
            // الرئيسية
            context.go(
              '/home',
              extra: {
                'userName': widget.userName,
                'userEmail': widget.userEmail,
              },
            );
          } else if (index == 1) {
            // الوارد
            context.go(
              '/shipments',
              extra: {
                'userName': widget.userName,
                'userEmail': widget.userEmail,
              },
            );
          } else if (index == 2) {
            // الصادر - already here
            if (_selectedIndex != 2) {
              setState(() => _selectedIndex = 2);
            }
          } else if (index == 3) {
            // الفواتير - navigate to payments page
            context.go(
              '/payments',
              extra: {
                'userName': widget.userName,
                'userEmail': widget.userEmail,
              },
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
