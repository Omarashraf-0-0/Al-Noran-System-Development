import 'package:shared_preferences/shared_preferences.dart';

/// Test helpers for Al Noran Mobile Application tests
class TestHelpers {
  /// Initialize SharedPreferences for testing
  static Future<void> initTestPreferences([Map<String, Object>? values]) async {
    SharedPreferences.setMockInitialValues(values ?? {});
  }

  /// Create a mock authenticated state
  static Future<void> setupAuthenticatedUser() async {
    SharedPreferences.setMockInitialValues({
      'auth_token': 'test_jwt_token_12345',
      'user_id': 'user_123',
      'user_name': 'Test User',
      'user_email': 'test@example.com',
      'user_type': 'client',
      'username': 'testuser',
      'client_type': 'personal',
    });
  }

  /// Create a mock unauthenticated state
  static Future<void> setupUnauthenticatedUser() async {
    SharedPreferences.setMockInitialValues({});
  }

  /// Sample valid test data
  static const Map<String, dynamic> sampleUserData = {
    '_id': 'user_123',
    'fullname': 'Test User',
    'email': 'test@example.com',
    'username': 'testuser',
    'type': 'client',
    'clientDetails': {'clientType': 'personal'},
  };

  /// Sample API responses
  static Map<String, dynamic> get successLoginResponse => {
    'success': true,
    'message': 'تم تسجيل الدخول بنجاح',
    'token': 'test_jwt_token_12345',
    'user': sampleUserData,
  };

  static Map<String, dynamic> get failureLoginResponse => {
    'success': false,
    'message': 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    'error': 'Invalid credentials',
  };
}
