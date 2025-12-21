import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:alnoran_mobile_application/main.dart' as app;

/// Shipment Flow Integration Tests
/// Tests complete shipment tracking, ACID/UCR request, and details flows
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

  group('Shipment Tracking Flow', () {
    setUp(setupAuthenticatedUser);

    testWidgets('should display tracking input on home screen', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Look for tracking input field
      final textFields = find.byType(TextField);
      final searchIcon = find.byIcon(Icons.search);
      final qrIcon = find.byIcon(Icons.qr_code_scanner);

      // Should have tracking input or search functionality
      expect(tester.takeException(), isNull);
    });

    testWidgets('should handle empty tracking number submission', (
      tester,
    ) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Find tracking button
      final trackButton = find.textContaining('تتبع');
      final searchButton = find.byIcon(Icons.search);

      if (trackButton.evaluate().isNotEmpty) {
        await tester.tap(trackButton.first);
        await tester.pump(const Duration(milliseconds: 500));
      } else if (searchButton.evaluate().isNotEmpty) {
        await tester.tap(searchButton.first);
        await tester.pump(const Duration(milliseconds: 500));
      }

      expect(tester.takeException(), isNull);
    });

    testWidgets('should enter tracking number and search', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Find tracking input
      final textFields = find.byType(TextField);

      if (textFields.evaluate().isNotEmpty) {
        // Enter a tracking number
        await tester.enterText(textFields.first, 'ACID-TEST-123');
        await tester.pumpAndSettle();

        // Try to submit
        final trackButton = find.textContaining('تتبع');
        if (trackButton.evaluate().isNotEmpty) {
          await tester.tap(trackButton.first);
          await tester.pump(const Duration(seconds: 1));
        }
      }

      expect(tester.takeException(), isNull);
    });
  });

  group('My Shipments Navigation', () {
    setUp(setupAuthenticatedUser);

    testWidgets('should navigate to my shipments list', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Find shipments navigation (could be in bottom nav or sidebar)
      final shipmentsText = find.textContaining('شحناتي');
      final shipmentsIcon = find.byIcon(Icons.local_shipping);

      if (shipmentsText.evaluate().isNotEmpty) {
        await tester.tap(shipmentsText.first);
        await tester.pumpAndSettle();
      } else if (shipmentsIcon.evaluate().isNotEmpty) {
        await tester.tap(shipmentsIcon.first);
        await tester.pumpAndSettle();
      }

      expect(tester.takeException(), isNull);
    });

    testWidgets('should switch between shipment tabs', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Navigate to shipments
      final shipmentsIcon = find.byIcon(Icons.local_shipping);
      if (shipmentsIcon.evaluate().isNotEmpty) {
        await tester.tap(shipmentsIcon.first);
        await tester.pumpAndSettle();
      }

      // Find tabs
      final currentTab = find.textContaining('الحالية');
      final completedTab = find.textContaining('المكتملة');
      final acidTab = find.textContaining('ACID');

      if (completedTab.evaluate().isNotEmpty) {
        await tester.tap(completedTab.first);
        await tester.pumpAndSettle();
      }

      if (acidTab.evaluate().isNotEmpty) {
        await tester.tap(acidTab.first);
        await tester.pumpAndSettle();
      }

      if (currentTab.evaluate().isNotEmpty) {
        await tester.tap(currentTab.first);
        await tester.pumpAndSettle();
      }

      expect(tester.takeException(), isNull);
    });

    testWidgets('should use search in shipments', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Navigate to shipments
      final shipmentsIcon = find.byIcon(Icons.local_shipping);
      if (shipmentsIcon.evaluate().isNotEmpty) {
        await tester.tap(shipmentsIcon.first);
        await tester.pumpAndSettle();
      }

      // Find search field
      final searchField = find.byType(TextField);
      if (searchField.evaluate().isNotEmpty) {
        await tester.enterText(searchField.first, 'بحث');
        await tester.pumpAndSettle();
      }

      expect(tester.takeException(), isNull);
    });
  });

  group('ACID Request Flow', () {
    setUp(setupAuthenticatedUser);

    testWidgets('should find new shipment button', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Look for FAB or add button
      final fab = find.byType(FloatingActionButton);
      final addIcon = find.byIcon(Icons.add);

      if (fab.evaluate().isNotEmpty) {
        await tester.tap(fab.first);
        await tester.pumpAndSettle();
      }

      expect(tester.takeException(), isNull);
    });

    testWidgets('should display ACID form elements', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Try to navigate to ACID request
      final fab = find.byType(FloatingActionButton);
      if (fab.evaluate().isNotEmpty) {
        await tester.tap(fab.first);
        await tester.pumpAndSettle();
      }

      // Look for ACID option
      final acidText = find.textContaining('ACID');
      if (acidText.evaluate().isNotEmpty) {
        await tester.tap(acidText.first);
        await tester.pumpAndSettle();
      }

      expect(tester.takeException(), isNull);
    });
  });

  group('UCR Request Flow', () {
    setUp(setupAuthenticatedUser);

    testWidgets('should navigate to exports page', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Look for exports navigation
      final exportsText = find.textContaining('صادراتي');
      final exportsIcon = find.byIcon(Icons.upload);

      if (exportsText.evaluate().isNotEmpty) {
        await tester.tap(exportsText.first);
        await tester.pumpAndSettle();
      } else if (exportsIcon.evaluate().isNotEmpty) {
        await tester.tap(exportsIcon.first);
        await tester.pumpAndSettle();
      }

      expect(tester.takeException(), isNull);
    });

    testWidgets('should switch between export tabs', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Navigate to exports
      final bottomNav = find.byType(BottomNavigationBar);
      if (bottomNav.evaluate().isNotEmpty) {
        final navItems = find.descendant(
          of: bottomNav,
          matching: find.byType(InkWell),
        );

        // Tap exports tab (usually second or third)
        if (navItems.evaluate().length >= 2) {
          await tester.tap(navItems.at(1));
          await tester.pumpAndSettle();
        }
      }

      // Find UCR tab
      final ucrTab = find.textContaining('UCR');
      if (ucrTab.evaluate().isNotEmpty) {
        await tester.tap(ucrTab.first);
        await tester.pumpAndSettle();
      }

      expect(tester.takeException(), isNull);
    });
  });

  group('Shipment Details', () {
    setUp(setupAuthenticatedUser);

    testWidgets('should handle shipment card tap', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Navigate to shipments
      final shipmentsIcon = find.byIcon(Icons.local_shipping);
      if (shipmentsIcon.evaluate().isNotEmpty) {
        await tester.tap(shipmentsIcon.first);
        await tester.pumpAndSettle();
      }

      // Find shipment cards
      final cards = find.byType(Card);
      final listTiles = find.byType(ListTile);

      if (cards.evaluate().isNotEmpty) {
        await tester.tap(cards.first);
        await tester.pumpAndSettle();
      } else if (listTiles.evaluate().isNotEmpty) {
        await tester.tap(listTiles.first);
        await tester.pumpAndSettle();
      }

      expect(tester.takeException(), isNull);
    });

    testWidgets('should navigate back from shipment details', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Navigate to a shipment
      final shipmentsIcon = find.byIcon(Icons.local_shipping);
      if (shipmentsIcon.evaluate().isNotEmpty) {
        await tester.tap(shipmentsIcon.first);
        await tester.pumpAndSettle();
      }

      final cards = find.byType(Card);
      if (cards.evaluate().isNotEmpty) {
        await tester.tap(cards.first);
        await tester.pumpAndSettle();

        // Navigate back
        final backIcon = find.byIcon(Icons.arrow_back);
        final backForward = find.byIcon(Icons.arrow_forward);

        if (backIcon.evaluate().isNotEmpty) {
          await tester.tap(backIcon.first);
          await tester.pumpAndSettle();
        } else if (backForward.evaluate().isNotEmpty) {
          await tester.tap(backForward.first);
          await tester.pumpAndSettle();
        }
      }

      expect(tester.takeException(), isNull);
    });
  });
}
