# دليل إعداد إشعارات Firebase Cloud Messaging (FCM)

## المتطلبات

### 1. إنشاء مشروع Firebase

1. اذهب إلى [Firebase Console](https://console.firebase.google.com/)
2. انقر على "Add project" أو "Create a project"
3. أدخل اسم المشروع: `Al-Noran-App`
4. اتبع الخطوات حتى إنشاء المشروع

### 2. إضافة تطبيق Android

1. في Firebase Console، انقر على أيقونة Android
2. أدخل package name: `com.alnoran.mobile`
3. قم بتحميل ملف `google-services.json`
4. ضع الملف في: `Mobile Application/android/app/google-services.json`

### 3. إضافة تطبيق iOS

1. في Firebase Console، انقر على أيقونة iOS
2. أدخل Bundle ID: `com.alnoran.mobile`
3. قم بتحميل ملف `GoogleService-Info.plist`
4. ضع الملف في: `Mobile Application/ios/Runner/GoogleService-Info.plist`

---

## تفعيل الـ Dependencies

في ملف `pubspec.yaml`، قم بإلغاء التعليق عن:

```yaml
dependencies:
  # ...
  firebase_core: ^3.8.1
  firebase_messaging: ^15.2.0
  flutter_local_notifications: ^18.0.1
```

ثم نفذ:

```bash
flutter pub get
```

---

## إعداد Android

### 1. تعديل `android/build.gradle.kts`

```kotlin
buildscript {
    dependencies {
        classpath("com.google.gms:google-services:4.4.2")
    }
}
```

### 2. تعديل `android/app/build.gradle.kts`

```kotlin
plugins {
    id("com.google.gms.google-services")
}

android {
    defaultConfig {
        minSdk = 21  // يجب أن يكون 21 أو أعلى
    }
}
```

### 3. إضافة الصلاحيات في `android/app/src/main/AndroidManifest.xml`

```xml
<manifest>
    <!-- إشعارات -->
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
    
    <application>
        <!-- Firebase Messaging Service -->
        <service
            android:name=".MyFirebaseMessagingService"
            android:exported="false">
            <intent-filter>
                <action android:name="com.google.firebase.MESSAGING_EVENT"/>
            </intent-filter>
        </service>
        
        <!-- قناة الإشعارات الافتراضية -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_channel_id"
            android:value="alnoran_channel" />
    </application>
</manifest>
```

---

## إعداد iOS

### 1. تفعيل Push Notifications في Xcode

1. افتح `ios/Runner.xcworkspace` في Xcode
2. اذهب إلى Target > Signing & Capabilities
3. انقر على "+ Capability"
4. أضف "Push Notifications"
5. أضف "Background Modes" واختر "Remote notifications"

### 2. تعديل `ios/Runner/AppDelegate.swift`

```swift
import UIKit
import Flutter
import FirebaseCore
import FirebaseMessaging

@main
@objc class AppDelegate: FlutterAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    FirebaseApp.configure()
    
    UNUserNotificationCenter.current().delegate = self
    
    let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
    UNUserNotificationCenter.current().requestAuthorization(
      options: authOptions,
      completionHandler: { _, _ in }
    )
    
    application.registerForRemoteNotifications()
    
    GeneratedPluginRegistrant.register(with: self)
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
```

---

## كود Flutter للـ FCM

### 1. إنشاء ملف `lib/core/services/fcm_service.dart`

```dart
import 'dart:convert';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import '../network/api_service.dart';

// معالج الرسائل في الخلفية (يجب أن يكون top-level function)
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print('🔔 [FCM Background] Message: ${message.messageId}');
}

class FCMService {
  static final FCMService _instance = FCMService._internal();
  factory FCMService() => _instance;
  FCMService._internal();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  bool _isInitialized = false;

  /// تهيئة الخدمة
  Future<void> initialize() async {
    if (_isInitialized) return;

    // تهيئة Firebase
    await Firebase.initializeApp();

    // إعداد معالج الخلفية
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // طلب صلاحيات الإشعارات
    await _requestPermissions();

    // إعداد قناة الإشعارات المحلية
    await _setupLocalNotifications();

    // الاستماع للرسائل
    _setupMessageListeners();

    // الحصول على الـ token وإرساله للسيرفر
    await _getAndSaveFCMToken();

    // الاستماع لتحديثات الـ token
    _messaging.onTokenRefresh.listen(_onTokenRefresh);

    _isInitialized = true;
    print('🔔 [FCMService] Initialized successfully');
  }

  /// طلب صلاحيات الإشعارات
  Future<void> _requestPermissions() async {
    final settings = await _messaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );

    print('🔔 [FCM] Permission status: ${settings.authorizationStatus}');
  }

  /// إعداد الإشعارات المحلية
  Future<void> _setupLocalNotifications() async {
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
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
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    // إنشاء قناة للإشعارات (Android)
    const channel = AndroidNotificationChannel(
      'alnoran_channel',
      'إشعارات النوران',
      description: 'إشعارات تطبيق النوران للشحن',
      importance: Importance.high,
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);
  }

  /// الاستماع للرسائل
  void _setupMessageListeners() {
    // رسائل Foreground
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // عند النقر على الإشعار
    FirebaseMessaging.onMessageOpenedApp.listen(_handleMessageOpenedApp);
  }

  /// معالجة رسائل Foreground
  void _handleForegroundMessage(RemoteMessage message) {
    print('🔔 [FCM Foreground] Title: ${message.notification?.title}');
    print('🔔 [FCM Foreground] Body: ${message.notification?.body}');
    print('🔔 [FCM Foreground] Data: ${message.data}');

    // عرض إشعار محلي
    _showLocalNotification(message);
  }

  /// عرض إشعار محلي
  Future<void> _showLocalNotification(RemoteMessage message) async {
    final notification = message.notification;
    if (notification == null) return;

    const androidDetails = AndroidNotificationDetails(
      'alnoran_channel',
      'إشعارات النوران',
      channelDescription: 'إشعارات تطبيق النوران للشحن',
      importance: Importance.high,
      priority: Priority.high,
      showWhen: true,
      icon: '@mipmap/ic_launcher',
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(
      message.hashCode,
      notification.title,
      notification.body,
      details,
      payload: jsonEncode(message.data),
    );
  }

  /// عند النقر على الإشعار
  void _handleMessageOpenedApp(RemoteMessage message) {
    print('🔔 [FCM] Notification tapped: ${message.data}');
    _navigateToNotification(message.data);
  }

  /// عند النقر على الإشعار المحلي
  void _onNotificationTapped(NotificationResponse response) {
    if (response.payload != null) {
      final data = jsonDecode(response.payload!) as Map<String, dynamic>;
      _navigateToNotification(data);
    }
  }

  /// التنقل حسب نوع الإشعار
  void _navigateToNotification(Map<String, dynamic> data) {
    // TODO: استخدم go_router للتنقل حسب البيانات
    // مثال:
    // final type = data['type'];
    // if (type == 'shipment') context.push('/shipment/${data['shipmentId']}');
    print('🔔 [FCM] Navigate to: $data');
  }

  /// الحصول على FCM Token وإرساله للسيرفر
  Future<void> _getAndSaveFCMToken() async {
    try {
      final token = await _messaging.getToken();
      if (token != null) {
        print('🔔 [FCM] Token: ${token.substring(0, 20)}...');
        await ApiService.updateFCMToken(token);
      }
    } catch (e) {
      print('❌ [FCM] Error getting token: $e');
    }
  }

  /// عند تحديث الـ Token
  void _onTokenRefresh(String token) async {
    print('🔔 [FCM] Token refreshed');
    await ApiService.updateFCMToken(token);
  }

  /// الاشتراك في موضوع معين
  Future<void> subscribeToTopic(String topic) async {
    await _messaging.subscribeToTopic(topic);
    print('🔔 [FCM] Subscribed to topic: $topic');
  }

  /// إلغاء الاشتراك من موضوع
  Future<void> unsubscribeFromTopic(String topic) async {
    await _messaging.unsubscribeFromTopic(topic);
    print('🔔 [FCM] Unsubscribed from topic: $topic');
  }
}
```

### 2. تهيئة FCM في `main.dart`

```dart
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'core/services/fcm_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // تهيئة Firebase
  await Firebase.initializeApp();
  
  // تهيئة FCM
  await FCMService().initialize();
  
  runApp(const MyApp());
}
```

---

## إعداد Backend للـ FCM

### 1. تثبيت firebase-admin

```bash
cd Web/backend
npm install firebase-admin
```

### 2. تحميل Service Account Key

1. في Firebase Console > Project Settings > Service accounts
2. انقر على "Generate new private key"
3. احفظ الملف كـ `firebase-service-account.json` في `Web/backend/`

### 3. إضافة إلى `.gitignore`

```
firebase-service-account.json
```

### 4. تحديث `notificationService.js`

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

// تهيئة Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// إرسال إشعار push
const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  try {
    const message = {
      token: fcmToken,
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'alnoran_channel',
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log('✅ Push notification sent:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('❌ Error sending push notification:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { sendPushNotification };
```

---

## ملاحظات مهمة

1. **الاختبار**: استخدم Firebase Cloud Messaging Console لإرسال إشعارات اختبارية

2. **المحاكي**: FCM لا يعمل على iOS Simulator، استخدم جهاز حقيقي

3. **الأمان**: لا ترفع ملفات `google-services.json` و `firebase-service-account.json` إلى Git

4. **التوثيق**: راجع [Firebase Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)

---

## حالة التنفيذ الحالية

- ✅ نظام الإشعارات في Backend (MongoDB + Email)
- ✅ API للإشعارات
- ✅ صفحة الإشعارات في Flutter
- ✅ إعدادات الإشعارات
- ✅ Badge للإشعارات في TopBar
- ⏳ FCM (جاهز للتفعيل - يحتاج Firebase Project)
