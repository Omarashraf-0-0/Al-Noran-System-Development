import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:alnoran_mobile_application/features/auth/OtpVerificationPage.dart';

/// =====================================================
/// 📚 OtpVerificationPage Widget Tests
/// OTP input with 5 boxes, timer, verify/resend buttons
/// =====================================================

void main() {
  Widget createWidgetUnderTest() {
    return const MaterialApp(
      home: OtpVerificationPage(email: 'test@example.com'),
    );
  }

  group('OtpVerificationPage Widget Tests', () {
    // ==================== UI Rendering ====================
    group('UI Rendering', () {
      testWidgets('should render title', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.text('رمز التحقق ( OTP )'), findsOneWidget);
      });

      testWidgets('should render description', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.text('أدخل رمز التحقق المرسل على جوالك'), findsOneWidget);
      });

      testWidgets('should render verify button', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.text('تأكيد الكود'), findsOneWidget);
      });

      testWidgets('should render back button', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.text('الرجوع'), findsOneWidget);
        expect(find.byIcon(Icons.arrow_forward), findsOneWidget);
      });
    });

    // ==================== OTP Boxes ====================
    group('OTP Boxes', () {
      testWidgets('should render 5 text fields for OTP', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.byType(TextField), findsNWidgets(5));
      });
    });

    // ==================== Timer Info ====================
    group('Timer Info', () {
      testWidgets('should render timer text', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.textContaining('إعادة إرسال الكود بعد'), findsOneWidget);
      });

      testWidgets('should render attempts info', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.textContaining('المحاولات المتبقية'), findsOneWidget);
      });
    });

    // ==================== Scaffold Structure ====================
    group('Scaffold Structure', () {
      testWidgets('should have Scaffold', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.byType(Scaffold), findsOneWidget);
      });

      testWidgets('should have SafeArea', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.byType(SafeArea), findsOneWidget);
      });

      testWidgets('should have ElevatedButton', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.byType(ElevatedButton), findsOneWidget);
      });
    });
  });
}
