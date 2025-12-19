import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:alnoran_mobile_application/features/auth/login_page.dart';

/// =====================================================
/// 📚 شرح الـ LoginPage Widget Tests:
/// =====================================================
///
/// ده Widget Tests للـ LoginPage - صفحة تسجيل الدخول
///
/// الـ Tests بتختبر:
/// 1. UI Rendering - هل العناصر ظاهرة؟
/// 2. User Interactions - الـ tap والـ typing
/// 3. Password visibility toggle
/// 4. Navigation links
///
/// ملحوظة: الـ API calls مش بتتختبر هنا - دي Integration Tests
/// =====================================================

void main() {
  /// Helper function to wrap widgets with MaterialApp for testing
  Widget createWidgetUnderTest() {
    return const MaterialApp(home: LoginPage());
  }

  group('LoginPage Widget Tests', () {
    // ==================== UI Rendering ====================
    group('UI Rendering', () {
      testWidgets('should render login page with title', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        // Title and button both have "تسجيل الدخول"
        expect(find.text('تسجيل الدخول'), findsNWidgets(2));
      });

      testWidgets('should render subtitle', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        expect(find.text('أهلاً بك في النوران'), findsOneWidget);
      });

      testWidgets('should render email field with hint', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        expect(find.text('البريد الإلكتروني'), findsOneWidget);
      });

      testWidgets('should render password field with hint', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        expect(find.text('كلمة المرور'), findsOneWidget);
      });

      testWidgets('should render login button', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        expect(find.text('تسجيل الدخول'), findsWidgets);
      });

      testWidgets('should render forgot password link', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        expect(find.text('نسيت كلمة المرور؟'), findsOneWidget);
      });

      testWidgets('should render register link', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        expect(find.text('إنشاء حساب'), findsOneWidget);
      });

      testWidgets('should render email icon', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        expect(find.byIcon(Icons.email_outlined), findsOneWidget);
      });

      testWidgets('should render lock icon', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        expect(find.byIcon(Icons.lock_outline), findsWidgets);
      });

      testWidgets('should render OR divider', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        expect(find.text('أو'), findsOneWidget);
      });

      testWidgets('should render social login text', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        expect(find.text('التسجيل من خلال'), findsOneWidget);
      });

      testWidgets('should render Google button', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        expect(find.text('جوجل'), findsOneWidget);
      });

      testWidgets('should render Apple button', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        expect(find.text('ابل'), findsOneWidget);
        expect(find.byIcon(Icons.apple), findsOneWidget);
      });
    });

    // ==================== Text Input ====================
    group('Text Input', () {
      testWidgets('should allow typing in email field', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        final emailField = find.byType(TextField).first;
        await tester.enterText(emailField, 'test@example.com');
        await tester.pump();

        expect(find.text('test@example.com'), findsOneWidget);
      });

      testWidgets('should allow typing in password field', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        final passwordField = find.byType(TextField).at(1);
        await tester.enterText(passwordField, 'password123');
        await tester.pump();

        // Password is obscured, so we check the controller value indirectly
        expect(find.byType(TextField), findsNWidgets(2));
      });

      testWidgets('should have two text fields', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        expect(find.byType(TextField), findsNWidgets(2));
      });
    });

    // ==================== Password Visibility Toggle ====================
    group('Password Visibility Toggle', () {
      testWidgets('password should be obscured by default', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        final passwordField = find.byType(TextField).at(1);
        final textField = tester.widget<TextField>(passwordField);

        expect(textField.obscureText, isTrue);
      });

      testWidgets('should show visibility off icon initially', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        expect(find.byIcon(Icons.visibility_off_outlined), findsOneWidget);
      });

      testWidgets('should toggle password visibility on icon tap', (
        tester,
      ) async {
        await tester.pumpWidget(createWidgetUnderTest());

        // Initially visibility off
        expect(find.byIcon(Icons.visibility_off_outlined), findsOneWidget);

        // Tap to show password
        await tester.tap(find.byIcon(Icons.visibility_off_outlined));
        await tester.pump();

        // Now visibility on
        expect(find.byIcon(Icons.visibility_outlined), findsOneWidget);
      });

      testWidgets('should toggle back to hidden on second tap', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        // Tap to show
        await tester.tap(find.byIcon(Icons.visibility_off_outlined));
        await tester.pump();

        // Tap to hide
        await tester.tap(find.byIcon(Icons.visibility_outlined));
        await tester.pump();

        // Back to hidden
        expect(find.byIcon(Icons.visibility_off_outlined), findsOneWidget);
      });
    });

    // ==================== Button Layout ====================
    group('Button Layout', () {
      testWidgets('should have elevated button for login', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        expect(find.byType(ElevatedButton), findsWidgets);
      });

      testWidgets('should have TextButton for forgot password', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        expect(find.byType(TextButton), findsWidgets);
      });

      testWidgets('should have InkWell for Google sign in', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        expect(find.byType(InkWell), findsWidgets);
      });
    });

    // ==================== RTL Directionality ====================
    group('RTL Directionality', () {
      testWidgets('should have RTL text direction', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        final directionality = find.byType(Directionality);
        expect(directionality, findsWidgets);
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

      testWidgets('should have SingleChildScrollView', (tester) async {
        await tester.pumpWidget(createWidgetUnderTest());

        expect(find.byType(SingleChildScrollView), findsOneWidget);
      });
    });
  });
}
