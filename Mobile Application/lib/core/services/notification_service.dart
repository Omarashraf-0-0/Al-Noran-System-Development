import 'dart:async';
import '../network/api_service.dart';

/// Notification Model
class AppNotification {
  final String id;
  final String type;
  final String title;
  final String message;
  final String? icon;
  final String priority;
  final bool isRead;
  final bool isArchived;
  final Map<String, dynamic>? data;
  final DateTime createdAt;

  AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    this.icon,
    required this.priority,
    required this.isRead,
    required this.isArchived,
    this.data,
    required this.createdAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['_id'] ?? json['id'] ?? '',
      type: json['type'] ?? 'general',
      title: json['title'] ?? '',
      message: json['message'] ?? '',
      icon: json['icon'],
      priority: json['priority'] ?? 'medium',
      isRead: json['isRead'] ?? false,
      isArchived: json['isArchived'] ?? false,
      data: json['data'],
      createdAt:
          json['createdAt'] != null
              ? DateTime.parse(json['createdAt'])
              : DateTime.now(),
    );
  }

  /// Get icon data based on notification type
  String get typeIcon {
    switch (type) {
      case 'registration_welcome':
      case 'account_activated':
        return '👤';
      case 'document_uploaded':
      case 'document_approved':
      case 'document_rejected':
      case 'documents_verified':
      case 'documents_pending':
        return '📄';
      case 'acid_submitted':
      case 'acid_reviewing':
      case 'acid_issued':
      case 'acid_rejected':
        return '🧪';
      case 'shipment_created':
      case 'shipment_status_changed':
      case 'shipment_documents_requested':
      case 'shipment_customs_cleared':
      case 'shipment_delivered':
        return '📦';
      case 'ucr_created':
      case 'ucr_reviewing':
      case 'ucr_approved':
      case 'ucr_rejected':
      case 'ucr_issued':
      case 'ucr_certificate_issued':
        return '📋';
      case 'invoice_generated':
      case 'invoice_paid':
      case 'invoice_overdue':
      case 'payment_reminder':
      case 'payment_received':
        return '💰';
      case 'chat_message':
      case 'chat_new_conversation':
        return '💬';
      case 'general':
      case 'system_maintenance':
      case 'promotional':
        return '🔔';
      default:
        return '📌';
    }
  }

  /// Get category name in Arabic
  String get categoryName {
    switch (type) {
      case 'registration_welcome':
      case 'account_activated':
        return 'الحساب';
      case 'document_uploaded':
      case 'document_approved':
      case 'document_rejected':
      case 'documents_verified':
      case 'documents_pending':
        return 'المستندات';
      case 'acid_submitted':
      case 'acid_reviewing':
      case 'acid_issued':
      case 'acid_rejected':
        return 'طلبات ACID';
      case 'shipment_created':
      case 'shipment_status_changed':
      case 'shipment_documents_requested':
      case 'shipment_customs_cleared':
      case 'shipment_delivered':
        return 'الشحنات';
      case 'ucr_created':
      case 'ucr_reviewing':
      case 'ucr_approved':
      case 'ucr_rejected':
      case 'ucr_issued':
      case 'ucr_certificate_issued':
        return 'طلبات UCR/التصدير';
      case 'invoice_generated':
      case 'invoice_paid':
      case 'invoice_overdue':
      case 'payment_reminder':
      case 'payment_received':
        return 'المالية';
      case 'chat_message':
      case 'chat_new_conversation':
        return 'الرسائل';
      default:
        return 'عام';
    }
  }

  /// Get time ago text in Arabic
  String get timeAgo {
    final now = DateTime.now();
    final difference = now.difference(createdAt);

    if (difference.inSeconds < 60) {
      return 'الآن';
    } else if (difference.inMinutes < 60) {
      final minutes = difference.inMinutes;
      return 'منذ $minutes ${minutes == 1 ? 'دقيقة' : 'دقائق'}';
    } else if (difference.inHours < 24) {
      final hours = difference.inHours;
      return 'منذ $hours ${hours == 1 ? 'ساعة' : 'ساعات'}';
    } else if (difference.inDays < 7) {
      final days = difference.inDays;
      return 'منذ $days ${days == 1 ? 'يوم' : 'أيام'}';
    } else if (difference.inDays < 30) {
      final weeks = (difference.inDays / 7).floor();
      return 'منذ $weeks ${weeks == 1 ? 'أسبوع' : 'أسابيع'}';
    } else {
      final months = (difference.inDays / 30).floor();
      return 'منذ $months ${months == 1 ? 'شهر' : 'أشهر'}';
    }
  }

  AppNotification copyWith({bool? isRead}) {
    return AppNotification(
      id: id,
      type: type,
      title: title,
      message: message,
      icon: icon,
      priority: priority,
      isRead: isRead ?? this.isRead,
      isArchived: isArchived,
      data: data,
      createdAt: createdAt,
    );
  }
}

/// Singleton service for managing notifications
class NotificationService {
  // Singleton instance
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  // Cached notifications
  List<AppNotification> _notifications = [];
  int _unreadCount = 0;
  bool _isLoading = false;
  bool _isInitialized = false;

  // Pagination
  int _currentPage = 1;
  bool _hasMore = true;
  static const int _pageSize = 20;

  // Stream controllers for reactive updates
  final _notificationsController =
      StreamController<List<AppNotification>>.broadcast();
  final _unreadCountController = StreamController<int>.broadcast();
  final _loadingController = StreamController<bool>.broadcast();

  // Streams
  Stream<List<AppNotification>> get notificationsStream =>
      _notificationsController.stream;
  Stream<int> get unreadCountStream => _unreadCountController.stream;
  Stream<bool> get loadingStream => _loadingController.stream;

  // Getters
  List<AppNotification> get notifications => List.unmodifiable(_notifications);
  int get unreadCount => _unreadCount;
  bool get isLoading => _isLoading;
  bool get isInitialized => _isInitialized;
  bool get hasMore => _hasMore;

  /// Initialize the notification service
  Future<void> initialize({bool forceRefresh = false}) async {
    if (_isInitialized && !forceRefresh) {
      print('🔔 [NotificationService] Already initialized, skipping...');
      return;
    }

    if (_isLoading) {
      print('🔔 [NotificationService] Already loading, skipping...');
      return;
    }

    _setLoading(true);
    print('🔔 [NotificationService] Initializing...');

    try {
      // Reset pagination
      _currentPage = 1;
      _hasMore = true;
      _notifications = [];

      // Fetch initial notifications
      await _fetchNotifications();

      // Fetch unread count
      await fetchUnreadCount();

      _isInitialized = true;
      _notifyListeners();
    } catch (e) {
      print('❌ [NotificationService] Error initializing: $e');
    } finally {
      _setLoading(false);
    }
  }

  /// Fetch notifications from API
  Future<void> _fetchNotifications({bool loadMore = false}) async {
    try {
      final response = await ApiService.getNotifications(
        page: loadMore ? _currentPage + 1 : 1,
        limit: _pageSize,
      );

      if (response['success'] == true) {
        final List<dynamic> notificationsJson = response['notifications'] ?? [];
        final newNotifications =
            notificationsJson
                .map((json) => AppNotification.fromJson(json))
                .toList();

        if (loadMore) {
          _notifications.addAll(newNotifications);
          _currentPage++;
        } else {
          _notifications = newNotifications;
          _currentPage = 1;
        }

        // Check if there are more
        final pagination = response['pagination'];
        if (pagination != null) {
          _hasMore = pagination['hasMore'] ?? false;
        } else {
          _hasMore = newNotifications.length >= _pageSize;
        }

        print(
          '🔔 [NotificationService] Loaded ${newNotifications.length} notifications. Total: ${_notifications.length}',
        );
      }
    } catch (e) {
      print('❌ [NotificationService] Error fetching notifications: $e');
    }
  }

  /// Load more notifications (pagination)
  Future<void> loadMore() async {
    if (_isLoading || !_hasMore) return;

    _setLoading(true);
    try {
      await _fetchNotifications(loadMore: true);
      _notifyListeners();
    } finally {
      _setLoading(false);
    }
  }

  /// Refresh notifications
  Future<void> refresh() async {
    await initialize(forceRefresh: true);
  }

  /// Fetch unread count
  Future<int> fetchUnreadCount() async {
    try {
      final response = await ApiService.getUnreadNotificationsCount();
      if (response['success'] == true) {
        _unreadCount = response['count'] ?? 0;
        _unreadCountController.add(_unreadCount);
        print('🔔 [NotificationService] Unread count: $_unreadCount');
      }
      return _unreadCount;
    } catch (e) {
      print('❌ [NotificationService] Error fetching unread count: $e');
      return _unreadCount;
    }
  }

  /// Mark notification as read
  Future<bool> markAsRead(String notificationId) async {
    try {
      final response = await ApiService.markNotificationAsRead(notificationId);
      if (response['success'] == true) {
        // Update local state
        final index = _notifications.indexWhere((n) => n.id == notificationId);
        if (index != -1 && !_notifications[index].isRead) {
          _notifications[index] = _notifications[index].copyWith(isRead: true);
          _unreadCount = (_unreadCount > 0) ? _unreadCount - 1 : 0;
          _notifyListeners();
        }
        return true;
      }
      return false;
    } catch (e) {
      print('❌ [NotificationService] Error marking as read: $e');
      return false;
    }
  }

  /// Mark all notifications as read
  Future<bool> markAllAsRead() async {
    try {
      final response = await ApiService.markAllNotificationsAsRead();
      if (response['success'] == true) {
        // Update local state
        _notifications =
            _notifications.map((n) => n.copyWith(isRead: true)).toList();
        _unreadCount = 0;
        _notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      print('❌ [NotificationService] Error marking all as read: $e');
      return false;
    }
  }

  /// Delete a notification
  Future<bool> deleteNotification(String notificationId) async {
    try {
      final response = await ApiService.deleteNotification(notificationId);
      if (response['success'] == true) {
        // Update local state
        final notification = _notifications.firstWhere(
          (n) => n.id == notificationId,
          orElse: () => throw Exception('Notification not found'),
        );
        if (!notification.isRead) {
          _unreadCount = (_unreadCount > 0) ? _unreadCount - 1 : 0;
        }
        _notifications.removeWhere((n) => n.id == notificationId);
        _notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      print('❌ [NotificationService] Error deleting notification: $e');
      return false;
    }
  }

  /// Clear all read notifications
  Future<bool> clearReadNotifications() async {
    try {
      final response = await ApiService.clearReadNotifications();
      if (response['success'] == true) {
        // Update local state
        _notifications = _notifications.where((n) => !n.isRead).toList();
        _notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      print('❌ [NotificationService] Error clearing read notifications: $e');
      return false;
    }
  }

  /// Get unread notifications
  List<AppNotification> get unreadNotifications =>
      _notifications.where((n) => !n.isRead).toList();

  /// Get notifications by type
  List<AppNotification> getNotificationsByType(String type) =>
      _notifications.where((n) => n.type == type).toList();

  /// Get notifications by category
  List<AppNotification> getNotificationsByCategory(String category) {
    final categoryTypes = <String, List<String>>{
      'account': [
        'registration',
        'registration_welcome',
        'account_activated',
        'password_changed',
        'security_alert',
        'otp_sent',
      ],
      'documents': [
        'document_uploaded',
        'document_approved',
        'document_rejected',
        'document_requested',
        'document_expiring',
        'documents_verified',
        'documents_pending',
      ],
      'acid': [
        'acid_created',
        'acid_submitted',
        'acid_reviewing',
        'acid_issued',
        'acid_rejected',
        'acid_documents_requested',
      ],
      'shipments': [
        'shipment_created',
        'shipment_status_changed',
        'shipment_arrived',
        'shipment_completed',
        'shipment_documents_requested',
        'shipment_customs_cleared',
        'shipment_delivered',
      ],
      'ucr': [
        'ucr_created',
        'ucr_reviewing',
        'ucr_approved',
        'ucr_rejected',
        'ucr_issued',
        'ucr_certificate_issued',
        'ucr_documents_requested',
      ],
      'finance': [
        'invoice_created',
        'invoice_generated',
        'invoice_paid',
        'invoice_overdue',
        'payment_reminder',
        'payment_received',
        'payment_failed',
      ],
      'chat': ['chat_message', 'chat_new_conversation'],
      'general': ['general', 'system_update'],
    };

    final types = categoryTypes[category] ?? [];
    return _notifications.where((n) => types.contains(n.type)).toList();
  }

  /// Helper to set loading state
  void _setLoading(bool value) {
    _isLoading = value;
    _loadingController.add(value);
  }

  /// Notify all listeners
  void _notifyListeners() {
    _notificationsController.add(_notifications);
    _unreadCountController.add(_unreadCount);
  }

  /// Reset service (on logout)
  void reset() {
    _notifications = [];
    _unreadCount = 0;
    _isInitialized = false;
    _currentPage = 1;
    _hasMore = true;
    _notifyListeners();
    print('🔔 [NotificationService] Reset complete');
  }

  /// Dispose streams
  void dispose() {
    _notificationsController.close();
    _unreadCountController.close();
    _loadingController.close();
  }
}
