import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:alnoran_mobile_application/features/auth/ForgotPasswordPage.dart';

/// =====================================================
/// 📚 ForgotPasswordPage Widget Tests
/// Simple page with email field and submit button
/// =====================================================

void main() {
  Widget createWidgetUnderTest() {
    return const MaterialApp(home: ForgotPasswordPage());
  }

  group('ForgotPasswordPage Widget Tests', () {
    // ==================== UI Rendering ====================
    group('UI Rendering', () {
      testWidgets('should render title', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.text('نسيت كلمة المرور'), findsOneWidget);
      });

      testWidgets('should render description', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(
          find.text('يرجى إدخال البريد الإلكتروني المسجل لدينا'),
          findsOneWidget,
        );
      });

      testWidgets('should render lock reset icon', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.byIcon(Icons.lock_reset), findsOneWidget);
      });

      testWidgets('should render submit button', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.text('إرسال الكود'), findsOneWidget);
      });

      testWidgets('should render back to login link', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.text('العودة لتسجيل الدخول'), findsOneWidget);
      });
    });

    // ==================== Email Field ====================
    group('Email Field', () {
      testWidgets('should render email hint', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.text('البريد الإلكتروني'), findsOneWidget);
      });

      testWidgets('should render email icon', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.byIcon(Icons.email_outlined), findsOneWidget);
      });

      testWidgets('should have TextFormField', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.byType(TextFormField), findsOneWidget);
      });

      testWidgets('should allow typing in email field', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        await tester.enterText(find.byType(TextFormField), 'test@example.com');
        await tester.pump();

        expect(find.text('test@example.com'), findsOneWidget);
      });
    });

    // ==================== Form Validation ====================
    group('Form Validation', () {
      testWidgets('should have Form widget', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.byType(Form), findsOneWidget);
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

      testWidgets('should have TextButton for back', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.byType(TextButton), findsOneWidget);
      });
    });
  });
}
