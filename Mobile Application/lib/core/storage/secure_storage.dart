import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

/// Secure Storage Helper Class
/// Wrapper around SharedPreferences for consistent storage operations
class SecureStorage {
  // Keys
  static const String _tokenKey = 'auth_token';
  static const String _userDataKey = 'user_data';

  /// Save JWT Token
  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  /// Get JWT Token
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  /// Delete JWT Token
  static Future<void> deleteToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
  }

  /// Save User Data as JSON
  static Future<void> saveUserData(Map<String, dynamic> userData) async {
    final prefs = await SharedPreferences.getInstance();
    final userDataString = jsonEncode(userData);
    await prefs.setString(_userDataKey, userDataString);
  }

  /// Get User Data as JSON
  static Future<Map<String, dynamic>?> getUserData() async {
    final prefs = await SharedPreferences.getInstance();
    final userDataString = prefs.getString(_userDataKey);

    if (userDataString == null || userDataString.isEmpty) {
      return null;
    }

    try {
      return jsonDecode(userDataString) as Map<String, dynamic>;
    } catch (e) {
      print('Error decoding user data: $e');
      return null;
    }
  }

  /// Delete User Data
  static Future<void> deleteUserData() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_userDataKey);
  }

  /// Clear All Stored Data (Logout)
  static Future<void> clearAll() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }

  /// Check if user is logged in
  static Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }
}
