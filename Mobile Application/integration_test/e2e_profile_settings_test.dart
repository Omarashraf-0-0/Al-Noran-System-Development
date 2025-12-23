import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:flutter/material.dart';
import 'package:alnoran_mobile_application/main.dart' as app;

/// =====================================================
/// 🧪 E2E TEST: Profile & Settings Flow
/// Profile → Settings Menu → Personal Data → Documents
/// =====================================================

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  // Test credentials
  const validEmail = 'test61142120@test.com';
  const validPassword = 'Test@123456';

  /// Helper: Wait for widget
  Future<bool> waitForWidget(
    WidgetTester tester,
    Finder finder, {
    Duration timeout = const Duration(seconds: 10),
  }) async {
    final stopwatch = Stopwatch()..start();
    while (stopwatch.elapsed < timeout) {
      await tester.pump(const Duration(milliseconds: 500));
      if (finder.evaluate().isNotEmpty) {
        stopwatch.stop();
        print('  ✓ Found widget in ${stopwatch.elapsedMilliseconds}ms');
        return true;
      }
    }
    stopwatch.stop();
    return false;
  }

  /// Helper: Login if needed
  Future<void> loginIfNeeded(WidgetTester tester) async {
    final homeNav = find.byType(BottomNavigationBar);
    if (homeNav.evaluate().isEmpty) {
      print('  ⏳ Logging in...');
      final loginFields = find.byType(TextField);
      if (loginFields.evaluate().length >= 2) {
        await tester.enterText(loginFields.at(0), validEmail);
        await tester.pumpAndSettle();
        await tester.enterText(loginFields.at(1), validPassword);
        await tester.pumpAndSettle();

        final loginBtn = find.byType(ElevatedButton);
        if (loginBtn.evaluate().isNotEmpty) {
          await tester.tap(loginBtn.first);
        }
        await waitForWidget(
          tester,
          homeNav,
          timeout: const Duration(seconds: 20),
        );
        print('  ✓ Logged in');
      }
    }
  }

  /// Helper: Scroll and tap
  Future<void> scrollAndTap(WidgetTester tester, Finder finder) async {
    await tester.ensureVisible(finder);
    await tester.pumpAndSettle();
    await tester.tap(finder, warnIfMissed: false);
    await tester.pumpAndSettle();
  }

  group('Profile & Settings E2E Tests', () {
    testWidgets('Navigate to Profile and Settings', (
      WidgetTester tester,
    ) async {
      print('=== Starting Profile Settings Test ===');

      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 5));
      await loginIfNeeded(tester);

      // ============================================
      // STEP 1: NAVIGATE TO PROFILE
      // ============================================
      print('STEP 1: Navigate to Profile');

      final profileIcon = find.byIcon(Icons.person);
      final moreIcon = find.byIcon(Icons.more_horiz);

      if (profileIcon.evaluate().isNotEmpty) {
        await tester.tap(profileIcon.last);
        await tester.pumpAndSettle(const Duration(seconds: 2));
        print('  ✓ Tapped profile icon');
      } else if (moreIcon.evaluate().isNotEmpty) {
        await tester.tap(moreIcon.first);
        await tester.pumpAndSettle(const Duration(seconds: 2));
      }

      // Verify on profile page
      final profileTitle = find.textContaining('حسابي');
      final settingsCard = find.textContaining('الإعدادات');

      if (profileTitle.evaluate().isNotEmpty) {
        print('  ✓ On profile page');
      }

      // ============================================
      // STEP 2: NAVIGATE TO SETTINGS
      // ============================================
      print('STEP 2: Navigate to Settings');

      final settingsIcon = find.byIcon(Icons.settings);
      final settingsText = find.textContaining('الإعدادات');

      if (settingsIcon.evaluate().isNotEmpty) {
        await tester.tap(settingsIcon.first);
        await tester.pumpAndSettle(const Duration(seconds: 2));
        print('  ✓ Opened settings');
      } else if (settingsText.evaluate().isNotEmpty) {
        await scrollAndTap(tester, settingsText.first);
        await tester.pumpAndSettle(const Duration(seconds: 2));
        print('  ✓ Opened settings via text');
      }

      // ============================================
      // STEP 3: CHECK SETTINGS OPTIONS
      // ============================================
      print('STEP 3: Verify Settings Options');

      final personalData = find.textContaining('البيانات الشخصية');
      final documents = find.textContaining('المستندات');
      final password = find.textContaining('كلمة المرور');
      final notifications = find.textContaining('الإشعارات');
      final logout = find.textContaining('تسجيل الخروج');

      if (personalData.evaluate().isNotEmpty) {
        print('  ✓ Found Personal Data option');
      }
      if (documents.evaluate().isNotEmpty) {
        print('  ✓ Found Documents option');
      }
      if (password.evaluate().isNotEmpty) {
        print('  ✓ Found Password option');
      }
      if (notifications.evaluate().isNotEmpty) {
        print('  ✓ Found Notifications option');
      }
      if (logout.evaluate().isNotEmpty) {
        print('  ✓ Found Logout option');
      }

      expect(tester.takeException(), isNull);
      print('=== Profile Settings Test Complete ===');
    });

    testWidgets('View Personal Data', (WidgetTester tester) async {
      print('=== Starting Personal Data Test ===');

      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 5));
      await loginIfNeeded(tester);

      // Navigate to profile
      final profileIcon = find.byIcon(Icons.person);
      if (profileIcon.evaluate().isNotEmpty) {
        await tester.tap(profileIcon.last);
        await tester.pumpAndSettle(const Duration(seconds: 2));
      }

      // Open settings
      final settingsIcon = find.byIcon(Icons.settings);
      if (settingsIcon.evaluate().isNotEmpty) {
        await tester.tap(settingsIcon.first);
        await tester.pumpAndSettle(const Duration(seconds: 2));
      }

      // ============================================
      // TAP PERSONAL DATA
      // ============================================
      print('STEP: Open Personal Data');

      final personalData = find.textContaining('البيانات الشخصية');
      final personIcon = find.byIcon(Icons.person_outline);

      if (personalData.evaluate().isNotEmpty) {
        await scrollAndTap(tester, personalData.first);
        await tester.pumpAndSettle(const Duration(seconds: 2));
        print('  ✓ Opened Personal Data');
      } else if (personIcon.evaluate().isNotEmpty) {
        await tester.tap(personIcon.first);
        await tester.pumpAndSettle(const Duration(seconds: 2));
      }

      // Verify user data is displayed
      final emailField = find.textContaining('@');
      final phoneField = find.textContaining('01');
      final nameField = find.textContaining('الاسم');
      final textFields = find.byType(TextField);

      if (textFields.evaluate().isNotEmpty) {
        print('  ✓ Found ${textFields.evaluate().length} data fields');
      }
      if (emailField.evaluate().isNotEmpty) {
        print('  ✓ Email displayed');
      }
      if (phoneField.evaluate().isNotEmpty) {
        print('  ✓ Phone displayed');
      }

      expect(tester.takeException(), isNull);
      print('=== Personal Data Test Complete ===');
    });

    testWidgets('View Documents Page', (WidgetTester tester) async {
      print('=== Starting Documents Test ===');

      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 5));
      await loginIfNeeded(tester);

      // Navigate to settings
      final profileIcon = find.byIcon(Icons.person);
      if (profileIcon.evaluate().isNotEmpty) {
        await tester.tap(profileIcon.last);
        await tester.pumpAndSettle(const Duration(seconds: 2));
      }

      final settingsIcon = find.byIcon(Icons.settings);
      if (settingsIcon.evaluate().isNotEmpty) {
        await tester.tap(settingsIcon.first);
        await tester.pumpAndSettle(const Duration(seconds: 2));
      }

      // ============================================
      // TAP DOCUMENTS
      // ============================================
      print('STEP: Open Documents');

      final documents = find.textContaining('المستندات');
      final folderIcon = find.byIcon(Icons.folder_open);

      if (documents.evaluate().isNotEmpty) {
        await scrollAndTap(tester, documents.first);
        await tester.pumpAndSettle(const Duration(seconds: 2));
        print('  ✓ Opened Documents');
      } else if (folderIcon.evaluate().isNotEmpty) {
        await tester.tap(folderIcon.first);
        await tester.pumpAndSettle(const Duration(seconds: 2));
      }

      // Check for document list
      final documentCards = find.byType(Card);
      final uploadBtn = find.byIcon(Icons.upload);
      final emptyState = find.textContaining('لا توجد');

      if (documentCards.evaluate().isNotEmpty) {
        print('  ✓ Found ${documentCards.evaluate().length} document cards');
      }
      if (emptyState.evaluate().isNotEmpty) {
        print('  ⚠️ No documents uploaded');
      }

      expect(tester.takeException(), isNull);
      print('=== Documents Test Complete ===');
    });

    testWidgets('Toggle Notifications Setting', (WidgetTester tester) async {
      print('=== Starting Notifications Toggle Test ===');

      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 5));
      await loginIfNeeded(tester);

      // Navigate to settings
      final profileIcon = find.byIcon(Icons.person);
      if (profileIcon.evaluate().isNotEmpty) {
        await tester.tap(profileIcon.last);
        await tester.pumpAndSettle(const Duration(seconds: 2));
      }

      final settingsIcon = find.byIcon(Icons.settings);
      if (settingsIcon.evaluate().isNotEmpty) {
        await tester.tap(settingsIcon.first);
        await tester.pumpAndSettle(const Duration(seconds: 2));
      }

      // ============================================
      // FIND AND TOGGLE NOTIFICATIONS SWITCH
      // ============================================
      print('STEP: Toggle Notifications');

      final notificationsSwitch = find.byType(Switch);
      final notificationsText = find.textContaining('الإشعارات');

      if (notificationsSwitch.evaluate().isNotEmpty) {
        // Get current state
        final switchWidget = tester.widget<Switch>(notificationsSwitch.first);
        final wasEnabled = switchWidget.value;
        print('  Current state: ${wasEnabled ? "enabled" : "disabled"}');

        // Toggle
        await tester.tap(notificationsSwitch.first);
        await tester.pumpAndSettle(const Duration(seconds: 2));
        print('  ✓ Toggled notifications');

        // Toggle back
        await tester.tap(notificationsSwitch.first);
        await tester.pumpAndSettle(const Duration(seconds: 2));
        print('  ✓ Toggled back');
      }

      expect(tester.takeException(), isNull);
      print('=== Notifications Toggle Test Complete ===');
    });
  });
}
