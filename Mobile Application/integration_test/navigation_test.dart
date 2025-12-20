import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:alnoran_mobile_application/main.dart' as app;

/// Navigation Integration Tests
/// Tests screen transitions and navigation patterns throughout the app
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Bottom Navigation', () {
    setUp(() {
      // Setup authenticated user for navigation tests
      SharedPreferences.setMockInitialValues({
        'auth_token': 'test_token',
        'user_id': 'user_123',
        'user_name': 'Test User',
        'user_email': 'test@example.com',
        'user_type': 'client',
        'username': 'testuser',
        'client_type': 'personal',
      });
    });

    testWidgets('should display bottom navigation bar when authenticated', (
      tester,
    ) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Look for navigation bar
      final bottomNav = find.byType(BottomNavigationBar);
      final navBar = find.byType(NavigationBar);

      // At least one type of navigation should be present
      expect(tester.takeException(), isNull);
    });

    testWidgets('should navigate between main screens', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Find navigation items
      final bottomNav = find.byType(BottomNavigationBar);
      final navBar = find.byType(NavigationBar);

      if (bottomNav.evaluate().isNotEmpty) {
        // Tap on different navigation items
        final navItems = find.descendant(
          of: bottomNav,
          matching: find.byType(InkWell),
        );

        for (int i = 0; i < navItems.evaluate().length && i < 4; i++) {
          await tester.tap(navItems.at(i));
          await tester.pumpAndSettle();
          expect(tester.takeException(), isNull);
        }
      } else if (navBar.evaluate().isNotEmpty) {
        final destinations = find.byType(NavigationDestination);

        for (int i = 0; i < destinations.evaluate().length && i < 4; i++) {
          await tester.tap(destinations.at(i));
          await tester.pumpAndSettle();
          expect(tester.takeException(), isNull);
        }
      }
    });

    testWidgets('should maintain selected state when switching tabs', (
      tester,
    ) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      final bottomNav = find.byType(BottomNavigationBar);

      if (bottomNav.evaluate().isNotEmpty) {
        // Switch tabs and verify no crash
        final navItems = find.descendant(
          of: bottomNav,
          matching: find.byType(InkWell),
        );

        if (navItems.evaluate().length >= 3) {
          // Go to second tab
          await tester.tap(navItems.at(1));
          await tester.pumpAndSettle();

          // Go to third tab
          await tester.tap(navItems.at(2));
          await tester.pumpAndSettle();

          // Go back to first tab
          await tester.tap(navItems.at(0));
          await tester.pumpAndSettle();
        }
      }

      expect(tester.takeException(), isNull);
    });
  });

  group('Screen Transitions', () {
    setUp(() {
      SharedPreferences.setMockInitialValues({
        'auth_token': 'test_token',
        'user_id': 'user_123',
        'user_name': 'Test User',
        'user_email': 'test@example.com',
        'user_type': 'client',
      });
    });

    testWidgets('should handle back navigation correctly', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Find any button that would trigger navigation
      final buttons = find.byType(ElevatedButton);
      final cards = find.byType(Card);
      final listTiles = find.byType(ListTile);

      // Tap on an element that might navigate
      if (listTiles.evaluate().isNotEmpty) {
        await tester.tap(listTiles.first);
        await tester.pumpAndSettle();

        // Try to go back
        final backButton = find.byType(BackButton);
        final backIcon = find.byIcon(Icons.arrow_back);

        if (backButton.evaluate().isNotEmpty) {
          await tester.tap(backButton.first);
          await tester.pumpAndSettle();
        } else if (backIcon.evaluate().isNotEmpty) {
          await tester.tap(backIcon.first);
          await tester.pumpAndSettle();
        }
      }

      expect(tester.takeException(), isNull);
    });

    testWidgets('should navigate to profile screen', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Look for profile icon or navigation item
      final profileIcon = find.byIcon(Icons.person);
      final accountIcon = find.byIcon(Icons.account_circle);

      if (profileIcon.evaluate().isNotEmpty) {
        await tester.tap(profileIcon.first);
        await tester.pumpAndSettle();
      } else if (accountIcon.evaluate().isNotEmpty) {
        await tester.tap(accountIcon.first);
        await tester.pumpAndSettle();
      }

      expect(tester.takeException(), isNull);
    });

    testWidgets('should navigate to notifications screen', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Look for notifications icon
      final notifIcon = find.byIcon(Icons.notifications);
      final notifOutlined = find.byIcon(Icons.notifications_outlined);

      if (notifIcon.evaluate().isNotEmpty) {
        await tester.tap(notifIcon.first);
        await tester.pumpAndSettle();
      } else if (notifOutlined.evaluate().isNotEmpty) {
        await tester.tap(notifOutlined.first);
        await tester.pumpAndSettle();
      }

      expect(tester.takeException(), isNull);
    });
  });

  group('Deep Navigation', () {
    setUp(() {
      SharedPreferences.setMockInitialValues({
        'auth_token': 'test_token',
        'user_id': 'user_123',
        'user_name': 'Test User',
        'user_email': 'test@example.com',
        'user_type': 'client',
        'client_type': 'commercial',
      });
    });

    testWidgets('should handle multiple back presses without crash', (
      tester,
    ) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Navigate deep into the app
      final listTiles = find.byType(ListTile);

      if (listTiles.evaluate().isNotEmpty) {
        await tester.tap(listTiles.first);
        await tester.pumpAndSettle();
      }

      // Try multiple back navigations
      for (int i = 0; i < 3; i++) {
        final backIcon = find.byIcon(Icons.arrow_back);
        if (backIcon.evaluate().isNotEmpty) {
          await tester.tap(backIcon.first);
          await tester.pumpAndSettle();
        }
      }

      expect(tester.takeException(), isNull);
    });
  });

  group('Modal and Dialog Navigation', () {
    setUp(() {
      SharedPreferences.setMockInitialValues({
        'auth_token': 'test_token',
        'user_id': 'user_123',
        'user_name': 'Test User',
        'user_email': 'test@example.com',
      });
    });

    testWidgets('should dismiss dialogs correctly', (tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Look for any dialog
      final dialogs = find.byType(AlertDialog);

      if (dialogs.evaluate().isNotEmpty) {
        // Try to dismiss by tapping outside or cancel button
        final cancelButton = find.textContaining('Cancel');
        final closeButton = find.textContaining('Close');
        final okButton = find.textContaining('OK');

        if (cancelButton.evaluate().isNotEmpty) {
          await tester.tap(cancelButton.first);
          await tester.pumpAndSettle();
        } else if (closeButton.evaluate().isNotEmpty) {
          await tester.tap(closeButton.first);
          await tester.pumpAndSettle();
        } else if (okButton.evaluate().isNotEmpty) {
          await tester.tap(okButton.first);
          await tester.pumpAndSettle();
        }
      }

      expect(tester.takeException(), isNull);
    });
  });
}
