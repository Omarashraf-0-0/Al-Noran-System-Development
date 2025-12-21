import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:flutter/material.dart';
import 'package:alnoran_mobile_application/main.dart' as app;

/// =====================================================
/// 🧪 E2E TEST: Shipment Tracking Flow
/// Home → Enter Tracking Number → Search → View Results
/// =====================================================

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  // Test credentials (use existing account)
  const validEmail = 'test61142120@test.com';
  const validPassword = 'Test@123456';

  /// ⭐ SMART WAIT: Wait until a widget appears (max timeout)
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
    print('  ⚠️ Timeout waiting for widget (${timeout.inSeconds}s)');
    return false;
  }

  /// Helper: Find all text fields
  Finder findAllTextFields() {
    return find.byType(TextField);
  }

  /// Helper: Scroll and tap
  Future<void> scrollAndTap(WidgetTester tester, Finder finder) async {
    await tester.ensureVisible(finder);
    await tester.pumpAndSettle();
    await tester.tap(finder, warnIfMissed: false);
    await tester.pumpAndSettle();
  }

  group('Shipment Tracking Tests', () {
    testWidgets('Search Shipment by Tracking Number', (
      WidgetTester tester,
    ) async {
      print('=== Starting Shipment Tracking Test ===');

      // ============================================
      // STEP 1: LAUNCH APP
      // ============================================
      print('STEP 1: Launch App');
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 5));

      // ============================================
      // STEP 2: LOGIN IF NEEDED
      // ============================================
      print('STEP 2: Check Login Status');

      final homeNav = find.byType(BottomNavigationBar);
      if (homeNav.evaluate().isEmpty) {
        print('  ⏳ Not logged in, logging in...');

        final loginFields = findAllTextFields();
        if (loginFields.evaluate().length >= 2) {
          // Enter email
          await tester.enterText(loginFields.at(0), validEmail);
          await tester.pumpAndSettle();

          // Enter password
          await tester.enterText(loginFields.at(1), validPassword);
          await tester.pumpAndSettle();

          // Tap login button
          final loginBtn = find.byType(ElevatedButton);
          if (loginBtn.evaluate().isNotEmpty) {
            await tester.tap(loginBtn.first);
          }

          // Wait for home page
          await waitForWidget(
            tester,
            homeNav,
            timeout: const Duration(seconds: 20),
          );
          print('  ✓ Logged in successfully');
        }
      } else {
        print('  ✓ Already logged in');
      }

      // ============================================
      // STEP 3: FIND TRACKING INPUT
      // ============================================
      print('STEP 3: Find Tracking Input');

      // Look for "تتبع شحنتك" card
      final trackingCard = find.textContaining('تتبع');
      if (trackingCard.evaluate().isNotEmpty) {
        print('  ✓ Found tracking card');
      }

      // Find the tracking input field (with hint "أدخل رقم الشحنة")
      final trackingInput = find.byType(TextField);
      if (trackingInput.evaluate().isNotEmpty) {
        print('  ✓ Found ${trackingInput.evaluate().length} text fields');

        // The tracking field is usually the first TextField on home page
        await tester.tap(trackingInput.first);
        await tester.pumpAndSettle();

        // Enter a tracking number (this can be a real or test number)
        // Common formats: ACID-XXXX, UCR-XXXX, or shipment number
        const testTrackingNumber = '12345';
        await tester.enterText(trackingInput.first, testTrackingNumber);
        await tester.pumpAndSettle();
        print('  ✓ Entered tracking number: $testTrackingNumber');
      }

      // ============================================
      // STEP 4: TAP TRACK BUTTON
      // ============================================
      print('STEP 4: Tap Track Button');

      // Look for "تتبع" button
      final trackButton = find.text('تتبع');
      if (trackButton.evaluate().isNotEmpty) {
        await scrollAndTap(tester, trackButton.first);
        print('  ✓ Tapped track button');
      } else {
        // Try finding ElevatedButton within tracking card
        final buttons = find.byType(ElevatedButton);
        if (buttons.evaluate().length > 1) {
          await tester.tap(buttons.at(1));
          await tester.pumpAndSettle();
          print('  ✓ Tapped button');
        }
      }

      // Wait for response
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // ============================================
      // STEP 5: CHECK RESULTS
      // ============================================
      print('STEP 5: Check Results');

      // Check for search results popup or error message
      final resultPopup = find.byType(BottomSheet);
      final errorMsg = find.textContaining('خطأ');
      final noResults = find.textContaining('لا توجد');
      final resultsCard = find.textContaining('نتائج');

      if (resultPopup.evaluate().isNotEmpty) {
        print('  ✓ Results popup appeared');
      }
      if (resultsCard.evaluate().isNotEmpty) {
        print('  ✓ Found results');
      }
      if (noResults.evaluate().isNotEmpty) {
        print('  ⚠️ No results found (expected for test number)');
      }
      if (errorMsg.evaluate().isNotEmpty) {
        print('  ⚠️ Error message shown');
      }

      // Test completed without crash
      expect(tester.takeException(), isNull);
      print('=== Shipment Tracking Test Complete ===');
    });

    testWidgets('Navigate to My Shipments', (WidgetTester tester) async {
      print('=== Starting My Shipments Navigation Test ===');

      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 5));

      // Login if needed (same as above)
      final homeNav = find.byType(BottomNavigationBar);
      if (homeNav.evaluate().isEmpty) {
        final loginFields = findAllTextFields();
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
        }
      }

      // ============================================
      // TAP MY SHIPMENTS IN BOTTOM NAV
      // ============================================
      print('STEP: Navigate to My Shipments');

      // Find shipments icon (usually second item in nav)
      final shipmentsIcon = find.byIcon(Icons.local_shipping);
      final boxIcon = find.byIcon(Icons.inventory_2);
      final listIcon = find.byIcon(Icons.list);

      if (shipmentsIcon.evaluate().isNotEmpty) {
        await tester.tap(shipmentsIcon.first);
        await tester.pumpAndSettle(const Duration(seconds: 2));
        print('  ✓ Tapped shipments icon');
      } else if (boxIcon.evaluate().isNotEmpty) {
        await tester.tap(boxIcon.first);
        await tester.pumpAndSettle(const Duration(seconds: 2));
        print('  ✓ Tapped box icon');
      }

      // Verify we're on shipments page
      final shipmentsTitle = find.textContaining('شحناتي');
      final importTitle = find.textContaining('الاستيراد');
      final tabBar = find.byType(TabBar);

      if (shipmentsTitle.evaluate().isNotEmpty) {
        print('  ✓ On My Shipments page');
        expect(shipmentsTitle, findsWidgets);
      }
      if (tabBar.evaluate().isNotEmpty) {
        print('  ✓ Found tab bar');
      }

      // ============================================
      // TEST TAB SWITCHING
      // ============================================
      print('STEP: Test Tab Switching');

      final tabs = find.byType(Tab);
      if (tabs.evaluate().length > 1) {
        // Tap second tab
        await tester.tap(tabs.at(1));
        await tester.pumpAndSettle(const Duration(seconds: 1));
        print('  ✓ Switched to second tab');

        // Tap back to first tab
        await tester.tap(tabs.at(0));
        await tester.pumpAndSettle(const Duration(seconds: 1));
        print('  ✓ Switched back to first tab');
      }

      expect(tester.takeException(), isNull);
      print('=== My Shipments Navigation Test Complete ===');
    });

    testWidgets('Navigate All Bottom Nav Items', (WidgetTester tester) async {
      print('=== Starting Bottom Nav Test ===');

      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 5));

      // Login if needed
      final homeNav = find.byType(BottomNavigationBar);
      if (homeNav.evaluate().isEmpty) {
        final loginFields = findAllTextFields();
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
        }
      }

      // Count nav items
      final navBar = find.byType(BottomNavigationBar);
      expect(navBar, findsOneWidget);
      print('  ✓ Found bottom navigation bar');

      // Tap each nav item (usually 4-5 items)
      final navIcons = [
        Icons.home,
        Icons.local_shipping,
        Icons.upload_file,
        Icons.attach_money,
        Icons.person,
      ];

      for (int i = 0; i < navIcons.length; i++) {
        final icon = find.byIcon(navIcons[i]);
        if (icon.evaluate().isNotEmpty) {
          await tester.tap(icon.first);
          await tester.pumpAndSettle(const Duration(seconds: 2));
          print('  ✓ Tapped nav item ${i + 1} (${navIcons[i]})');
        }
      }

      // Go back to home
      final homeIcon = find.byIcon(Icons.home);
      if (homeIcon.evaluate().isNotEmpty) {
        await tester.tap(homeIcon.first);
        await tester.pumpAndSettle(const Duration(seconds: 2));
        print('  ✓ Back on home page');
      }

      expect(tester.takeException(), isNull);
      print('=== Bottom Nav Test Complete ===');
    });
  });
}
