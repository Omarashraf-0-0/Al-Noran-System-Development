import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:alnoran_mobile_application/features/home/homePage.dart';

/// =====================================================
/// 📚 HomePage Widget Tests
/// Main home page with tracking, statistics, services, shipments
/// ⚠️ Skipped - requires Firebase initialization
/// =====================================================

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  Widget createWidgetUnderTest() {
    return const MaterialApp(
      home: HomePage(userName: 'أحمد محمد', userEmail: 'ahmed@test.com'),
    );
  }

  group(
    'HomePage Widget Tests',
    skip: 'Requires Firebase initialization - covered in integration tests',
    () {
      testWidgets('should have Scaffold', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        expect(find.byType(Scaffold), findsOneWidget);
      });
    },
  );
}
