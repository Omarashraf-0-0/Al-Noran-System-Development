import 'dart:convert';
import 'dart:io'; // للتحقق من المنصة
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/foundation.dart'; // للتحقق من kIsWeb

class ApiService {
  // Base URL - يتغير حسب المنصة تلقائياً
  static String get baseUrl {
    // لو Web (Chrome/Edge/Firefox)
    if (kIsWeb) {
      return 'http://localhost:3500';
    }

    // لو Android Emulator
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:3500'; // Android emulator يستخدم 10.0.2.2 للوصول للـ localhost
    }

    // لو iOS Simulator أو جهاز حقيقي
    if (Platform.isIOS) {
      return 'http://localhost:3500'; // iOS simulator يستخدم localhost عادي
    }

    // Default
    return 'http://localhost:3500';
  }

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
          // حفظ بيانات المستخدم
          if (data['user'] != null) {
            await saveUserData(data['user']);
          }
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
        'message': 'خطأ في الاتصال بالسيرفر - تأكد من تشغيل السيرفر',
        'error': e.toString(),
      };
    }
  }

  // Register API
  static Future<Map<String, dynamic>> register({
    required String name,
    required String username,
    required String email,
    required String phone,
    required String password,
    required String clientType, // personal, commercial, factory
    String? ssn, // Required only for personal accounts
  }) async {
    try {
      final Map<String, dynamic> body = {
        'fullname': name,
        'username': username,
        'email': email,
        'phone': phone,
        'password': password,
        'type': 'client',
        'clientType': clientType,
      };

      // Add SSN only if it's provided (for personal accounts)
      if (ssn != null && ssn.isNotEmpty) {
        body['ssn'] = ssn;
      }

      final response = await http.post(
        Uri.parse('$baseUrl/api/auth/signup'),
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: jsonEncode(body),
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

  // حفظ بيانات المستخدم
  static Future<void> saveUserData(Map<String, dynamic> user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_id', user['id'] ?? '');
    await prefs.setString('user_name', user['fullname'] ?? '');
    await prefs.setString('user_email', user['email'] ?? '');
    await prefs.setString('user_type', user['type'] ?? '');
    await prefs.setString('username', user['username'] ?? '');
  }

  // جلب الـ Token
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  // جلب بيانات المستخدم
  static Future<Map<String, String?>> getUserData() async {
    final prefs = await SharedPreferences.getInstance();
    return {
      'id': prefs.getString('user_id'),
      'name': prefs.getString('user_name'),
      'email': prefs.getString('user_email'),
      'type': prefs.getString('user_type'),
      'username': prefs.getString('username'),
    };
  }

  // حذف الـ Token (Logout)
  static Future<void> removeToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('user_id');
    await prefs.remove('user_name');
    await prefs.remove('user_email');
    await prefs.remove('user_type');
    await prefs.remove('username');
  }

  // التحقق من تسجيل الدخول
  static Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null && token.isNotEmpty;
  }

  // ============ Password Reset APIs ============

  // Forgot Password - إرسال OTP
  static Future<Map<String, dynamic>> forgotPassword({
    required String email,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/otp/forgotPassword'),
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: jsonEncode({'email': email}),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': data['msg'] ?? 'تم إرسال رمز التحقق',
        };
      } else {
        return {
          'success': false,
          'message': data['msg'] ?? 'فشل إرسال رمز التحقق',
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

  // Resend OTP - إعادة إرسال OTP
  static Future<Map<String, dynamic>> resendOTP({required String email}) async {
    // Same as forgotPassword - resend OTP
    return forgotPassword(email: email);
  }

  // Verify OTP - التحقق من OTP
  static Future<Map<String, dynamic>> verifyOTP({
    required String email,
    required String otp,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/otp/verifyOTP'),
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: jsonEncode({'email': email, 'otp': otp}),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'message': data['msg'] ?? 'تم التحقق بنجاح'};
      } else {
        return {
          'success': false,
          'message': data['msg'] ?? 'رمز التحقق غير صحيح',
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

  // Reset Password - إعادة تعيين كلمة المرور
  static Future<Map<String, dynamic>> resetPassword({
    required String email,
    required String newPassword,
  }) async {
    try {
      final response = await http.patch(
        Uri.parse('$baseUrl/api/otp/resetPassword'),
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: jsonEncode({'email': email, 'newPassword': newPassword}),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': data['msg'] ?? 'تم تغيير كلمة المرور بنجاح',
        };
      } else {
        return {
          'success': false,
          'message': data['msg'] ?? 'فشل تغيير كلمة المرور',
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
}
