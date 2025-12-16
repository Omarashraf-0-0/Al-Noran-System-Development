import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../features/splash/splash_page.dart';
import '../features/auth/login_page.dart';
import '../features/auth/register_page.dart';
import '../features/auth/ForgotPasswordPage.dart';
import '../features/auth/OtpVerificationPage.dart';
import '../features/auth/reset_password_page.dart';
import '../features/home/homePage.dart';
import '../features/home/myShipments.dart';
import '../features/home/myExports.dart';
import '../features/Shipments/ShipmentsDetailsPage.dart';
import '../features/Shipments/ChatPage.dart';
import '../features/Shipments/ACIDReqPage.dart';
import '../features/Shipments/UCRReqPage.dart';
import '../features/profile/profile_page.dart';
import '../features/profile/profile_settings_page.dart';
import '../features/profile/settings_menu_page.dart';
import '../features/profile/documents_settings_page.dart';
import '../features/notifications/notifications_page.dart';
import '../features/notifications/notification_settings_page.dart';

class AppRouter {
  static final GoRouter router = GoRouter(
    initialLocation: '/',
    debugLogDiagnostics: true,
    routes: [
      // Splash Screen
      GoRoute(
        path: '/',
        name: 'splash',
        builder: (context, state) => const SplashScreen(),
      ),

      // Login
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) => const LoginPage(),
      ),

      // Register
      GoRoute(
        path: '/register',
        name: 'register',
        builder: (context, state) => const RegisterPage(),
      ),

      // Forgot Password
      GoRoute(
        path: '/forgot-password',
        name: 'forgot-password',
        builder: (context, state) => const ForgotPasswordPage(),
      ),

      // OTP Verification
      GoRoute(
        path: '/otp-verification',
        name: 'otp-verification',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          return OtpVerificationPage(email: extra?['email'] ?? '');
        },
      ),

      // Reset Password
      GoRoute(
        path: '/reset-password',
        name: 'reset-password',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          return ResetPasswordPage(email: extra?['email'] ?? '');
        },
      ),

      // Home
      GoRoute(
        path: '/home',
        name: 'home',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          return HomePage(
            userName: extra?['userName'] ?? 'مستخدم',
            userEmail: extra?['userEmail'] ?? 'user@alnoran.com',
          );
        },
      ),

      // My Shipments (Imports)
      GoRoute(
        path: '/shipments',
        name: 'shipments',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          return MyShipmentsPage(
            userName: extra?['userName'] ?? 'مستخدم',
            userEmail: extra?['userEmail'] ?? 'user@alnoran.com',
          );
        },
      ),

      // My Exports
      GoRoute(
        path: '/exports',
        name: 'exports',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          return MyExportsPage(
            userName: extra?['userName'] ?? 'مستخدم',
            userEmail: extra?['userEmail'] ?? 'user@alnoran.com',
          );
        },
      ),

      // Shipment Details
      GoRoute(
        path: '/shipment-details/:shipmentId',
        name: 'shipment-details',
        builder: (context, state) {
          final shipmentId = state.pathParameters['shipmentId'] ?? '';
          return ShipmentDetailsPage(shipmentId: shipmentId);
        },
      ),

      // Chat
      GoRoute(
        path: '/chat/:shipmentId',
        name: 'chat',
        builder: (context, state) {
          final shipmentId = state.pathParameters['shipmentId'] ?? '';
          final extra = state.extra as Map<String, dynamic>?;
          return CustomerSupportChatPage(
            shipmentId: shipmentId,
            employeeName: extra?['employeeName'],
          );
        },
      ),

      // ACID Request
      GoRoute(
        path: '/acid-request',
        name: 'acid-request',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          return AcidRequestPage(
            userName: extra?['userName'],
            userEmail: extra?['userEmail'],
          );
        },
      ),

      // UCR Request (Export)
      GoRoute(
        path: '/ucr-request',
        name: 'ucr-request',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          return UcrRequestPage(
            userName: extra?['userName'],
            userEmail: extra?['userEmail'],
          );
        },
      ),

      // Profile
      GoRoute(
        path: '/profile',
        name: 'profile',
        builder: (context, state) => const ProfilePage(),
      ),

      // Profile Settings
      GoRoute(
        path: '/profile-settings',
        name: 'profile-settings',
        builder: (context, state) => const ProfileSettingsPage(),
      ),

      // Settings Menu
      GoRoute(
        path: '/settings',
        name: 'settings',
        builder: (context, state) => const SettingsMenuPage(),
      ),

      // Documents Settings
      GoRoute(
        path: '/documents',
        name: 'documents',
        builder: (context, state) => const DocumentsSettingsPage(),
      ),

      // Notifications
      GoRoute(
        path: '/notifications',
        name: 'notifications',
        builder: (context, state) => const NotificationsPage(),
      ),

      // Notification Settings
      GoRoute(
        path: '/notification-settings',
        name: 'notification-settings',
        builder: (context, state) => const NotificationSettingsPage(),
      ),
    ],

    // Error Page
    errorBuilder:
        (context, state) => Scaffold(
          body: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 64, color: Colors.red),
                const SizedBox(height: 16),
                Text(
                  'الصفحة غير موجودة',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Cairo',
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  state.error.toString(),
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontFamily: 'Cairo'),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () => context.go('/'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF690000),
                  ),
                  child: const Text(
                    'العودة للرئيسية',
                    style: TextStyle(fontFamily: 'Cairo'),
                  ),
                ),
              ],
            ),
          ),
        ),
  );
}
