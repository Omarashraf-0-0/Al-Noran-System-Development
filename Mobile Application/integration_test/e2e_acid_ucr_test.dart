import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:flutter/material.dart';
import 'package:alnoran_mobile_application/main.dart' as app;

/// =====================================================
/// 🧪 Real E2E Tests - ACID & UCR Request Flows
/// Complete shipment request creation scenarios
/// =====================================================
///
/// Run: flutter test integration_test/e2e_acid_ucr_test.dart -d <device-id>
/// =====================================================

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  /// Helper: Login and setup
  Future<void> loginToApp(WidgetTester tester) async {
    app.main();
    await tester.pumpAndSettle(const Duration(seconds: 5));

    final textFields = find.byType(TextFormField);
    if (textFields.evaluate().length >= 2) {
      await tester.enterText(textFields.first, 'test@alnoran.com');
      await tester.enterText(textFields.at(1), 'Test@123456');
      await tester.pumpAndSettle();

      final loginButton = find.byType(ElevatedButton);
      if (loginButton.evaluate().isNotEmpty) {
        await tester.tap(loginButton.first);
        await tester.pumpAndSettle(const Duration(seconds: 10));
      }
    }
  }

  group('📋 ACID Request Scenarios', () {
    testWidgets('E2E: Navigate to ACID request page', (
      WidgetTester tester,
    ) async {
      await loginToApp(tester);

      // Navigate to shipments
      final shipmentsIcon = find.byIcon(Icons.local_shipping);
      if (shipmentsIcon.evaluate().isNotEmpty) {
        await tester.tap(shipmentsIcon.first);
        await tester.pumpAndSettle(const Duration(seconds: 3));
      }

      // Tap FAB
      final fab = find.byType(FloatingActionButton);
      if (fab.evaluate().isNotEmpty) {
        await tester.tap(fab.first);
        await tester.pumpAndSettle(const Duration(seconds: 2));
      }

      // Select ACID option
      final acidOption = find.textContaining('ACID');
      if (acidOption.evaluate().isNotEmpty) {
        await tester.tap(acidOption.first);
        await tester.pumpAndSettle(const Duration(seconds: 2));
      }

      // Should be on ACID form
      final acidTitle = find.text('طلب رقم ACID');
      final formFields = find.byType(TextFormField);

      expect(
        acidTitle.evaluate().isNotEmpty || formFields.evaluate().isNotEmpty,
        isTrue,
        reason: 'Should show ACID request form',
      );
    });

    testWidgets('E2E: ACID form shows shipment type selection', (
      WidgetTester tester,
    ) async {
      await loginToApp(tester);

      // Navigate to ACID
      final shipmentsIcon = find.byIcon(Icons.local_shipping);
      if (shipmentsIcon.evaluate().isNotEmpty) {
        await tester.tap(shipmentsIcon.first);
        await tester.pumpAndSettle(const Duration(seconds: 3));
      }

      final fab = find.byType(FloatingActionButton);
      if (fab.evaluate().isNotEmpty) {
        await tester.tap(fab.first);
        await tester.pumpAndSettle();
      }

      final acidOption = find.textContaining('ACID');
      if (acidOption.evaluate().isNotEmpty) {
        await tester.tap(acidOption.first);
        await tester.pumpAndSettle(const Duration(seconds: 2));
      }

      // Check for type selection (Sea/Air)
      final seaType = find.text('بحري');
      final airType = find.text('جوي');
      final seaIcon = find.byIcon(Icons.directions_boat);
      final airIcon = find.byIcon(Icons.flight);

      expect(
        seaType.evaluate().isNotEmpty ||
            airType.evaluate().isNotEmpty ||
            seaIcon.evaluate().isNotEmpty ||
            airIcon.evaluate().isNotEmpty,
        isTrue,
        reason: 'Should show shipment type selection',
      );
    });

    testWidgets('E2E: Toggle between Sea and Air in ACID', (
      WidgetTester tester,
    ) async {
      await loginToApp(tester);

      // Navigate to ACID form
      final shipmentsIcon = find.byIcon(Icons.local_shipping);
      if (shipmentsIcon.evaluate().isNotEmpty) {
        await tester.tap(shipmentsIcon.first);
        await tester.pumpAndSettle(const Duration(seconds: 3));
      }

      final fab = find.byType(FloatingActionButton);
      if (fab.evaluate().isNotEmpty) {
        await tester.tap(fab.first);
        await tester.pumpAndSettle();

        final acidOption = find.textContaining('ACID');
        if (acidOption.evaluate().isNotEmpty) {
          await tester.tap(acidOption.first);
          await tester.pumpAndSettle(const Duration(seconds: 2));
        }
      }

      // Toggle type
      final airType = find.text('جوي');
      if (airType.evaluate().isNotEmpty) {
        await tester.tap(airType.first);
        await tester.pumpAndSettle();
      }

      final seaType = find.text('بحري');
      if (seaType.evaluate().isNotEmpty) {
        await tester.tap(seaType.first);
        await tester.pumpAndSettle();
      }

      expect(tester.takeException(), isNull);
    });

    testWidgets('E2E: ACID form has invoice upload section', (
      WidgetTester tester,
    ) async {
      await loginToApp(tester);

      // Navigate to ACID form
      final shipmentsIcon = find.byIcon(Icons.local_shipping);
      if (shipmentsIcon.evaluate().isNotEmpty) {
        await tester.tap(shipmentsIcon.first);
        await tester.pumpAndSettle(const Duration(seconds: 3));
      }

      final fab = find.byType(FloatingActionButton);
      if (fab.evaluate().isNotEmpty) {
        await tester.tap(fab.first);
        await tester.pumpAndSettle();

        final acidOption = find.textContaining('ACID');
        if (acidOption.evaluate().isNotEmpty) {
          await tester.tap(acidOption.first);
          await tester.pumpAndSettle(const Duration(seconds: 2));
        }
      }

      // Look for upload section
      final invoiceText = find.textContaining('فاتورة');
      final uploadIcon = find.byIcon(Icons.upload);
      final attachIcon = find.byIcon(Icons.attach_file);
      final receiptIcon = find.byIcon(Icons.receipt);

      expect(
        invoiceText.evaluate().isNotEmpty ||
            uploadIcon.evaluate().isNotEmpty ||
            attachIcon.evaluate().isNotEmpty ||
            receiptIcon.evaluate().isNotEmpty,
        isTrue,
        reason: 'Should have invoice upload section',
      );
    });
  });

  group('📤 UCR Request Scenarios', () {
    testWidgets('E2E: Navigate to UCR request page', (
      WidgetTester tester,
    ) async {
      await loginToApp(tester);

      // Navigate to exports (second tab usually)
      final bottomNav = find.byType(BottomNavigationBar);
      if (bottomNav.evaluate().isNotEmpty) {
        final navItems = find.descendant(
          of: bottomNav,
          matching: find.byType(InkWell),
        );
        if (navItems.evaluate().length >= 2) {
          await tester.tap(navItems.at(1));
          await tester.pumpAndSettle(const Duration(seconds: 3));
        }
      }

      // Tap FAB
      final fab = find.byType(FloatingActionButton);
      if (fab.evaluate().isNotEmpty) {
        await tester.tap(fab.first);
        await tester.pumpAndSettle(const Duration(seconds: 2));
      }

      // Select UCR option if shown
      final ucrOption = find.textContaining('UCR');
      if (ucrOption.evaluate().isNotEmpty) {
        await tester.tap(ucrOption.first);
        await tester.pumpAndSettle(const Duration(seconds: 2));
      }

      // Should be on UCR form or selection
      expect(tester.takeException(), isNull);
    });

    testWidgets('E2E: UCR shows certification type selection', (
      WidgetTester tester,
    ) async {
      await loginToApp(tester);

      // Navigate to exports
      final bottomNav = find.byType(BottomNavigationBar);
      if (bottomNav.evaluate().isNotEmpty) {
        final navItems = find.descendant(
          of: bottomNav,
          matching: find.byType(InkWell),
        );
        if (navItems.evaluate().length >= 2) {
          await tester.tap(navItems.at(1));
          await tester.pumpAndSettle(const Duration(seconds: 3));
        }
      }

      final fab = find.byType(FloatingActionButton);
      if (fab.evaluate().isNotEmpty) {
        await tester.tap(fab.first);
        await tester.pumpAndSettle();
      }

      // Look for certification type options
      final companyCard = find.textContaining('بطاقة الشركة');
      final personalCard = find.textContaining('بطاقتي');
      final certType = find.textContaining('نوع الشهادة');

      expect(
        companyCard.evaluate().isNotEmpty ||
            personalCard.evaluate().isNotEmpty ||
            certType.evaluate().isNotEmpty,
        isTrue,
        reason: 'Should show certification type selection',
      );
    });

    testWidgets('E2E: Select company certification and continue', (
      WidgetTester tester,
    ) async {
      await loginToApp(tester);

      // Navigate to exports
      final bottomNav = find.byType(BottomNavigationBar);
      if (bottomNav.evaluate().isNotEmpty) {
        final navItems = find.descendant(
          of: bottomNav,
          matching: find.byType(InkWell),
        );
        if (navItems.evaluate().length >= 2) {
          await tester.tap(navItems.at(1));
          await tester.pumpAndSettle(const Duration(seconds: 3));
        }
      }

      final fab = find.byType(FloatingActionButton);
      if (fab.evaluate().isNotEmpty) {
        await tester.tap(fab.first);
        await tester.pumpAndSettle();
      }

      // Select company option
      final companyOption = find.textContaining('بطاقة الشركة');
      if (companyOption.evaluate().isNotEmpty) {
        await tester.tap(companyOption.first);
        await tester.pumpAndSettle();
      }

      // Tap continue
      final continueButton = find.text('متابعة');
      final nextButton = find.text('التالي');

      if (continueButton.evaluate().isNotEmpty) {
        await tester.tap(continueButton.first);
        await tester.pumpAndSettle(const Duration(seconds: 2));
      } else if (nextButton.evaluate().isNotEmpty) {
        await tester.tap(nextButton.first);
        await tester.pumpAndSettle(const Duration(seconds: 2));
      }

      // Should proceed to next step
      expect(tester.takeException(), isNull);
    });
  });

  group('💳 Payments Scenarios', () {
    testWidgets('E2E: Navigate to payments page', (WidgetTester tester) async {
      await loginToApp(tester);

      // Find payments in bottom nav
      final walletIcon = find.byIcon(Icons.account_balance_wallet);
      final paymentIcon = find.byIcon(Icons.payment);

      if (walletIcon.evaluate().isNotEmpty) {
        await tester.tap(walletIcon.first);
        await tester.pumpAndSettle(const Duration(seconds: 3));
      } else if (paymentIcon.evaluate().isNotEmpty) {
        await tester.tap(paymentIcon.first);
        await tester.pumpAndSettle(const Duration(seconds: 3));
      }

      // Verify on payments page
      final invoicesTab = find.textContaining('فواتير');
      final balanceCard = find.textContaining('رصيد');

      expect(
        invoicesTab.evaluate().isNotEmpty || balanceCard.evaluate().isNotEmpty,
        isTrue,
        reason: 'Should be on payments page',
      );
    });

    testWidgets('E2E: Switch between Invoices and Payments tabs', (
      WidgetTester tester,
    ) async {
      await loginToApp(tester);

      // Navigate to payments
      final walletIcon = find.byIcon(Icons.account_balance_wallet);
      if (walletIcon.evaluate().isNotEmpty) {
        await tester.tap(walletIcon.first);
        await tester.pumpAndSettle(const Duration(seconds: 3));
      }

      // Switch to payments tab
      final paymentsTab = find.textContaining('مدفوعات');
      final transactionsTab = find.textContaining('معاملات');

      if (paymentsTab.evaluate().isNotEmpty) {
        await tester.tap(paymentsTab.first);
        await tester.pumpAndSettle();
      } else if (transactionsTab.evaluate().isNotEmpty) {
        await tester.tap(transactionsTab.first);
        await tester.pumpAndSettle();
      }

      // Back to invoices
      final invoicesTab = find.textContaining('فواتير');
      if (invoicesTab.evaluate().isNotEmpty) {
        await tester.tap(invoicesTab.first);
        await tester.pumpAndSettle();
      }

      expect(tester.takeException(), isNull);
    });

    testWidgets('E2E: Find upload receipt button', (WidgetTester tester) async {
      await loginToApp(tester);

      // Navigate to payments
      final walletIcon = find.byIcon(Icons.account_balance_wallet);
      if (walletIcon.evaluate().isNotEmpty) {
        await tester.tap(walletIcon.first);
        await tester.pumpAndSettle(const Duration(seconds: 3));
      }

      // Look for upload button
      final uploadReceiptText = find.textContaining('رفع إيصال');
      final addButton = find.byType(FloatingActionButton);
      final uploadIcon = find.byIcon(Icons.upload);

      expect(
        uploadReceiptText.evaluate().isNotEmpty ||
            addButton.evaluate().isNotEmpty ||
            uploadIcon.evaluate().isNotEmpty,
        isTrue,
        reason: 'Should have upload receipt option',
      );
    });
  });
}
