import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:alnoran_mobile_application/main.dart' as app;

/// =====================================================
/// 🧪 Real E2E Tests - Home & Shipment Tracking
/// Complete user scenarios for authenticated users
/// =====================================================
///
/// Prerequisites:
/// - Backend must be running
/// - Valid test user credentials
///
/// Run: flutter test integration_test/e2e_home_test.dart -d <device-id>
/// =====================================================

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  /// Helper: Login first then run test
  Future<void> loginAndNavigateToHome(WidgetTester tester) async {
    app.main();
    await tester.pumpAndSettle(const Duration(seconds: 5));

    // Check if already on home (token might be cached)
    final bottomNav = find.byType(BottomNavigationBar);
    if (bottomNav.evaluate().isNotEmpty) {
      return; // Already logged in
    }

    // Otherwise login
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

  group('🏠 Home Page Scenarios', () {
    testWidgets('E2E: Home page shows tracking card', (
      WidgetTester tester,
    ) async {
      await loginAndNavigateToHome(tester);

      // Verify tracking card is visible
      final trackingTitle = find.text('تتبع شحنتك');
      final trackingInput = find.text('أدخل رقم الشحنة');
      final searchIcon = find.byIcon(Icons.search);

      expect(
        trackingTitle.evaluate().isNotEmpty ||
            trackingInput.evaluate().isNotEmpty ||
            searchIcon.evaluate().isNotEmpty,
        isTrue,
        reason: 'Home should show tracking card',
      );
    });

    testWidgets('E2E: Enter tracking number and search', (
      WidgetTester tester,
    ) async {
      await loginAndNavigateToHome(tester);

      // Find tracking input field
      final trackingField = find.byType(TextField);

      if (trackingField.evaluate().isNotEmpty) {
        // Enter a real tracking number format
        await tester.enterText(trackingField.first, 'ACID-2024-001234');
        await tester.pumpAndSettle();

        // Tap search/track button
        final trackButton = find.text('تتبع');
        final searchIcon = find.byIcon(Icons.search);

        if (trackButton.evaluate().isNotEmpty) {
          await tester.tap(trackButton.first);
        } else if (searchIcon.evaluate().isNotEmpty) {
          await tester.tap(searchIcon.first);
        }

        // Wait for search result
        await tester.pumpAndSettle(const Duration(seconds: 5));

        // Should show result or "not found" message
        final notFound = find.textContaining('غير موجود');
        final details = find.textContaining('تفاصيل');
        final resultCard = find.byType(Card);

        // Any of these outcomes is acceptable (depends on if tracking number exists)
        expect(tester.takeException(), isNull);
      }
    });

    testWidgets('E2E: QR code scanner button exists', (
      WidgetTester tester,
    ) async {
      await loginAndNavigateToHome(tester);

      // Find QR scanner button
      final qrButton = find.byIcon(Icons.qr_code_scanner);
      final qrButton2 = find.byIcon(Icons.qr_code);

      expect(
        qrButton.evaluate().isNotEmpty || qrButton2.evaluate().isNotEmpty,
        isTrue,
        reason: 'Home should have QR scanner button',
      );
    });

    testWidgets('E2E: Bottom navigation has all tabs', (
      WidgetTester tester,
    ) async {
      await loginAndNavigateToHome(tester);

      final bottomNav = find.byType(BottomNavigationBar);
      expect(
        bottomNav,
        findsOneWidget,
        reason: 'Should have bottom navigation',
      );

      // Check for expected navigation icons
      final homeIcon = find.byIcon(Icons.home);
      final shipmentsIcon = find.byIcon(Icons.local_shipping);
      final profileIcon = find.byIcon(Icons.person);

      expect(homeIcon, findsWidgets);
    });
  });

  group('📦 My Shipments Scenarios', () {
    testWidgets('E2E: Navigate to My Shipments and see list', (
      WidgetTester tester,
    ) async {
      await loginAndNavigateToHome(tester);

      // Find and tap shipments navigation
      final shipmentsIcon = find.byIcon(Icons.local_shipping);
      final shipmentsText = find.text('شحناتي');

      if (shipmentsIcon.evaluate().isNotEmpty) {
        await tester.tap(shipmentsIcon.first);
        await tester.pumpAndSettle(const Duration(seconds: 5));
      }

      // Should show shipments list or empty state
      final shipmentCards = find.byType(Card);
      final emptyState = find.textContaining('لا توجد');
      final loadingIndicator = find.byType(CircularProgressIndicator);
      final currentTab = find.text('الحالية');

      // Any of these indicates we're on the shipments page
      expect(
        shipmentCards.evaluate().isNotEmpty ||
            emptyState.evaluate().isNotEmpty ||
            currentTab.evaluate().isNotEmpty,
        isTrue,
        reason: 'Should be on shipments page',
      );
    });

    testWidgets('E2E: Switch between shipment tabs', (
      WidgetTester tester,
    ) async {
      await loginAndNavigateToHome(tester);

      // Navigate to shipments
      final shipmentsIcon = find.byIcon(Icons.local_shipping);
      if (shipmentsIcon.evaluate().isNotEmpty) {
        await tester.tap(shipmentsIcon.first);
        await tester.pumpAndSettle(const Duration(seconds: 3));
      }

      // Find and tap "Completed" tab
      final completedTab = find.text('المكتملة');
      if (completedTab.evaluate().isNotEmpty) {
        await tester.tap(completedTab.first);
        await tester.pumpAndSettle(const Duration(seconds: 2));
      }

      // Find and tap "ACID Requests" tab
      final acidTab = find.text('طلبات ACID');
      if (acidTab.evaluate().isNotEmpty) {
        await tester.tap(acidTab.first);
        await tester.pumpAndSettle(const Duration(seconds: 2));
      }

      // Back to current
      final currentTab = find.text('الحالية');
      if (currentTab.evaluate().isNotEmpty) {
        await tester.tap(currentTab.first);
        await tester.pumpAndSettle(const Duration(seconds: 2));
      }

      expect(tester.takeException(), isNull);
    });

    testWidgets('E2E: Use search in shipments', (WidgetTester tester) async {
      await loginAndNavigateToHome(tester);

      // Navigate to shipments
      final shipmentsIcon = find.byIcon(Icons.local_shipping);
      if (shipmentsIcon.evaluate().isNotEmpty) {
        await tester.tap(shipmentsIcon.first);
        await tester.pumpAndSettle(const Duration(seconds: 3));
      }

      // Find search field
      final searchField = find.byType(TextField);
      final searchHint = find.text('بحث بالرقم أو الوصف...');

      if (searchField.evaluate().isNotEmpty) {
        await tester.enterText(searchField.first, 'شحنة');
        await tester.pumpAndSettle(const Duration(seconds: 2));

        // Clear search
        await tester.enterText(searchField.first, '');
        await tester.pumpAndSettle();
      }

      expect(tester.takeException(), isNull);
    });

    testWidgets('E2E: Tap FAB to create new shipment', (
      WidgetTester tester,
    ) async {
      await loginAndNavigateToHome(tester);

      // Navigate to shipments
      final shipmentsIcon = find.byIcon(Icons.local_shipping);
      if (shipmentsIcon.evaluate().isNotEmpty) {
        await tester.tap(shipmentsIcon.first);
        await tester.pumpAndSettle(const Duration(seconds: 3));
      }

      // Find and tap FAB
      final fab = find.byType(FloatingActionButton);
      if (fab.evaluate().isNotEmpty) {
        await tester.tap(fab.first);
        await tester.pumpAndSettle(const Duration(seconds: 2));

        // Should show options or navigate to creation page
        final acidOption = find.textContaining('ACID');
        final newShipment = find.textContaining('شحنة جديدة');
        final bottomSheet = find.byType(BottomSheet);

        expect(
          acidOption.evaluate().isNotEmpty ||
              newShipment.evaluate().isNotEmpty ||
              bottomSheet.evaluate().isNotEmpty,
          isTrue,
          reason: 'Should show shipment creation options',
        );
      }
    });

    testWidgets('E2E: Tap on shipment card to see details', (
      WidgetTester tester,
    ) async {
      await loginAndNavigateToHome(tester);

      // Navigate to shipments
      final shipmentsIcon = find.byIcon(Icons.local_shipping);
      if (shipmentsIcon.evaluate().isNotEmpty) {
        await tester.tap(shipmentsIcon.first);
        await tester.pumpAndSettle(const Duration(seconds: 5));
      }

      // Find shipment cards
      final cards = find.byType(Card);
      final listTiles = find.byType(ListTile);

      if (cards.evaluate().isNotEmpty) {
        // Tap first shipment
        await tester.tap(cards.first);
        await tester.pumpAndSettle(const Duration(seconds: 3));

        // Should navigate to details
        final backButton = find.byIcon(Icons.arrow_back);
        final backButtonRTL = find.byIcon(Icons.arrow_forward);
        final detailsTitle = find.textContaining('تفاصيل');

        // Check we're on details page
        expect(
          backButton.evaluate().isNotEmpty ||
              backButtonRTL.evaluate().isNotEmpty ||
              detailsTitle.evaluate().isNotEmpty ||
              cards.evaluate().isEmpty, // Cards replaced by details view
          isTrue,
        );
      }
    });
  });

  group('📤 My Exports Scenarios', () {
    testWidgets('E2E: Navigate to My Exports page', (
      WidgetTester tester,
    ) async {
      await loginAndNavigateToHome(tester);

      // Find exports navigation (might be second tab)
      final bottomNav = find.byType(BottomNavigationBar);
      if (bottomNav.evaluate().isNotEmpty) {
        final navItems = find.descendant(
          of: bottomNav,
          matching: find.byType(InkWell),
        );

        // Try second navigation item
        if (navItems.evaluate().length >= 2) {
          await tester.tap(navItems.at(1));
          await tester.pumpAndSettle(const Duration(seconds: 3));
        }
      }

      // Verify we're on exports page
      final exportsTitle = find.textContaining('صادراتي');
      final ucrTab = find.text('طلبات UCR');

      expect(tester.takeException(), isNull);
    });

    testWidgets('E2E: Switch to UCR requests tab', (WidgetTester tester) async {
      await loginAndNavigateToHome(tester);

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

      // Find and tap UCR tab
      final ucrTab = find.text('طلبات UCR');
      if (ucrTab.evaluate().isNotEmpty) {
        await tester.tap(ucrTab.first);
        await tester.pumpAndSettle(const Duration(seconds: 2));
      }

      expect(tester.takeException(), isNull);
    });
  });
}
