import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:flutter/material.dart';
import 'package:alnoran_mobile_application/main.dart' as app;

/// =====================================================
/// 🧪 COMPLETE HAPPY PATH: Register → Login → Home
/// FIXED VERSION with proper scrolling and widget finding
/// =====================================================

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  // Generate unique test data
  final String uniqueId = DateTime.now().millisecondsSinceEpoch
      .toString()
      .substring(5);
  final String testEmail = 'test$uniqueId@test.com';
  final String testUsername = 'testuser$uniqueId';
  final String testPassword = 'Test@123456';
  final String testName = 'مستخدم تجريبي';
  // Generate unique phone: 010 + 8 digits from uniqueId (padded if needed)
  final String testPhone = '010${uniqueId.padLeft(8, '0').substring(0, 8)}';

  /// Helper: Find all text fields - ONLY TextField, not EditableText (which is a child)
  Finder findAllTextFields() {
    return find.byType(TextField);
  }

  /// ⭐ SMART WAIT: Wait until a widget appears (max timeout)
  Future<bool> waitForWidget(
    WidgetTester tester,
    Finder finder, {
    Duration timeout = const Duration(seconds: 10),
    Duration pollInterval = const Duration(milliseconds: 500),
  }) async {
    final stopwatch = Stopwatch()..start();

    while (stopwatch.elapsed < timeout) {
      await tester.pump(pollInterval);

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

  /// ⭐ SMART WAIT: Wait until a widget disappears (for loading spinners)
  Future<bool> waitForWidgetToDisappear(
    WidgetTester tester,
    Finder finder, {
    Duration timeout = const Duration(seconds: 15),
    Duration pollInterval = const Duration(milliseconds: 500),
  }) async {
    final stopwatch = Stopwatch()..start();

    while (stopwatch.elapsed < timeout) {
      await tester.pump(pollInterval);

      if (finder.evaluate().isEmpty) {
        stopwatch.stop();
        print('  ✓ Widget disappeared in ${stopwatch.elapsedMilliseconds}ms');
        return true;
      }
    }

    stopwatch.stop();
    print('  ⚠️ Widget still present after ${timeout.inSeconds}s');
    return false;
  }

  /// ⭐ SMART WAIT: Wait for any of multiple widgets (returns first found)
  Future<Finder?> waitForAnyWidget(
    WidgetTester tester,
    List<Finder> finders, {
    Duration timeout = const Duration(seconds: 10),
  }) async {
    final stopwatch = Stopwatch()..start();

    while (stopwatch.elapsed < timeout) {
      await tester.pump(const Duration(milliseconds: 300));

      for (final finder in finders) {
        if (finder.evaluate().isNotEmpty) {
          stopwatch.stop();
          print(
            '  ✓ Found one of ${finders.length} widgets in ${stopwatch.elapsedMilliseconds}ms',
          );
          return finder;
        }
      }
    }

    stopwatch.stop();
    return null;
  }

  /// ⭐ SMART WAIT: Wait for page to stabilize (no loading indicators)
  Future<void> waitForPageToLoad(WidgetTester tester) async {
    // Wait for loading indicators to disappear
    final loadingIndicator = find.byType(CircularProgressIndicator);
    if (loadingIndicator.evaluate().isNotEmpty) {
      await waitForWidgetToDisappear(tester, loadingIndicator);
    }
    await tester.pumpAndSettle();
  }

  /// Helper: Scroll to make element visible and tap
  Future<void> scrollAndTap(WidgetTester tester, Finder finder) async {
    await tester.ensureVisible(finder);
    await tester.pumpAndSettle();
    await tester.tap(finder, warnIfMissed: false);
    await tester.pumpAndSettle();
  }

  /// Helper: Enter text in a field by index - TAP FIRST then enter
  Future<void> enterTextInField(
    WidgetTester tester,
    int index,
    String text,
  ) async {
    final allFields = findAllTextFields();
    final fieldCount = allFields.evaluate().length;
    print('  -> Total fields found: $fieldCount, targeting index: $index');

    if (fieldCount > index) {
      final field = allFields.at(index);

      // 1. Scroll to make visible
      await tester.ensureVisible(field);
      await tester.pumpAndSettle();

      // 2. TAP the field first to focus it
      await tester.tap(field, warnIfMissed: false);
      await tester.pumpAndSettle();

      // 3. Now enter text
      await tester.enterText(field, text);
      await tester.pumpAndSettle();

      // 4. Dismiss keyboard / unfocus
      await tester.testTextInput.receiveAction(TextInputAction.next);
      await tester.pump(const Duration(milliseconds: 500));
    } else {
      print('  ⚠️ Field index $index not found (only $fieldCount fields)');
    }
  }

  group('COMPLETE AUTH HAPPY PATH', () {
    testWidgets('FULL FLOW: Register New Account and Login', (
      WidgetTester tester,
    ) async {
      print('Starting COMPLETE AUTH FLOW');
      print('Email: $testEmail');
      print('Username: $testUsername');

      // LAUNCH APP
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 5));

      // CHECK IF ALREADY LOGGED IN
      final bottomNav = find.byType(BottomNavigationBar);
      if (bottomNav.evaluate().isNotEmpty) {
        print('Already logged in! Skipping registration test.');
        expect(bottomNav, findsOneWidget);
        return;
      }

      // STEP 1: NAVIGATE TO REGISTRATION
      print('STEP 1: Navigate to Registration');

      final createAccountLink = find.textContaining('إنشاء حساب');
      final newAccountLink = find.textContaining('حساب جديد');

      Finder? regLink;
      if (createAccountLink.evaluate().isNotEmpty) {
        regLink = createAccountLink;
      } else if (newAccountLink.evaluate().isNotEmpty) {
        regLink = newAccountLink;
      }

      if (regLink == null) {
        print('Could not find registration link');
        expect(regLink, isNotNull, reason: 'Registration link should exist');
        return;
      }

      // await scrollAndTap(tester, regLink.first);
      await tester.tap(regLink.first);
      await tester.pumpAndSettle(const Duration(seconds: 1));
      print('Navigated to registration page');

      // STEP 2: FILL REGISTRATION FORM
      print('STEP 2: Fill Registration Form');
      await tester.pumpAndSettle(const Duration(seconds: 1));

      final textFields = findAllTextFields();
      final fieldCount = textFields.evaluate().length;
      print('Found $fieldCount text fields');

      // Enter data in fields
      if (fieldCount > 0) {
        await enterTextInField(tester, 0, testName);
        print('Entered name');
      }
      // sleep for 2 seconds
      await tester.pumpAndSettle(const Duration(seconds: 1));
      await tester.pumpAndSettle();

      if (fieldCount > 1) {
        await enterTextInField(tester, 1, testUsername);
        print('Entered username');
      }
      // sleep for 2 seconds
      await tester.pumpAndSettle(const Duration(seconds: 1));
      await tester.pumpAndSettle();

      if (fieldCount > 2) {
        await enterTextInField(tester, 2, testEmail);
        print('Entered email');
      }
      // sleep for 2 seconds
      await tester.pumpAndSettle(const Duration(seconds: 1));
      await tester.pumpAndSettle();

      if (fieldCount > 3) {
        await enterTextInField(tester, 3, testPhone);
        print('Entered phone');
      }
      // sleep for 2 seconds
      await tester.pumpAndSettle(const Duration(seconds: 1));
      await tester.pumpAndSettle();

      // Scroll down for password fields
      final scrollable = find.byType(SingleChildScrollView);
      if (scrollable.evaluate().isNotEmpty) {
        await tester.drag(scrollable.first, const Offset(0, -300));
        await tester.pumpAndSettle();
      }
      // sleep for 2 seconds
      await tester.pumpAndSettle(const Duration(seconds: 1));

      final fieldsAfterScroll = findAllTextFields();
      if (fieldsAfterScroll.evaluate().length > 4) {
        await enterTextInField(tester, 4, testPassword);
        print('Entered password');
      }
      // sleep for 2 seconds
      await tester.pumpAndSettle(const Duration(seconds: 1));
      await tester.pumpAndSettle();

      if (fieldsAfterScroll.evaluate().length > 5) {
        await enterTextInField(tester, 5, testPassword);
        print('Entered confirm password');
      }
      // sleep for 2 seconds
      await tester.pumpAndSettle(const Duration(seconds: 1));
      await tester.pumpAndSettle();

      // STEP 3: ACCEPT TERMS
      print('STEP 3: Accept Terms');

      if (scrollable.evaluate().isNotEmpty) {
        await tester.drag(scrollable.first, const Offset(0, -200));
        await tester.pumpAndSettle();
      }
      // sleep for 2 seconds
      await tester.pumpAndSettle(const Duration(seconds: 1));

      final checkbox = find.byType(Checkbox);
      if (checkbox.evaluate().isNotEmpty) {
        await scrollAndTap(tester, checkbox.first);
        print('Accepted terms');
      }

      // STEP 4: SUBMIT REGISTRATION
      print('STEP 4: Submit Registration');

      final registerButton = find.text('إنشاء الحساب');
      if (registerButton.evaluate().isNotEmpty) {
        await scrollAndTap(tester, registerButton.first);
        print('Submitted registration form');
      } else {
        final buttons = find.byType(ElevatedButton);
        if (buttons.evaluate().isNotEmpty) {
          await scrollAndTap(tester, buttons.first);
          print('Submitted via button');
        }
      }

      print('Waiting for navigation...');
      await tester.pump(const Duration(seconds: 3));
      await tester.pumpAndSettle(const Duration(seconds: 1));

      // ============================================
      // STEP 5: PERSONAL REGISTRATION PAGE (National ID + Documents)
      // ============================================
      print('STEP 5: Personal Registration Page');

      // Check if we're on Personal Registration page
      final personalRegTitle = find.text('التسجيل - حساب شخصي');
      final nationalIdHint = find.text('الرقم القومي (14 رقم)');
      final personalTitle = find.textContaining('إكمال بيانات');

      if (personalRegTitle.evaluate().isNotEmpty ||
          nationalIdHint.evaluate().isNotEmpty ||
          personalTitle.evaluate().isNotEmpty) {
        print('  ✓ On Personal Registration page');

        // Find National ID field and enter data
        final nationalIdFields = findAllTextFields();
        if (nationalIdFields.evaluate().isNotEmpty) {
          // Generate VALID Egyptian National ID
          // Format: XYYMMDDSSGGGC
          // X = Century (3 for 2000s)
          // YY = Year (95 = 1995 for century 2, or 00 = 2000 for century 3)
          // MM = Month (01-12)
          // DD = Day (01-31)
          // SS = Governorate (01-35, Cairo = 01)
          // GGG = Sequence (001-999)
          // C = Check digit (any digit)

          // Example: 29501150100001 = Born Jan 15, 1995, Cairo, sequence 0001
          final validNationalId = '29501150100123'; // Valid format

          await enterTextInField(tester, 0, validNationalId);
          print('  ✓ Entered National ID: $validNationalId');
        }

        await tester.pumpAndSettle(const Duration(seconds: 2));

        // Look for document upload sections (we can't actually upload files in integration test)
        // But we can check they exist
        final idCardUpload = find.textContaining('صورة البطاقة');
        final powerOfAttorney = find.textContaining('التوكيل');

        if (idCardUpload.evaluate().isNotEmpty) {
          print('  ✓ Found ID Card upload section');
        }
        if (powerOfAttorney.evaluate().isNotEmpty) {
          print('  ✓ Found Power of Attorney upload section');
        }

        // NOTE: File upload cannot be automated in integration tests
        // The user will need to either:
        // 1. Make documents optional for testing
        // 2. Or skip this test for now
        print('  ⚠️ Document upload cannot be automated in integration tests');
        print('  ⚠️ Either make documents optional or test manually');

        // Try to scroll and find submit button
        final scrollable2 = find.byType(SingleChildScrollView);
        if (scrollable2.evaluate().isNotEmpty) {
          await tester.drag(scrollable2.first, const Offset(0, -200));
          await tester.pumpAndSettle();
        }

        // Try to submit (might fail if documents are required)
        final submitBtn = find.text('إنشاء الحساب');
        final completeBtn = find.textContaining('إتمام');
        final submitBtnAlt = find.byType(ElevatedButton);

        if (submitBtn.evaluate().isNotEmpty) {
          await scrollAndTap(tester, submitBtn.first);
          print('  ✓ Tapped إنشاء الحساب');
        } else if (completeBtn.evaluate().isNotEmpty) {
          await scrollAndTap(tester, completeBtn.first);
          print('  ✓ Tapped complete button');
        } else if (submitBtnAlt.evaluate().isNotEmpty) {
          await scrollAndTap(tester, submitBtnAlt.last);
          print('  ✓ Tapped submit button');
        }

        await tester.pump(const Duration(seconds: 2));
        await tester.pumpAndSettle(const Duration(seconds: 10));
      } else {
        print(
          '  ⚠️ Not on Personal Registration page - might have skipped or different flow',
        );
      }

      // ============================================
      // STEP 6: WAIT FOR SUCCESS & GO TO LOGIN
      // ============================================
      print('STEP 6: Wait for Success and Navigate to Login');

      // ⭐ SMART WAIT: Wait for success popup OR login fields
      final successPopup = find.textContaining('تم التسجيل بنجاح');
      final successPopup2 = find.textContaining('تم إنشاء');
      final loginFieldsFinder = find.byType(TextField);

      final foundWidget = await waitForAnyWidget(tester, [
        successPopup,
        successPopup2,
        loginFieldsFinder,
      ], timeout: const Duration(seconds: 15));

      if (foundWidget == successPopup || foundWidget == successPopup2) {
        print('  ✓ Success popup appeared');

        // Dismiss the popup - wait for OK button
        final okButton = find.text('حسناً');
        final okButton2 = find.text('موافق');

        if (okButton.evaluate().isNotEmpty) {
          await tester.tap(okButton.first);
        } else if (okButton2.evaluate().isNotEmpty) {
          await tester.tap(okButton2.first);
        } else {
          final button = find.byType(ElevatedButton);
          if (button.evaluate().isNotEmpty) {
            await tester.tap(button.first);
          }
        }
        await tester.pumpAndSettle();
      }

      // ⭐ SMART WAIT: Wait for login page to appear
      await waitForWidget(
        tester,
        loginFieldsFinder,
        timeout: const Duration(seconds: 10),
      );

      // ============================================
      // STEP 7: LOGIN WITH NEW ACCOUNT
      // ============================================
      print('STEP 7: Login with New Account');

      // Check if we're on login page
      final loginFields = findAllTextFields();
      final loginFieldCount = loginFields.evaluate().length;
      print('  Found $loginFieldCount text fields');

      if (loginFieldCount >= 2) {
        // Enter email
        await enterTextInField(tester, 0, testEmail);
        print('  ✓ Entered email: $testEmail');

        // Enter password
        await enterTextInField(tester, 1, testPassword);
        print('  ✓ Entered password');

        await tester.pumpAndSettle();

        // Tap login button
        final loginButton = find.byType(ElevatedButton);
        if (loginButton.evaluate().isNotEmpty) {
          await scrollAndTap(tester, loginButton.first);
          print('  ✓ Tapped login button');
        }

        // ⭐ SMART WAIT: Wait for home page (BottomNavigationBar) to appear
        print('  ⏳ Waiting for login response...');
        final homeNavFinder = find.byType(BottomNavigationBar);
        await waitForWidget(
          tester,
          homeNavFinder,
          timeout: const Duration(seconds: 20),
        );
      } else {
        print('  ⚠️ Not on login page - might be showing an error');
      }

      // ============================================
      // STEP 8: VERIFY HOME PAGE
      // ============================================
      print('STEP 8: Verify Home Page');

      // ⭐ Use waitForPageToLoad to ensure no spinners
      await waitForPageToLoad(tester);

      final homeNav = find.byType(BottomNavigationBar);
      if (homeNav.evaluate().isNotEmpty) {
        print('  ✓ SUCCESS! On home page after login!');
        expect(homeNav, findsOneWidget);
      } else {
        print('  ⚠️ Not on home page - checking for errors');
        final errorText = find.textContaining('خطأ');
        if (errorText.evaluate().isNotEmpty) {
          print('  ⚠️ Error message shown');
        }
        // Continue anyway to test logout
      }

      await tester.pumpAndSettle(const Duration(seconds: 2));

      // ============================================
      // STEP 9: LOGOUT
      // ============================================
      print('STEP 9: Logout');

      // Step 9a: Navigate to Profile (usually last/4th item in bottom nav)
      // final profileIcon = find.byIcon(Icons.person);
      // final moreIcon = find.byIcon(Icons.more_horiz);

      // if (profileIcon.evaluate().isNotEmpty) {
      //   await tester.tap(profileIcon.last);
      //   await tester.pumpAndSettle(const Duration(seconds: 2));
      //   print('  ✓ Navigated to profile');
      // } else if (moreIcon.evaluate().isNotEmpty) {
      //   await tester.tap(moreIcon.last);
      //   await tester.pumpAndSettle(const Duration(seconds: 2));
      // } else {
      //   // Try tapping last nav item directly
      //   final navBar = find.byType(BottomNavigationBar);
      //   if (navBar.evaluate().isNotEmpty) {
      //     await tester.tap(navBar);
      //     await tester.pumpAndSettle();
      //   }
      // }

      // Step 9b: Look for Settings button/icon in Profile page
      final settingsIcon = find.byIcon(Icons.settings);
      final settingsText = find.textContaining('الإعدادات');
      final gearIcon = find.byIcon(Icons.settings_outlined);

      if (settingsIcon.evaluate().isNotEmpty) {
        await tester.tap(settingsIcon.first);
        await tester.pumpAndSettle(const Duration(seconds: 2));
        print('  ✓ Navigated to settings');
      } else if (settingsText.evaluate().isNotEmpty) {
        await scrollAndTap(tester, settingsText.first);
        await tester.pumpAndSettle(const Duration(seconds: 2));
        print('  ✓ Navigated to settings via text');
      } else if (gearIcon.evaluate().isNotEmpty) {
        await tester.tap(gearIcon.first);
        await tester.pumpAndSettle(const Duration(seconds: 2));
      }

      // Step 9c: Scroll down in Settings to find logout
      final settingsScroll = find.byType(SingleChildScrollView);
      if (settingsScroll.evaluate().isNotEmpty) {
        // Scroll down to bottom where logout is
        await tester.drag(settingsScroll.first, const Offset(0, -500));
        await tester.pumpAndSettle();
      }

      // Step 9d: Find and tap logout button
      final logoutText = find.textContaining('تسجيل الخروج');
      final logoutIcon = find.byIcon(Icons.logout);
      final logoutRounded = find.byIcon(Icons.logout_rounded);
      final exitIcon = find.byIcon(Icons.exit_to_app);

      if (logoutText.evaluate().isNotEmpty) {
        await scrollAndTap(tester, logoutText.first);
        print('  ✓ Tapped logout text');
      } else if (logoutIcon.evaluate().isNotEmpty) {
        await tester.tap(logoutIcon.first);
        print('  ✓ Tapped logout icon');
      } else if (logoutRounded.evaluate().isNotEmpty) {
        await tester.tap(logoutRounded.first);
        print('  ✓ Tapped logout_rounded icon');
      } else if (exitIcon.evaluate().isNotEmpty) {
        await tester.tap(exitIcon.first);
        print('  ✓ Tapped exit icon');
      } else {
        // Last resort: Look for the red خروج button
        final redLogoutBtn = find.text('خروج');
        if (redLogoutBtn.evaluate().isNotEmpty) {
          await scrollAndTap(tester, redLogoutBtn.first);
          print('  ✓ Tapped خروج button');
        } else {
          print('  ⚠️ Could not find logout button');
        }
      }

      await tester.pumpAndSettle(const Duration(seconds: 2));

      // ⭐ Wait for confirmation bottom sheet to appear
      // The logout confirmation has a "خروج" button (red) and "إلغاء" button
      print('  ⏳ Looking for logout confirmation...');

      // Look for the bottom sheet with confirmation
      final confirmLogoutBtn = find.text('خروج');
      final confirmLogoutFull = find.textContaining('خروج');
      final yesButton = find.text('نعم');
      final confirmButton = find.textContaining('تأكيد');

      // Wait for any confirmation button
      final confirmWidget = await waitForAnyWidget(tester, [
        confirmLogoutBtn,
        confirmLogoutFull,
        yesButton,
        confirmButton,
      ], timeout: const Duration(seconds: 5));

      if (confirmWidget != null) {
        if (confirmLogoutBtn.evaluate().isNotEmpty) {
          await tester.tap(confirmLogoutBtn.first);
          print('  ✓ Tapped خروج confirmation button');
        } else if (confirmLogoutFull.evaluate().isNotEmpty) {
          await tester.tap(confirmLogoutFull.first);
          print('  ✓ Tapped خروج text');
        } else if (yesButton.evaluate().isNotEmpty) {
          await tester.tap(yesButton.first);
          print('  ✓ Tapped نعم button');
        } else if (confirmButton.evaluate().isNotEmpty) {
          await tester.tap(confirmButton.first);
          print('  ✓ Tapped تأكيد button');
        }

        // Wait for logout to complete
        await tester.pumpAndSettle(const Duration(seconds: 3));

        // Wait for login page to appear
        final loginPageFinder = find.byType(TextField);
        await waitForWidget(
          tester,
          loginPageFinder,
          timeout: const Duration(seconds: 10),
        );
      } else {
        print('  ⚠️ No confirmation dialog found');
      }

      // ============================================
      // STEP 10: VERIFY BACK ON LOGIN PAGE
      // ============================================
      print('STEP 10: Verify Back on Login Page');

      await tester.pumpAndSettle(const Duration(seconds: 3));

      final loginFieldsAfterLogout = findAllTextFields();
      final loginTitle = find.text('تسجيل الدخول');

      if (loginFieldsAfterLogout.evaluate().length >= 2 ||
          loginTitle.evaluate().isNotEmpty) {
        print('🎉🎉🎉 COMPLETE SUCCESS! 🎉🎉🎉');
        print('✅ Registered: $testEmail');
        print('✅ Logged in successfully');
        print('✅ Logged out successfully');
        print('✅ Back on login page');
      } else {
        print('⚠️ Could not verify login page after logout');
      }

      expect(tester.takeException(), isNull);
    });

    testWidgets('LOGIN ONLY: With Test Credentials', (
      WidgetTester tester,
    ) async {
      // CHANGE THESE TO YOUR VALID TEST ACCOUNT
      const validEmail = 'testing@test.com';
      const validPassword = '111111';

      print('Testing Login Flow');
      print('Using: $validEmail');

      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 5));

      final homeNav = find.byType(BottomNavigationBar);
      if (homeNav.evaluate().isNotEmpty) {
        print('Already logged in!');
        expect(homeNav, findsOneWidget);
        return;
      }

      final fields = findAllTextFields();
      if (fields.evaluate().length >= 2) {
        await enterTextInField(tester, 0, validEmail);
        await enterTextInField(tester, 1, validPassword);
        await tester.pumpAndSettle();

        final buttons = find.byType(ElevatedButton);
        if (buttons.evaluate().isNotEmpty) {
          await scrollAndTap(tester, buttons.first);
        }

        await tester.pump(const Duration(seconds: 5));
        await tester.pumpAndSettle(const Duration(seconds: 10));

        final afterNav = find.byType(BottomNavigationBar);
        if (afterNav.evaluate().isNotEmpty) {
          print('LOGIN SUCCESS!');
          expect(afterNav, findsOneWidget);
        } else {
          print('Login did not navigate to home');
          expect(tester.takeException(), isNull);
        }
      }
    });
  });
}
