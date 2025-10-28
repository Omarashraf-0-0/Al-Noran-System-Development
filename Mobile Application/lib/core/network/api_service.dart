import 'dart:convert';
import 'dart:io'; // للتحقق من المنصة
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/foundation.dart'; // للتحقق من kIsWeb
import 'package:http_parser/http_parser.dart';

class ApiService {
  // Base URL - يتغير حسب المنصة تلقائياً
  static String get baseUrl {
    // لو Web (Chrome/Edge/Firefox)
    if (kIsWeb) {
      return 'http://localhost:3500';
    }

    // لو Android (Emulator أو Physical Device)
    if (Platform.isAndroid) {
      // للموبايل الحقيقي - استخدم IP اللابتوب على نفس الشبكة
      // تأكد إن اللابتوب والموبايل على نفس WiFi
      return 'http://192.168.1.8:3500';

      // لو Emulator فقط، استخدم:
      // return 'http://10.0.2.2:3500';
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

  // Check username/email availability before registration
  static Future<Map<String, dynamic>> checkAvailability({
    required String username,
    required String email,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/auth/check-availability'),
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: jsonEncode({'username': username, 'email': email}),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'available': data['available'] ?? false,
          'field': data['field'],
          'message': data['message'] ?? '',
        };
      } else {
        return {
          'success': false,
          'available': false,
          'message': data['message'] ?? 'فشل التحقق',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'available': false,
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

  // Upload Document - رفع مستند
  static Future<Map<String, dynamic>> uploadDocument({
    required File file,
    required String uploadType, // 'users' or 'shipments'
    String? userId,
    Map<String, dynamic>? relatedTo,
    String? description,
    List<String>? tags,
  }) async {
    try {
      var request = http.MultipartRequest(
        'POST',
        Uri.parse('$baseUrl/api/upload/$uploadType'),
      );

      // Add file
      var fileStream = http.ByteStream(file.openRead());
      var fileLength = await file.length();
      var multipartFile = http.MultipartFile(
        'document',
        fileStream,
        fileLength,
        filename: file.path.split('/').last,
        contentType: MediaType('application', 'octet-stream'),
      );
      request.files.add(multipartFile);

      // Add optional fields
      if (userId != null) {
        request.fields['uploadedBy'] = userId;
      }
      if (relatedTo != null) {
        request.fields['relatedTo'] = jsonEncode(relatedTo);
      }
      if (description != null) {
        request.fields['description'] = description;
      }
      if (tags != null) {
        request.fields['tags'] = jsonEncode(tags);
      }

      // Send request
      var streamedResponse = await request.send();
      var response = await http.Response.fromStream(streamedResponse);
      final data = jsonDecode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        return {
          'success': true,
          'message': data['message'] ?? 'تم رفع الملف بنجاح',
          'data': data,
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'فشل رفع الملف',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'خطأ في رفع الملف',
        'error': e.toString(),
      };
    }
  }

  // Upload Multiple Documents - رفع عدة مستندات
  static Future<Map<String, dynamic>> uploadMultipleDocuments({
    required List<File> files,
    required String uploadType, // 'users' or 'shipments'
    String? userId,
    Map<String, dynamic>? relatedTo,
    String? description,
    List<String>? tags,
  }) async {
    try {
      var request = http.MultipartRequest(
        'POST',
        Uri.parse('$baseUrl/api/upload/$uploadType/multiple'),
      );

      // Add files
      for (var file in files) {
        var fileStream = http.ByteStream(file.openRead());
        var fileLength = await file.length();
        var multipartFile = http.MultipartFile(
          'documents',
          fileStream,
          fileLength,
          filename: file.path.split('/').last,
          contentType: MediaType('application', 'octet-stream'),
        );
        request.files.add(multipartFile);
      }

      // Add optional fields
      if (userId != null) {
        request.fields['uploadedBy'] = userId;
      }
      if (relatedTo != null) {
        request.fields['relatedTo'] = jsonEncode(relatedTo);
      }
      if (description != null) {
        request.fields['description'] = description;
      }
      if (tags != null) {
        request.fields['tags'] = jsonEncode(tags);
      }

      // Send request
      var streamedResponse = await request.send();
      var response = await http.Response.fromStream(streamedResponse);
      final data = jsonDecode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        return {
          'success': true,
          'message': data['message'] ?? 'تم رفع الملفات بنجاح',
          'data': data,
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'فشل رفع الملفات',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'خطأ في رفع الملفات',
        'error': e.toString(),
      };
    }
  }

  // ============ S3 Upload APIs (NEW - With JWT) ============

  /// Upload Single File to S3
  /// Required: JWT token must be saved (after login/register)
  /// @param file - File to upload
  /// @param category - registration | acid | shipment | invoice | archive
  /// @param documentType - Type of document (e.g., contract, taxCard, etc.)
  /// @param relatedId - Related entity ID (shipmentId, acidId, etc.)
  /// @param userType - client | employee | admin (optional, will use logged-in user type)
  /// @param clientType - factory | commercial | personal (required for registration)
  static Future<Map<String, dynamic>> uploadToS3({
    required File file,
    required String category,
    String? documentType,
    String? relatedId,
    String? description,
    List<String>? tags,
    String? userType,
    String? clientType,
  }) async {
    try {
      print('🔵 [Upload] بدء عملية رفع الملف...');
      print('📁 File: ${file.path.split('/').last}');
      print('📂 Category: $category');
      print('📄 Document Type: $documentType');

      // Get JWT token
      final token = await getToken();
      if (token == null || token.isEmpty) {
        print('❌ [Upload] لا يوجد token - يجب تسجيل الدخول');
        return {
          'success': false,
          'message': 'يجب تسجيل الدخول أولاً',
          'error': 'No authentication token found',
        };
      }

      print('✅ Token موجود: ${token.substring(0, 20)}...');
      print('🌐 URL: $baseUrl/api/uploads');

      var request = http.MultipartRequest(
        'POST',
        Uri.parse('$baseUrl/api/uploads'),
      );

      // Add Authorization header with Bearer token
      request.headers['Authorization'] = 'Bearer $token';

      // Add file
      var fileStream = http.ByteStream(file.openRead());
      var fileLength = await file.length();
      print('📦 File size: ${(fileLength / 1024).toStringAsFixed(2)} KB');

      // Detect correct mimetype from file extension
      String fileName = file.path.split('/').last;
      String fileExtension = fileName.split('.').last.toLowerCase();

      MediaType? contentType;
      if (fileExtension == 'pdf') {
        contentType = MediaType('application', 'pdf');
      } else if (['jpg', 'jpeg'].contains(fileExtension)) {
        contentType = MediaType('image', 'jpeg');
      } else if (fileExtension == 'png') {
        contentType = MediaType('image', 'png');
      } else if (fileExtension == 'gif') {
        contentType = MediaType('image', 'gif');
      } else if (fileExtension == 'webp') {
        contentType = MediaType('image', 'webp');
      } else if (fileExtension == 'doc') {
        contentType = MediaType('application', 'msword');
      } else if (fileExtension == 'docx') {
        contentType = MediaType(
          'application',
          'vnd.openxmlformats-officedocument.wordprocessingml.document',
        );
      } else if (fileExtension == 'xls') {
        contentType = MediaType('application', 'vnd.ms-excel');
      } else if (fileExtension == 'xlsx') {
        contentType = MediaType(
          'application',
          'vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
      } else {
        // Default fallback
        contentType = MediaType('application', 'octet-stream');
      }

      print('📄 Detected mimetype: ${contentType.mimeType}');

      var multipartFile = http.MultipartFile(
        'file', // S3 route expects 'file' field
        fileStream,
        fileLength,
        filename: fileName,
        contentType: contentType,
      );
      request.files.add(multipartFile);

      // Add required fields
      request.fields['category'] = category;

      // Add optional fields
      if (documentType != null) request.fields['documentType'] = documentType;
      if (relatedId != null) request.fields['relatedId'] = relatedId;
      if (description != null) request.fields['description'] = description;
      if (tags != null) request.fields['tags'] = jsonEncode(tags);
      if (userType != null) request.fields['userType'] = userType;
      if (clientType != null) request.fields['clientType'] = clientType;

      print('📋 Fields: ${request.fields}');
      print('⏳ جاري إرسال الطلب...');

      // Send request
      var streamedResponse = await request.send();
      var response = await http.Response.fromStream(streamedResponse);

      print('📨 Response Status: ${response.statusCode}');
      print('📨 Response Body: ${response.body}');

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        print('✅✅✅ [Upload SUCCESS] تم رفع الملف بنجاح!');
        print('🔗 S3 URL: ${data['data']?['s3Url'] ?? 'N/A'}');
        return {
          'success': true,
          'message': data['message'] ?? 'تم رفع الملف بنجاح إلى S3',
          'data': data,
        };
      } else {
        print('❌❌❌ [Upload FAILED] فشل رفع الملف');
        print('Error: ${data['error'] ?? data['message']}');
        return {
          'success': false,
          'message': data['message'] ?? 'فشل رفع الملف',
          'error': data['error'],
        };
      }
    } catch (e) {
      print('💥💥💥 [Upload EXCEPTION] خطأ في رفع الملف');
      print('Exception: $e');
      return {
        'success': false,
        'message': 'خطأ في رفع الملف إلى S3',
        'error': e.toString(),
      };
    }
  }

  /// Upload Multiple Files to S3
  /// Required: JWT token must be saved
  static Future<Map<String, dynamic>> uploadMultipleToS3({
    required List<File> files,
    required String category,
    String? documentType,
    String? relatedId,
    String? description,
    List<String>? tags,
    String? userType,
    String? clientType,
  }) async {
    try {
      // Get JWT token
      final token = await getToken();
      if (token == null || token.isEmpty) {
        return {
          'success': false,
          'message': 'يجب تسجيل الدخول أولاً',
          'error': 'No authentication token found',
        };
      }

      var request = http.MultipartRequest(
        'POST',
        Uri.parse('$baseUrl/api/uploads/multiple'),
      );

      // Add Authorization header
      request.headers['Authorization'] = 'Bearer $token';

      // Add files
      for (var file in files) {
        var fileStream = http.ByteStream(file.openRead());
        var fileLength = await file.length();
        var multipartFile = http.MultipartFile(
          'files', // S3 route expects 'files' field for multiple
          fileStream,
          fileLength,
          filename: file.path.split('/').last,
          contentType: MediaType('application', 'octet-stream'),
        );
        request.files.add(multipartFile);
      }

      // Add required fields
      request.fields['category'] = category;

      // Add optional fields
      if (documentType != null) request.fields['documentType'] = documentType;
      if (relatedId != null) request.fields['relatedId'] = relatedId;
      if (description != null) request.fields['description'] = description;
      if (tags != null) request.fields['tags'] = jsonEncode(tags);
      if (userType != null) request.fields['userType'] = userType;
      if (clientType != null) request.fields['clientType'] = clientType;

      // Send request
      var streamedResponse = await request.send();
      var response = await http.Response.fromStream(streamedResponse);
      final data = jsonDecode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        return {
          'success': true,
          'message': data['message'] ?? 'تم رفع الملفات بنجاح إلى S3',
          'data': data,
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'فشل رفع الملفات',
          'error': data['error'],
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'خطأ في رفع الملفات إلى S3',
        'error': e.toString(),
      };
    }
  }

  /// Check Required Documents Status
  /// Checks if user has uploaded all required registration documents
  static Future<Map<String, dynamic>> checkRequiredDocuments() async {
    try {
      // Get JWT token
      final token = await getToken();
      if (token == null || token.isEmpty) {
        return {'success': false, 'message': 'يجب تسجيل الدخول أولاً'};
      }

      // Get user ID
      final userData = await getUserData();
      final userId = userData['id'];
      if (userId == null || userId.isEmpty) {
        return {'success': false, 'message': 'لم يتم العثور على معرف المستخدم'};
      }

      final response = await http.get(
        Uri.parse('$baseUrl/api/uploads/check-required/$userId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'data': data};
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'فشل التحقق من المستندات',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'خطأ في التحقق من المستندات',
        'error': e.toString(),
      };
    }
  }
}
