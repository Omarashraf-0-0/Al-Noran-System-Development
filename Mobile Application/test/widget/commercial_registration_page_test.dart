import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:alnoran_mobile_application/features/auth/commercialRegistration.dart';

/// =====================================================
/// 📚 شرح الـ CommercialRegistrationPage Widget Tests:
/// =====================================================
///
/// صفحة إكمال التسجيل للحساب التجاري
/// 6 document uploads (5 required, 1 optional)
/// =====================================================

void main() {
  Widget createWidgetUnderTest() {
    return MaterialApp(
      home: CommercialRegistrationPage(
        userData: {
          'name': 'شركة النوران للتجارة',
          'username': 'alnoran_trade',
          'email': 'info@alnoran.com',
          'phone': '01012345678',
          'password': 'password123',
        },
      ),
    );
  }

  group('CommercialRegistrationPage Widget Tests', () {
    // ==================== UI Rendering ====================
    group('UI Rendering', () {
      testWidgets('should render app bar title', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.text('التسجيل - حساب تجاري'), findsOneWidget);
      });

      testWidgets('should render main title', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.text('إكمال بيانات الحساب التجاري'), findsOneWidget);
      });

      testWidgets('should render subtitle', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.text('يرجى إرفاق المستندات المطلوبة'), findsOneWidget);
      });

      testWidgets('should render business icon', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.byIcon(Icons.business), findsOneWidget);
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

      testWidgets('should render import certificate upload', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.text('الشهادة الاستيرادية *'), findsOneWidget);
      });
    });

    // ==================== Optional Documents ====================
    group('Optional Documents', () {
      testWidgets('should render optional documents section', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.text('مستندات اختيارية'), findsOneWidget);
      });

      testWidgets('should render export card upload', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.text('بطاقة التصدير (اختياري)'), findsOneWidget);
      });
    });

    // ==================== Upload Icons ====================
    group('Upload Icons', () {
      testWidgets('should render upload icons for all documents', (
        tester,
      ) async {
        await tester.pumpWidget(createWidgetUnderTest());
        // 6 document upload sections
        expect(find.byIcon(Icons.upload_file), findsNWidgets(6));
      });
    });

    // ==================== Info Box ====================
    group('Info Box', () {
      testWidgets('should render info icon', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.byIcon(Icons.info_outline), findsOneWidget);
      });

      testWidgets('should render info text', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(
          find.text(
            'سيتم مراجعة المستندات المرفوعة وتفعيل حسابك خلال 24-48 ساعة',
          ),
          findsOneWidget,
        );
      });
    });

    // ==================== Scaffold Structure ====================
    group('Scaffold Structure', () {
      testWidgets('should have Scaffold', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.byType(Scaffold), findsOneWidget);
      });

      testWidgets('should have AppBar', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.byType(AppBar), findsOneWidget);
      });

      testWidgets('should have back button', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.byIcon(Icons.arrow_forward), findsOneWidget);
      });
    });
  });
}
