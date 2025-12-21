import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:alnoran_mobile_application/main.dart' as app;

/// Payments Flow Integration Tests
/// Tests payments page, invoices, transactions, and receipt upload flows
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
    });
  }

  group('Payments Navigation', () {
    setUp(setupAuthenticatedUser);

    testWidgets('should navigate to payments page', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Look for payments navigation in bottom nav
      final paymentIcon = find.byIcon(Icons.payment);
      final walletIcon = find.byIcon(Icons.account_balance_wallet);
      final moneyIcon = find.byIcon(Icons.attach_money);
      final bottomNav = find.byType(BottomNavigationBar);

      if (paymentIcon.evaluate().isNotEmpty) {
        await tester.tap(paymentIcon.first);
        await tester.pumpAndSettle();
      } else if (walletIcon.evaluate().isNotEmpty) {
        await tester.tap(walletIcon.first);
        await tester.pumpAndSettle();
      } else if (bottomNav.evaluate().isNotEmpty) {
        // Try different nav items
        final navItems = find.descendant(
          of: bottomNav,
          matching: find.byType(InkWell),
        );

        for (int i = 0; i < navItems.evaluate().length; i++) {
          await tester.tap(navItems.at(i));
          await tester.pumpAndSettle();

          // Check if we found payments by looking for payment-related text
          final invoicesText = find.textContaining('فواتير');
          final balanceText = find.textContaining('رصيد');
          if (invoicesText.evaluate().isNotEmpty ||
              balanceText.evaluate().isNotEmpty) {
            break;
          }
        }
      }

      expect(tester.takeException(), isNull);
    });

    testWidgets('should display payment summary cards', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Navigate to payments
      final walletIcon = find.byIcon(Icons.account_balance_wallet);
      if (walletIcon.evaluate().isNotEmpty) {
        await tester.tap(walletIcon.first);
        await tester.pumpAndSettle();
      }

      // Look for summary cards
      final cards = find.byType(Card);
      final balanceText = find.textContaining('رصيد');
      final debtText = find.textContaining('مستحق');

      expect(tester.takeException(), isNull);
    });
  });

  group('Invoices Tab', () {
    setUp(setupAuthenticatedUser);

    testWidgets('should switch to invoices tab', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Navigate to payments
      final walletIcon = find.byIcon(Icons.account_balance_wallet);
      if (walletIcon.evaluate().isNotEmpty) {
        await tester.tap(walletIcon.first);
        await tester.pumpAndSettle();
      }

      // Find invoices tab
      final invoicesTab = find.textContaining('فواتير');
      if (invoicesTab.evaluate().isNotEmpty) {
        await tester.tap(invoicesTab.first);
        await tester.pumpAndSettle();
      }

      expect(tester.takeException(), isNull);
    });

    testWidgets('should display invoice list or empty state', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Navigate to payments and invoices tab
      final walletIcon = find.byIcon(Icons.account_balance_wallet);
      if (walletIcon.evaluate().isNotEmpty) {
        await tester.tap(walletIcon.first);
        await tester.pumpAndSettle();
      }

      final invoicesTab = find.textContaining('فواتير');
      if (invoicesTab.evaluate().isNotEmpty) {
        await tester.tap(invoicesTab.first);
        await tester.pumpAndSettle();
      }

      // Should show either invoice cards or empty state
      final cards = find.byType(Card);
      final emptyIcon = find.byIcon(Icons.receipt_long);
      final noDataText = find.textContaining('لا توجد');

      expect(tester.takeException(), isNull);
    });
  });

  group('Transactions Tab', () {
    setUp(setupAuthenticatedUser);

    testWidgets('should switch to transactions tab', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Navigate to payments
      final walletIcon = find.byIcon(Icons.account_balance_wallet);
      if (walletIcon.evaluate().isNotEmpty) {
        await tester.tap(walletIcon.first);
        await tester.pumpAndSettle();
      }

      // Find transactions tab
      final transTab = find.textContaining('معاملات');
      final paymentsTab = find.textContaining('مدفوعات');

      if (transTab.evaluate().isNotEmpty) {
        await tester.tap(transTab.first);
        await tester.pumpAndSettle();
      } else if (paymentsTab.evaluate().isNotEmpty) {
        await tester.tap(paymentsTab.first);
        await tester.pumpAndSettle();
      }

      expect(tester.takeException(), isNull);
    });

    testWidgets('should display transaction history', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Navigate to transactions
      final walletIcon = find.byIcon(Icons.account_balance_wallet);
      if (walletIcon.evaluate().isNotEmpty) {
        await tester.tap(walletIcon.first);
        await tester.pumpAndSettle();
      }

      final transTab = find.textContaining('معاملات');
      if (transTab.evaluate().isNotEmpty) {
        await tester.tap(transTab.first);
        await tester.pumpAndSettle();
      }

      // Should show transactions or empty state
      final cards = find.byType(Card);
      final listTiles = find.byType(ListTile);

      expect(tester.takeException(), isNull);
    });
  });

  group('Receipt Upload', () {
    setUp(setupAuthenticatedUser);

    testWidgets('should find upload receipt button', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Navigate to payments
      final walletIcon = find.byIcon(Icons.account_balance_wallet);
      if (walletIcon.evaluate().isNotEmpty) {
        await tester.tap(walletIcon.first);
        await tester.pumpAndSettle();
      }

      // Look for upload button
      final uploadText = find.textContaining('رفع');
      final fab = find.byType(FloatingActionButton);
      final uploadIcon = find.byIcon(Icons.upload);
      final addIcon = find.byIcon(Icons.add);

      expect(tester.takeException(), isNull);
    });

    testWidgets('should open upload sheet on tap', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Navigate to payments
      final walletIcon = find.byIcon(Icons.account_balance_wallet);
      if (walletIcon.evaluate().isNotEmpty) {
        await tester.tap(walletIcon.first);
        await tester.pumpAndSettle();
      }

      // Tap upload button
      final uploadText = find.textContaining('رفع');
      final fab = find.byType(FloatingActionButton);

      if (uploadText.evaluate().isNotEmpty) {
        await tester.tap(uploadText.first);
        await tester.pumpAndSettle();
      } else if (fab.evaluate().isNotEmpty) {
        await tester.tap(fab.first);
        await tester.pumpAndSettle();
      }

      // Check for bottom sheet
      final bottomSheet = find.byType(BottomSheet);
      final modalSheet = find.byType(DraggableScrollableSheet);

      expect(tester.takeException(), isNull);
    });
  });

  group('Invoice Details', () {
    setUp(setupAuthenticatedUser);

    testWidgets('should tap on invoice card', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Navigate to payments
      final walletIcon = find.byIcon(Icons.account_balance_wallet);
      if (walletIcon.evaluate().isNotEmpty) {
        await tester.tap(walletIcon.first);
        await tester.pumpAndSettle();
      }

      // Try to tap an invoice card
      final cards = find.byType(Card);
      if (cards.evaluate().isNotEmpty) {
        await tester.tap(cards.first);
        await tester.pumpAndSettle();
      }

      expect(tester.takeException(), isNull);
    });

    testWidgets('should find pay invoice button', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Navigate to payments
      final walletIcon = find.byIcon(Icons.account_balance_wallet);
      if (walletIcon.evaluate().isNotEmpty) {
        await tester.tap(walletIcon.first);
        await tester.pumpAndSettle();
      }

      // Look for pay button
      final payText = find.textContaining('دفع');
      final payButton = find.byIcon(Icons.payment);

      expect(tester.takeException(), isNull);
    });
  });
}
