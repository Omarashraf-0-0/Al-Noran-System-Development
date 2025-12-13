import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'config/app_router.dart';

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
    return MaterialApp.router(
      title: 'نوران سمارت',
      debugShowCheckedModeBanner: false,

      // Router Configuration
      routerConfig: AppRouter.router,

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
