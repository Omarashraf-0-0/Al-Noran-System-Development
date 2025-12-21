import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:alnoran_mobile_application/core/storage/secure_storage.dart';

void main() {
  group('SecureStorage', () {
    setUp(() {
      // Initialize mock SharedPreferences before each test
      SharedPreferences.setMockInitialValues({});
    });

    // ==================== Token Operations ====================
    group('Token Operations', () {
      test('saveToken should store token in SharedPreferences', () async {
        const testToken = 'test_jwt_token_12345';

        await SecureStorage.saveToken(testToken);

        final prefs = await SharedPreferences.getInstance();
        expect(prefs.getString('auth_token'), equals(testToken));
      });

      test('getToken should retrieve stored token', () async {
        SharedPreferences.setMockInitialValues({
          'auth_token': 'stored_token_xyz',
        });

        final token = await SecureStorage.getToken();

        expect(token, equals('stored_token_xyz'));
      });

      test('getToken should return null when no token exists', () async {
        final token = await SecureStorage.getToken();

        expect(token, isNull);
      });

      test('deleteToken should remove token from storage', () async {
        SharedPreferences.setMockInitialValues({
          'auth_token': 'token_to_delete',
        });

        await SecureStorage.deleteToken();

        final prefs = await SharedPreferences.getInstance();
        expect(prefs.getString('auth_token'), isNull);
      });
    });

    // ==================== User Data Operations ====================
    group('User Data Operations', () {
      test('saveUserData should store user data as JSON', () async {
        final userData = {
          '_id': 'user_123',
          'fullname': 'Test User',
          'email': 'test@example.com',
        };

        await SecureStorage.saveUserData(userData);

        final prefs = await SharedPreferences.getInstance();
        final storedData = prefs.getString('user_data');
        expect(storedData, isNotNull);
        expect(storedData, contains('user_123'));
        expect(storedData, contains('Test User'));
      });

      test('getUserData should retrieve stored user data as Map', () async {
        SharedPreferences.setMockInitialValues({
          'user_data':
              '{"_id":"user_456","fullname":"John Doe","email":"john@example.com"}',
        });

        final userData = await SecureStorage.getUserData();

        expect(userData, isNotNull);
        expect(userData!['_id'], equals('user_456'));
        expect(userData['fullname'], equals('John Doe'));
        expect(userData['email'], equals('john@example.com'));
      });

      test('getUserData should return null when no data exists', () async {
        final userData = await SecureStorage.getUserData();

        expect(userData, isNull);
      });

      test('getUserData should return null for empty string', () async {
        SharedPreferences.setMockInitialValues({'user_data': ''});

        final userData = await SecureStorage.getUserData();

        expect(userData, isNull);
      });

      test('getUserData should return null for invalid JSON', () async {
        SharedPreferences.setMockInitialValues({
          'user_data': 'not valid json {{{',
        });

        final userData = await SecureStorage.getUserData();

        expect(userData, isNull);
      });

      test('deleteUserData should remove user data from storage', () async {
        SharedPreferences.setMockInitialValues({
          'user_data': '{"_id":"user_123"}',
        });

        await SecureStorage.deleteUserData();

        final prefs = await SharedPreferences.getInstance();
        expect(prefs.getString('user_data'), isNull);
      });
    });

    // ==================== Clear All & Login State ====================
    group('Clear All & Login State', () {
      test('clearAll should remove all stored data', () async {
        SharedPreferences.setMockInitialValues({
          'auth_token': 'some_token',
          'user_data': '{"_id":"user_123"}',
          'other_key': 'other_value',
        });

        await SecureStorage.clearAll();

        final prefs = await SharedPreferences.getInstance();
        expect(prefs.getKeys(), isEmpty);
      });

      test('isLoggedIn should return true when token exists', () async {
        SharedPreferences.setMockInitialValues({'auth_token': 'valid_token'});

        final isLoggedIn = await SecureStorage.isLoggedIn();

        expect(isLoggedIn, isTrue);
      });

      test('isLoggedIn should return false when no token exists', () async {
        final isLoggedIn = await SecureStorage.isLoggedIn();

        expect(isLoggedIn, isFalse);
      });

      test(
        'isLoggedIn should return false when token is empty string',
        () async {
          SharedPreferences.setMockInitialValues({'auth_token': ''});

          final isLoggedIn = await SecureStorage.isLoggedIn();

          expect(isLoggedIn, isFalse);
        },
      );
    });

    // ==================== Integration Scenarios ====================
    group('Integration Scenarios', () {
      test('full login/logout cycle should work correctly', () async {
        // 1. Initially not logged in
        expect(await SecureStorage.isLoggedIn(), isFalse);

        // 2. Save token and user data (login)
        await SecureStorage.saveToken('new_session_token');
        await SecureStorage.saveUserData({
          '_id': 'new_user',
          'fullname': 'New User',
          'email': 'new@example.com',
        });

        // 3. Verify logged in state
        expect(await SecureStorage.isLoggedIn(), isTrue);
        expect(await SecureStorage.getToken(), equals('new_session_token'));

        final userData = await SecureStorage.getUserData();
        expect(userData!['_id'], equals('new_user'));

        // 4. Clear all (logout)
        await SecureStorage.clearAll();

        // 5. Verify logged out state
        expect(await SecureStorage.isLoggedIn(), isFalse);
        expect(await SecureStorage.getToken(), isNull);
        expect(await SecureStorage.getUserData(), isNull);
      });
    });
  });
}
