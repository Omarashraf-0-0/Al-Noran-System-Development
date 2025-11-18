import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'features/splash/splash_page.dart';
import 'features/auth/login_page.dart';
import 'features/home/homePage.dart';
import 'features/home/myShipments.dart';
import 'features/Shipments/ShipmentsDetailsPage.dart';
import 'features/Shipments/ChatPage.dart';
import 'features/Shipments/ACIDReqPage.dart';
import 'features/profile/profile_page.dart';
import 'features/profile/profile_settings_page.dart';
import 'features/profile/settings_menu_page.dart';

void main() {
  // قفل الـ Orientation على Portrait فقط (اختياري)
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // جعل الـ Status Bar شفافة وجميلة
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
    ),
  );

  runApp(const NoranSmartApp());
}

class NoranSmartApp extends StatelessWidget {
  const NoranSmartApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'نوران سمارت',
      debugShowCheckedModeBanner: false,

      // Theme
      theme: ThemeData(
        primaryColor: const Color(0xFF690000),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF690000),
          secondary: const Color(0xFF1ba3b6),
        ),

        // الخط العربي - سيتم تفعيل Cairo بعد تحميله
        // fontFamily: 'Cairo',
        // RTL Support
        visualDensity: VisualDensity.adaptivePlatformDensity,
      ),

      // الصفحة الأولى: Splash Screen
      home: const SplashScreen(),

      // Routes (اختياري - للتنقل السهل)
      onGenerateRoute: (settings) {
        // قراءة بيانات المستخدم من arguments إذا وجدت
        final args = settings.arguments as Map<String, dynamic>?;

        switch (settings.name) {
          case '/login':
            return MaterialPageRoute(builder: (_) => const LoginPage());

          case '/home':
            return MaterialPageRoute(
              builder:
                  (_) => HomePage(
                    userName: args?['userName'] ?? 'مستخدم',
                    userEmail: args?['userEmail'] ?? 'user@alnoran.com',
                  ),
            );

          case '/my-shipments':
          case '/shipments':
            return MaterialPageRoute(
              builder:
                  (_) => MyShipmentsPage(
                    userName: args?['userName'] ?? 'مستخدم',
                    userEmail: args?['userEmail'] ?? 'user@alnoran.com',
                  ),
            );

          case '/shipment-details':
            return MaterialPageRoute(
              builder:
                  (_) => ShipmentDetailsPage(
                    shipmentId: args?['shipmentId'] ?? '',
                  ),
            );

          case '/chat':
            return MaterialPageRoute(
              builder:
                  (_) => CustomerSupportChatPage(
                    shipmentId: args?['shipmentId'] ?? '',
                    employeeName: args?['employeeName'],
                  ),
            );

          case '/acid-request':
            return MaterialPageRoute(
              builder:
                  (_) => AcidRequestPage(
                    userName: args?['userName'],
                    userEmail: args?['userEmail'],
                  ),
            );

          case '/profile':
            return MaterialPageRoute(builder: (_) => const ProfilePage());

          case '/profile-settings':
            return MaterialPageRoute(
              builder: (_) => const ProfileSettingsPage(),
            );

          case '/settings':
            return MaterialPageRoute(builder: (_) => const SettingsMenuPage());

          default:
            return null;
        }
      },
      routes: {'/login': (context) => const LoginPage()},

      // دعم اللغة العربية واتجاه RTL
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('ar', 'EG'), // العربية - مصر
        Locale('ar', ''), // العربية - عام
      ],
      locale: const Locale('ar', 'EG'),
    );
  }
}
