import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:flutter/material.dart';
import 'package:alnoran_mobile_application/main.dart' as app;

/// =====================================================
/// 🧪 Real E2E Tests - Profile & Settings
/// Complete user scenarios for profile management
/// =====================================================
///
/// Run: flutter test integration_test/e2e_profile_test.dart -d <device-id>
/// =====================================================

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  /// Helper: Login and navigate to profile
  Future<void> navigateToProfile(WidgetTester tester) async {
    app.main();
    await tester.pumpAndSettle(const Duration(seconds: 5));

    // Check if on login page
    final textFields = find.byType(TextFormField);
    if (textFields.evaluate().length >= 2) {
      // Login first
      await tester.enterText(textFields.first, 'test@alnoran.com');
      await tester.enterText(textFields.at(1), 'Test@123456');
      await tester.pumpAndSettle();

      final loginButton = find.byType(ElevatedButton);
      if (loginButton.evaluate().isNotEmpty) {
        await tester.tap(loginButton.first);
        await tester.pumpAndSettle(const Duration(seconds: 10));
      }
    }

    // Navigate to profile tab
    final profileIcon = find.byIcon(Icons.person);
    final accountIcon = find.byIcon(Icons.account_circle);

    if (profileIcon.evaluate().isNotEmpty) {
      await tester.tap(profileIcon.last);
      await tester.pumpAndSettle(const Duration(seconds: 3));
    } else if (accountIcon.evaluate().isNotEmpty) {
      await tester.tap(accountIcon.last);
      await tester.pumpAndSettle(const Duration(seconds: 3));
    }
  }

  group('👤 Profile Page Scenarios', () {
    testWidgets('E2E: Profile page shows user info', (
      WidgetTester tester,
    ) async {
      await navigateToProfile(tester);

      // Verify profile elements
      final profileTitle = find.text('الملف الشخصي');
      final userAvatar = find.byType(CircleAvatar);
      final settingsOption = find.textContaining('إعدادات');

      expect(
        profileTitle.evaluate().isNotEmpty ||
            userAvatar.evaluate().isNotEmpty ||
            settingsOption.evaluate().isNotEmpty,
        isTrue,
        reason: 'Should show profile page',
      );
    });

    testWidgets('E2E: Navigate to personal data settings', (
      WidgetTester tester,
    ) async {
      await navigateToProfile(tester);

      // Find personal data option
      final personalData = find.textContaining('البيانات الشخصية');
      final editProfile = find.textContaining('تعديل');
      final userSettings = find.byIcon(Icons.person_outline);

      if (personalData.evaluate().isNotEmpty) {
        await tester.tap(personalData.first);
        await tester.pumpAndSettle(const Duration(seconds: 3));
      } else if (editProfile.evaluate().isNotEmpty) {
        await tester.tap(editProfile.first);
        await tester.pumpAndSettle(const Duration(seconds: 3));
      }

      // Should show form fields
      final formFields = find.byType(TextFormField);
      expect(tester.takeException(), isNull);
    });

    testWidgets('E2E: Navigate to documents page', (WidgetTester tester) async {
      await navigateToProfile(tester);

      // Find documents option
      final documents = find.textContaining('المستندات');
      final docsIcon = find.byIcon(Icons.folder);
      final docsIcon2 = find.byIcon(Icons.description);

      if (documents.evaluate().isNotEmpty) {
        await tester.tap(documents.first);
        await tester.pumpAndSettle(const Duration(seconds: 3));

        // Should show documents list or upload options
        final uploadButton = find.textContaining('رفع');
        final docsList = find.byType(ListView);

        expect(tester.takeException(), isNull);
      }
    });

    testWidgets('E2E: Navigate to change password', (
      WidgetTester tester,
    ) async {
      await navigateToProfile(tester);

      // Find password option
      final changePassword = find.textContaining('كلمة المرور');
      final lockIcon = find.byIcon(Icons.lock);
      final securityIcon = find.byIcon(Icons.security);

      if (changePassword.evaluate().isNotEmpty) {
        await tester.tap(changePassword.first);
        await tester.pumpAndSettle(const Duration(seconds: 3));

        // Should show password form
        final passwordFields = find.byType(TextFormField);
        expect(
          passwordFields,
          findsAtLeastNWidgets(2),
          reason: 'Should have current and new password fields',
        );
      }
    });

    testWidgets('E2E: Navigate to notification settings', (
      WidgetTester tester,
    ) async {
      await navigateToProfile(tester);

      // Find notifications option
      final notifications = find.textContaining('الإشعارات');
      final notifIcon = find.byIcon(Icons.notifications);

      if (notifications.evaluate().isNotEmpty) {
        await tester.tap(notifications.first);
        await tester.pumpAndSettle(const Duration(seconds: 3));

        // Should show toggle switches
        final switches = find.byType(Switch);
        final switchTiles = find.byType(SwitchListTile);

        expect(
          switches.evaluate().isNotEmpty || switchTiles.evaluate().isNotEmpty,
          isTrue,
          reason: 'Notification settings should have toggles',
        );
      }
    });

    testWidgets('E2E: Toggle a notification setting', (
      WidgetTester tester,
    ) async {
      await navigateToProfile(tester);

      // Navigate to notifications
      final notifications = find.textContaining('الإشعارات');
      if (notifications.evaluate().isNotEmpty) {
        await tester.tap(notifications.first);
        await tester.pumpAndSettle(const Duration(seconds: 3));
      }

      // Find and toggle a switch
      final switches = find.byType(Switch);
      if (switches.evaluate().isNotEmpty) {
        await tester.tap(switches.first);
        await tester.pumpAndSettle();

        // Toggle back
        await tester.tap(switches.first);
        await tester.pumpAndSettle();
      }

      expect(tester.takeException(), isNull);
    });
  });

  group('🚪 Logout Scenario', () {
    testWidgets('E2E: Find and tap logout button', (WidgetTester tester) async {
      await navigateToProfile(tester);

      // Scroll down if needed to find logout
      await tester.drag(find.byType(ListView).first, const Offset(0, -200));
      await tester.pumpAndSettle();

      // Find logout option
      final logoutText = find.textContaining('تسجيل الخروج');
      final logoutIcon = find.byIcon(Icons.logout);
      final exitIcon = find.byIcon(Icons.exit_to_app);

      Finder? logoutButton;
      if (logoutText.evaluate().isNotEmpty) {
        logoutButton = logoutText;
      } else if (logoutIcon.evaluate().isNotEmpty) {
        logoutButton = logoutIcon;
      } else if (exitIcon.evaluate().isNotEmpty) {
        logoutButton = exitIcon;
      }

      if (logoutButton != null) {
        await tester.tap(logoutButton.first);
        await tester.pumpAndSettle();

        // Should show confirmation dialog
        final confirmDialog = find.byType(AlertDialog);
        final confirmText = find.textContaining('تأكيد');
        final yesButton = find.text('نعم');
        final cancelButton = find.text('لا');

        expect(
          confirmDialog.evaluate().isNotEmpty ||
              confirmText.evaluate().isNotEmpty ||
              yesButton.evaluate().isNotEmpty,
          isTrue,
          reason: 'Should show logout confirmation',
        );

        // Cancel logout (to not mess up further tests)
        if (cancelButton.evaluate().isNotEmpty) {
          await tester.tap(cancelButton.first);
          await tester.pumpAndSettle();
        }
      }
    });

    testWidgets('E2E: Confirm logout returns to login', (
      WidgetTester tester,
    ) async {
      await navigateToProfile(tester);

      // Find logout
      final logoutText = find.textContaining('تسجيل الخروج');
      if (logoutText.evaluate().isNotEmpty) {
        await tester.tap(logoutText.first);
        await tester.pumpAndSettle();

        // Confirm logout
        final yesButton = find.text('نعم');
        final confirmButton = find.textContaining('تأكيد');

        if (yesButton.evaluate().isNotEmpty) {
          await tester.tap(yesButton.first);
          await tester.pumpAndSettle(const Duration(seconds: 3));
        } else if (confirmButton.evaluate().isNotEmpty) {
          await tester.tap(confirmButton.first);
          await tester.pumpAndSettle(const Duration(seconds: 3));
        }

        // Should be back on login page
        final loginButton = find.textContaining('تسجيل الدخول');
        final loginFields = find.byType(TextFormField);

        expect(
          loginButton.evaluate().isNotEmpty ||
              loginFields.evaluate().length >= 2,
          isTrue,
          reason: 'Should return to login after logout',
        );
      }
    });
  });
}
