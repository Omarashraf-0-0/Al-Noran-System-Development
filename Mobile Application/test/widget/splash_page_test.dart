import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:alnoran_mobile_application/features/splash/splash_page.dart';

/// =====================================================
/// 📚 SplashScreen Widget Tests
/// ⚠️ SKIPPED: Splash has animations that require pumpAndSettle - integration test
/// =====================================================

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({'auth_token': 'test_token_123'});
  });

  group(
    'SplashScreen Widget Tests',
    skip: 'Splash uses animations and timers - covered in integration tests',
    () {
      testWidgets('should have Scaffold', (tester) async {
        await tester.pumpWidget(const MaterialApp(home: SplashScreen()));
        await tester.pump();
        expect(find.byType(Scaffold), findsOneWidget);
      });
    },
  );
}
