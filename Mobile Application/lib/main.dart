import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'features/splash/splash_page.dart'; // حسب الـ structure بتاعك
import 'features/auth/login_page.dart'; // استبدلها بـ LoginPage()
// import 'features/home/home_page.dart';

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
  const NoranSmartApp({Key? key}) : super(key: key);

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
      routes: {
        '/login': (context) => const LoginPage(), // استبدلها بـ LoginPage()
        '/home': (context) => Container(), // استبدلها بـ HomePage()
      },

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
