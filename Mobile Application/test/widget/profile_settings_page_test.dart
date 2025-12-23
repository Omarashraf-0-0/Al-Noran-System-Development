import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:alnoran_mobile_application/features/profile/profile_settings_page.dart';

/// =====================================================
/// 📚 ProfileSettingsPage Widget Tests
/// Settings form with personal, company, and password sections
/// ⚠️ Some tests skipped - uses API calls
/// =====================================================

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  Widget createWidgetUnderTest() {
    return const MaterialApp(home: ProfileSettingsPage());
  }

  group('ProfileSettingsPage Widget Tests', () {
    // ==================== Scaffold Structure ====================
    group('Scaffold Structure', () {
      testWidgets('should have Scaffold', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        expect(find.byType(Scaffold), findsOneWidget);
      });

      testWidgets('should have AppBar', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        expect(find.byType(AppBar), findsOneWidget);
      });
    });

    // ==================== AppBar ====================
    group('AppBar', () {
      testWidgets('should render title', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        expect(find.text('إعدادات الملف الشخصي'), findsOneWidget);
      });

      testWidgets('should render back arrow', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        expect(find.byIcon(Icons.arrow_forward_ios), findsOneWidget);
      });
    });

    // ==================== Section Headers (skip - API loads data) ====================
    group('Section Headers', skip: 'API dependent', () {
      testWidgets('should render personal info section', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        expect(find.text('المعلومات الشخصية'), findsOneWidget);
      });
    });
  });
}
