import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:alnoran_mobile_application/features/auth/personalRegistration.dart';

/// =====================================================
/// 📚 شرح الـ PersonalRegistrationPage Widget Tests:
/// =====================================================
///
/// صفحة إكمال التسجيل للحساب الشخصي
///
/// UI Elements:
/// - National ID field
/// - ID card upload section
/// - Power of attorney upload section
/// - Submit button
/// - Info box
/// =====================================================

void main() {
  /// Helper function to wrap widgets with MaterialApp for testing
  Widget createWidgetUnderTest() {
    return MaterialApp(
      home: PersonalRegistrationPage(
        userData: {
          'name': 'أحمد محمد',
          'username': 'ahmed_test',
          'email': 'ahmed@test.com',
          'phone': '01012345678',
          'password': 'password123',
        },
      ),
    );
  }

  group('PersonalRegistrationPage Widget Tests', () {
    // ==================== UI Rendering ====================
    group('UI Rendering', () {
      testWidgets('should render app bar with title', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        expect(find.text('التسجيل - حساب شخصي'), findsOneWidget);
      });

      testWidgets('should render main title', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        expect(find.text('إكمال بيانات الحساب الشخصي'), findsOneWidget);
      });

      testWidgets('should render subtitle', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        expect(
          find.text('يرجى إدخال رقمك القومي وإرفاق التوكيل'),
          findsOneWidget,
        );
      });

      testWidgets('should render national ID field', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        expect(find.text('الرقم القومي (14 رقم)'), findsOneWidget);
      });

      testWidgets('should render submit button', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        expect(find.text('إتمام التسجيل'), findsOneWidget);
      });

      testWidgets('should render person icon', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        expect(find.byIcon(Icons.person_outline), findsOneWidget);
      });

      testWidgets('should render credit card icon for ID', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        expect(find.byIcon(Icons.credit_card), findsOneWidget);
      });
    });

    // ==================== Document Upload Sections ====================
    group('Document Upload Sections', () {
      testWidgets('should render ID card upload section', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        expect(find.text('صورة البطاقة الشخصية'), findsOneWidget);
      });

      testWidgets('should render ID card upload subtitle', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        expect(find.text('صورة واضحة للبطاقة من الوجهين'), findsOneWidget);
      });

      testWidgets('should render power of attorney upload section', (
        tester,
      ) async {
        await tester.pumpWidget(createWidgetUnderTest());

        expect(find.text('التوكيل'), findsOneWidget);
      });

      testWidgets('should render power of attorney subtitle', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        expect(find.text('صورة أو ملف PDF للتوكيل'), findsOneWidget);
      });

      testWidgets('should render upload icons', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        expect(find.byIcon(Icons.upload_file), findsNWidgets(2));
      });
    });

    // ==================== Info Box ====================
    group('Info Box', () {
      testWidgets('should render info box', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        expect(find.byIcon(Icons.info_outline), findsOneWidget);
      });

      testWidgets('should render info text', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        expect(
          find.text('سيتم مراجعة المستندات المرفوعة وتفعيل حسابك خلال 24 ساعة'),
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

      testWidgets('should have SingleChildScrollView', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        expect(find.byType(SingleChildScrollView), findsOneWidget);
      });

      testWidgets('should have ElevatedButton', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        expect(find.byType(ElevatedButton), findsOneWidget);
      });

      testWidgets('should have back button in AppBar', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        expect(find.byIcon(Icons.arrow_forward), findsOneWidget);
      });
    });

    // ==================== Text Field ====================
    group('Text Field', () {
      testWidgets('should have text field for national ID', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        expect(find.byType(TextField), findsOneWidget);
      });

      testWidgets('should allow typing in national ID field', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        final textField = find.byType(TextField);
        await tester.enterText(textField, '29901231234567');
        await tester.pump();

        expect(find.text('29901231234567'), findsOneWidget);
      });
    });
  });
}
