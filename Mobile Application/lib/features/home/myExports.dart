import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/network/api_service.dart';
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
                    .contains(searchQuery);

            final matchesFilter =
                _selectedFilter == 'الكل' ||
                _selectedFilter == 'طلبات UCR' &&
                    false || // Hide UCR requests when UCR filter is selected
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
                    .contains(searchQuery);

            final matchesFilter =
                _selectedFilter == 'الكل' ||
                _selectedFilter == 'طلبات UCR' &&
                    false || // Hide UCR requests when UCR filter is selected
                _getShippingMethodFilter(request) == _selectedFilter;

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
        break;
    }
  }

  Future<void> _loadUcrRequests() async {
    try {
      if (!mounted) return;
      setState(() => _isLoading = true);

      print('📦 [MyExports] Loading UCR requests...');

      final response = await ApiService.getMyUcrRequests();

      print('📦 [MyExports] UCR Response: $response');

      if (response['success'] == true) {
        final requests = List<Map<String, dynamic>>.from(
          response['data'] ?? [],
        );

        print('📦 [MyExports] Found ${requests.length} UCR requests');

        final current = <Map<String, dynamic>>[];
        final completed = <Map<String, dynamic>>[];

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

        if (!mounted) return;
        setState(() {
          _allCurrentUcrRequests = current;
          _allCompletedUcrRequests = completed;
          _currentUcrRequests = current;
          _completedUcrRequests = completed;
          _isLoading = false;
        });

        print(
          '📦 [MyExports] UCR Requests - Current: ${current.length}, Completed: ${completed.length}',
        );
      } else {
        if (!mounted) return;
        setState(() => _isLoading = false);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(response['message'] ?? 'حدث خطأ في تحميل البيانات'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
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
    switch (status) {
      case 'Pending':
        return 'قيد المراجعة';
      case 'InProgress':
        return 'جاري التنفيذ';
      case 'Approved':
        return 'تمت الموافقة';
      case 'Completed':
        return 'مكتمل';
      case 'Rejected':
        return 'مرفوض';
      default:
        return status;
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
                                  _buildUcrRequestsList(
                                    _currentUcrRequests,
                                    true,
                                  ),
                                  _buildUcrRequestsList(
                                    _completedUcrRequests,
                                    false,
                                  ),
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
    final shippingMethod = request['shippingMethod'] ?? 'sea';
    final isSea = shippingMethod == 'sea';

    return Container(
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
          color: const Color(0xFF690000).withOpacity(0.2),
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
          // Header Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFF690000),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      isSea
                          ? Icons.directions_boat_rounded
                          : Icons.flight_takeoff_rounded,
                      color: Colors.white,
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isSea ? 'شحنة صادرة بحرية' : 'شحنة صادرة جوية',
                        style: const TextStyle(
                          fontSize: 14,
                          fontFamily: 'Cairo',
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF690000),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        request['destinationCountry'],
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
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

          // Destination Port
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
                      'ميناء الوصول',
                      style: TextStyle(
                        fontSize: 12,
                        color: Color(0xFF9E9E9E),
                        fontFamily: 'Cairo',
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      request['destinationPort'],
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

          // Description
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
                      request['generalDescription'],
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

          // Weight and Value Row
          Row(
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
                      '${request['totalWeight']} كجم',
                      style: const TextStyle(
                        fontSize: 13,
                        color: Color(0xFF616161),
                        fontFamily: 'Cairo',
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Row(
                  children: [
                    const Icon(
                      Icons.attach_money_rounded,
                      size: 18,
                      color: Color(0xFF690000),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${request['valueInEGP']} ج.م',
                      style: const TextStyle(
                        fontSize: 13,
                        color: Color(0xFF616161),
                        fontFamily: 'Cairo',
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Packages and Date Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(
                    Icons.inventory_outlined,
                    size: 16,
                    color: Color(0xFF9E9E9E),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    '${request['packagesCount']} طرد',
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF9E9E9E),
                      fontFamily: 'Cairo',
                    ),
                  ),
                ],
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

          // Sea shipment containers info
          if (isSea &&
              int.tryParse(request['containersCount'] ?? '0') != null &&
              int.parse(request['containersCount'] ?? '0') > 0) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(
                  Icons.view_in_ar_outlined,
                  size: 16,
                  color: Color(0xFF9E9E9E),
                ),
                const SizedBox(width: 6),
                Text(
                  '${request['containersCount']} حاوية',
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF9E9E9E),
                    fontFamily: 'Cairo',
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildAllUcrRequestsList() {
    // Combine current and completed UCR requests
    final allUcrRequests = <Map<String, dynamic>>[];
    allUcrRequests.addAll(_currentUcrRequests);
    allUcrRequests.addAll(_completedUcrRequests);

    if (allUcrRequests.isEmpty) {
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
        itemCount: allUcrRequests.length,
        itemBuilder: (context, index) {
          return _buildUcrRequestCard(allUcrRequests[index]);
        },
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'قيد المراجعة':
      case 'Pending':
        return Colors.orange;
      case 'جاري التنفيذ':
      case 'InProgress':
        return const Color(0xFF1ba3b6);
      case 'تمت الموافقة':
      case 'Approved':
      case 'مكتمل':
      case 'Completed':
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
            // الفواتير
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
