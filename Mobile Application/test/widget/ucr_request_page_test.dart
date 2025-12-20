import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:alnoran_mobile_application/features/Shipments/UCRReqPage.dart';

/// =====================================================
/// 📚 UcrRequestPage Widget Tests
/// UCR request multi-step form with certification selection
/// =====================================================

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  Widget createWidgetUnderTest() {
    return const MaterialApp(
      home: UcrRequestPage(userName: 'أحمد محمد', userEmail: 'ahmed@test.com'),
    );
  }

  group('UcrRequestPage Widget Tests', () {
    // ==================== Scaffold Structure ====================
    group('Scaffold Structure', () {
      testWidgets('should have Scaffold', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        expect(find.byType(Scaffold), findsOneWidget);
      });

      testWidgets('should have SingleChildScrollView', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        expect(find.byType(SingleChildScrollView), findsWidgets);
      });
    });

    // ==================== Header ====================
    group('Header', () {
      testWidgets('should render title', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        expect(find.text('طلب رقم UCR'), findsOneWidget);
      });

      testWidgets('should render subtitle', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        expect(find.text('اختر نوع الشهادة للتصدير'), findsOneWidget);
      });
    });

    // ==================== Certification Type Selection ====================
    group('Certification Type', () {
      testWidgets('should render certification type label', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        expect(find.text('نوع الشهادة'), findsOneWidget);
      });

      testWidgets('should render noran option title', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        expect(find.text('على بطاقة الشركة'), findsOneWidget);
      });

      testWidgets('should render client option title', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        expect(find.text('على بطاقتي الخاصة'), findsOneWidget);
      });

      testWidgets('should render continue button', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        expect(find.text('متابعة'), findsOneWidget);
      });
    });

    // ==================== Icons (using findsWidgets for flexibility) ====================
    group('Icons', () {
      testWidgets('should render business icon', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        expect(find.byIcon(Icons.business), findsWidgets);
      });

      testWidgets('should render person icon', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        expect(find.byIcon(Icons.person), findsWidgets);
      });
    });
  });
}
