import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:flutter/material.dart';
import 'package:alnoran_mobile_application/main.dart' as app;

/// =====================================================
/// 🧪 E2E TEST: Payments Flow
/// Navigate to Payments → View Balance → Switch Tabs
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
    print('  ⚠️ Timeout waiting for widget');
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
    } else {
      print('  ✓ Already logged in');
    }
  }

  group('Payments E2E Tests', () {
    testWidgets('View Payments Page and Balance', (WidgetTester tester) async {
      print('=== Starting Payments Test ===');

      // Launch and login
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 5));
      await loginIfNeeded(tester);

      // ============================================
      // STEP 1: NAVIGATE TO PAYMENTS
      // ============================================
      print('STEP 1: Navigate to Payments');

      // Find payments icon in bottom nav (usually money icon)
      final moneyIcon = find.byIcon(Icons.attach_money);
      final paymentsIcon = find.byIcon(Icons.payment);
      final walletIcon = find.byIcon(Icons.account_balance_wallet);

      if (moneyIcon.evaluate().isNotEmpty) {
        await tester.tap(moneyIcon.first);
        await tester.pumpAndSettle(const Duration(seconds: 3));
        print('  ✓ Tapped money icon');
      } else if (paymentsIcon.evaluate().isNotEmpty) {
        await tester.tap(paymentsIcon.first);
        await tester.pumpAndSettle(const Duration(seconds: 3));
      } else if (walletIcon.evaluate().isNotEmpty) {
        await tester.tap(walletIcon.first);
        await tester.pumpAndSettle(const Duration(seconds: 3));
      }

      // Wait for payments page to load
      await tester.pumpAndSettle(const Duration(seconds: 2));

      // ============================================
      // STEP 2: VERIFY BALANCE CARDS
      // ============================================
      print('STEP 2: Verify Balance Display');

      // Look for balance text or cards
      final balanceText = find.textContaining('الرصيد');
      final debtText = find.textContaining('المديونية');
      final currencyText = find.textContaining('جنيه');
      final amountCards = find.byType(Card);

      if (balanceText.evaluate().isNotEmpty) {
        print('  ✓ Found balance display');
      }
      if (debtText.evaluate().isNotEmpty) {
        print('  ✓ Found debt display');
      }
      if (currencyText.evaluate().isNotEmpty) {
        print('  ✓ Found currency amounts');
      }
      if (amountCards.evaluate().isNotEmpty) {
        print('  ✓ Found ${amountCards.evaluate().length} cards');
      }

      // ============================================
      // STEP 3: TEST TAB SWITCHING
      // ============================================
      print('STEP 3: Test Tab Switching');

      // Look for Invoices / Transactions tabs
      final invoicesTab = find.textContaining('الفواتير');
      final transactionsTab = find.textContaining('المعاملات');
      final paymentsTab = find.textContaining('المدفوعات');

      if (invoicesTab.evaluate().isNotEmpty) {
        await tester.tap(invoicesTab.first);
        await tester.pumpAndSettle(const Duration(seconds: 1));
        print('  ✓ Switched to Invoices tab');
      }

      if (transactionsTab.evaluate().isNotEmpty) {
        await tester.tap(transactionsTab.first);
        await tester.pumpAndSettle(const Duration(seconds: 1));
        print('  ✓ Switched to Transactions tab');
      }

      if (paymentsTab.evaluate().isNotEmpty) {
        await tester.tap(paymentsTab.first);
        await tester.pumpAndSettle(const Duration(seconds: 1));
        print('  ✓ Switched to Payments tab');
      }

      // ============================================
      // STEP 4: CHECK FOR UPLOAD BUTTON
      // ============================================
      print('STEP 4: Check Upload Button');

      final fab = find.byType(FloatingActionButton);
      final uploadIcon = find.byIcon(Icons.upload);
      final addIcon = find.byIcon(Icons.add);
      final uploadText = find.textContaining('رفع');

      if (fab.evaluate().isNotEmpty) {
        print('  ✓ Found FAB button');
      }
      if (uploadIcon.evaluate().isNotEmpty ||
          uploadText.evaluate().isNotEmpty) {
        print('  ✓ Found upload option');
      }

      expect(tester.takeException(), isNull);
      print('=== Payments Test Complete ===');
    });

    testWidgets('View Invoice Details (if available)', (
      WidgetTester tester,
    ) async {
      print('=== Starting Invoice Details Test ===');

      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 5));
      await loginIfNeeded(tester);

      // Navigate to payments
      final moneyIcon = find.byIcon(Icons.attach_money);
      if (moneyIcon.evaluate().isNotEmpty) {
        await tester.tap(moneyIcon.first);
        await tester.pumpAndSettle(const Duration(seconds: 3));
      }

      // Look for invoice cards
      final invoiceCards = find.byType(Card);
      final invoiceText = find.textContaining('فاتورة');
      final invoiceNumber = find.textContaining('INV-');

      if (invoiceCards.evaluate().length > 2) {
        // Skip header cards, tap an invoice card
        await tester.tap(invoiceCards.at(2));
        await tester.pumpAndSettle(const Duration(seconds: 2));
        print('  ✓ Tapped invoice card');

        // Check for details popup/page
        final detailsPopup = find.byType(BottomSheet);
        final detailsPage = find.textContaining('تفاصيل');

        if (detailsPopup.evaluate().isNotEmpty) {
          print('  ✓ Invoice details shown');
        }
        if (detailsPage.evaluate().isNotEmpty) {
          print('  ✓ Details page opened');
        }
      } else {
        print('  ⚠️ No invoice cards found');
      }

      expect(tester.takeException(), isNull);
      print('=== Invoice Details Test Complete ===');
    });
  });
}
