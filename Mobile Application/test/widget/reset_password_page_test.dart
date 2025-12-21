import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:alnoran_mobile_application/features/auth/reset_password_page.dart';

/// =====================================================
/// 📚 ResetPasswordPage Widget Tests
/// Password reset form with password/confirm fields
/// =====================================================

void main() {
  Widget createWidgetUnderTest() {
    return const MaterialApp(
      home: ResetPasswordPage(email: 'test@example.com'),
    );
  }

  group('ResetPasswordPage Widget Tests', () {
    // ==================== UI Rendering ====================
    group('UI Rendering', () {
      testWidgets('should render title', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.text('إنشاء كلمة مرور جديدة'), findsOneWidget);
      });

      testWidgets('should render subtitle', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.text('أدخل كلمة المرور الجديدة لحسابك'), findsOneWidget);
      });

      testWidgets('should render lock open icon', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.byIcon(Icons.lock_open), findsOneWidget);
      });

      testWidgets('should render submit button', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.text('تغيير كلمة المرور'), findsOneWidget);
      });
    });

    // ==================== Password Fields ====================
    group('Password Fields', () {
      testWidgets('should render password hint', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.text('كلمة المرور الجديدة'), findsOneWidget);
      });

      testWidgets('should render confirm password hint', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.text('تأكيد كلمة المرور'), findsOneWidget);
      });

      testWidgets('should have 2 text fields', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.byType(TextField), findsNWidgets(2));
      });

      testWidgets('should render lock icons', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.byIcon(Icons.lock_outline), findsNWidgets(2));
      });

      testWidgets('should render visibility toggle icons', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.byIcon(Icons.visibility_off_outlined), findsNWidgets(2));
      });
    });

    // ==================== Requirements Box ====================
    group('Requirements Box', () {
      testWidgets('should render requirements title', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.text('متطلبات كلمة المرور:'), findsOneWidget);
      });

      testWidgets('should render minimum length requirement', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.text('6 أحرف على الأقل'), findsOneWidget);
      });

      testWidgets('should render info icon', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.byIcon(Icons.info_outline), findsOneWidget);
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

      testWidgets('should have ElevatedButton', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());
        expect(find.byType(ElevatedButton), findsOneWidget);
      });
    });
  });
}
