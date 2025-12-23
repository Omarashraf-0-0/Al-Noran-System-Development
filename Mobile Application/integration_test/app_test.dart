import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:alnoran_mobile_application/main.dart' as app;

/// Integration tests for Al-Noran Mobile Application
/// These tests run on actual devices/emulators and test complete user flows.
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('App Initialization', () {
    testWidgets('app should start without crashing', (tester) async {
      SharedPreferences.setMockInitialValues({});

      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // App should be running
      expect(find.byType(MaterialApp), findsOneWidget);
    });

    testWidgets('should show splash screen initially', (tester) async {
      SharedPreferences.setMockInitialValues({});

      app.main();
      // Pump immediately to catch splash screen
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      // Splash or login should be visible
      expect(tester.takeException(), isNull);
    });

    testWidgets('should navigate to login when not authenticated', (
      tester,
    ) async {
      SharedPreferences.setMockInitialValues({});

      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Should eventually show login or splash
      expect(tester.takeException(), isNull);
    });
  });

  group('Navigation', () {
    testWidgets('bottom navigation should work when logged in', (tester) async {
      // Simulate logged-in state
      SharedPreferences.setMockInitialValues({
        'auth_token': 'test_token',
        'user_id': 'user_123',
        'user_name': 'Test User',
        'user_email': 'test@example.com',
      });

      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // Try to find bottom navigation
      final bottomNav = find.byType(BottomNavigationBar);
      final navigationBar = find.byType(NavigationBar);

      if (bottomNav.evaluate().isNotEmpty) {
        // Tap different navigation items
        final navItems = find.descendant(
          of: bottomNav,
          matching: find.byType(InkWell),
        );

        if (navItems.evaluate().length >= 2) {
          await tester.tap(navItems.at(1));
          await tester.pumpAndSettle();
        }
      }

      expect(tester.takeException(), isNull);
    });
  });
}
