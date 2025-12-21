import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import 'config/app_router.dart';
import 'theme/theme.dart';
import 'core/providers/theme_provider.dart';

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

  // Initialize Theme Provider
  final themeProvider = ThemeProvider();
  await themeProvider.loadTheme();

  runApp(
    ChangeNotifierProvider.value(
      value: themeProvider,
      child: const AlNoranApp(),
    ),
  );
}

class AlNoranApp extends StatelessWidget {
  const AlNoranApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        // Update system UI based on theme
        SystemChrome.setSystemUIOverlayStyle(
          SystemUiOverlayStyle(
            statusBarColor: Colors.transparent,
            statusBarIconBrightness:
                themeProvider.isDarkMode ? Brightness.light : Brightness.light,
            systemNavigationBarColor:
                themeProvider.isDarkMode
                    ? const Color(0xFF1E1E1E)
                    : Colors.white,
            systemNavigationBarIconBrightness:
                themeProvider.isDarkMode ? Brightness.light : Brightness.dark,
          ),
        );

        return MaterialApp.router(
          title: 'Al Noran',
          debugShowCheckedModeBanner: false,

          // Router Configuration
          routerConfig: AppRouter.router,

          // Theme - استخدام نظام الثيم الموحد
          theme: AppTheme.lightTheme,
          darkTheme: AppTheme.darkTheme,
          themeMode: themeProvider.materialThemeMode,

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
      },
    );
  }
}
