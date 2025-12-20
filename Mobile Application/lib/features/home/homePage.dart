import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../Pop-ups/al_noran_popups.dart';
import '../../core/network/api_service.dart';
import '../../core/services/user_cache_service.dart';
import '../../core/services/shipments_cache_service.dart';
import '../../core/services/notification_service.dart';
import '../../core/services/firebase_push_service.dart';
import '../../core/services/recent_shipments_service.dart';
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

    // Initialize Firebase Push Service (in case not initialized during login)
    _initializeFirebaseAndNotifications();

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

  /// Initialize Firebase Push and Notification services
  Future<void> _initializeFirebaseAndNotifications() async {
    try {
      // Initialize Firebase Push Service if not already initialized
      if (!FirebasePushService().isInitialized) {
        print('🏠 [HomePage] Initializing Firebase Push Service...');
        await FirebasePushService().initialize();
      }

      // Initialize Notification Service if not already initialized
      if (!NotificationService().isInitialized) {
        print('🏠 [HomePage] Initializing Notification Service...');
        await NotificationService().initialize();
      }
    } catch (e) {
      print('❌ [HomePage] Error initializing services: $e');
    }
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

  void _updateShipmentsFromCache() async {
    final allShipments = _shipmentsCache.allShipments;
    final recentShipments = await RecentShipmentsService.getRecentShipments();
    _processShipments(recentShipments, allShipments);
  }

  Future<void> _loadRecentShipments() async {
    try {
      if (!mounted) return;
      setState(() => _isLoadingShipments = true);

      print('🏠 [HomePage] Loading shipments for current user...');

      // Load user's import shipments from cache (API already filters by user)
      final allImportShipments = await _shipmentsCache.getAllShipments();
      print(
        '🏠 [HomePage] Import shipments count: ${allImportShipments.length}',
      );

      // Load user's export shipments
      List<Map<String, dynamic>> allExportShipments = [];
      try {
        final exportResponse = await ApiService.getMyExportShipments();
        if (exportResponse['success'] == true) {
          allExportShipments = List<Map<String, dynamic>>.from(
            exportResponse['data'] ?? [],
          );
          print(
            '🏠 [HomePage] Export shipments count: ${allExportShipments.length}',
          );
        }
      } catch (e) {
        print('❌ [HomePage] Error loading export shipments: $e');
      }

      // Get last 3 opened shipments from RecentShipmentsService (now user-specific)
      var recentShipments = await RecentShipmentsService.getRecentShipments();
      print(
        '🏠 [HomePage] Recent shipments from service: ${recentShipments.length}',
      );

      // If no recent shipments, show the 3 most recent from user's shipments
      if (recentShipments.isEmpty &&
          (allImportShipments.isNotEmpty || allExportShipments.isNotEmpty)) {
        print(
          '🏠 [HomePage] No recent shipments, showing user\'s latest shipments',
        );
        recentShipments = _getLatestUserShipments(
          allImportShipments,
          allExportShipments,
          3,
        );
        // Debug: Show what type each shipment is
        for (var s in recentShipments) {
          print(
            '🏠 [HomePage] Shipment: ${s['_sourceType']} - ${s['acid'] ?? s['ucrNumber'] ?? s['_id']}',
          );
        }
      }

      _processShipments(recentShipments, allImportShipments);
    } catch (e) {
      print('❌ [HomePage] Error loading shipments: $e');
      if (!mounted) return;
      setState(() => _isLoadingShipments = false);
    }
  }

  /// اختيار أحدث شحنات المستخدم من الوارد والصادر
  List<Map<String, dynamic>> _getLatestUserShipments(
    List<Map<String, dynamic>> importShipments,
    List<Map<String, dynamic>> exportShipments,
    int count,
  ) {
    // جمع كل شحنات المستخدم (imports + exports) مع تحديد النوع
    final List<Map<String, dynamic>> allShipments = [];

    // إضافة شحنات الوارد
    for (var shipment in importShipments) {
      allShipments.add({...shipment, '_sourceType': 'import'});
    }

    // إضافة شحنات الصادر
    for (var shipment in exportShipments) {
      allShipments.add({
        ...shipment,
        '_sourceType': 'export',
        // تحويل حقول الصادر لتتوافق مع شكل الوارد
        'acid': shipment['ucrNumber'] ?? shipment['_id'],
        'shipmentDescription':
            shipment['productDescription'] ?? shipment['shipmentNumber'],
        'shipment_type': shipment['shippingMethod'] ?? 'بحري',
        'status': _translateExportStatus(shipment['currentStatus']),
      });
    }

    // لو مافيش شحنات
    if (allShipments.isEmpty) return [];

    // ترتيب حسب تاريخ التحديث (الأحدث أولاً)
    allShipments.sort((a, b) {
      final dateA = a['updatedAt'] ?? a['createdAt'] ?? '';
      final dateB = b['updatedAt'] ?? b['createdAt'] ?? '';
      return dateB.toString().compareTo(dateA.toString());
    });

    return allShipments.take(count).toList();
  }

  /// ترجمة حالات شحنات الصادر
  String _translateExportStatus(String? status) {
    if (status == null) return 'غير محدد';
    switch (status.toLowerCase()) {
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

  void _processShipments(
    List<Map<String, dynamic>> recentShipments,
    List<Map<String, dynamic>> allShipments,
  ) {
    if (!mounted) return;

    print(
      '🏠 [HomePage] Processing ${recentShipments.length} recent shipments',
    );

    // Format recent shipments for display
    final recent =
        recentShipments.map((shipment) {
          // Determine shipment type from shipment_type field
          final shipmentType =
              shipment['shipment_type']?.toString().toLowerCase() ?? '';
          // Fix: Air shipments contain 'جوي' or 'air', everything else is sea
          final isAir =
              shipmentType.contains('جوي') || shipmentType.contains('air');

          // Check if this is an export shipment (multiple ways to detect)
          final isExport =
              shipment['_sourceType'] == 'export' ||
              shipment['isExport'] == true ||
              (shipment['ucrNumber'] != null && shipment['acid'] == null);
          print(
            '🏠 [_processShipments] Processing: _sourceType=${shipment['_sourceType']}, isExport=$isExport, ucrNumber=${shipment['ucrNumber']}',
          );

          return {
            'id':
                isExport
                    ? (shipment['ucrNumber'] ??
                        shipment['acid'] ??
                        shipment['id'] ??
                        'N/A')
                    : (shipment['acid'] ?? shipment['id'] ?? 'N/A'),
            'ucrNumber': shipment['ucrNumber'],
            'shipmentCode': shipment['shipmentCode'] ?? '',
            'name':
                shipment['shipmentDescription'] ?? shipment['name'] ?? 'شحنة',
            'number46': shipment['number46'] ?? '',
            'shipment_type': shipment['shipment_type'] ?? 'بحري',
            'type': isAir ? 'جوي' : 'بحري',
            'date': _formatDate(
              shipment['updatedAt'] ??
                  shipment['createdAt'] ??
                  shipment['viewedAt'],
            ),
            'status': shipment['status'] ?? 'غير محدد',
            'isUrgent': _isUrgent(shipment['status']),
            'isExport': isExport,
            '_sourceType': shipment['_sourceType'] ?? 'import',
            'rawData': shipment,
          };
        }).toList();

    setState(() {
      _recentShipments = recent;
      _isLoadingShipments = false;
      // تحديث الإحصائيات من كل الشحنات
      _userStats = {
        'totalShipments': allShipments.length,
        'activeShipments':
            allShipments.where((s) => s['status'] != 'تمت بنجاح').length,
        'completedShipments':
            allShipments.where((s) => s['status'] == 'تمت بنجاح').length,
      };
    });

    print('🏠 [HomePage] Recent opened shipments loaded: ${recent.length}');
  }

  bool _isUrgent(String? status) {
    return status == 'في انتظار الشحن' || status == 'في انتظار وصول الإذن';
  }

  Color _getStatusColor(String? status) {
    switch (status) {
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
      default:
        return Colors.orange;
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

  // Premium Colors
  static const Color primaryDark = Color(0xFF690000);
  static const Color primaryLight = Color(0xFF8B0000);
  static const Color accentColor = Color(0xFF1ba3b6);
  static const Color goldAccent = Color(0xFFD4AF37);
  static const Color bgColor = Color(0xFFF8F9FA);

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: bgColor,
        body: Stack(
          children: [
            // Background Gradient
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              height: 300,
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [primaryDark.withValues(alpha: 0.05), bgColor],
                  ),
                ),
              ),
            ),

            // Main Content
            Column(
              children: [
                // Premium Top Bar
                UnifiedTopBar(
                  showBackButton: false,
                  showMenu: true,
                  showWelcome: true,
                  onMenuPressed: () => _showMenu(),
                ),

                // Scrollable Content
                Expanded(
                  child: RefreshIndicator(
                    onRefresh: _loadRecentShipments,
                    color: primaryDark,
                    child: SingleChildScrollView(
                      physics: const BouncingScrollPhysics(),
                      child: Column(
                        children: [
                          const SizedBox(height: 20),

                          // Premium Tracking Card
                          _buildPremiumTrackingCard(),

                          const SizedBox(height: 24),

                          // Premium Statistics Section
                          _buildPremiumStatisticsSection(),

                          const SizedBox(height: 24),

                          // Premium Services Section
                          _buildPremiumServicesSection(),

                          const SizedBox(height: 24),

                          // Premium Shipments Section
                          _buildPremiumShipmentsSection(),

                          const SizedBox(height: 100),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
        bottomNavigationBar: _buildPremiumBottomNav(),
      ),
    );
  }

  // ==================== PREMIUM TRACKING CARD ====================
  Widget _buildPremiumTrackingCard() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            primaryDark,
            primaryLight,
            primaryDark.withValues(alpha: 0.9),
          ],
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: primaryDark.withValues(alpha: 0.4),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Stack(
          children: [
            // Decorative Pattern
            Positioned(
              right: -30,
              top: -30,
              child: Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withValues(alpha: 0.05),
                ),
              ),
            ),
            Positioned(
              left: -20,
              bottom: -20,
              child: Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white.withValues(alpha: 0.05),
                ),
              ),
            ),
            // Content
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  // Header with Icon
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text(
                        'تتبع شحنتك',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'Cairo',
                        ),
                      ),

                      const SizedBox(width: 12),

                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          Icons.local_shipping_rounded,
                          color: goldAccent,
                          size: 24,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'أدخل رقم الشحنة أو رقم ACID للتتبع',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.7),
                      fontSize: 13,
                      fontFamily: 'Cairo',
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Premium Search Bar
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.1),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        // QR Scanner Button
                        Container(
                          margin: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [primaryDark, primaryLight],
                            ),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: IconButton(
                            onPressed: () {
                              HapticFeedback.lightImpact();
                              // TODO: QR Scanner
                            },
                            icon: const Icon(
                              Icons.qr_code_scanner_rounded,
                              color: Colors.white,
                              size: 22,
                            ),
                          ),
                        ),
                        // Text Field
                        Expanded(
                          child: TextField(
                            controller: _trackingController,
                            textAlign: TextAlign.right,
                            style: const TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 15,
                            ),
                            decoration: InputDecoration(
                              hintText: 'رقم الشحنة أو ACID...',
                              hintStyle: TextStyle(
                                color: Colors.grey[400],
                                fontFamily: 'Cairo',
                                fontSize: 14,
                              ),
                              border: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 14,
                              ),
                            ),
                            onSubmitted: (_) => _handleTrackShipment(),
                          ),
                        ),
                        // Search Button
                        Container(
                          margin: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                accentColor,
                                accentColor.withValues(alpha: 0.8),
                              ],
                            ),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: IconButton(
                            onPressed: () {
                              HapticFeedback.lightImpact();
                              _handleTrackShipment();
                            },
                            icon: const Icon(
                              Icons.search_rounded,
                              color: Colors.white,
                              size: 22,
                            ),
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
                maxHeight: MediaQuery.of(context).size.height * 0.8,
              ),
              decoration: BoxDecoration(
                color: bgColor,
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(30),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.2),
                    blurRadius: 30,
                    offset: const Offset(0, -10),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Handle Bar
                  Container(
                    margin: const EdgeInsets.only(top: 12, bottom: 16),
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),

                  // Profile Header Section
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 20),
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          primaryDark,
                          primaryLight,
                          primaryDark.withValues(alpha: 0.9),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: primaryDark.withValues(alpha: 0.3),
                          blurRadius: 15,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        // Icon
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Icon(
                            Icons.person_rounded,
                            color: goldAccent,
                            size: 28,
                          ),
                        ),
                        const SizedBox(width: 16),
                        // User Info
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                widget.userName.split(' ').first,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  fontFamily: 'Cairo',
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                widget.userEmail,
                                style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.8),
                                  fontSize: 13,
                                  fontFamily: 'Cairo',
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                        // Arrow Icon
                        GestureDetector(
                          onTap: () {
                            HapticFeedback.lightImpact();
                            Navigator.pop(context);
                            this.context.push('/profile');
                          },
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(
                              Icons.arrow_back_ios_rounded,
                              color: Colors.white,
                              size: 16,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Menu Items
                  Flexible(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Column(
                        children: [
                          _buildPremiumMenuItem(
                            icon: Icons.person_rounded,
                            title: 'الملف الشخصي',
                            subtitle: 'عرض وتعديل معلوماتك',
                            gradient: [primaryDark, primaryLight],
                            onTap: () {
                              Navigator.pop(context);
                              this.context.push('/profile');
                            },
                          ),
                          const SizedBox(height: 12),
                          _buildPremiumMenuItem(
                            icon: Icons.settings_rounded,
                            title: 'إعدادات الحساب',
                            subtitle: 'التحكم في إعدادات التطبيق',
                            gradient: [
                              accentColor,
                              accentColor.withValues(alpha: 0.7),
                            ],
                            onTap: () {
                              Navigator.pop(context);
                              this.context.push('/settings');
                            },
                          ),
                          const SizedBox(height: 12),
                          _buildPremiumMenuItem(
                            icon: Icons.notifications_rounded,
                            title: 'الإشعارات',
                            subtitle: 'إدارة الإشعارات والتنبيهات',
                            gradient: [
                              goldAccent,
                              goldAccent.withValues(alpha: 0.7),
                            ],
                            onTap: () {
                              Navigator.pop(context);
                              this.context.push('/notifications');
                            },
                          ),
                          const SizedBox(height: 12),
                          _buildPremiumMenuItem(
                            icon: Icons.help_rounded,
                            title: 'المساعدة والدعم',
                            subtitle: 'تواصل معنا للمساعدة',
                            gradient: [primaryLight, primaryDark],
                            onTap: () {
                              Navigator.pop(context);
                              this.context.push('/contact');
                            },
                          ),

                          const SizedBox(height: 20),
                          Container(
                            height: 1,
                            margin: const EdgeInsets.symmetric(horizontal: 20),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  Colors.transparent,
                                  Colors.grey.withValues(alpha: 0.3),
                                  Colors.transparent,
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 20),

                          // Logout Button
                          GestureDetector(
                            onTap: () {
                              HapticFeedback.lightImpact();
                              Navigator.pop(context);
                              _handleLogout();
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                vertical: 16,
                                horizontal: 20,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: Colors.red.withValues(alpha: 0.3),
                                  width: 1.5,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.red.withValues(alpha: 0.1),
                                    blurRadius: 10,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: Colors.red.withValues(alpha: 0.1),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: const Icon(
                                      Icons.logout_rounded,
                                      color: Colors.red,
                                      size: 22,
                                    ),
                                  ),
                                  const SizedBox(width: 16),
                                  const Expanded(
                                    child: Text(
                                      'تسجيل الخروج',
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                        fontFamily: 'Cairo',
                                        color: Colors.red,
                                      ),
                                    ),
                                  ),
                                  Icon(
                                    Icons.arrow_back_ios_rounded,
                                    size: 16,
                                    color: Colors.red.withValues(alpha: 0.5),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 24),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
    );
  }

  Widget _buildPremiumMenuItem({
    required IconData icon,
    required String title,
    required String subtitle,
    required List<Color> gradient,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            // Icon with Gradient
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: gradient,
                ),
                borderRadius: BorderRadius.circular(14),
                boxShadow: [
                  BoxShadow(
                    color: gradient[0].withValues(alpha: 0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Icon(icon, color: Colors.white, size: 22),
            ),
            const SizedBox(width: 16),
            // Text Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Cairo',
                      color: Color(0xFF2D2D2D),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      fontFamily: 'Cairo',
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
            // Arrow Icon
            Icon(
              Icons.arrow_back_ios_rounded,
              size: 16,
              color: Colors.grey[400],
            ),
          ],
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

  // ==================== PREMIUM STATISTICS SECTION ====================
  Widget _buildPremiumStatisticsSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'نظرة عامة',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Cairo',
                  color: Color(0xFF2D2D2D),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: accentColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.analytics_rounded, size: 16, color: accentColor),
                    const SizedBox(width: 4),
                    Text(
                      'إحصائياتك',
                      style: TextStyle(
                        color: accentColor,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        fontFamily: 'Cairo',
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Stats Cards Row
          Row(
            children: [
              Expanded(
                child: _buildPremiumStatCard(
                  title: 'إجمالي الشحنات',
                  value: _userStats['totalShipments'].toString(),
                  icon: Icons.inventory_2_rounded,
                  gradient: [primaryDark, primaryLight],
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildPremiumStatCard(
                  title: 'نشطة',
                  value: _userStats['activeShipments'].toString(),
                  icon: Icons.flight_takeoff_rounded,
                  gradient: [accentColor, accentColor.withValues(alpha: 0.7)],
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildPremiumStatCard(
                  title: 'مكتملة',
                  value: _userStats['completedShipments'].toString(),
                  icon: Icons.check_circle_rounded,
                  gradient: [goldAccent, goldAccent.withValues(alpha: 0.7)],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPremiumStatCard({
    required String title,
    required String value,
    required IconData icon,
    required List<Color> gradient,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: gradient,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: gradient[0].withValues(alpha: 0.4),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: Colors.white, size: 22),
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: Colors.white,
              fontFamily: 'Cairo',
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: TextStyle(
              fontSize: 11,
              color: Colors.white.withValues(alpha: 0.9),
              fontFamily: 'Cairo',
              fontWeight: FontWeight.w500,
            ),
            textAlign: TextAlign.center,
          ),
        ],
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

  // ==================== PREMIUM SERVICES SECTION ====================
  Widget _buildPremiumServicesSection() {
    return Column(
      children: [
        // Section Header
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'خدماتنا',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Cairo',
                  color: Color(0xFF2D2D2D),
                ),
              ),
              TextButton(
                onPressed: () {},
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'المزيد',
                      style: TextStyle(
                        color: primaryDark,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        fontFamily: 'Cairo',
                      ),
                    ),
                    const SizedBox(width: 4),
                    Icon(Icons.arrow_forward_ios, size: 14, color: primaryDark),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Services Grid
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Column(
            children: [
              Row(
                children: [
                  Expanded(
                    child: _buildPremiumServiceCard(
                      title: 'الملف الشخصي',
                      icon: Icons.person_rounded,
                      color: primaryDark,
                      onTap: () => context.push('/profile'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildPremiumServiceCard(
                      title: 'الإعدادات',
                      icon: Icons.settings_rounded,
                      color: primaryLight,
                      onTap: () => context.push('/settings'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildPremiumServiceCard(
                      title: 'طلب ACID\n(الوارد)',
                      icon: Icons.flight_land_rounded,
                      color: accentColor,
                      onTap:
                          () => context.push(
                            '/acid-request',
                            extra: {
                              'userName': widget.userName,
                              'userEmail': widget.userEmail,
                            },
                          ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildPremiumServiceCard(
                      title: 'طلب UCR\n(الصادر)',
                      icon: Icons.flight_takeoff_rounded,
                      color: goldAccent,
                      onTap:
                          () => context.push(
                            '/ucr-request',
                            extra: {
                              'userName': widget.userName,
                              'userEmail': widget.userEmail,
                            },
                          ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildPremiumServiceCard(
                      title: 'تواصل معنا',
                      icon: Icons.headset_mic_rounded,
                      color: accentColor,
                      onTap: () => _handleServiceTap('تواصل معنا'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildPremiumServiceCard(
                      title: 'الإشعارات',
                      icon: Icons.notifications_rounded,
                      color: primaryDark,
                      onTap: () => context.push('/notifications'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPremiumServiceCard({
    required String title,
    required IconData icon,
    required Color color,
    VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap?.call();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.grey.withValues(alpha: 0.08)),
          boxShadow: [
            BoxShadow(
              color: color.withValues(alpha: 0.1),
              blurRadius: 15,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [color, color.withValues(alpha: 0.7)],
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: color.withValues(alpha: 0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Icon(icon, size: 26, color: Colors.white),
            ),
            const SizedBox(height: 14),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                fontFamily: 'Cairo',
                color: Color(0xFF2D2D2D),
                height: 1.3,
              ),
              maxLines: 2,
            ),
          ],
        ),
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

  // ==================== PREMIUM SHIPMENTS SECTION ====================
  Widget _buildPremiumShipmentsSection() {
    return Column(
      children: [
        // Section Header
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Text(
                    'آخر الشحنات',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Cairo',
                      color: Color(0xFF2D2D2D),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: primaryDark.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      Icons.local_shipping_rounded,
                      size: 20,
                      color: primaryDark,
                    ),
                  ),
                ],
              ),

              TextButton(
                onPressed: _handleViewAllShipments,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'عرض الكل',
                      style: TextStyle(
                        color: primaryDark,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        fontFamily: 'Cairo',
                      ),
                    ),
                    const SizedBox(width: 4),
                    Icon(Icons.arrow_forward_ios, size: 14, color: primaryDark),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Content
        if (_isLoadingShipments)
          Padding(
            padding: const EdgeInsets.all(40),
            child: Column(
              children: [
                SizedBox(
                  width: 50,
                  height: 50,
                  child: CircularProgressIndicator(
                    color: primaryDark,
                    strokeWidth: 3,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'جاري تحميل الشحنات...',
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontFamily: 'Cairo',
                  ),
                ),
              ],
            ),
          )
        else if (_recentShipments.isEmpty)
          Padding(
            padding: const EdgeInsets.all(40),
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.inventory_2_outlined,
                    size: 48,
                    color: Colors.grey[400],
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'لا توجد شحنات حالياً',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.grey[600],
                    fontFamily: 'Cairo',
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'ابدأ بإضافة شحنتك الأولى',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[500],
                    fontFamily: 'Cairo',
                  ),
                ),
              ],
            ),
          )
        else
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _recentShipments.length,
            itemBuilder: (context, index) {
              return _buildPremiumShipmentCard(_recentShipments[index], index);
            },
          ),
      ],
    );
  }

  Widget _buildPremiumShipmentCard(Map<String, dynamic> shipment, int index) {
    // Check if this is an export shipment
    final isExport =
        shipment['isExport'] == true || shipment['_sourceType'] == 'export';

    final shipmentType =
        shipment['shipment_type']?.toString().toLowerCase() ?? '';
    final isAir =
        shipmentType.contains('جوي') ||
        shipmentType.contains('air') ||
        shipment['type'] == 'جوي';
    final typeText = isAir ? 'جوي' : 'بحري';
    final typeIcon =
        isAir ? Icons.flight_takeoff_rounded : Icons.directions_boat_rounded;
    final typeColor = isAir ? goldAccent : accentColor;
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
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          onTap: () {
            HapticFeedback.lightImpact();
            _handleShipmentTap(shipment);
          },
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header Row - Shipment Code + Badges
                Row(
                  children: [
                    // Shipment Code (if available)
                    if (shipment['shipmentCode']?.toString().isNotEmpty ==
                        true) ...[
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 5,
                        ),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [primaryDark, primaryLight],
                          ),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          shipment['shipmentCode'],
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Cairo',
                            color: Colors.white,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                    ],
                    // Type Badge (بحري/جوي)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: typeColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(typeIcon, size: 12, color: typeColor),
                          const SizedBox(width: 3),
                          Text(
                            typeText,
                            style: TextStyle(
                              fontSize: 10,
                              fontFamily: 'Cairo',
                              fontWeight: FontWeight.bold,
                              color: typeColor,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 6),
                    // Import/Export Badge
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color:
                            isExport
                                ? Colors.green.withOpacity(0.1)
                                : Colors.blue.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        isExport ? 'تصدير' : 'استيراد',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'Cairo',
                          color:
                              isExport
                                  ? Colors.green.shade700
                                  : Colors.blue.shade700,
                        ),
                      ),
                    ),
                    const Spacer(),
                    // Urgent Badge
                    if (shipment['isUrgent'] == true) ...[
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.red.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          'عاجل',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Cairo',
                            color: Colors.red.shade700,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                    ],
                    Icon(
                      Icons.arrow_forward_ios_rounded,
                      size: 14,
                      color: Colors.grey[400],
                    ),
                  ],
                ),

                const SizedBox(height: 14),

                // ACID/UCR Number Row
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: bgColor,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.qr_code_2_rounded,
                        size: 20,
                        color: primaryDark,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              isExport ? 'رقم UCR' : 'رقم ACID',
                              style: TextStyle(
                                fontSize: 10,
                                fontFamily: 'Cairo',
                                color: Colors.grey[500],
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              shipment['id'] ?? '',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'Cairo',
                                color: primaryDark,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // Number 46 (only for imports)
                if (!isExport &&
                    shipment['number46']?.toString().isNotEmpty == true) ...[
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Icon(
                        Icons.description_outlined,
                        size: 16,
                        color: Colors.grey[600],
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'رقم 46: ',
                        style: TextStyle(
                          fontSize: 11,
                          fontFamily: 'Cairo',
                          color: Colors.grey[500],
                        ),
                      ),
                      Text(
                        shipment['number46'],
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          fontFamily: 'Cairo',
                          color: Color(0xFF424242),
                        ),
                      ),
                    ],
                  ),
                ],

                const SizedBox(height: 12),

                // Status and Date Row
                Row(
                  children: [
                    // Status
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: statusColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: statusColor,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            shipment['status'] ?? '',
                            style: TextStyle(
                              fontSize: 11,
                              fontFamily: 'Cairo',
                              fontWeight: FontWeight.w600,
                              color: statusColor,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Spacer(),
                    // Date
                    Row(
                      children: [
                        Icon(
                          Icons.schedule_rounded,
                          size: 12,
                          color: Colors.grey[500],
                        ),
                        const SizedBox(width: 4),
                        Text(
                          shipment['date'] ?? '',
                          style: TextStyle(
                            fontSize: 10,
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
        ),
      ),
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
    // Debug: Log shipment data
    print(
      '🎨 [_buildShipmentCard] shipment[isExport]=${shipment['isExport']}, _sourceType=${shipment['_sourceType']}, id=${shipment['id']}',
    );

    // Get shipment type from shipment_type field or pre-computed type
    final shipmentType =
        shipment['shipment_type']?.toString().toLowerCase() ?? '';
    // Fix: Check for air first - if contains 'جوي' or 'air' it's air, otherwise sea
    final isAir =
        shipmentType.contains('جوي') ||
        shipmentType.contains('air') ||
        shipment['type'] == 'جوي';
    final typeText = isAir ? 'جوي' : 'بحري';
    final typeIcon =
        isAir ? Icons.flight_takeoff_rounded : Icons.directions_boat_rounded;
    final typeColor = isAir ? goldAccent : accentColor;

    // Check if this is an export shipment
    final isExport =
        shipment['isExport'] == true || shipment['_sourceType'] == 'export';
    print('🎨 [_buildShipmentCard] isExport=$isExport');

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
          onTap: () {
            HapticFeedback.lightImpact();
            _handleShipmentTap(shipment);
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
                          if (shipment['isUrgent'] == true) ...[
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
                    // ACID/UCR Number Row (based on shipment type)
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
                                  isExport ? 'رقم UCR' : 'رقم ACID',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontFamily: 'Cairo',
                                    color: Colors.grey[500],
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  shipment['id'] ?? '',
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
                            _handleShipmentTap(shipment);
                          },
                          borderRadius: BorderRadius.circular(14),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  isExport
                                      ? 'عرض تفاصيل التصدير'
                                      : 'عرض تفاصيل الشحنة',
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    fontFamily: 'Cairo',
                                    color: Colors.white,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                                const SizedBox(width: 10),
                                const Icon(
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

  void _handleShipmentTap(Map<String, dynamic> shipment) {
    // Check if export shipment - navigate to export details
    final isExport =
        shipment['isExport'] == true || shipment['_sourceType'] == 'export';
    if (isExport) {
      context.push('/export-shipment-details/${shipment['id']}');
    } else {
      context.push('/shipment-details/${shipment['id']}');
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
            color: Colors.black.withValues(alpha: 0.08),
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
                  ? LinearGradient(colors: [primaryDark, primaryLight])
                  : null,
          color: isSelected ? null : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
          boxShadow:
              isSelected
                  ? [
                    BoxShadow(
                      color: primaryDark.withValues(alpha: 0.3),
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
        // الفواتير - Navigate to payments page
        setState(() => _selectedIndex = index);
        context.go(
          '/payments',
          extra: {'userName': widget.userName, 'userEmail': widget.userEmail},
        );
        break;
    }
  }
}
