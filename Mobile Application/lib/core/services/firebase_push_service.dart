import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:ui' show Color;
import 'package:flutter/foundation.dart';
import 'package:permission_handler/permission_handler.dart';

// Conditional imports for Firebase
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import '../network/api_service.dart';
import 'notification_service.dart';

/// Background message handler (must be top-level function)
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp();
    print('🔔 [FCM Background] Message: ${message.messageId}');

    // Handle background notification
    await FirebasePushService._handleBackgroundMessage(message);
  } catch (e) {
    print('❌ [FCM Background] Error: $e');
  }
}

/// Firebase Cloud Messaging Service for Push Notifications
class FirebasePushService {
  // Singleton instance
  static final FirebasePushService _instance = FirebasePushService._internal();
  factory FirebasePushService() => _instance;
  FirebasePushService._internal();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();
  final NotificationService _notificationService = NotificationService();

  // Stream controller for notification taps
  final _onNotificationTap = StreamController<Map<String, dynamic>>.broadcast();
  Stream<Map<String, dynamic>> get onNotificationTap =>
      _onNotificationTap.stream;

  // FCM Token
  String? _fcmToken;
  String? get fcmToken => _fcmToken;

  bool _isInitialized = false;
  bool get isInitialized => _isInitialized;

  // Android notification channel
  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'alnoran_notifications',
    'Al Noran إشعارات',
    description: 'إشعارات تطبيق النوران للشحن',
    importance: Importance.high,
    playSound: true,
    enableVibration: true,
    showBadge: true,
  );

  /// Initialize Firebase Push Notifications
  Future<void> initialize() async {
    if (_isInitialized) {
      print('🔔 [FCM] Already initialized');
      return;
    }

    try {
      print('🔔 [FCM] Initializing Firebase Push Service...');

      // Firebase should already be initialized in main.dart
      // Just ensure it's ready
      if (Firebase.apps.isEmpty) {
        print('🔔 [FCM] Firebase not initialized, initializing now...');
        await Firebase.initializeApp();
      }

      // Set background message handler
      FirebaseMessaging.onBackgroundMessage(
        _firebaseMessagingBackgroundHandler,
      );

      // Request permission
      await _requestPermission();

      // Setup local notifications
      await _setupLocalNotifications();

      // Get FCM token
      await _getToken();

      // Listen to token refresh
      _messaging.onTokenRefresh.listen(_onTokenRefresh);

      // Listen to foreground messages
      FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

      // Listen to notification taps (when app is in background)
      FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

      // Check for initial message (when app was terminated)
      final initialMessage = await _messaging.getInitialMessage();
      if (initialMessage != null) {
        _handleNotificationTap(initialMessage);
      }

      _isInitialized = true;
      print('🔔 [FCM] Initialization complete');
    } catch (e) {
      print('❌ [FCM] Error initializing: $e');
    }
  }

  /// Request notification permission
  Future<void> _requestPermission() async {
    // For Android 13+ (API 33+), request POST_NOTIFICATIONS permission
    if (Platform.isAndroid) {
      final status = await Permission.notification.status;
      print('🔔 [FCM] Android notification permission status: $status');

      if (!status.isGranted) {
        final result = await Permission.notification.request();
        print('🔔 [FCM] Android notification permission result: $result');

        if (result.isDenied || result.isPermanentlyDenied) {
          print('⚠️ [FCM] User denied notification permission on Android');
        }
      }
    }

    // Request Firebase messaging permission (for iOS and as fallback)
    final settings = await _messaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );

    print(
      '🔔 [FCM] Firebase permission status: ${settings.authorizationStatus}',
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      print('🔔 [FCM] User granted permission');
    } else if (settings.authorizationStatus ==
        AuthorizationStatus.provisional) {
      print('🔔 [FCM] User granted provisional permission');
    } else {
      print('⚠️ [FCM] User declined or has not accepted permission');
    }
  }

  /// Setup local notifications for foreground messages
  Future<void> _setupLocalNotifications() async {
    // Android initialization
    const androidSettings = AndroidInitializationSettings(
      '@mipmap/ic_launcher',
    );

    // iOS initialization
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onLocalNotificationTap,
      onDidReceiveBackgroundNotificationResponse: _onBackgroundNotificationTap,
    );

    // Create notification channel for Android
    if (Platform.isAndroid) {
      await _localNotifications
          .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin
          >()
          ?.createNotificationChannel(_channel);
    }

    print('🔔 [FCM] Local notifications setup complete');
  }

  /// Get FCM token
  Future<void> _getToken() async {
    try {
      _fcmToken = await _messaging.getToken();
      print('🔔 [FCM] Token: $_fcmToken');

      if (_fcmToken != null) {
        await _sendTokenToServer(_fcmToken!);
      }
    } catch (e) {
      print('❌ [FCM] Error getting token: $e');
    }
  }

  /// Handle token refresh
  void _onTokenRefresh(String token) {
    print('🔔 [FCM] Token refreshed: $token');
    _fcmToken = token;
    _sendTokenToServer(token);
  }

  /// Send FCM token to backend
  Future<void> _sendTokenToServer(String token) async {
    try {
      final response = await ApiService.updateFcmToken(token);
      if (response['success'] == true) {
        print('🔔 [FCM] Token sent to server successfully');
      } else {
        print('⚠️ [FCM] Failed to send token: ${response['message']}');
      }
    } catch (e) {
      print('❌ [FCM] Error sending token to server: $e');
    }
  }

  /// Handle foreground messages - show local notification
  void _handleForegroundMessage(RemoteMessage message) {
    print(
      '🔔 [FCM Foreground] Message received: ${message.notification?.title}',
    );

    final notification = message.notification;
    final data = message.data;

    // Show local notification
    if (notification != null) {
      _showLocalNotification(
        id: message.hashCode,
        title: notification.title ?? 'إشعار جديد',
        body: notification.body ?? '',
        payload: jsonEncode(data),
        priority: data['priority'] ?? 'medium',
      );
    }

    // Refresh notification list
    _notificationService.refresh();
  }

  /// Show local notification
  Future<void> _showLocalNotification({
    required int id,
    required String title,
    required String body,
    String? payload,
    String priority = 'medium',
  }) async {
    // Set importance based on priority
    Importance importance;
    Priority androidPriority;

    switch (priority) {
      case 'high':
      case 'urgent':
        importance = Importance.high;
        androidPriority = Priority.high;
        break;
      case 'low':
        importance = Importance.low;
        androidPriority = Priority.low;
        break;
      default:
        importance = Importance.defaultImportance;
        androidPriority = Priority.defaultPriority;
    }

    final androidDetails = AndroidNotificationDetails(
      _channel.id,
      _channel.name,
      channelDescription: _channel.description,
      importance: importance,
      priority: androidPriority,
      showWhen: true,
      icon: '@mipmap/ic_launcher',
      color: const Color(0xFF690000),
      styleInformation: BigTextStyleInformation(body),
    );

    final iosDetails = const DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    final details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(id, title, body, details, payload: payload);
  }

  /// Handle notification tap from FCM
  void _handleNotificationTap(RemoteMessage message) {
    print('🔔 [FCM] Notification tapped: ${message.notification?.title}');

    final data = message.data;
    _onNotificationTap.add(data);
  }

  /// Handle local notification tap
  static void _onLocalNotificationTap(NotificationResponse response) {
    print('🔔 [Local] Notification tapped: ${response.payload}');

    if (response.payload != null) {
      try {
        final data = jsonDecode(response.payload!) as Map<String, dynamic>;
        FirebasePushService()._onNotificationTap.add(data);
      } catch (e) {
        print('❌ [Local] Error parsing payload: $e');
      }
    }
  }

  /// Handle background notification tap
  @pragma('vm:entry-point')
  static void _onBackgroundNotificationTap(NotificationResponse response) {
    print('🔔 [Background] Notification tapped: ${response.payload}');
  }

  /// Handle background message (static)
  static Future<void> _handleBackgroundMessage(RemoteMessage message) async {
    print('🔔 [FCM Background] Processing: ${message.notification?.title}');
    // The notification will be shown automatically by FCM
    // We just need to handle any data processing here
  }

  /// Subscribe to topic
  Future<void> subscribeToTopic(String topic) async {
    try {
      await _messaging.subscribeToTopic(topic);
      print('🔔 [FCM] Subscribed to topic: $topic');
    } catch (e) {
      print('❌ [FCM] Error subscribing to topic: $e');
    }
  }

  /// Unsubscribe from topic
  Future<void> unsubscribeFromTopic(String topic) async {
    try {
      await _messaging.unsubscribeFromTopic(topic);
      print('🔔 [FCM] Unsubscribed from topic: $topic');
    } catch (e) {
      print('❌ [FCM] Error unsubscribing from topic: $e');
    }
  }

  /// Get notification settings
  Future<NotificationSettings> getSettings() async {
    return await _messaging.getNotificationSettings();
  }

  /// Delete FCM token (on logout)
  Future<void> deleteToken() async {
    try {
      await _messaging.deleteToken();
      _fcmToken = null;
      print('🔔 [FCM] Token deleted');
    } catch (e) {
      print('❌ [FCM] Error deleting token: $e');
    }
  }

  /// Dispose
  void dispose() {
    _onNotificationTap.close();
  }
}
