import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/services/notification_service.dart';
import '../../core/widgets/unified_top_bar.dart';
import '../../theme/colors.dart';

/// صفحة الإشعارات الرئيسية
class NotificationsPage extends StatefulWidget {
  const NotificationsPage({super.key});

  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage>
    with SingleTickerProviderStateMixin {
  final NotificationService _notificationService = NotificationService();
  late TabController _tabController;
  final ScrollController _scrollController = ScrollController();

  StreamSubscription? _notificationsSubscription;
  StreamSubscription? _loadingSubscription;

  List<AppNotification> _notifications = [];
  bool _isLoading = false;
  String _selectedFilter = 'all';

  final List<Map<String, dynamic>> _filters = [
    {'key': 'all', 'label': 'الكل', 'icon': Icons.all_inbox},
    {'key': 'unread', 'label': 'غير مقروء', 'icon': Icons.markunread},
    {'key': 'shipments', 'label': 'الشحنات', 'icon': Icons.local_shipping},
    {'key': 'acid', 'label': 'ACID', 'icon': Icons.science},
    {'key': 'ucr', 'label': 'UCR', 'icon': Icons.description},
    {'key': 'documents', 'label': 'المستندات', 'icon': Icons.folder},
    {
      'key': 'finance',
      'label': 'المالية',
      'icon': Icons.account_balance_wallet,
    },
    {'key': 'chat', 'label': 'الرسائل', 'icon': Icons.chat},
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _filters.length, vsync: this);
    _tabController.addListener(_onTabChanged);

    // Subscribe to notification service streams
    _notificationsSubscription = _notificationService.notificationsStream
        .listen((notifications) {
          if (mounted) {
            setState(() {
              _notifications = notifications;
            });
          }
        });

    _loadingSubscription = _notificationService.loadingStream.listen((
      isLoading,
    ) {
      if (mounted) {
        setState(() {
          _isLoading = isLoading;
        });
      }
    });

    // Setup scroll controller for pagination
    _scrollController.addListener(_onScroll);

    // Initialize notifications
    _initNotifications();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _scrollController.dispose();
    _notificationsSubscription?.cancel();
    _loadingSubscription?.cancel();
    super.dispose();
  }

  void _onTabChanged() {
    if (_tabController.indexIsChanging) {
      setState(() {
        _selectedFilter = _filters[_tabController.index]['key'];
      });
    }
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      if (!_isLoading && _notificationService.hasMore) {
        _notificationService.loadMore();
      }
    }
  }

  Future<void> _initNotifications() async {
    await _notificationService.initialize();
    if (mounted) {
      setState(() {
        _notifications = _notificationService.notifications;
      });
    }
  }

  Future<void> _refreshNotifications() async {
    await _notificationService.refresh();
  }

  List<AppNotification> get _filteredNotifications {
    if (_selectedFilter == 'all') {
      return _notifications;
    } else if (_selectedFilter == 'unread') {
      return _notifications.where((n) => !n.isRead).toList();
    } else {
      return _notificationService.getNotificationsByCategory(_selectedFilter);
    }
  }

  Future<void> _markAllAsRead() async {
    final success = await _notificationService.markAllAsRead();
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text(
            'تم تحديد جميع الإشعارات كمقروءة',
            style: TextStyle(fontFamily: 'Cairo'),
          ),
          backgroundColor: AlNoranColors.success,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
      );
    }
  }

  Future<void> _clearReadNotifications() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder:
          (context) => AlertDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            title: const Text(
              'حذف الإشعارات المقروءة',
              style: TextStyle(
                fontFamily: 'Cairo',
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            content: const Text(
              'هل أنت متأكد من حذف جميع الإشعارات المقروءة؟',
              style: TextStyle(fontFamily: 'Cairo'),
              textAlign: TextAlign.center,
            ),
            actionsAlignment: MainAxisAlignment.spaceEvenly,
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text(
                  'إلغاء',
                  style: TextStyle(fontFamily: 'Cairo', color: Colors.grey),
                ),
              ),
              ElevatedButton(
                onPressed: () => Navigator.pop(context, true),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AlNoranColors.error,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: const Text(
                  'حذف',
                  style: TextStyle(fontFamily: 'Cairo', color: Colors.white),
                ),
              ),
            ],
          ),
    );

    if (confirm == true) {
      final success = await _notificationService.clearReadNotifications();
      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text(
              'تم حذف الإشعارات المقروءة',
              style: TextStyle(fontFamily: 'Cairo'),
            ),
            backgroundColor: AlNoranColors.success,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        );
      }
    }
  }

  void _showNotificationOptions() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder:
          (context) => Container(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 20),
                _buildOptionTile(
                  icon: Icons.done_all,
                  title: 'تحديد الكل كمقروء',
                  color: AlNoranColors.info,
                  onTap: () {
                    Navigator.pop(context);
                    _markAllAsRead();
                  },
                ),
                _buildOptionTile(
                  icon: Icons.delete_sweep,
                  title: 'حذف المقروءة',
                  color: AlNoranColors.error,
                  onTap: () {
                    Navigator.pop(context);
                    _clearReadNotifications();
                  },
                ),
                _buildOptionTile(
                  icon: Icons.settings,
                  title: 'إعدادات الإشعارات',
                  color: AlNoranColors.primary,
                  onTap: () {
                    Navigator.pop(context);
                    context.push('/notification-settings');
                  },
                ),
              ],
            ),
          ),
    );
  }

  Widget _buildOptionTile({
    required IconData icon,
    required String title,
    required Color color,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: color),
      ),
      title: Text(
        title,
        style: const TextStyle(
          fontFamily: 'Cairo',
          fontWeight: FontWeight.w600,
        ),
      ),
      onTap: onTap,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        backgroundColor: AlNoranColors.greyBg,
        body: Column(
          children: [
            // Top Bar
            UnifiedTopBar(
              title: 'الإشعارات',
              subtitle: '${_notificationService.unreadCount} غير مقروء',
              showBackButton: true,
              showNotification: false,
              onBackPressed: () {
                if (GoRouter.of(context).canPop()) {
                  context.pop();
                } else {
                  context.go('/home');
                }
              },
            ),

            // Filter Tabs
            Container(
              color: Colors.white,
              child: TabBar(
                controller: _tabController,
                isScrollable: true,
                labelColor: AlNoranColors.primary,
                unselectedLabelColor: Colors.grey,
                indicatorColor: AlNoranColors.primary,
                indicatorWeight: 3,
                labelStyle: const TextStyle(
                  fontFamily: 'Cairo',
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
                unselectedLabelStyle: const TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 13,
                ),
                tabs:
                    _filters.map((f) {
                      return Tab(
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(f['icon'], size: 18),
                            const SizedBox(width: 6),
                            Text(f['label']),
                          ],
                        ),
                      );
                    }).toList(),
              ),
            ),

            // Notifications List
            Expanded(
              child: RefreshIndicator(
                onRefresh: _refreshNotifications,
                color: AlNoranColors.primary,
                child: _buildNotificationsList(),
              ),
            ),
          ],
        ),
        floatingActionButton:
            _notifications.isNotEmpty
                ? FloatingActionButton(
                  onPressed: _showNotificationOptions,
                  backgroundColor: AlNoranColors.primary,
                  child: const Icon(Icons.more_vert, color: Colors.white),
                )
                : null,
      ),
    );
  }

  Widget _buildNotificationsList() {
    final filteredNotifications = _filteredNotifications;

    if (_isLoading && filteredNotifications.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(color: AlNoranColors.primary),
            SizedBox(height: 16),
            Text(
              'جاري تحميل الإشعارات...',
              style: TextStyle(fontFamily: 'Cairo', color: Colors.grey),
            ),
          ],
        ),
      );
    }

    if (filteredNotifications.isEmpty) {
      return _buildEmptyState();
    }

    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.all(16),
      itemCount: filteredNotifications.length + (_isLoading ? 1 : 0),
      itemBuilder: (context, index) {
        if (index == filteredNotifications.length) {
          return const Padding(
            padding: EdgeInsets.all(16),
            child: Center(
              child: CircularProgressIndicator(color: AlNoranColors.primary),
            ),
          );
        }

        final notification = filteredNotifications[index];
        return _NotificationCard(
          notification: notification,
          onTap: () => _onNotificationTap(notification),
          onDismiss: () => _deleteNotification(notification),
        );
      },
    );
  }

  Widget _buildEmptyState() {
    IconData emptyIcon;
    String emptyTitle;
    String emptySubtitle;
    Color iconColor;

    if (_selectedFilter == 'unread') {
      emptyIcon = Icons.mark_email_read_rounded;
      emptyTitle = 'لا توجد إشعارات غير مقروءة';
      emptySubtitle = 'رائع! لقد قرأت جميع الإشعارات';
      iconColor = const Color(0xFF10B981);
    } else if (_selectedFilter == 'shipments') {
      emptyIcon = Icons.local_shipping_rounded;
      emptyTitle = 'لا توجد إشعارات شحنات';
      emptySubtitle = 'ستظهر هنا إشعارات الشحنات الجديدة';
      iconColor = const Color(0xFF3B82F6);
    } else if (_selectedFilter == 'acid') {
      emptyIcon = Icons.science_rounded;
      emptyTitle = 'لا توجد إشعارات ACID';
      emptySubtitle = 'ستظهر هنا إشعارات طلبات ACID';
      iconColor = const Color(0xFF8B5CF6);
    } else if (_selectedFilter == 'ucr') {
      emptyIcon = Icons.description_rounded;
      emptyTitle = 'لا توجد إشعارات UCR';
      emptySubtitle = 'ستظهر هنا إشعارات طلبات التصدير';
      iconColor = const Color(0xFF10B981);
    } else if (_selectedFilter == 'documents') {
      emptyIcon = Icons.folder_rounded;
      emptyTitle = 'لا توجد إشعارات مستندات';
      emptySubtitle = 'ستظهر هنا إشعارات المستندات';
      iconColor = const Color(0xFFF59E0B);
    } else if (_selectedFilter == 'finance') {
      emptyIcon = Icons.account_balance_wallet_rounded;
      emptyTitle = 'لا توجد إشعارات مالية';
      emptySubtitle = 'ستظهر هنا إشعارات الفواتير والمدفوعات';
      iconColor = const Color(0xFF690000);
    } else if (_selectedFilter == 'chat') {
      emptyIcon = Icons.chat_bubble_rounded;
      emptyTitle = 'لا توجد رسائل';
      emptySubtitle = 'ستظهر هنا إشعارات المحادثات';
      iconColor = const Color(0xFF06B6D4);
    } else {
      emptyIcon = Icons.notifications_off_rounded;
      emptyTitle = 'لا توجد إشعارات';
      emptySubtitle = 'ستظهر الإشعارات هنا عند وصولها';
      iconColor = Colors.grey;
    }

    return Center(
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Animated icon container
              TweenAnimationBuilder<double>(
                tween: Tween(begin: 0.8, end: 1.0),
                duration: const Duration(milliseconds: 600),
                curve: Curves.elasticOut,
                builder: (context, value, child) {
                  return Transform.scale(scale: value, child: child);
                },
                child: Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        iconColor.withOpacity(0.15),
                        iconColor.withOpacity(0.05),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: iconColor.withOpacity(0.2),
                        blurRadius: 30,
                        spreadRadius: 5,
                      ),
                    ],
                  ),
                  child: Icon(emptyIcon, size: 56, color: iconColor),
                ),
              ),
              const SizedBox(height: 28),
              Text(
                emptyTitle,
                style: const TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1F2937),
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 10),
              Text(
                emptySubtitle,
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 14,
                  color: Colors.grey[500],
                  height: 1.5,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              // Refresh button
              OutlinedButton.icon(
                onPressed: _refreshNotifications,
                icon: const Icon(Icons.refresh_rounded, size: 20),
                label: const Text(
                  'تحديث',
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontWeight: FontWeight.w600,
                  ),
                ),
                style: OutlinedButton.styleFrom(
                  foregroundColor: iconColor,
                  side: BorderSide(color: iconColor.withOpacity(0.5)),
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
    );
  }

  Future<void> _onNotificationTap(AppNotification notification) async {
    // Mark as read
    if (!notification.isRead) {
      await _notificationService.markAsRead(notification.id);
    }

    // Navigate based on notification type
    if (!mounted) return;

    final data = notification.data;

    switch (notification.type) {
      case 'shipment_created':
      case 'shipment_status_changed':
      case 'shipment_documents_requested':
      case 'shipment_customs_cleared':
      case 'shipment_delivered':
        final shipmentId = data?['shipmentId'] ?? data?['acid'];
        if (shipmentId != null && shipmentId.toString().isNotEmpty) {
          context.push('/shipment-details/$shipmentId');
        } else {
          context.push('/shipments');
        }
        break;

      case 'acid_submitted':
      case 'acid_created':
      case 'acid_reviewing':
      case 'acid_issued':
      case 'acid_rejected':
      case 'acid_documents_requested':
        // Navigate to shipments page (imports) - ACID tab
        context.push('/shipments');
        break;

      case 'ucr_created':
      case 'ucr_reviewing':
      case 'ucr_approved':
      case 'ucr_rejected':
      case 'ucr_issued':
      case 'ucr_certificate_issued':
      case 'ucr_documents_requested':
        final ucrId = data?['ucrRequestId'] ?? data?['ucrId'];
        if (ucrId != null && ucrId.toString().isNotEmpty) {
          context.push('/ucr-details/$ucrId');
        } else {
          context.push('/exports');
        }
        break;

      case 'document_uploaded':
      case 'document_approved':
      case 'document_rejected':
      case 'documents_verified':
      case 'documents_pending':
      case 'document_requested':
      case 'document_expiring':
        context.push('/documents');
        break;

      case 'invoice_created':
      case 'invoice_generated':
      case 'invoice_paid':
      case 'invoice_overdue':
      case 'payment_reminder':
      case 'payment_received':
      case 'payment_failed':
        context.push('/payments');
        break;

      case 'chat_message':
      case 'chat_new_conversation':
        final conversationId = data?['conversationId'] ?? data?['shipmentId'];
        if (conversationId != null && conversationId.toString().isNotEmpty) {
          context.push('/chat/$conversationId');
        } else {
          // Show notification details if no conversation ID
          _showNotificationDetails(notification);
        }
        break;

      case 'registration':
      case 'account_activated':
      case 'password_changed':
      case 'security_alert':
        context.push('/profile');
        break;

      default:
        // Show notification details dialog
        _showNotificationDetails(notification);
    }
  }

  void _showNotificationDetails(AppNotification notification) {
    // Get category color
    Color categoryColor;
    IconData categoryIcon;

    switch (notification.type) {
      case 'shipment_created':
      case 'shipment_status_changed':
      case 'shipment_documents_requested':
      case 'shipment_customs_cleared':
      case 'shipment_delivered':
        categoryColor = const Color(0xFF3B82F6);
        categoryIcon = Icons.local_shipping_rounded;
        break;
      case 'acid_submitted':
      case 'acid_created':
      case 'acid_reviewing':
      case 'acid_issued':
      case 'acid_rejected':
        categoryColor = const Color(0xFF8B5CF6);
        categoryIcon = Icons.science_rounded;
        break;
      case 'ucr_created':
      case 'ucr_reviewing':
      case 'ucr_approved':
      case 'ucr_rejected':
      case 'ucr_issued':
      case 'ucr_certificate_issued':
        categoryColor = const Color(0xFF10B981);
        categoryIcon = Icons.description_rounded;
        break;
      case 'document_uploaded':
      case 'document_approved':
      case 'document_rejected':
      case 'documents_verified':
      case 'documents_pending':
        categoryColor = const Color(0xFFF59E0B);
        categoryIcon = Icons.folder_rounded;
        break;
      case 'invoice_created':
      case 'invoice_generated':
      case 'invoice_paid':
      case 'invoice_overdue':
      case 'payment_reminder':
      case 'payment_received':
      case 'payment_failed':
        categoryColor = const Color(0xFF690000);
        categoryIcon = Icons.receipt_long_rounded;
        break;
      default:
        categoryColor = const Color(0xFF6B7280);
        categoryIcon = Icons.notifications_rounded;
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder:
          (context) => Container(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(context).size.height * 0.7,
            ),
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Handle
                Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(top: 12, bottom: 16),
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),

                // Header with gradient
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 20),
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        categoryColor.withOpacity(0.1),
                        categoryColor.withOpacity(0.05),
                      ],
                      begin: Alignment.topRight,
                      end: Alignment.bottomLeft,
                    ),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: categoryColor.withOpacity(0.2)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: categoryColor.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Icon(
                          categoryIcon,
                          color: categoryColor,
                          size: 28,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              notification.title,
                              style: const TextStyle(
                                fontFamily: 'Cairo',
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                                color: Color(0xFF1F2937),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 3,
                              ),
                              decoration: BoxDecoration(
                                color: categoryColor.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                notification.categoryName,
                                style: TextStyle(
                                  fontFamily: 'Cairo',
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: categoryColor,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // Message
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.grey[50],
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.grey[200]!),
                    ),
                    child: Text(
                      notification.message,
                      style: const TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 14,
                        height: 1.6,
                        color: Color(0xFF4B5563),
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                // Time and status
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(
                    children: [
                      Icon(
                        Icons.access_time_rounded,
                        size: 16,
                        color: Colors.grey[400],
                      ),
                      const SizedBox(width: 6),
                      Text(
                        notification.timeAgo,
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 13,
                          color: Colors.grey[500],
                        ),
                      ),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color:
                              notification.isRead
                                  ? Colors.grey[100]
                                  : const Color(0xFF10B981).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              notification.isRead
                                  ? Icons.done_all_rounded
                                  : Icons.markunread_rounded,
                              size: 14,
                              color:
                                  notification.isRead
                                      ? Colors.grey[500]
                                      : const Color(0xFF10B981),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              notification.isRead ? 'مقروء' : 'جديد',
                              style: TextStyle(
                                fontFamily: 'Cairo',
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color:
                                    notification.isRead
                                        ? Colors.grey[500]
                                        : const Color(0xFF10B981),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Action button
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(context),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: categoryColor,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 0,
                      ),
                      child: const Text(
                        'حسناً',
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
                    ),
                  ),
                ),

                SizedBox(height: MediaQuery.of(context).padding.bottom + 20),
              ],
            ),
          ),
    );
  }

  Future<void> _deleteNotification(AppNotification notification) async {
    final success = await _notificationService.deleteNotification(
      notification.id,
    );
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text(
            'تم حذف الإشعار',
            style: TextStyle(fontFamily: 'Cairo'),
          ),
          backgroundColor: AlNoranColors.success,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
          action: SnackBarAction(
            label: 'تراجع',
            textColor: Colors.white,
            onPressed: () {
              // Refresh to get notification back (if server supports it)
              _refreshNotifications();
            },
          ),
        ),
      );
    }
  }
}

/// كارد الإشعار الفردي - تصميم محسن
class _NotificationCard extends StatelessWidget {
  final AppNotification notification;
  final VoidCallback onTap;
  final VoidCallback onDismiss;

  const _NotificationCard({
    required this.notification,
    required this.onTap,
    required this.onDismiss,
  });

  Color get _priorityColor {
    switch (notification.priority) {
      case 'high':
      case 'urgent':
        return const Color(0xFFDC2626); // Red
      case 'low':
        return Colors.grey;
      default:
        return const Color(0xFF1BA3B6); // Accent blue
    }
  }

  Color get _categoryColor {
    switch (notification.type) {
      case 'shipment_created':
      case 'shipment_status_changed':
      case 'shipment_documents_requested':
      case 'shipment_customs_cleared':
      case 'shipment_delivered':
      case 'shipment_arrived':
      case 'shipment_completed':
        return const Color(0xFF3B82F6); // Blue
      case 'acid_submitted':
      case 'acid_created':
      case 'acid_reviewing':
      case 'acid_issued':
      case 'acid_rejected':
        return const Color(0xFF8B5CF6); // Purple
      case 'ucr_created':
      case 'ucr_reviewing':
      case 'ucr_approved':
      case 'ucr_rejected':
      case 'ucr_issued':
      case 'ucr_certificate_issued':
        return const Color(0xFF10B981); // Green
      case 'document_uploaded':
      case 'document_approved':
      case 'document_rejected':
      case 'documents_verified':
      case 'documents_pending':
        return const Color(0xFFF59E0B); // Amber
      case 'invoice_created':
      case 'invoice_generated':
      case 'invoice_paid':
      case 'invoice_overdue':
      case 'payment_reminder':
      case 'payment_received':
      case 'payment_failed':
        return const Color(0xFF690000); // Primary
      case 'chat_message':
      case 'chat_new_conversation':
        return const Color(0xFF06B6D4); // Cyan
      default:
        return const Color(0xFF6B7280); // Gray
    }
  }

  IconData get _typeIconData {
    switch (notification.type) {
      case 'shipment_created':
      case 'shipment_status_changed':
      case 'shipment_documents_requested':
      case 'shipment_customs_cleared':
      case 'shipment_delivered':
      case 'shipment_arrived':
      case 'shipment_completed':
        return Icons.local_shipping_rounded;
      case 'acid_submitted':
      case 'acid_created':
      case 'acid_reviewing':
      case 'acid_issued':
      case 'acid_rejected':
        return Icons.science_rounded;
      case 'ucr_created':
      case 'ucr_reviewing':
      case 'ucr_approved':
      case 'ucr_rejected':
      case 'ucr_issued':
      case 'ucr_certificate_issued':
        return Icons.description_rounded;
      case 'document_uploaded':
      case 'document_approved':
      case 'document_rejected':
      case 'documents_verified':
      case 'documents_pending':
        return Icons.folder_rounded;
      case 'invoice_created':
      case 'invoice_generated':
      case 'invoice_paid':
      case 'invoice_overdue':
      case 'payment_reminder':
      case 'payment_received':
      case 'payment_failed':
        return Icons.receipt_long_rounded;
      case 'chat_message':
      case 'chat_new_conversation':
        return Icons.chat_bubble_rounded;
      case 'registration':
      case 'account_activated':
        return Icons.person_add_rounded;
      case 'password_changed':
      case 'security_alert':
        return Icons.security_rounded;
      default:
        return Icons.notifications_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dismissible(
      key: Key(notification.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerLeft,
        padding: const EdgeInsets.only(left: 24),
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [Colors.red.shade400, Colors.red.shade600],
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Row(
          children: [
            Icon(Icons.delete_rounded, color: Colors.white, size: 28),
            SizedBox(width: 8),
            Text(
              'حذف',
              style: TextStyle(
                color: Colors.white,
                fontFamily: 'Cairo',
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
      confirmDismiss: (direction) async {
        return await showDialog<bool>(
              context: context,
              builder:
                  (context) => AlertDialog(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    title: const Text(
                      'حذف الإشعار',
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    content: const Text(
                      'هل تريد حذف هذا الإشعار؟',
                      style: TextStyle(fontFamily: 'Cairo'),
                      textAlign: TextAlign.center,
                    ),
                    actionsAlignment: MainAxisAlignment.spaceEvenly,
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(context, false),
                        child: const Text(
                          'إلغاء',
                          style: TextStyle(
                            fontFamily: 'Cairo',
                            color: Colors.grey,
                          ),
                        ),
                      ),
                      ElevatedButton(
                        onPressed: () => Navigator.pop(context, true),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.red,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: const Text(
                          'حذف',
                          style: TextStyle(
                            fontFamily: 'Cairo',
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ),
            ) ??
            false;
      },
      onDismissed: (_) => onDismiss(),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border:
                notification.isRead
                    ? Border.all(color: Colors.grey.shade200, width: 1)
                    : Border.all(
                      color: _categoryColor.withOpacity(0.4),
                      width: 2,
                    ),
            boxShadow: [
              BoxShadow(
                color:
                    notification.isRead
                        ? Colors.black.withOpacity(0.03)
                        : _categoryColor.withOpacity(0.15),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Stack(
              children: [
                // Left color stripe
                Positioned(
                  right: 0,
                  top: 0,
                  bottom: 0,
                  child: Container(
                    width: 5,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          _categoryColor,
                          _categoryColor.withOpacity(0.7),
                        ],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),
                ),

                // Content
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 21, 16),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Icon with gradient background
                      Container(
                        width: 52,
                        height: 52,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              _categoryColor.withOpacity(0.15),
                              _categoryColor.withOpacity(0.08),
                            ],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: _categoryColor.withOpacity(0.2),
                            width: 1,
                          ),
                        ),
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            Icon(
                              _typeIconData,
                              color: _categoryColor,
                              size: 26,
                            ),
                            // Unread badge
                            if (!notification.isRead)
                              Positioned(
                                top: 2,
                                left: 2,
                                child: Container(
                                  width: 10,
                                  height: 10,
                                  decoration: BoxDecoration(
                                    color: _priorityColor,
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                      color: Colors.white,
                                      width: 2,
                                    ),
                                    boxShadow: [
                                      BoxShadow(
                                        color: _priorityColor.withOpacity(0.4),
                                        blurRadius: 4,
                                        spreadRadius: 1,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 14),

                      // Text content
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Title row
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    notification.title,
                                    style: TextStyle(
                                      fontFamily: 'Cairo',
                                      fontWeight:
                                          notification.isRead
                                              ? FontWeight.w500
                                              : FontWeight.bold,
                                      fontSize: 15,
                                      color:
                                          notification.isRead
                                              ? Colors.grey[700]
                                              : const Color(0xFF1F2937),
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                // Priority indicator
                                if (notification.priority == 'high' ||
                                    notification.priority == 'urgent')
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 6,
                                      vertical: 2,
                                    ),
                                    decoration: BoxDecoration(
                                      color: _priorityColor.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(6),
                                      border: Border.all(
                                        color: _priorityColor.withOpacity(0.3),
                                      ),
                                    ),
                                    child: Text(
                                      notification.priority == 'urgent'
                                          ? 'عاجل'
                                          : 'مهم',
                                      style: TextStyle(
                                        fontFamily: 'Cairo',
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        color: _priorityColor,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 6),

                            // Message
                            Text(
                              notification.message,
                              style: TextStyle(
                                fontFamily: 'Cairo',
                                fontSize: 13,
                                color: Colors.grey[600],
                                height: 1.4,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 10),

                            // Footer row
                            Row(
                              children: [
                                // Time
                                Icon(
                                  Icons.access_time_rounded,
                                  size: 13,
                                  color: Colors.grey[400],
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  notification.timeAgo,
                                  style: TextStyle(
                                    fontFamily: 'Cairo',
                                    fontSize: 11,
                                    color: Colors.grey[400],
                                  ),
                                ),
                                const SizedBox(width: 12),

                                // Category badge
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 3,
                                  ),
                                  decoration: BoxDecoration(
                                    color: _categoryColor.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    notification.categoryName,
                                    style: TextStyle(
                                      fontFamily: 'Cairo',
                                      fontSize: 10,
                                      fontWeight: FontWeight.w600,
                                      color: _categoryColor,
                                    ),
                                  ),
                                ),

                                const Spacer(),

                                // Arrow indicator
                                Container(
                                  padding: const EdgeInsets.all(4),
                                  decoration: BoxDecoration(
                                    color: Colors.grey[100],
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Icon(
                                    Icons.arrow_forward_ios_rounded,
                                    size: 12,
                                    color: Colors.grey[400],
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
              ],
            ),
          ),
        ),
      ),
    );
  }
}
