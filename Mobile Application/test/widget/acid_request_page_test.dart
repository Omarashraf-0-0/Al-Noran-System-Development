import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:alnoran_mobile_application/features/Shipments/ACIDReqPage.dart';

/// =====================================================
/// 📚 AcidRequestPage Widget Tests
/// ACID request form with file upload and type toggle
/// =====================================================

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  Widget createWidgetUnderTest() {
    return const MaterialApp(
      home: AcidRequestPage(userName: 'أحمد محمد', userEmail: 'ahmed@test.com'),
    );
  }

  group('AcidRequestPage Widget Tests', () {
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
        expect(find.text('طلب رقم ACID'), findsOneWidget);
      });

      testWidgets('should render subtitle', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        expect(find.text('املأ البيانات المطلوبة بدقة'), findsOneWidget);
      });

      testWidgets('should render receipt icon', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        expect(find.byIcon(Icons.receipt_long), findsWidgets);
      });
    });

    // ==================== Type Toggle ====================
    group('Type Toggle', () {
      testWidgets('should render sea type button', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        expect(find.text('بحري'), findsOneWidget);
      });

      testWidgets('should render air type button', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        expect(find.text('جوي'), findsOneWidget);
      });

      testWidgets('should render boat icon', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        expect(find.byIcon(Icons.directions_boat), findsWidgets);
      });

      testWidgets('should render flight icon', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        expect(find.byIcon(Icons.flight), findsWidgets);
      });
    });

    // ==================== Invoice Upload ====================
    group('Invoice Upload', () {
      testWidgets('should render invoice title', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        expect(find.text('فاتورة مبدأية'), findsOneWidget);
      });

      testWidgets('should render receipt icon', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        expect(find.byIcon(Icons.receipt), findsWidgets);
      });
    });
  });
}
