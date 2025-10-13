import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // Base URL من ngrok
  static const String baseUrl = 'https://c146f6f88dcb.ngrok-free.app';

  // Login API
  static Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/auth/login'),
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true', // مهم لـ ngrok
        },
        body: jsonEncode({'email': email, 'password': password}),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        // نجح تسجيل الدخول
        if (data['token'] != null) {
          // حفظ الـ token
          await saveToken(data['token']);
        }
        return {
          'success': true,
          'message': data['message'] ?? 'تم تسجيل الدخول بنجاح',
          'data': data,
        };
      } else {
        // فشل تسجيل الدخول
        return {
          'success': false,
          'message': data['message'] ?? 'فشل تسجيل الدخول',
          'error': data['error'],
        };
      }
    } catch (e) {
      // خطأ في الاتصال
      return {
        'success': false,
        'message': 'خطأ في الاتصال بالسيرفر',
        'error': e.toString(),
      };
    }
  }

  // Register API
  static Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String phone,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/auth/register'),
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: jsonEncode({
          'name': name,
          'email': email,
          'phone': phone,
          'password': password,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (data['token'] != null) {
          await saveToken(data['token']);
        }
        return {
          'success': true,
          'message': data['message'] ?? 'تم التسجيل بنجاح',
          'data': data,
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'فشل التسجيل',
          'error': data['error'],
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'خطأ في الاتصال بالسيرفر',
        'error': e.toString(),
      };
    }
  }

  // حفظ الـ Token
  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
  }

  // جلب الـ Token
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  // حذف الـ Token (Logout)
  static Future<void> removeToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
  }

  // التحقق من تسجيل الدخول
  static Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }
}
