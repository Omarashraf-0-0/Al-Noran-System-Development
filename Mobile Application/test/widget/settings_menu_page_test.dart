import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:alnoran_mobile_application/features/profile/settings_menu_page.dart';

/// =====================================================
/// 📚 SettingsMenuPage Widget Tests
/// Settings menu with various options and logout
/// ⚠️ Some tests skipped - uses Firebase
/// =====================================================

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  Widget createWidgetUnderTest() {
    return const MaterialApp(home: SettingsMenuPage());
  }

  group('SettingsMenuPage Widget Tests', () {
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

    // ==================== Header ====================
    group('Header', () {
      testWidgets('should render title', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        expect(find.text('الإعدادات'), findsOneWidget);
      });
    });

    // ==================== Menu Items (skip - needs Firebase) ====================
    group('Menu Items', skip: 'Firebase/API dependent', () {
      testWidgets('should render settings icon', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        expect(find.byIcon(Icons.settings), findsWidgets);
      });
    });
  });
}
