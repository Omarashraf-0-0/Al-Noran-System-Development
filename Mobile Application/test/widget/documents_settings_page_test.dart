import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:alnoran_mobile_application/features/profile/documents_settings_page.dart';

/// =====================================================
/// 📚 DocumentsSettingsPage Widget Tests
/// Documents management with stats and upload status
/// ⚠️ Some tests skipped - uses API calls
/// =====================================================

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  Widget createWidgetUnderTest() {
    return const MaterialApp(home: DocumentsSettingsPage());
  }

  group('DocumentsSettingsPage Widget Tests', () {
    // ==================== Scaffold Structure ====================
    group('Scaffold Structure', () {
      testWidgets('should have Scaffold', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        expect(find.byType(Scaffold), findsOneWidget);
      });

      testWidgets('should have SliverAppBar', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        expect(find.byType(SliverAppBar), findsOneWidget);
      });

      testWidgets('should have CustomScrollView', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        expect(find.byType(CustomScrollView), findsOneWidget);
      });
    });

    // ==================== Header ====================
    group('Header', () {
      testWidgets('should render title', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        expect(find.text('المستندات المرفوعة'), findsOneWidget);
      });
    });

    // ==================== Loading (skip - API dependent) ====================
    group('Loading', skip: 'API dependent', () {
      testWidgets('should show loading text', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        expect(find.text('جاري تحميل المستندات...'), findsOneWidget);
      });
    });
  });
}
