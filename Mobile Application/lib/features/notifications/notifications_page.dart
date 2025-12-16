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
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.withOpacity(0.1),
                  blurRadius: 20,
                  spreadRadius: 5,
                ),
              ],
            ),
            child: Icon(
              _selectedFilter == 'unread'
                  ? Icons.mark_email_read
                  : Icons.notifications_off,
              size: 64,
              color: Colors.grey[400],
            ),
          ),
          const SizedBox(height: 24),
          Text(
            _selectedFilter == 'unread'
                ? 'لا توجد إشعارات غير مقروءة'
                : 'لا توجد إشعارات',
            style: const TextStyle(
              fontFamily: 'Cairo',
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.grey,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _selectedFilter == 'unread'
                ? 'لقد قرأت جميع الإشعارات'
                : 'ستظهر الإشعارات هنا عند وصولها',
            style: TextStyle(
              fontFamily: 'Cairo',
              fontSize: 14,
              color: Colors.grey[500],
            ),
          ),
        ],
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

    switch (notification.type) {
      case 'shipment_created':
      case 'shipment_status_changed':
      case 'shipment_documents_requested':
      case 'shipment_customs_cleared':
      case 'shipment_delivered':
        final shipmentId = notification.data?['shipmentId'];
        if (shipmentId != null) {
          context.push('/shipment/$shipmentId');
        } else {
          context.push('/shipments');
        }
        break;

      case 'acid_submitted':
      case 'acid_reviewing':
      case 'acid_issued':
      case 'acid_rejected':
        final acidRequestId = notification.data?['acidRequestId'];
        if (acidRequestId != null) {
          context.push('/acid-request/$acidRequestId');
        } else {
          context.push('/acid-requests');
        }
        break;

      case 'ucr_created':
      case 'ucr_reviewing':
      case 'ucr_approved':
      case 'ucr_rejected':
      case 'ucr_issued':
      case 'ucr_certificate_issued':
        final ucrRequestId = notification.data?['ucrRequestId'];
        if (ucrRequestId != null) {
          context.push('/ucr-request/$ucrRequestId');
        } else {
          context.push('/ucr-requests');
        }
        break;

      case 'document_uploaded':
      case 'document_approved':
      case 'document_rejected':
      case 'documents_verified':
      case 'documents_pending':
        context.push('/documents');
        break;

      case 'invoice_generated':
      case 'invoice_paid':
      case 'invoice_overdue':
      case 'payment_reminder':
      case 'payment_received':
        final invoiceId = notification.data?['invoiceId'];
        if (invoiceId != null) {
          context.push('/invoice/$invoiceId');
        } else {
          context.push('/invoices');
        }
        break;

      case 'chat_message':
      case 'chat_new_conversation':
        final conversationId = notification.data?['conversationId'];
        if (conversationId != null) {
          context.push('/chat/$conversationId');
        } else {
          context.push('/chat');
        }
        break;

      default:
        // Show notification details dialog
        _showNotificationDetails(notification);
    }
  }

  void _showNotificationDetails(AppNotification notification) {
    showDialog(
      context: context,
      builder:
          (context) => AlertDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            title: Row(
              children: [
                Text(
                  notification.typeIcon,
                  style: const TextStyle(fontSize: 24),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    notification.title,
                    style: const TextStyle(
                      fontFamily: 'Cairo',
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ),
              ],
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  notification.message,
                  style: const TextStyle(fontFamily: 'Cairo'),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Icon(Icons.access_time, size: 14, color: Colors.grey[500]),
                    const SizedBox(width: 4),
                    Text(
                      notification.timeAgo,
                      style: TextStyle(
                        fontFamily: 'Cairo',
                        fontSize: 12,
                        color: Colors.grey[500],
                      ),
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: AlNoranColors.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        notification.categoryName,
                        style: const TextStyle(
                          fontFamily: 'Cairo',
                          fontSize: 10,
                          color: AlNoranColors.primary,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text(
                  'إغلاق',
                  style: TextStyle(fontFamily: 'Cairo'),
                ),
              ),
            ],
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

/// كارد الإشعار الفردي
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
        return AlNoranColors.error;
      case 'low':
        return Colors.grey;
      default:
        return AlNoranColors.primary;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dismissible(
      key: Key(notification.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerLeft,
        padding: const EdgeInsets.only(left: 20),
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: AlNoranColors.error,
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Icon(Icons.delete, color: Colors.white),
      ),
      onDismissed: (_) => onDismiss(),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: notification.isRead ? Colors.white : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border:
                notification.isRead
                    ? null
                    : Border.all(
                      color: _priorityColor.withOpacity(0.3),
                      width: 1,
                    ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Stack(
            children: [
              // Unread indicator
              if (!notification.isRead)
                Positioned(
                  top: 0,
                  right: 0,
                  child: Container(
                    width: 8,
                    height: 8,
                    margin: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: _priorityColor,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),

              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Icon
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: _priorityColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        notification.typeIcon,
                        style: const TextStyle(fontSize: 24),
                      ),
                    ),
                    const SizedBox(width: 12),

                    // Content
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
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
                                    fontSize: 14,
                                    color:
                                        notification.isRead
                                            ? Colors.grey[700]
                                            : Colors.black,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            notification.message,
                            style: TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 13,
                              color: Colors.grey[600],
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Icon(
                                Icons.access_time,
                                size: 12,
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
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: AlNoranColors.greyBg,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  notification.categoryName,
                                  style: TextStyle(
                                    fontFamily: 'Cairo',
                                    fontSize: 10,
                                    color: Colors.grey[600],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    // Arrow
                    Icon(
                      Icons.arrow_forward_ios,
                      size: 14,
                      color: Colors.grey[400],
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
}
