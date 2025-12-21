import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:alnoran_mobile_application/features/notifications/notifications_page.dart';

/// =====================================================
/// 📚 NotificationsPage Widget Tests
/// Notifications list with tabs and filters
/// =====================================================

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  Widget createWidgetUnderTest() {
    return const MaterialApp(home: NotificationsPage());
  }

  group('NotificationsPage Widget Tests', () {
    // ==================== Scaffold Structure ====================
    group('Scaffold Structure', () {
      testWidgets('should have Scaffold', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        expect(find.byType(Scaffold), findsOneWidget);
      });
    });

    // ==================== Title ====================
    group('Header', () {
      testWidgets('should render title', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        expect(find.text('الإشعارات'), findsOneWidget);
      });
    });

    // ==================== TabBar ====================
    group('TabBar', () {
      testWidgets('should have TabBar', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        expect(find.byType(TabBar), findsOneWidget);
      });

      testWidgets('should render all filter tab', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        expect(find.text('الكل'), findsOneWidget);
      });

      testWidgets('should render unread filter tab', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        expect(find.text('غير مقروء'), findsOneWidget);
      });

      testWidgets('should render shipments filter tab', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        expect(find.text('الشحنات'), findsOneWidget);
      });
    });
  });
}
