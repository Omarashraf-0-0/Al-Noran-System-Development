import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:firebase_core/firebase_core.dart';
import 'config/app_router.dart';
import 'theme/theme.dart';

void main() async {
  // قفل الـ Orientation على Portrait فقط (اختياري)
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase FIRST before anything else
  try {
    await Firebase.initializeApp();
    print('✅ [Main] Firebase initialized successfully');
  } catch (e) {
    print('❌ [Main] Firebase initialization error: $e');
  }

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

      // Theme - استخدام نظام الثيم الموحد
      theme: AppTheme.lightTheme,

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
