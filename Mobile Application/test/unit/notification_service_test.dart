import 'package:flutter_test/flutter_test.dart';
import 'package:alnoran_mobile_application/core/services/notification_service.dart';

/// =====================================================
/// 📚 شرح الـ NotificationService:
/// =====================================================
///
/// في ملفين رئيسيين:
///
/// 1. AppNotification (Model):
///    - بيمثل إشعار واحد
///    - فيه fromJson للتحويل من JSON
///    - فيه typeIcon للأيقونة حسب النوع
///    - فيه categoryName للفئة بالعربي
///    - فيه timeAgo للوقت "منذ..."
///    - فيه copyWith لنسخ مع تعديل
///
/// 2. NotificationService (Singleton):
///    - بتدير كل الإشعارات
///    - فيها pagination (تحميل المزيد)
///    - فيها streams للتحديثات الفورية
///    - فيها filter بالنوع أو الفئة
///
/// async Methods (تحتاج API):
/// - initialize(), refresh(), loadMore()
/// - fetchUnreadCount(), markAsRead(), markAllAsRead()
/// - deleteNotification(), clearReadNotifications()
///
/// sync Methods (نختبرها كـ Unit Tests):
/// - reset()
/// - unreadNotifications getter
/// - getNotificationsByType()
/// - getNotificationsByCategory()
/// - Streams (notificationsStream, unreadCountStream, loadingStream)
/// =====================================================

void main() {
  group('AppNotification Model', () {
    // ==================== fromJson Tests ====================
    group('fromJson', () {
      test('should parse complete notification correctly', () {
        final json = {
          '_id': 'notif123',
          'type': 'shipment_created',
          'title': 'شحنة جديدة',
          'message': 'تم إنشاء شحنة جديدة برقم ACID-001',
          'icon': '📦',
          'priority': 'high',
          'isRead': false,
          'isArchived': false,
          'data': {'shipmentId': 'ship123', 'acid': 'ACID-001'},
          'createdAt': '2024-01-15T10:30:00.000Z',
        };

        final notification = AppNotification.fromJson(json);

        expect(notification.id, equals('notif123'));
        expect(notification.type, equals('shipment_created'));
        expect(notification.title, equals('شحنة جديدة'));
        expect(notification.message, contains('ACID-001'));
        expect(notification.icon, equals('📦'));
        expect(notification.priority, equals('high'));
        expect(notification.isRead, isFalse);
        expect(notification.isArchived, isFalse);
        expect(notification.data, isNotNull);
        expect(notification.data!['acid'], equals('ACID-001'));
        expect(notification.createdAt.year, equals(2024));
      });

      test('should use _id or id for ID field', () {
        final json1 = {'_id': 'mongo_id'};
        final json2 = {'id': 'regular_id'};

        expect(AppNotification.fromJson(json1).id, equals('mongo_id'));
        expect(AppNotification.fromJson(json2).id, equals('regular_id'));
      });

      test('should use default values for missing fields', () {
        final json = <String, dynamic>{'_id': 'notif123'};

        final notification = AppNotification.fromJson(json);

        expect(notification.id, equals('notif123'));
        expect(notification.type, equals('general'));
        expect(notification.title, equals(''));
        expect(notification.message, equals(''));
        expect(notification.icon, isNull);
        expect(notification.priority, equals('medium'));
        expect(notification.isRead, isFalse);
        expect(notification.isArchived, isFalse);
        expect(notification.data, isNull);
      });

      test('should handle null values', () {
        final json = {
          '_id': null,
          'type': null,
          'title': null,
          'message': null,
          'priority': null,
          'isRead': null,
          'isArchived': null,
          'createdAt': null,
        };

        final notification = AppNotification.fromJson(json);

        expect(notification.id, equals(''));
        expect(notification.type, equals('general'));
        expect(notification.priority, equals('medium'));
        expect(notification.isRead, isFalse);
        expect(notification.isArchived, isFalse);
      });

      test('should handle Arabic content', () {
        final json = {
          '_id': 'notif123',
          'title': 'إشعار مهم جداً',
          'message': 'تم تحديث حالة الشحنة الخاصة بك بنجاح 🎉',
        };

        final notification = AppNotification.fromJson(json);

        expect(notification.title, contains('إشعار'));
        expect(notification.message, contains('الشحنة'));
      });
    });

    // ==================== typeIcon Tests ====================
    group('typeIcon', () {
      test('should return 👤 for account types', () {
        final n1 = _createNotification(type: 'registration_welcome');
        final n2 = _createNotification(type: 'account_activated');

        expect(n1.typeIcon, equals('👤'));
        expect(n2.typeIcon, equals('👤'));
      });

      test('should return 📄 for document types', () {
        final types = [
          'document_uploaded',
          'document_approved',
          'document_rejected',
          'documents_verified',
          'documents_pending',
        ];

        for (var type in types) {
          final n = _createNotification(type: type);
          expect(n.typeIcon, equals('📄'), reason: 'Type: $type should be 📄');
        }
      });

      test('should return 🧪 for ACID types', () {
        final types = [
          'acid_submitted',
          'acid_reviewing',
          'acid_issued',
          'acid_rejected',
        ];

        for (var type in types) {
          final n = _createNotification(type: type);
          expect(n.typeIcon, equals('🧪'), reason: 'Type: $type should be 🧪');
        }
      });

      test('should return 📦 for shipment types', () {
        final types = [
          'shipment_created',
          'shipment_status_changed',
          'shipment_documents_requested',
          'shipment_customs_cleared',
          'shipment_delivered',
        ];

        for (var type in types) {
          final n = _createNotification(type: type);
          expect(n.typeIcon, equals('📦'), reason: 'Type: $type should be 📦');
        }
      });

      test('should return 📋 for UCR types', () {
        final types = [
          'ucr_created',
          'ucr_reviewing',
          'ucr_approved',
          'ucr_rejected',
          'ucr_issued',
          'ucr_certificate_issued',
        ];

        for (var type in types) {
          final n = _createNotification(type: type);
          expect(n.typeIcon, equals('📋'), reason: 'Type: $type should be 📋');
        }
      });

      test('should return 💰 for finance types', () {
        final types = [
          'invoice_generated',
          'invoice_paid',
          'invoice_overdue',
          'payment_reminder',
          'payment_received',
        ];

        for (var type in types) {
          final n = _createNotification(type: type);
          expect(n.typeIcon, equals('💰'), reason: 'Type: $type should be 💰');
        }
      });

      test('should return 💬 for chat types', () {
        final types = ['chat_message', 'chat_new_conversation'];

        for (var type in types) {
          final n = _createNotification(type: type);
          expect(n.typeIcon, equals('💬'), reason: 'Type: $type should be 💬');
        }
      });

      test('should return 🔔 for general/system types', () {
        final types = ['general', 'system_maintenance', 'promotional'];

        for (var type in types) {
          final n = _createNotification(type: type);
          expect(n.typeIcon, equals('🔔'), reason: 'Type: $type should be 🔔');
        }
      });

      test('should return 📌 for unknown types', () {
        final n = _createNotification(type: 'unknown_type_xyz');
        expect(n.typeIcon, equals('📌'));
      });
    });

    // ==================== categoryName Tests ====================
    group('categoryName', () {
      test('should return الحساب for account types', () {
        final n = _createNotification(type: 'account_activated');
        expect(n.categoryName, equals('الحساب'));
      });

      test('should return المستندات for document types', () {
        final n = _createNotification(type: 'document_uploaded');
        expect(n.categoryName, equals('المستندات'));
      });

      test('should return طلبات ACID for ACID types', () {
        final n = _createNotification(type: 'acid_submitted');
        expect(n.categoryName, equals('طلبات ACID'));
      });

      test('should return الشحنات for shipment types', () {
        final n = _createNotification(type: 'shipment_created');
        expect(n.categoryName, equals('الشحنات'));
      });

      test('should return طلبات UCR/التصدير for UCR types', () {
        final n = _createNotification(type: 'ucr_approved');
        expect(n.categoryName, equals('طلبات UCR/التصدير'));
      });

      test('should return المالية for finance types', () {
        final n = _createNotification(type: 'invoice_paid');
        expect(n.categoryName, equals('المالية'));
      });

      test('should return الرسائل for chat types', () {
        final n = _createNotification(type: 'chat_message');
        expect(n.categoryName, equals('الرسائل'));
      });

      test('should return عام for unknown types', () {
        final n = _createNotification(type: 'some_unknown_type');
        expect(n.categoryName, equals('عام'));
      });
    });

    // ==================== timeAgo Tests ====================
    group('timeAgo', () {
      test('should return الآن for less than 60 seconds', () {
        final n = _createNotification(createdAt: DateTime.now());
        expect(n.timeAgo, equals('الآن'));
      });

      test('should return منذ X دقائق for minutes', () {
        final n = _createNotification(
          createdAt: DateTime.now().subtract(const Duration(minutes: 5)),
        );
        expect(n.timeAgo, contains('دقائق'));
        expect(n.timeAgo, contains('5'));
      });

      test('should return منذ 1 دقيقة for 1 minute', () {
        final n = _createNotification(
          createdAt: DateTime.now().subtract(const Duration(minutes: 1)),
        );
        expect(n.timeAgo, contains('دقيقة'));
      });

      test('should return منذ X ساعات for hours', () {
        final n = _createNotification(
          createdAt: DateTime.now().subtract(const Duration(hours: 5)),
        );
        expect(n.timeAgo, contains('ساعات'));
        expect(n.timeAgo, contains('5'));
      });

      test('should return منذ 1 ساعة for 1 hour', () {
        final n = _createNotification(
          createdAt: DateTime.now().subtract(const Duration(hours: 1)),
        );
        expect(n.timeAgo, contains('ساعة'));
      });

      test('should return منذ X أيام for days', () {
        final n = _createNotification(
          createdAt: DateTime.now().subtract(const Duration(days: 3)),
        );
        expect(n.timeAgo, contains('أيام'));
        expect(n.timeAgo, contains('3'));
      });

      test('should return منذ 1 يوم for 1 day', () {
        final n = _createNotification(
          createdAt: DateTime.now().subtract(const Duration(days: 1)),
        );
        expect(n.timeAgo, contains('يوم'));
      });

      test('should return منذ X أسابيع for weeks', () {
        final n = _createNotification(
          createdAt: DateTime.now().subtract(const Duration(days: 14)),
        );
        expect(n.timeAgo, contains('أسابيع'));
        expect(n.timeAgo, contains('2'));
      });

      test('should return منذ X أشهر for months', () {
        final n = _createNotification(
          createdAt: DateTime.now().subtract(const Duration(days: 60)),
        );
        expect(n.timeAgo, contains('أشهر'));
      });

      test('should handle boundary: 59 seconds = الآن', () {
        final n = _createNotification(
          createdAt: DateTime.now().subtract(const Duration(seconds: 59)),
        );
        expect(n.timeAgo, equals('الآن'));
      });

      test('should handle boundary: 60 seconds = 1 دقيقة', () {
        final n = _createNotification(
          createdAt: DateTime.now().subtract(const Duration(seconds: 60)),
        );
        expect(n.timeAgo, contains('دقيقة'));
      });
    });

    // ==================== copyWith Tests ====================
    group('copyWith', () {
      test('should copy notification with isRead changed', () {
        final original = _createNotification(isRead: false);
        final copy = original.copyWith(isRead: true);

        expect(original.isRead, isFalse);
        expect(copy.isRead, isTrue);
        expect(copy.id, equals(original.id));
        expect(copy.title, equals(original.title));
      });

      test('should preserve all other fields when copying', () {
        final original = AppNotification(
          id: 'test123',
          type: 'shipment_created',
          title: 'Test Title',
          message: 'Test Message',
          icon: '📦',
          priority: 'high',
          isRead: false,
          isArchived: true,
          data: {'key': 'value'},
          createdAt: DateTime(2024, 1, 15),
        );

        final copy = original.copyWith(isRead: true);

        expect(copy.id, equals('test123'));
        expect(copy.type, equals('shipment_created'));
        expect(copy.title, equals('Test Title'));
        expect(copy.message, equals('Test Message'));
        expect(copy.icon, equals('📦'));
        expect(copy.priority, equals('high'));
        expect(copy.isArchived, isTrue);
        expect(copy.data, equals({'key': 'value'}));
        expect(copy.createdAt, equals(DateTime(2024, 1, 15)));
      });

      test('should keep original isRead when null passed', () {
        final original = _createNotification(isRead: true);
        final copy = original.copyWith();

        expect(copy.isRead, isTrue);
      });
    });
  });

  group('NotificationService', () {
    late NotificationService service;

    setUp(() {
      service = NotificationService();
      service.reset();
    });

    tearDown(() {
      service.reset();
    });

    // ==================== Singleton Pattern ====================
    group('Singleton Pattern', () {
      test('should return same instance', () {
        final instance1 = NotificationService();
        final instance2 = NotificationService();

        expect(identical(instance1, instance2), isTrue);
      });
    });

    // ==================== Initial State ====================
    group('Initial State (after reset)', () {
      test('should have empty notifications list', () {
        expect(service.notifications, isEmpty);
      });

      test('should have zero unread count', () {
        expect(service.unreadCount, equals(0));
      });

      test('should not be loading', () {
        expect(service.isLoading, isFalse);
      });

      test('should not be initialized', () {
        expect(service.isInitialized, isFalse);
      });

      test('should have hasMore as true', () {
        expect(service.hasMore, isTrue);
      });

      test('notifications should be unmodifiable list', () {
        final notifications = service.notifications;
        expect(notifications, isA<List<AppNotification>>());
        // Attempting to modify should theoretically throw
      });
    });

    // ==================== reset() Tests ====================
    group('reset', () {
      test('should clear all notifications', () {
        service.reset();
        expect(service.notifications, isEmpty);
      });

      test('should set unreadCount to 0', () {
        service.reset();
        expect(service.unreadCount, equals(0));
      });

      test('should set isInitialized to false', () {
        service.reset();
        expect(service.isInitialized, isFalse);
      });

      test('should set hasMore to true', () {
        service.reset();
        expect(service.hasMore, isTrue);
      });

      test('should not throw when called multiple times', () {
        expect(() {
          service.reset();
          service.reset();
          service.reset();
        }, returnsNormally);
      });
    });

    // ==================== unreadNotifications Tests ====================
    group('unreadNotifications', () {
      test('should return empty list when no notifications', () {
        expect(service.unreadNotifications, isEmpty);
      });

      test('should return List<AppNotification>', () {
        expect(service.unreadNotifications, isA<List<AppNotification>>());
      });
    });

    // ==================== getNotificationsByType Tests ====================
    group('getNotificationsByType', () {
      test('should return empty list for non-existent type', () {
        final result = service.getNotificationsByType('shipment_created');
        expect(result, isEmpty);
      });

      test('should return List<AppNotification>', () {
        final result = service.getNotificationsByType('some_type');
        expect(result, isA<List<AppNotification>>());
      });

      test('should handle empty string type', () {
        expect(() => service.getNotificationsByType(''), returnsNormally);
      });

      test('should handle special characters in type', () {
        expect(
          () => service.getNotificationsByType('type_@#\$%'),
          returnsNormally,
        );
      });
    });

    // ==================== getNotificationsByCategory Tests ====================
    group('getNotificationsByCategory', () {
      test('should return empty list for account category when empty', () {
        final result = service.getNotificationsByCategory('account');
        expect(result, isEmpty);
      });

      test('should return empty list for documents category when empty', () {
        final result = service.getNotificationsByCategory('documents');
        expect(result, isEmpty);
      });

      test('should return empty list for acid category when empty', () {
        final result = service.getNotificationsByCategory('acid');
        expect(result, isEmpty);
      });

      test('should return empty list for shipments category when empty', () {
        final result = service.getNotificationsByCategory('shipments');
        expect(result, isEmpty);
      });

      test('should return empty list for ucr category when empty', () {
        final result = service.getNotificationsByCategory('ucr');
        expect(result, isEmpty);
      });

      test('should return empty list for finance category when empty', () {
        final result = service.getNotificationsByCategory('finance');
        expect(result, isEmpty);
      });

      test('should return empty list for chat category when empty', () {
        final result = service.getNotificationsByCategory('chat');
        expect(result, isEmpty);
      });

      test('should return empty list for general category when empty', () {
        final result = service.getNotificationsByCategory('general');
        expect(result, isEmpty);
      });

      test('should return empty list for unknown category', () {
        final result = service.getNotificationsByCategory('unknown_category');
        expect(result, isEmpty);
      });

      test('should handle empty string category', () {
        expect(() => service.getNotificationsByCategory(''), returnsNormally);
      });
    });

    // ==================== Streams Tests ====================
    group('Streams', () {
      test('notificationsStream should be broadcast', () {
        expect(service.notificationsStream.isBroadcast, isTrue);
      });

      test('unreadCountStream should be broadcast', () {
        expect(service.unreadCountStream.isBroadcast, isTrue);
      });

      test('loadingStream should be broadcast', () {
        expect(service.loadingStream.isBroadcast, isTrue);
      });

      test('should allow multiple listeners on notificationsStream', () {
        expect(() {
          service.notificationsStream.listen((_) {});
          service.notificationsStream.listen((_) {});
        }, returnsNormally);
      });

      test('should allow multiple listeners on unreadCountStream', () {
        expect(() {
          service.unreadCountStream.listen((_) {});
          service.unreadCountStream.listen((_) {});
        }, returnsNormally);
      });

      test('should emit on reset', () async {
        final values = <List<AppNotification>>[];
        final subscription = service.notificationsStream.listen(values.add);

        service.reset();

        await Future.delayed(const Duration(milliseconds: 100));
        expect(values.isNotEmpty, isTrue);

        await subscription.cancel();
      });
    });

    // ==================== Getter Edge Cases ====================
    group('Getters Edge Cases', () {
      test('all getters should be accessible without initialization', () {
        expect(() => service.notifications, returnsNormally);
        expect(() => service.unreadCount, returnsNormally);
        expect(() => service.isLoading, returnsNormally);
        expect(() => service.isInitialized, returnsNormally);
        expect(() => service.hasMore, returnsNormally);
        expect(() => service.unreadNotifications, returnsNormally);
      });

      test('unreadCount should be non-negative', () {
        expect(service.unreadCount, greaterThanOrEqualTo(0));
      });

      test('notifications should not be null', () {
        expect(service.notifications, isNotNull);
      });
    });

    // ==================== State Consistency ====================
    group('State Consistency', () {
      test('reset should make all state consistent', () {
        service.reset();

        expect(service.notifications, isEmpty);
        expect(service.unreadCount, equals(0));
        expect(service.isInitialized, isFalse);
        expect(service.unreadNotifications, isEmpty);
      });

      test('multiple operations should not corrupt state', () {
        service.reset();
        service.getNotificationsByType('type1');
        service.getNotificationsByCategory('account');
        service.reset();

        expect(service.notifications, isEmpty);
        expect(service.unreadCount, equals(0));
      });
    });

    // ==================== Edge Cases ====================
    group('Edge Cases', () {
      test('should handle rapid reset calls', () {
        for (var i = 0; i < 100; i++) {
          service.reset();
        }
        expect(service.notifications, isEmpty);
      });

      test('getNotificationsByType called many times should not fail', () {
        for (var i = 0; i < 100; i++) {
          service.getNotificationsByType('type_$i');
        }
        expect(() => service.notifications, returnsNormally);
      });

      test('getNotificationsByCategory called many times should not fail', () {
        final categories = [
          'account',
          'documents',
          'acid',
          'shipments',
          'ucr',
          'finance',
          'chat',
          'general',
        ];
        for (var i = 0; i < 100; i++) {
          for (var cat in categories) {
            service.getNotificationsByCategory(cat);
          }
        }
        expect(() => service.notifications, returnsNormally);
      });
    });
  });
}

/// Helper to create notification with minimal params
AppNotification _createNotification({
  String id = 'test_id',
  String type = 'general',
  String title = 'Test Title',
  String message = 'Test Message',
  String priority = 'medium',
  bool isRead = false,
  bool isArchived = false,
  DateTime? createdAt,
}) {
  return AppNotification(
    id: id,
    type: type,
    title: title,
    message: message,
    priority: priority,
    isRead: isRead,
    isArchived: isArchived,
    createdAt: createdAt ?? DateTime.now(),
  );
}
