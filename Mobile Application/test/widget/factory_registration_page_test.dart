import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:alnoran_mobile_application/features/auth/factoryRegistration.dart';

/// =====================================================
/// 📚 FactoryRegistrationPage Widget Tests
/// 6 document uploads (all required)
/// =====================================================

void main() {
  Widget createWidgetUnderTest() {
    return MaterialApp(
      home: FactoryRegistrationPage(
        userData: {
          'name': 'مصنع النوران للصناعات',
          'username': 'alnoran_factory',
          'email': 'factory@alnoran.com',
          'phone': '01012345678',
          'password': 'password123',
        },
      ),
    );
  }

  group('FactoryRegistrationPage Widget Tests', () {
    // ==================== UI Rendering ====================
    group('UI Rendering', () {
      testWidgets('should render app bar title', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.text('التسجيل - حساب مصنع'), findsOneWidget);
      });

      testWidgets('should render main title', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.text('إكمال بيانات حساب المصنع'), findsOneWidget);
      });

      testWidgets('should render factory icon', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.byIcon(Icons.factory), findsOneWidget);
      });

      testWidgets('should render submit button', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.text('إتمام التسجيل'), findsOneWidget);
      });
    });

    // ==================== Required Documents ====================
    group('Required Documents', () {
      testWidgets('should render required documents section', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.text('المستندات المطلوبة'), findsOneWidget);
      });

      testWidgets('should render contract upload', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.text('العقد *'), findsOneWidget);
      });

      testWidgets('should render tax card upload', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.text('البطاقة الضريبية *'), findsOneWidget);
      });

      testWidgets('should render commercial register upload', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.text('السجل التجاري *'), findsOneWidget);
      });

      testWidgets('should render VAT certificate upload', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.text('شهادة القيمة المضافة *'), findsOneWidget);
      });

      testWidgets('should render production requirements upload', (
        tester,
      ) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.text('مستلزمات الإنتاج *'), findsOneWidget);
      });

      testWidgets('should render industrial register upload', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.text('السجل الصناعي *'), findsOneWidget);
      });
    });

    // ==================== Upload Icons ====================
    group('Upload Icons', () {
      testWidgets('should render upload icons for all documents', (
        tester,
      ) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.byIcon(Icons.upload_file), findsNWidgets(6));
      });
    });

    // ==================== Scaffold Structure ====================
    group('Scaffold Structure', () {
      testWidgets('should have AppBar', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.byType(AppBar), findsOneWidget);
      });

      testWidgets('should have back button', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.byIcon(Icons.arrow_forward), findsOneWidget);
      });

      testWidgets('should have info icon', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.byIcon(Icons.info_outline), findsOneWidget);
      });
    });
  });
}
