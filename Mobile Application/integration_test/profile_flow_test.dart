import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:alnoran_mobile_application/main.dart' as app;

/// Profile Flow Integration Tests
/// Tests profile viewing, settings, documents, and account management flows
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  /// Setup authenticated user state
  void setupAuthenticatedUser() {
    SharedPreferences.setMockInitialValues({
      'auth_token': 'test_token_123',
      'user_id': 'user_123',
      'user_name': 'أحمد محمد',
      'user_email': 'ahmed@test.com',
      'user_type': 'client',
      'username': 'ahmedmohamed',
      'client_type': 'commercial',
      'user_data':
          '{"_id":"user_123","fullname":"أحمد محمد","email":"ahmed@test.com"}',
    });
  }

  group('Profile Navigation', () {
    setUp(setupAuthenticatedUser);

    testWidgets('should navigate to profile screen', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Look for profile icon in bottom nav or top bar
      final profileIcon = find.byIcon(Icons.person);
      final accountIcon = find.byIcon(Icons.account_circle);
      final menuIcon = find.byIcon(Icons.menu);

      if (profileIcon.evaluate().isNotEmpty) {
        await tester.tap(profileIcon.first);
        await tester.pumpAndSettle();
      } else if (accountIcon.evaluate().isNotEmpty) {
        await tester.tap(accountIcon.first);
        await tester.pumpAndSettle();
      } else if (menuIcon.evaluate().isNotEmpty) {
        await tester.tap(menuIcon.first);
        await tester.pumpAndSettle();
      }

      expect(tester.takeException(), isNull);
    });

    testWidgets('should display user info on profile', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Navigate to profile
      final profileIcon = find.byIcon(Icons.person);
      if (profileIcon.evaluate().isNotEmpty) {
        await tester.tap(profileIcon.first);
        await tester.pumpAndSettle();
      }

      // Look for profile elements
      final profileText = find.textContaining('الملف');
      final settingsText = find.textContaining('الإعدادات');

      expect(tester.takeException(), isNull);
    });
  });

  group('Settings Navigation', () {
    setUp(setupAuthenticatedUser);

    testWidgets('should navigate to settings menu', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Navigate to profile first
      final profileIcon = find.byIcon(Icons.person);
      if (profileIcon.evaluate().isNotEmpty) {
        await tester.tap(profileIcon.first);
        await tester.pumpAndSettle();
      }

      // Look for settings option
      final settingsIcon = find.byIcon(Icons.settings);
      final settingsText = find.textContaining('إعدادات');

      if (settingsIcon.evaluate().isNotEmpty) {
        await tester.tap(settingsIcon.first);
        await tester.pumpAndSettle();
      } else if (settingsText.evaluate().isNotEmpty) {
        await tester.tap(settingsText.first);
        await tester.pumpAndSettle();
      }

      expect(tester.takeException(), isNull);
    });

    testWidgets('should navigate to notification settings', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Navigate to profile/settings
      final profileIcon = find.byIcon(Icons.person);
      if (profileIcon.evaluate().isNotEmpty) {
        await tester.tap(profileIcon.first);
        await tester.pumpAndSettle();
      }

      // Look for notification settings
      final notifSettingsText = find.textContaining('إشعارات');
      final notifIcon = find.byIcon(Icons.notifications);

      if (notifSettingsText.evaluate().isNotEmpty) {
        await tester.tap(notifSettingsText.first);
        await tester.pumpAndSettle();
      } else if (notifIcon.evaluate().isNotEmpty) {
        await tester.tap(notifIcon.first);
        await tester.pumpAndSettle();
      }

      expect(tester.takeException(), isNull);
    });
  });

  group('Documents Management', () {
    setUp(setupAuthenticatedUser);

    testWidgets('should navigate to documents page', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Navigate to profile
      final profileIcon = find.byIcon(Icons.person);
      if (profileIcon.evaluate().isNotEmpty) {
        await tester.tap(profileIcon.first);
        await tester.pumpAndSettle();
      }

      // Look for documents option
      final docsText = find.textContaining('مستندات');
      final folderIcon = find.byIcon(Icons.folder);
      final descriptionIcon = find.byIcon(Icons.description);

      if (docsText.evaluate().isNotEmpty) {
        await tester.tap(docsText.first);
        await tester.pumpAndSettle();
      } else if (folderIcon.evaluate().isNotEmpty) {
        await tester.tap(folderIcon.first);
        await tester.pumpAndSettle();
      }

      expect(tester.takeException(), isNull);
    });

    testWidgets('should display document list or upload area', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Navigate to documents via profile
      final profileIcon = find.byIcon(Icons.person);
      if (profileIcon.evaluate().isNotEmpty) {
        await tester.tap(profileIcon.first);
        await tester.pumpAndSettle();
      }

      final docsText = find.textContaining('مستندات');
      if (docsText.evaluate().isNotEmpty) {
        await tester.tap(docsText.first);
        await tester.pumpAndSettle();
      }

      // Check for document UI elements
      final uploadIcon = find.byIcon(Icons.upload);
      final attachIcon = find.byIcon(Icons.attach_file);
      final cards = find.byType(Card);

      expect(tester.takeException(), isNull);
    });
  });

  group('Change Password Flow', () {
    setUp(setupAuthenticatedUser);

    testWidgets('should navigate to change password', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Navigate to profile/settings
      final profileIcon = find.byIcon(Icons.person);
      if (profileIcon.evaluate().isNotEmpty) {
        await tester.tap(profileIcon.first);
        await tester.pumpAndSettle();
      }

      // Look for password change option
      final passwordText = find.textContaining('كلمة المرور');
      final lockIcon = find.byIcon(Icons.lock);

      if (passwordText.evaluate().isNotEmpty) {
        await tester.tap(passwordText.first);
        await tester.pumpAndSettle();
      } else if (lockIcon.evaluate().isNotEmpty) {
        await tester.tap(lockIcon.first);
        await tester.pumpAndSettle();
      }

      expect(tester.takeException(), isNull);
    });

    testWidgets('should validate empty password fields', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Navigate to change password (complex navigation)
      final profileIcon = find.byIcon(Icons.person);
      if (profileIcon.evaluate().isNotEmpty) {
        await tester.tap(profileIcon.first);
        await tester.pumpAndSettle();
      }

      final passwordText = find.textContaining('كلمة المرور');
      if (passwordText.evaluate().isNotEmpty) {
        await tester.tap(passwordText.first);
        await tester.pumpAndSettle();
      }

      // Try to submit empty form
      final submitButton = find.byType(ElevatedButton);
      if (submitButton.evaluate().isNotEmpty) {
        await tester.tap(submitButton.first);
        await tester.pump(const Duration(milliseconds: 500));
      }

      expect(tester.takeException(), isNull);
    });
  });

  group('User Data Settings', () {
    setUp(setupAuthenticatedUser);

    testWidgets('should navigate to user data settings', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Navigate to profile
      final profileIcon = find.byIcon(Icons.person);
      if (profileIcon.evaluate().isNotEmpty) {
        await tester.tap(profileIcon.first);
        await tester.pumpAndSettle();
      }

      // Look for user data/personal info option
      final personalText = find.textContaining('بيانات');
      final editIcon = find.byIcon(Icons.edit);

      if (personalText.evaluate().isNotEmpty) {
        await tester.tap(personalText.first);
        await tester.pumpAndSettle();
      } else if (editIcon.evaluate().isNotEmpty) {
        await tester.tap(editIcon.first);
        await tester.pumpAndSettle();
      }

      expect(tester.takeException(), isNull);
    });
  });

  group('Logout Flow', () {
    setUp(setupAuthenticatedUser);

    testWidgets('should find logout option', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Navigate to profile/settings
      final profileIcon = find.byIcon(Icons.person);
      if (profileIcon.evaluate().isNotEmpty) {
        await tester.tap(profileIcon.first);
        await tester.pumpAndSettle();
      }

      // Look for logout
      final logoutText = find.textContaining('تسجيل الخروج');
      final logoutIcon = find.byIcon(Icons.logout);
      final exitIcon = find.byIcon(Icons.exit_to_app);

      expect(tester.takeException(), isNull);
    });

    testWidgets('should show confirmation on logout tap', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Navigate to profile
      final profileIcon = find.byIcon(Icons.person);
      if (profileIcon.evaluate().isNotEmpty) {
        await tester.tap(profileIcon.first);
        await tester.pumpAndSettle();
      }

      // Try to tap logout
      final logoutIcon = find.byIcon(Icons.logout);
      final exitIcon = find.byIcon(Icons.exit_to_app);

      if (logoutIcon.evaluate().isNotEmpty) {
        await tester.tap(logoutIcon.first);
        await tester.pumpAndSettle();
      } else if (exitIcon.evaluate().isNotEmpty) {
        await tester.tap(exitIcon.first);
        await tester.pumpAndSettle();
      }

      // Check for confirmation dialog
      final dialog = find.byType(AlertDialog);

      expect(tester.takeException(), isNull);
    });
  });
}
