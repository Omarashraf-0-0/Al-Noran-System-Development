import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../Pop-ups/al_noran_popups.dart';
import '../../core/network/api_service.dart';
import '../../core/services/user_cache_service.dart';
import '../../core/services/shipments_cache_service.dart';
import '../../core/widgets/unified_top_bar.dart';

class HomePage extends StatefulWidget {
  final String userName;
  final String userEmail;

  const HomePage({super.key, required this.userName, required this.userEmail});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _selectedIndex = 0;
  final TextEditingController _trackingController = TextEditingController();

  // User cache service - still needed for logout and refresh operations
  final UserCacheService _userCache = UserCacheService();
  final ShipmentsCacheService _shipmentsCache = ShipmentsCacheService();
  StreamSubscription? _userDataSubscription;
  StreamSubscription<List<Map<String, dynamic>>>? _shipmentsSubscription;

  // بيانات ديناميكية ستأتي من الـ Backend
  Map<String, dynamic> _userStats = {
    'totalShipments': 0,
    'activeShipments': 0,
    'completedShipments': 0,
  };

  List<Map<String, dynamic>> _recentShipments = [];
  bool _isLoadingShipments = true;

  @override
  void initState() {
    super.initState();

    // Initialize user cache (for logout operations and other usage)
    _initializeUserData();
    _loadRecentShipments();

    // Listen to shipments cache updates
    _shipmentsSubscription = _shipmentsCache.shipmentsStream.listen((_) {
      if (mounted) {
        _updateShipmentsFromCache();
      }
    });
  }

  @override
  void dispose() {
    _userDataSubscription?.cancel();
    _shipmentsSubscription?.cancel();
    _trackingController.dispose();
    super.dispose();
  }

  Future<void> _initializeUserData() async {
    try {
      await _userCache.initialize();
    } catch (e) {
      print('❌ [HomePage] Error initializing user cache: $e');
    }
  }

  void _updateShipmentsFromCache() {
    final shipments = _shipmentsCache.allShipments;
    _processShipments(shipments);
  }

  Future<void> _loadRecentShipments() async {
    try {
      if (!mounted) return;
      setState(() => _isLoadingShipments = true);

      print('🏠 [HomePage] Loading recent shipments from cache...');

      // Use the cache service instead of direct API call
      final shipments = await _shipmentsCache.getAllShipments();
      _processShipments(shipments);
    } catch (e) {
      print('❌ [HomePage] Error loading shipments: $e');
      if (!mounted) return;
      setState(() => _isLoadingShipments = false);
    }
  }

  void _processShipments(List<Map<String, dynamic>> shipments) {
    if (!mounted) return;

    print('🏠 [HomePage] Processing ${shipments.length} shipments');

    // أخذ آخر 3 شحنات فقط
    final recent =
        shipments.take(3).map((shipment) {
          return {
            'id': shipment['acid'] ?? 'N/A',
            'name': shipment['shipmentDescription'] ?? 'شحنة',
            'polNumber': shipment['number46'] ?? 'غير محدد',
            'date': _formatDate(
              shipment['arrivalDate'] ?? shipment['createdAt'],
            ),
            'status': shipment['status'] ?? 'غير محدد',
            'isUrgent': _isUrgent(shipment['status']),
            'rawData': shipment,
          };
        }).toList();

    setState(() {
      _recentShipments = recent;
      _isLoadingShipments = false;
      // تحديث الإحصائيات
      _userStats = {
        'totalShipments': shipments.length,
        'activeShipments':
            shipments.where((s) => s['status'] != 'تمت بنجاح').length,
        'completedShipments':
            shipments.where((s) => s['status'] == 'تمت بنجاح').length,
      };
    });

    print('🏠 [HomePage] Recent shipments loaded: ${recent.length}');
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
      final days = [
        'الأحد',
        'الإثنين',
        'الثلاثاء',
        'الأربعاء',
        'الخميس',
        'الجمعة',
        'السبت',
      ];
      return 'تاريخ ${days[dateTime.weekday % 7]} ${dateTime.day} ${months[dateTime.month - 1]}';
    } catch (e) {
      return 'غير محدد';
    }
  }

  // Mock Data - REMOVED
  // final List<Map<String, dynamic>> _currentShipments = [...]

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: const Color(0xFFF5F5F5),
        body: Column(
          children: [
            // Top Bar - Uses UnifiedTopBar with UserCacheService
            UnifiedTopBar(
              showBackButton: false,
              showMenu: true,
              onMenuPressed: () => _showMenu(),
            ),

            // Main Content
            Expanded(
              child: SafeArea(
                top: false,
                child: SingleChildScrollView(
                  child: Column(
                    children: [
                      const SizedBox(height: 16),

                      // Tracking Card
                      _buildTrackingCard(),

                      const SizedBox(height: 24),

                      // Statistics Section
                      _buildStatisticsSection(),

                      const SizedBox(height: 24),

                      // Services Section
                      _buildServicesSection(),

                      const SizedBox(height: 24),

                      // Current Shipments Section
                      _buildCurrentShipmentsSection(),

                      const SizedBox(height: 16),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
        bottomNavigationBar: _buildBottomNavigationBar(),
      ),
    );
  }

  Widget _buildTrackingCard() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF690000),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        children: [
          const Text(
            'تتبع شحنتك',
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
              fontFamily: 'Cairo',
            ),
          ),
          const SizedBox(height: 16),

          // Search Bar
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
            ),
            child: TextField(
              controller: _trackingController,
              textAlign: TextAlign.right,
              style: const TextStyle(fontFamily: 'Cairo'),
              decoration: InputDecoration(
                hintText: 'أدخل رقم الشحنة',
                hintStyle: const TextStyle(
                  color: Color(0xFFBDBDBD),
                  fontFamily: 'Cairo',
                  fontSize: 14,
                ),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 14,
                ),
                suffixIcon: const Icon(Icons.search, color: Color(0xFFBDBDBD)),
                prefixIcon: Icon(
                  Icons.qr_code_scanner,
                  color: const Color(0xFF690000),
                ),
              ),
            ),
          ),

          const SizedBox(height: 12),

          // Track Button
          SizedBox(
            width: 120,
            height: 40,
            child: ElevatedButton(
              onPressed: () {
                _handleTrackShipment();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: const Color(0xFF690000),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
                elevation: 0,
              ),
              child: const Text(
                'تتبع',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Cairo',
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _handleTrackShipment() async {
    final trackingNumber = _trackingController.text.trim();
    if (trackingNumber.isEmpty) {
      AlNoranPopups.showError(
        context: context,
        message: 'من فضلك أدخل رقم التتبع',
      );
      return;
    }

    // Show loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder:
          (context) => const Center(
            child: CircularProgressIndicator(color: Color(0xFF690000)),
          ),
    );

    try {
      // Get all shipments from API
      final response = await ApiService.getAllShipments();

      if (!mounted) return;
      context.pop(); // Close loading

      if (response['success'] == true) {
        final allShipments = List<Map<String, dynamic>>.from(
          response['shipments'] ?? [],
        );

        // Filter shipments that match the search query
        final searchLower = trackingNumber.toLowerCase();
        final matchingShipments =
            allShipments.where((shipment) {
              final acid = (shipment['acid'] ?? '').toString().toLowerCase();
              final number46 =
                  (shipment['number46'] ?? '').toString().toLowerCase();
              final description =
                  (shipment['shipmentDescription'] ?? '')
                      .toString()
                      .toLowerCase();

              return acid.contains(searchLower) ||
                  number46.contains(searchLower) ||
                  description.contains(searchLower);
            }).toList();

        if (matchingShipments.isEmpty) {
          AlNoranPopups.showError(
            context: context,
            message: 'لم يتم العثور على شحنات تطابق: $trackingNumber',
          );
          return;
        }

        // Show results in popup
        _showSearchResultsPopup(matchingShipments, trackingNumber);
      } else {
        AlNoranPopups.showError(
          context: context,
          message: 'حدث خطأ أثناء البحث',
        );
      }
    } catch (e) {
      if (!mounted) return;
      context.pop(); // Close loading if still open
      AlNoranPopups.showError(
        context: context,
        message: 'حدث خطأ أثناء البحث: ${e.toString()}',
      );
    }
  }

  void _showSearchResultsPopup(
    List<Map<String, dynamic>> results,
    String query,
  ) {
    final homeContext = context; // Save home page context

    showDialog(
      context: context,
      builder:
          (dialogContext) => Directionality(
            textDirection: TextDirection.rtl,
            child: Dialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(25),
              ),
              child: Container(
                constraints: BoxConstraints(
                  maxHeight: MediaQuery.of(dialogContext).size.height * 0.7,
                  maxWidth: MediaQuery.of(dialogContext).size.width * 0.9,
                ),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(25),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Header
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: const Color(0xFF690000),
                        borderRadius: const BorderRadius.only(
                          topLeft: Radius.circular(25),
                          topRight: Radius.circular(25),
                        ),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.search_rounded,
                            color: Colors.white,
                            size: 28,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'نتائج البحث',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                    fontFamily: 'Cairo',
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'تم العثور على ${results.length} شحنة',
                                  style: const TextStyle(
                                    color: Colors.white70,
                                    fontSize: 14,
                                    fontFamily: 'Cairo',
                                  ),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            onPressed: () => Navigator.pop(dialogContext),
                            icon: const Icon(Icons.close, color: Colors.white),
                          ),
                        ],
                      ),
                    ),

                    // Results List
                    Flexible(
                      child: ListView.builder(
                        shrinkWrap: true,
                        padding: const EdgeInsets.all(16),
                        itemCount: results.length,
                        itemBuilder: (context, index) {
                          final shipment = results[index];
                          return _buildSearchResultCard(shipment, homeContext);
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
    );
  }

  Widget _buildSearchResultCard(
    Map<String, dynamic> shipment,
    BuildContext homeContext,
  ) {
    final acid = shipment['acid'] ?? 'N/A';
    final polNumber = shipment['number46'] ?? 'غير محدد';
    final status = shipment['status'] ?? 'غير محدد';
    final description = shipment['shipmentDescription'] ?? 'شحنة';
    final isUrgent = _isUrgent(status);

    return InkWell(
      onTap: () {
        Navigator.pop(context); // Close dialog using dialog context
        homeContext.push(
          '/shipment-details/$acid',
        ); // Navigate using home context
      },
      borderRadius: BorderRadius.circular(16),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFFF5F5F5),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.withOpacity(0.2), width: 1),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 5,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFF690000),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        acid,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'Cairo',
                          color: Colors.white,
                        ),
                      ),
                    ),
                    if (isUrgent) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.red,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text(
                          'عاجل',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Cairo',
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                Icon(Icons.arrow_back_ios, size: 16, color: Colors.grey[400]),
              ],
            ),

            const SizedBox(height: 10),

            // Description
            Text(
              description,
              style: const TextStyle(
                fontSize: 13,
                fontFamily: 'Cairo',
                fontWeight: FontWeight.w600,
                color: Color(0xFF424242),
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),

            const SizedBox(height: 8),

            // POL Number
            Row(
              children: [
                Icon(
                  Icons.description_outlined,
                  size: 14,
                  color: Colors.grey[600],
                ),
                const SizedBox(width: 6),
                Text(
                  'رقم البوليصة: ',
                  style: TextStyle(
                    fontSize: 11,
                    fontFamily: 'Cairo',
                    color: Colors.grey[600],
                  ),
                ),
                Text(
                  polNumber,
                  style: const TextStyle(
                    fontSize: 11,
                    fontFamily: 'Cairo',
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF424242),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 6),

            // Status
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: Colors.orange.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Icon(
                    Icons.access_time,
                    size: 12,
                    color: Colors.orange[700],
                  ),
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    status,
                    style: TextStyle(
                      fontSize: 11,
                      fontFamily: 'Cairo',
                      fontWeight: FontWeight.w600,
                      color: Colors.orange[700],
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showMenu() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder:
          (context) => Directionality(
            textDirection: TextDirection.rtl,
            child: Container(
              constraints: BoxConstraints(
                maxHeight: MediaQuery.of(context).size.height * 0.75,
              ),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(25)),
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Handle Bar
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

                    // Menu Header
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Row(
                        children: const [
                          Icon(
                            Icons.menu_rounded,
                            color: Color(0xFF690000),
                            size: 28,
                          ),
                          SizedBox(width: 12),
                          Text(
                            'القائمة',
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

                    // Menu Items
                    _buildMenuItem(
                      Icons.person_rounded,
                      'الملف الشخصي',
                      const Color(0xFF690000),
                      () {
                        context.pop();
                        context.push('/profile');
                      },
                    ),
                    _buildMenuItem(
                      Icons.settings_rounded,
                      'الإعدادات',
                      const Color(0xFF690000),
                      () {
                        context.pop();
                        context.push('/settings');
                      },
                    ),
                    _buildMenuItem(
                      Icons.help_outline_rounded,
                      'المساعدة',
                      const Color(0xFF1ba3b6),
                      () {
                        context.pop();
                        // TODO: Navigate to help
                      },
                    ),

                    const SizedBox(height: 8),
                    const Divider(height: 1),
                    const SizedBox(height: 8),

                    _buildMenuItem(
                      Icons.logout_rounded,
                      'تسجيل الخروج',
                      Colors.red,
                      () {
                        context.pop();
                        _handleLogout();
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

  Widget _buildMenuItem(
    IconData icon,
    String title,
    Color color,
    VoidCallback onTap,
  ) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(width: 16),
            Text(
              title,
              style: TextStyle(
                fontSize: 16,
                fontFamily: 'Cairo',
                fontWeight: FontWeight.w600,
                color:
                    color == Colors.red ? Colors.red : const Color(0xFF424242),
              ),
            ),
            const Spacer(),
            Icon(Icons.arrow_back_ios, size: 16, color: Colors.grey[400]),
          ],
        ),
      ),
    );
  }

  void _handleLogout() {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder:
          (context) => Directionality(
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
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Icon
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.red.withOpacity(0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.logout_rounded,
                          color: Colors.red,
                          size: 40,
                        ),
                      ),

                      const SizedBox(height: 20),

                      // Title
                      const Text(
                        'تسجيل الخروج',
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF690000),
                        ),
                      ),

                      const SizedBox(height: 12),

                      // Message
                      const Text(
                        'هل أنت متأكد من تسجيل الخروج؟',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 16,
                          color: Color(0xFF757575),
                        ),
                      ),

                      const SizedBox(height: 24),

                      // Buttons
                      Row(
                        children: [
                          Expanded(
                            child: TextButton(
                              onPressed: () => context.pop(),
                              style: TextButton.styleFrom(
                                padding: const EdgeInsets.symmetric(
                                  vertical: 14,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  side: BorderSide(
                                    color: Colors.grey[300]!,
                                    width: 1.5,
                                  ),
                                ),
                              ),
                              child: const Text(
                                'إلغاء',
                                style: TextStyle(
                                  fontFamily: 'Cairo',
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF424242),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () async {
                                // حذف جميع بيانات المستخدم والـ Token
                                await ApiService.removeToken();

                                // Clear user cache
                                _userCache.clear();

                                // إغلاق الـ dialog ثم الانتقال لصفحة تسجيل الدخول
                                if (mounted) {
                                  context.pop(); // Close dialog
                                  context.go('/login');
                                }
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.red,
                                padding: const EdgeInsets.symmetric(
                                  vertical: 14,
                                ),
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              child: const Text(
                                'تسجيل الخروج',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontFamily: 'Cairo',
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
    );
  }

  Widget _buildStatisticsSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          Expanded(
            child: _buildStatCard(
              'إجمالي الشحنات',
              _userStats['totalShipments'].toString(),
              Icons.inventory_2_outlined,
              const Color(0xFF1ba3b6),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _buildStatCard(
              'نشطة',
              _userStats['activeShipments'].toString(),
              Icons.flight_takeoff_rounded,
              Colors.orange,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _buildStatCard(
              'مكتملة',
              _userStats['completedShipments'].toString(),
              Icons.check_circle_outline,
              Colors.green,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(
    String title,
    String value,
    IconData icon,
    Color color,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: color,
              fontFamily: 'Cairo',
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: const TextStyle(
              fontSize: 12,
              color: Colors.grey,
              fontFamily: 'Cairo',
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildServicesSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 16),
          child: Align(
            alignment: Alignment.centerRight,
            child: Text(
              'خدماتنا',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                fontFamily: 'Cairo',
                color: Color(0xFF690000),
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Services Grid
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Column(
            children: [
              // Row 1: الملف الشخصي - إعدادات الحساب
              Row(
                children: [
                  Expanded(
                    child: _buildServiceCard(
                      'الملف الشخصي',
                      Icons.person_outline,
                      onTap: () {
                        context.push('/profile');
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildServiceCard(
                      'إعدادات الحساب',
                      Icons.settings_outlined,
                      onTap: () {
                        context.push('/settings');
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              // Row 2: طلب رقم ACID (الوارد) - طلب رقم UCR (الصادر)
              Row(
                children: [
                  Expanded(
                    child: _buildServiceCard(
                      'طلب رقم ACID\n(الوارد)',
                      Icons.flight_land_rounded,
                      onTap: () {
                        context.push(
                          '/acid-request',
                          extra: {
                            'userName': widget.userName,
                            'userEmail': widget.userEmail,
                          },
                        );
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildServiceCard(
                      'طلب رقم UCR\n(الصادر)',
                      Icons.flight_takeoff_rounded,
                      onTap: () {
                        context.push(
                          '/ucr-request',
                          extra: {
                            'userName': widget.userName,
                            'userEmail': widget.userEmail,
                          },
                        );
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              // Row 3: تواصل معنا
              Row(
                children: [
                  Expanded(
                    flex: 1,
                    child: _buildServiceCard(
                      'تواصل معنا',
                      Icons.headset_mic_outlined,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 1,
                    child: Container(), // Empty space
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildServiceCard(String title, IconData icon, {VoidCallback? onTap}) {
    return InkWell(
      onTap: onTap ?? () => _handleServiceTap(title),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
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
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFF690000).withOpacity(0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, size: 30, color: const Color(0xFF690000)),
            ),
            const SizedBox(height: 12),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                fontFamily: 'Cairo',
                color: Color(0xFF424242),
                height: 1.3,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  void _handleServiceTap(String serviceName) {
    // TODO: Implement service navigation
    AlNoranPopups.showInfo(
      context: context,
      title: serviceName,
      message: 'سيتم تفعيل هذه الخدمة قريباً',
    );
  }

  Widget _buildCurrentShipmentsSection() {
    if (_isLoadingShipments) {
      return const Padding(
        padding: EdgeInsets.all(32),
        child: Center(
          child: CircularProgressIndicator(color: Color(0xFF690000)),
        ),
      );
    }

    if (_recentShipments.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          children: [
            Icon(Icons.inventory_2_outlined, size: 64, color: Colors.grey[300]),
            const SizedBox(height: 12),
            Text(
              'لا توجد شحنات حالياً',
              style: TextStyle(
                fontSize: 16,
                fontFamily: 'Cairo',
                color: Colors.grey[500],
              ),
            ),
          ],
        ),
      );
    }

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'آخر الشحنات',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Cairo',
                  color: Color(0xFF690000),
                ),
              ),
              TextButton(
                onPressed: () {
                  _handleViewAllShipments();
                },
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: const [
                    Text(
                      'رؤية الكل',
                      style: TextStyle(
                        color: Color(0xFF1ba3b6),
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        fontFamily: 'Cairo',
                      ),
                    ),
                    SizedBox(width: 4),
                    Icon(
                      Icons.arrow_forward,
                      size: 16,
                      color: Color(0xFF1ba3b6),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        // Shipment Cards
        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
          itemCount: _recentShipments.length,
          itemBuilder: (context, index) {
            return _buildShipmentCard(_recentShipments[index]);
          },
        ),
      ],
    );
  }

  void _handleViewAllShipments() {
    // الانتقال لصفحة جميع الشحنات
    context.go(
      '/shipments',
      extra: {
        'userName': widget.userName,
        'userEmail': widget.userEmail,
        'type': 'incoming',
      },
    );
  }

  Widget _buildShipmentCard(Map<String, dynamic> shipment) {
    return InkWell(
      onTap: () {
        _handleShipmentTap(shipment);
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
            // Header with ID and Urgent Badge
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

            // POL Number
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

            // Status and Date
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

                // Date
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
          ],
        ),
      ),
    );
  }

  void _handleShipmentTap(Map<String, dynamic> shipment) {
    context.push('/shipment-details/${shipment['id']}');
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
          if (!mounted) return;
          _handleNavigationTap(index);
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

  void _handleNavigationTap(int index) {
    switch (index) {
      case 0:
        // الرئيسية - already here, just update state if needed
        if (_selectedIndex != 0) {
          setState(() => _selectedIndex = 0);
        }
        break;
      case 1:
        // الوارد - Navigate to incoming shipments (الشحنات الحالية)
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
        // الصادر - Navigate to exports page
        setState(() => _selectedIndex = index);
        context.go(
          '/exports',
          extra: {'userName': widget.userName, 'userEmail': widget.userEmail},
        );
        break;
      case 3:
        // الفواتير (don't change selected index)
        AlNoranPopups.showInfo(
          context: context,
          title: 'الفواتير',
          message: 'قسم الفواتير قيد التطوير',
        );
        break;
    }
  }
}
