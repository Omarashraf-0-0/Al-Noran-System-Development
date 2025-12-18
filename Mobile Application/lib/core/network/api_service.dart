import 'dart:convert';
import 'dart:io'; // للتحقق من المنصة
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/foundation.dart'; // للتحقق من kIsWeb
import 'package:http_parser/http_parser.dart';
import '../storage/secure_storage.dart';

class ApiService {
  // Base URL - يتغير حسب المنصة تلقائياً
  static String get baseUrl {
    // لو Web (Chrome/Edge/Firefox)
    if (kIsWeb) {
      return 'http://localhost:3500';
    }

    // لو Android (Emulator أو Physical Device)
    if (Platform.isAndroid) {
      // للـ Emulator - استخدم IP الخاص
      // return 'http://10.0.2.2:3500';

      // لو موبايل حقيقي، استخدم IP اللابتوب:
      return 'http://192.168.137.139:3500';
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
      print('🔐 [API] Login request to: $baseUrl/api/auth/login');

      final response = await http
          .post(
            Uri.parse('$baseUrl/api/auth/login'),
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true', // مهم لـ ngrok
            },
            body: jsonEncode({'email': email, 'password': password}),
          )
          .timeout(
            const Duration(seconds: 15),
            onTimeout: () {
              throw Exception('انتهت مهلة الاتصال - يرجى المحاولة مرة أخرى');
            },
          );

      print('🔐 [API] Login response status: ${response.statusCode}');
      print('🔐 [API] Login response body: ${response.body}');

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        // نجح تسجيل الدخول
        print('🔐 [API] Login successful!');
        print('🔐 [API] User data from backend: ${data['user']}');
        print(
          '🔐 [API] ClientDetails from backend: ${data['user']?['clientDetails']}',
        );

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
        print('🔐 [API] Login failed: ${data['message']}');
        return {
          'success': false,
          'message': data['message'] ?? 'فشل تسجيل الدخول',
          'error': data['error'],
        };
      }
    } catch (e) {
      // خطأ في الاتصال
      print('🔐 [API] Login exception: $e');
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

      print('📱 [Register] Sending registration request...');
      print('📱 [Register] URL: $baseUrl/api/auth/signup');
      print('📱 [Register] Body: $body');

      final response = await http.post(
        Uri.parse('$baseUrl/api/auth/signup'),
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: jsonEncode(body),
      );

      print('📱 [Register] Response status: ${response.statusCode}');
      print('📱 [Register] Response body: ${response.body}');

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (data['token'] != null) {
          await saveToken(data['token']);
          print('✅ [Register] Token saved successfully');
        }
        return {
          'success': true,
          'message': data['message'] ?? 'تم التسجيل بنجاح',
          'data': data,
        };
      } else {
        print('❌ [Register] Registration failed: ${data['message']}');
        return {
          'success': false,
          'message': data['message'] ?? 'فشل التسجيل',
          'error': data['error'],
        };
      }
    } catch (e) {
      print('❌ [Register] Exception: $e');
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
    print('💾 [saveUserData] Saving user data: $user');
    print('💾 [saveUserData] ClientDetails: ${user['clientDetails']}');

    // حفظ في SecureStorage (كامل البيانات)
    await SecureStorage.saveUserData(user);
    print('💾 [saveUserData] Saved to SecureStorage');

    // حفظ في SharedPreferences (للتوافق مع الكود القديم)
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_id', user['_id'] ?? user['id'] ?? '');
    await prefs.setString('user_name', user['fullname'] ?? '');
    await prefs.setString('user_email', user['email'] ?? '');
    await prefs.setString('user_type', user['type'] ?? '');
    await prefs.setString('username', user['username'] ?? '');

    // حفظ clientType بشكل منفصل للوصول السريع
    final clientType =
        user['clientDetails']?['clientType']?.toString() ??
        user['clientType']?.toString() ??
        'personal';
    await prefs.setString('client_type', clientType);
    print('💾 [saveUserData] ClientType saved: $clientType');
    print('💾 [saveUserData] Saved to SharedPreferences');
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
      'fullname': prefs.getString(
        'user_name',
      ), // استخدام fullname بدلاً من name
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

      // Check if file exists and has content
      if (!await file.exists()) {
        print('❌ [Upload] File does not exist at path: ${file.path}');
        return {
          'success': false,
          'message': 'الملف غير موجود',
          'error': 'File does not exist at path: ${file.path}',
        };
      }

      if (fileLength == 0) {
        print('❌ [Upload] File is empty');
        return {
          'success': false,
          'message': 'الملف فارغ',
          'error': 'File is empty',
        };
      }

      // Detect correct mimetype from file extension
      // Handle both Unix (/) and Windows (\) path separators
      String fileName = file.path.split(Platform.pathSeparator).last;
      // Also handle cases where path might have mixed separators
      if (fileName.contains('/')) {
        fileName = fileName.split('/').last;
      }
      if (fileName.contains('\\')) {
        fileName = fileName.split('\\').last;
      }
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

  /// Get User Uploads
  /// Fetches all uploaded documents for a user
  static Future<Map<String, dynamic>> getUploads({
    required String userId,
    String? category,
  }) async {
    try {
      final token = await getToken();
      if (token == null || token.isEmpty) {
        print('❌ [getUploads] No token found');
        return {'success': false, 'message': 'يجب تسجيل الدخول أولاً'};
      }

      String url = '$baseUrl/api/uploads/user/$userId';
      if (category != null && category.isNotEmpty) {
        url += '?category=$category';
      }

      print('📤 [getUploads] Requesting: $url');
      print('📤 [getUploads] Token: ${token.substring(0, 20)}...');

      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      print('📥 [getUploads] Status: ${response.statusCode}');
      print('📥 [getUploads] Body: ${response.body}');

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        print(
          '✅ [getUploads] Success! Found ${data['uploads']?.length ?? 0} uploads',
        );
        return {'success': true, 'uploads': data['uploads'] ?? []};
      } else {
        print('❌ [getUploads] Failed: ${data['message']}');
        return {
          'success': false,
          'message': data['message'] ?? 'فشل تحميل المستندات',
        };
      }
    } catch (e) {
      print('❌ [getUploads] Exception: $e');
      return {
        'success': false,
        'message': 'خطأ في تحميل المستندات',
        'error': e.toString(),
      };
    }
  }

  /// Update User Profile
  /// Updates user's personal information
  static Future<Map<String, dynamic>> updateUserProfile({
    required String userId,
    String? fullname,
    String? email,
    String? phone,
    String? nationalId,
  }) async {
    try {
      final token = await getToken();
      if (token == null || token.isEmpty) {
        return {'success': false, 'message': 'يجب تسجيل الدخول أولاً'};
      }

      final body = <String, dynamic>{};
      if (fullname != null && fullname.isNotEmpty) body['fullname'] = fullname;
      if (email != null && email.isNotEmpty) body['email'] = email;
      if (phone != null && phone.isNotEmpty) body['phone'] = phone;
      if (nationalId != null && nationalId.isNotEmpty)
        body['nationalId'] = nationalId;

      final response = await http.put(
        Uri.parse('$baseUrl/api/users/$userId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(body),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': data['message'] ?? 'تم تحديث البيانات بنجاح',
          'user': data['user'],
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'فشل تحديث البيانات',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'خطأ في تحديث البيانات',
        'error': e.toString(),
      };
    }
  }

  /// Update Client Details
  /// Updates company/business information
  static Future<Map<String, dynamic>> updateClientDetails({
    required String userId,
    String? companyName,
    String? commercialRegisterNumber,
    String? taxCardNumber,
    String? address,
  }) async {
    try {
      final token = await getToken();
      if (token == null || token.isEmpty) {
        return {'success': false, 'message': 'يجب تسجيل الدخول أولاً'};
      }

      final body = <String, dynamic>{};
      if (companyName != null && companyName.isNotEmpty) {
        body['companyName'] = companyName;
      }
      if (commercialRegisterNumber != null &&
          commercialRegisterNumber.isNotEmpty) {
        body['commercialRegisterNumber'] = commercialRegisterNumber;
      }
      if (taxCardNumber != null && taxCardNumber.isNotEmpty) {
        body['taxCardNumber'] = taxCardNumber;
      }
      if (address != null && address.isNotEmpty) {
        body['address'] = address;
      }

      final response = await http.put(
        Uri.parse('$baseUrl/api/users/$userId/client-details'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(body),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': data['message'] ?? 'تم تحديث بيانات الشركة بنجاح',
          'clientDetails': data['clientDetails'],
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'فشل تحديث بيانات الشركة',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'خطأ في تحديث بيانات الشركة',
        'error': e.toString(),
      };
    }
  }

  /// Change Password
  /// Changes user's password
  static Future<Map<String, dynamic>> changePassword({
    required String userId,
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      final token = await getToken();
      if (token == null || token.isEmpty) {
        return {'success': false, 'message': 'يجب تسجيل الدخول أولاً'};
      }

      // Use the profile change-password endpoint (without userId in URL)
      final response = await http.put(
        Uri.parse('$baseUrl/api/users/change-password'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'currentPassword': currentPassword,
          'newPassword': newPassword,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': data['message'] ?? 'تم تغيير كلمة المرور بنجاح',
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'فشل تغيير كلمة المرور',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'خطأ في تغيير كلمة المرور',
        'error': e.toString(),
      };
    }
  }

  /// Update Upload
  /// Updates upload description or other metadata
  static Future<Map<String, dynamic>> updateUpload({
    required String uploadId,
    String? description,
    List<String>? tags,
  }) async {
    try {
      final token = await getToken();
      if (token == null || token.isEmpty) {
        return {'success': false, 'message': 'يجب تسجيل الدخول أولاً'};
      }

      final body = <String, dynamic>{};
      if (description != null) body['description'] = description;
      if (tags != null) body['tags'] = tags;

      print('📝 [updateUpload] Updating upload: $uploadId');
      print('📝 [updateUpload] Body: $body');

      final response = await http.put(
        Uri.parse('$baseUrl/api/uploads/$uploadId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(body),
      );

      print('📝 [updateUpload] Response status: ${response.statusCode}');
      print('📝 [updateUpload] Response body: ${response.body}');

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': data['message'] ?? 'تم تحديث المستند بنجاح',
          'upload': data['upload'],
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'فشل تحديث المستند',
        };
      }
    } catch (e) {
      print('❌ [updateUpload] Error: $e');
      return {
        'success': false,
        'message': 'خطأ في تحديث المستند',
        'error': e.toString(),
      };
    }
  }

  /// Delete Upload
  /// Deletes an upload from S3 and database
  static Future<Map<String, dynamic>> deleteUpload({
    required String uploadId,
  }) async {
    try {
      final token = await getToken();
      if (token == null || token.isEmpty) {
        return {'success': false, 'message': 'يجب تسجيل الدخول أولاً'};
      }

      print('🗑️ [deleteUpload] Deleting upload: $uploadId');

      final response = await http.delete(
        Uri.parse('$baseUrl/api/uploads/$uploadId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      print('🗑️ [deleteUpload] Response status: ${response.statusCode}');
      print('🗑️ [deleteUpload] Response body: ${response.body}');

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'message': data['message'] ?? 'تم حذف المستند بنجاح',
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'فشل حذف المستند',
        };
      }
    } catch (e) {
      print('❌ [deleteUpload] Error: $e');
      return {
        'success': false,
        'message': 'خطأ في حذف المستند',
        'error': e.toString(),
      };
    }
  }

  // ==================== Shipments API ====================

  /// Get All Shipments
  /// Retrieves all shipments from database
  static Future<Map<String, dynamic>> getAllShipments() async {
    try {
      final token = await getToken();
      if (token == null || token.isEmpty) {
        return {'success': false, 'message': 'يجب تسجيل الدخول أولاً'};
      }

      print('🚢 [getAllShipments] Fetching shipments...');

      final response = await http.get(
        Uri.parse('$baseUrl/api/shipments/getAll'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      print('🚢 [getAllShipments] Status: ${response.statusCode}');
      print('🚢 [getAllShipments] Body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {'success': true, 'shipments': data is List ? data : []};
      } else {
        return {'success': false, 'message': 'فشل تحميل الشحنات'};
      }
    } catch (e) {
      print('❌ [getAllShipments] Error: $e');
      return {
        'success': false,
        'message': 'خطأ في تحميل الشحنات',
        'error': e.toString(),
      };
    }
  }

  /// Get Shipment By ACID
  /// Retrieves single shipment by ACID number
  static Future<Map<String, dynamic>> getShipmentByAcid({
    required String acid,
  }) async {
    try {
      final token = await getToken();
      if (token == null || token.isEmpty) {
        return {'success': false, 'message': 'يجب تسجيل الدخول أولاً'};
      }

      print('🚢 [getShipmentByAcid] Fetching shipment: $acid');

      final response = await http.get(
        Uri.parse('$baseUrl/api/shipments/$acid'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      print('🚢 [getShipmentByAcid] Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {'success': true, 'shipment': data};
      } else if (response.statusCode == 404) {
        return {'success': false, 'message': 'الشحنة غير موجودة'};
      } else {
        return {'success': false, 'message': 'فشل تحميل بيانات الشحنة'};
      }
    } catch (e) {
      print('❌ [getShipmentByAcid] Error: $e');
      return {
        'success': false,
        'message': 'خطأ في تحميل بيانات الشحنة',
        'error': e.toString(),
      };
    }
  }

  /// Get Required Documents for Shipment
  /// Retrieves the list of documents requested by employee for specific shipment
  static Future<Map<String, dynamic>> getRequiredDocuments({
    required String shipmentId,
  }) async {
    try {
      final token = await getToken();
      if (token == null || token.isEmpty) {
        return {'success': false, 'message': 'يجب تسجيل الدخول أولاً'};
      }

      print('📋 [getRequiredDocuments] Fetching for shipment: $shipmentId');

      final response = await http.get(
        Uri.parse('$baseUrl/api/shipments/id/$shipmentId/required-documents'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      print('📋 [getRequiredDocuments] Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'success': true,
          'requiredDocuments': data['data']?['requiredDocuments'] ?? [],
        };
      } else if (response.statusCode == 404) {
        return {'success': false, 'message': 'الشحنة غير موجودة'};
      } else {
        return {'success': false, 'message': 'فشل تحميل المستندات المطلوبة'};
      }
    } catch (e) {
      print('❌ [getRequiredDocuments] Error: $e');
      return {
        'success': false,
        'message': 'خطأ في تحميل المستندات المطلوبة',
        'error': e.toString(),
      };
    }
  }

  /// Mark Document as Uploaded
  /// Updates the required document status to uploaded with the file ID
  static Future<Map<String, dynamic>> markDocumentAsUploaded({
    required String shipmentId,
    required String documentId,
    required String fileId,
  }) async {
    try {
      final token = await getToken();
      if (token == null || token.isEmpty) {
        return {'success': false, 'message': 'يجب تسجيل الدخول أولاً'};
      }

      print('📝 [markDocumentAsUploaded] Marking document: $documentId');
      print('📝 [markDocumentAsUploaded] For shipment: $shipmentId');
      print('📝 [markDocumentAsUploaded] With file ID: $fileId');

      final response = await http.patch(
        Uri.parse(
          '$baseUrl/api/shipments/id/$shipmentId/required-documents/$documentId',
        ),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({'fileId': fileId}),
      );

      print('📝 [markDocumentAsUploaded] Status: ${response.statusCode}');
      print('📝 [markDocumentAsUploaded] Response: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'success': true,
          'message': 'تم تحديث حالة المستند',
          'data': data['data'],
        };
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'فشل تحديث حالة المستند',
        };
      }
    } catch (e) {
      print('❌ [markDocumentAsUploaded] Error: $e');
      return {
        'success': false,
        'message': 'خطأ في تحديث حالة المستند',
        'error': e.toString(),
      };
    }
  }

  /// Create Shipment
  /// Creates a new shipment
  static Future<Map<String, dynamic>> createShipment({
    required String acid,
    String? importerName,
    String? number46,
    String? employerName,
    String? shipmentDescription,
    DateTime? arrivalDate,
  }) async {
    try {
      final token = await getToken();
      if (token == null || token.isEmpty) {
        return {'success': false, 'message': 'يجب تسجيل الدخول أولاً'};
      }

      final body = <String, dynamic>{'acid': acid};
      if (importerName != null) body['importerName'] = importerName;
      if (number46 != null) body['number46'] = number46;
      if (employerName != null) body['employerName'] = employerName;
      if (shipmentDescription != null)
        body['shipmentDescription'] = shipmentDescription;
      if (arrivalDate != null)
        body['arrivalDate'] = arrivalDate.toIso8601String();

      print('🚢 [createShipment] Creating shipment: $acid');

      final response = await http.post(
        Uri.parse('$baseUrl/api/shipments'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(body),
      );

      print('🚢 [createShipment] Status: ${response.statusCode}');

      final data = jsonDecode(response.body);

      if (response.statusCode == 201) {
        return {
          'success': true,
          'message': 'تم إنشاء الشحنة بنجاح',
          'shipment': data,
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'فشل إنشاء الشحنة',
        };
      }
    } catch (e) {
      print('❌ [createShipment] Error: $e');
      return {
        'success': false,
        'message': 'خطأ في إنشاء الشحنة',
        'error': e.toString(),
      };
    }
  }

  /// Update Shipment Status
  /// Updates shipment status and other fields
  static Future<Map<String, dynamic>> updateShipmentStatus({
    required String acid,
    String? status,
    String? importerName,
    String? number46,
    String? employerName,
    String? shipmentDescription,
  }) async {
    try {
      final token = await getToken();
      if (token == null || token.isEmpty) {
        return {'success': false, 'message': 'يجب تسجيل الدخول أولاً'};
      }

      final body = <String, dynamic>{};
      if (status != null) body['status'] = status;
      if (importerName != null) body['importerName'] = importerName;
      if (number46 != null) body['number46'] = number46;
      if (employerName != null) body['employerName'] = employerName;
      if (shipmentDescription != null)
        body['shipmentDescription'] = shipmentDescription;

      print('🚢 [updateShipmentStatus] Updating shipment: $acid');

      final response = await http.patch(
        Uri.parse('$baseUrl/api/shipments/$acid'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(body),
      );

      print('🚢 [updateShipmentStatus] Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'success': true,
          'message': 'تم تحديث الشحنة بنجاح',
          'shipment': data,
        };
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'فشل تحديث الشحنة',
        };
      }
    } catch (e) {
      print('❌ [updateShipmentStatus] Error: $e');
      return {
        'success': false,
        'message': 'خطأ في تحديث الشحنة',
        'error': e.toString(),
      };
    }
  }

  // ============================================
  // ACID Request API
  // ============================================

  /// Create ACID Request
  static Future<Map<String, dynamic>> createAcidRequest(
    Map<String, dynamic> requestData,
  ) async {
    try {
      final token = await SecureStorage.getToken();
      if (token == null) {
        return {'success': false, 'message': 'لم يتم تسجيل الدخول'};
      }

      print('📦 [createAcidRequest] Sending request...');

      final response = await http.post(
        Uri.parse('$baseUrl/api/acid'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
          'ngrok-skip-browser-warning': 'true',
        },
        body: jsonEncode(requestData),
      );

      print('📦 [createAcidRequest] Response status: ${response.statusCode}');
      print('📦 [createAcidRequest] Response body: ${response.body}');

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return {
          'success': true,
          'message': data['message'] ?? 'تم إرسال الطلب بنجاح',
          'request': data['request'],
        };
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'فشل إرسال الطلب',
        };
      }
    } catch (e) {
      print('❌ [createAcidRequest] Error: $e');
      return {
        'success': false,
        'message': 'خطأ في إرسال الطلب',
        'error': e.toString(),
      };
    }
  }

  /// Get All ACID Requests for current user
  static Future<Map<String, dynamic>> getAllAcidRequests() async {
    try {
      final token = await SecureStorage.getToken();
      if (token == null) {
        return {'success': false, 'message': 'لم يتم تسجيل الدخول'};
      }

      print('📦 [getAllAcidRequests] Fetching ACID requests...');

      final response = await http.get(
        Uri.parse('$baseUrl/api/acid'),
        headers: {
          'Authorization': 'Bearer $token',
          'ngrok-skip-browser-warning': 'true',
        },
      );

      print('📦 [getAllAcidRequests] Response status: ${response.statusCode}');
      print('📦 [getAllAcidRequests] Response body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);

        // Handle both array response and object with requests array
        List<dynamic> requests = [];
        if (data is List) {
          requests = data;
        } else if (data is Map && data.containsKey('requests')) {
          requests = data['requests'];
        }

        return {'success': true, 'requests': requests};
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'فشل جلب طلبات ACID',
        };
      }
    } catch (e) {
      print('❌ [getAllAcidRequests] Error: $e');
      return {
        'success': false,
        'message': 'خطأ في جلب طلبات ACID',
        'error': e.toString(),
      };
    }
  }

  /// Get ACID Request by ACID code
  static Future<Map<String, dynamic>> getAcidRequestByCode(
    String acidCode,
  ) async {
    try {
      final token = await SecureStorage.getToken();
      if (token == null) {
        return {'success': false, 'message': 'لم يتم تسجيل الدخول'};
      }

      print('📦 [getAcidRequestByCode] Fetching ACID: $acidCode');

      final response = await http.get(
        Uri.parse('$baseUrl/api/acid/$acidCode'),
        headers: {
          'Authorization': 'Bearer $token',
          'ngrok-skip-browser-warning': 'true',
        },
      );

      print(
        '📦 [getAcidRequestByCode] Response status: ${response.statusCode}',
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {'success': true, 'request': data};
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'فشل جلب طلب ACID',
        };
      }
    } catch (e) {
      print('❌ [getAcidRequestByCode] Error: $e');
      return {
        'success': false,
        'message': 'خطأ في جلب طلب ACID',
        'error': e.toString(),
      };
    }
  }

  /// Upload file (general purpose)
  static Future<Map<String, dynamic>> uploadFile({
    required String filePath,
    required String category,
    String? documentType,
    String? relatedId,
    String? clientType,
  }) async {
    try {
      final token = await SecureStorage.getToken();
      if (token == null) {
        return {'success': false, 'message': 'لم يتم تسجيل الدخول'};
      }

      // Auto-detect clientType for registration category if not provided
      String? effectiveClientType = clientType;
      if (category == 'registration' && effectiveClientType == null) {
        try {
          final userData = await SecureStorage.getUserData();
          effectiveClientType = userData?['clientDetails']?['clientType'];
          print(
            '📤 [uploadFile] Auto-detected clientType: $effectiveClientType',
          );
        } catch (e) {
          print('📤 [uploadFile] Could not auto-detect clientType: $e');
        }
      }

      print('📤 [uploadFile] Uploading: $filePath');
      print('📤 [uploadFile] URL: $baseUrl/api/uploads');
      print(
        '📤 [uploadFile] Category: $category, ClientType: $effectiveClientType',
      );

      var request = http.MultipartRequest(
        'POST',
        Uri.parse('$baseUrl/api/uploads'),
      );

      request.headers.addAll({
        'Authorization': 'Bearer $token',
        'ngrok-skip-browser-warning': 'true',
      });

      // Get filename and detect mimetype
      String fileName = filePath.split('/').last;
      if (fileName.contains('\\')) {
        fileName = fileName.split('\\').last;
      }
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
      } else {
        contentType = MediaType('application', 'octet-stream');
      }

      print('📤 [uploadFile] File: $fileName, Type: ${contentType.mimeType}');

      request.files.add(
        await http.MultipartFile.fromPath(
          'file',
          filePath,
          contentType: contentType,
        ),
      );

      request.fields['category'] = category;
      if (documentType != null) request.fields['documentType'] = documentType;
      if (relatedId != null) request.fields['relatedId'] = relatedId;
      if (effectiveClientType != null)
        request.fields['clientType'] = effectiveClientType;
      request.fields['userType'] = 'client';

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      print('📤 [uploadFile] Response status: ${response.statusCode}');
      print('📤 [uploadFile] Response body: ${response.body}');

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'success': true,
          'message': data['message'] ?? 'تم رفع الملف بنجاح',
          'upload': data['upload'] ?? data['data'],
        };
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'فشل رفع الملف',
        };
      }
    } catch (e) {
      print('❌ [uploadFile] Error: $e');
      return {
        'success': false,
        'message': 'خطأ في رفع الملف',
        'error': e.toString(),
      };
    }
  }

  /// Get upload details by ID
  static Future<Map<String, dynamic>> getUploadDetails(String uploadId) async {
    try {
      final token = await getToken();
      if (token == null || token.isEmpty) {
        return {'success': false, 'message': 'يجب تسجيل الدخول أولاً'};
      }

      print('📥 [getUploadDetails] Fetching upload: $uploadId');

      final response = await http.get(
        Uri.parse('$baseUrl/api/uploads/$uploadId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      print('📥 [getUploadDetails] Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        print('✅ [getUploadDetails] Success');
        return {'success': true, 'upload': data['upload'] ?? data['data']};
      } else {
        print('❌ [getUploadDetails] Failed: ${response.statusCode}');
        return {'success': false, 'message': 'فشل في جلب معلومات الملف'};
      }
    } catch (e) {
      print('❌ [getUploadDetails] Error: $e');
      return {
        'success': false,
        'message': 'خطأ في جلب معلومات الملف',
        'error': e.toString(),
      };
    }
  }

  // ============= CHAT API =============

  /// Get all chats for current user
  static Future<Map<String, dynamic>> getChats() async {
    try {
      final token = await getToken();
      if (token == null || token.isEmpty) {
        return {'success': false, 'message': 'يجب تسجيل الدخول أولاً'};
      }

      print('💬 [getChats] Fetching chats...');

      final response = await http.get(
        Uri.parse('$baseUrl/api/chat'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      print('💬 [getChats] Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {'success': true, 'chats': data['chats'] ?? []};
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'فشل تحميل المحادثات',
        };
      }
    } catch (e) {
      print('❌ [getChats] Error: $e');
      return {
        'success': false,
        'message': 'خطأ في تحميل المحادثات',
        'error': e.toString(),
      };
    }
  }

  /// Get or create a chat for a specific shipment
  static Future<Map<String, dynamic>> getOrCreateChat(String shipmentId) async {
    try {
      final token = await getToken();
      if (token == null || token.isEmpty) {
        return {'success': false, 'message': 'يجب تسجيل الدخول أولاً'};
      }

      print('💬 [getOrCreateChat] Creating chat for shipment: $shipmentId');

      final response = await http.post(
        Uri.parse('$baseUrl/api/chat'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({'shipmentId': shipmentId}),
      );

      print('💬 [getOrCreateChat] Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {'success': true, 'chat': data['chat']};
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'فشل إنشاء المحادثة',
        };
      }
    } catch (e) {
      print('❌ [getOrCreateChat] Error: $e');
      return {
        'success': false,
        'message': 'خطأ في إنشاء المحادثة',
        'error': e.toString(),
      };
    }
  }

  /// Get messages for a specific chat
  static Future<Map<String, dynamic>> getMessages(String chatId) async {
    try {
      final token = await getToken();
      if (token == null || token.isEmpty) {
        return {'success': false, 'message': 'يجب تسجيل الدخول أولاً'};
      }

      print('💬 [getMessages] Fetching messages for chat: $chatId');

      final response = await http.get(
        Uri.parse('$baseUrl/api/chat/$chatId/messages'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      print('💬 [getMessages] Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {'success': true, 'messages': data['messages'] ?? []};
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'فشل تحميل الرسائل',
        };
      }
    } catch (e) {
      print('❌ [getMessages] Error: $e');
      return {
        'success': false,
        'message': 'خطأ في تحميل الرسائل',
        'error': e.toString(),
      };
    }
  }

  /// Send a message in a chat
  static Future<Map<String, dynamic>> sendMessage(
    String chatId,
    String text,
  ) async {
    try {
      final token = await getToken();
      if (token == null || token.isEmpty) {
        return {'success': false, 'message': 'يجب تسجيل الدخول أولاً'};
      }

      print('💬 [sendMessage] Sending message to chat: $chatId');

      final response = await http.post(
        Uri.parse('$baseUrl/api/chat/$chatId/messages'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({'text': text}),
      );

      print('💬 [sendMessage] Status: ${response.statusCode}');

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {'success': true, 'message': data['message']};
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'فشل إرسال الرسالة',
        };
      }
    } catch (e) {
      print('❌ [sendMessage] Error: $e');
      return {
        'success': false,
        'message': 'خطأ في إرسال الرسالة',
        'error': e.toString(),
      };
    }
  }

  /// Get Upload By ID
  /// Fetches complete file details including URL, mimetype, filename, etc.
  static Future<Map<String, dynamic>> getUploadById({
    required String uploadId,
  }) async {
    try {
      final token = await getToken();
      if (token == null || token.isEmpty) {
        return {'success': false, 'message': 'يجب تسجيل الدخول أولاً'};
      }

      print('📄 [getUploadById] Fetching upload: $uploadId');

      final response = await http.get(
        Uri.parse('$baseUrl/api/uploads/$uploadId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      print('📄 [getUploadById] Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {'success': true, 'upload': data['upload']};
      } else if (response.statusCode == 404) {
        return {'success': false, 'message': 'الملف غير موجود'};
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'فشل تحميل بيانات الملف',
        };
      }
    } catch (e) {
      print('❌ [getUploadById] Error: $e');
      return {
        'success': false,
        'message': 'خطأ في تحميل بيانات الملف',
        'error': e.toString(),
      };
    }
  }

  // ============= PROFILE PHOTO APIS =============

  /// Get User Profile with Photo
  /// Fetches user profile including profile photo presigned URL
  static Future<Map<String, dynamic>> getUserProfile() async {
    try {
      final token = await getToken();
      if (token == null || token.isEmpty) {
        return {'success': false, 'message': 'يجب تسجيل الدخول أولاً'};
      }

      print('👤 [getUserProfile] Fetching user profile...');

      final response = await http.get(
        Uri.parse('$baseUrl/api/users/profile'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      print('👤 [getUserProfile] Status: ${response.statusCode}');
      print('👤 [getUserProfile] Response body: ${response.body}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final user = data['user'];

        print(
          '👤 [getUserProfile] User profilePhoto field: ${user?['profilePhoto']}',
        );

        // Get presigned URL for profile photo if exists
        if (user != null && user['profilePhoto'] != null) {
          final photoKey = user['profilePhoto'];
          print('👤 [getUserProfile] Photo key: $photoKey');

          if (photoKey.toString().isNotEmpty &&
              !photoKey.toString().startsWith('http')) {
            try {
              print(
                '👤 [getUserProfile] Getting presigned URL for key: $photoKey',
              );
              final photoUrl = await getPresignedUrl(photoKey.toString());
              print('👤 [getUserProfile] Got presigned URL: $photoUrl');
              if (photoUrl != null) {
                user['profilePhotoUrl'] = photoUrl;
              }
            } catch (e) {
              print('⚠️ [getUserProfile] Could not get photo URL: $e');
            }
          } else if (photoKey.toString().startsWith('http')) {
            print('👤 [getUserProfile] Photo is already a URL');
            user['profilePhotoUrl'] = photoKey;
          }
        } else {
          print('👤 [getUserProfile] No profile photo found');
        }

        return {'success': true, 'user': user};
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'فشل تحميل بيانات المستخدم',
        };
      }
    } catch (e) {
      print('❌ [getUserProfile] Error: $e');
      return {
        'success': false,
        'message': 'خطأ في تحميل بيانات المستخدم',
        'error': e.toString(),
      };
    }
  }

  /// Get Presigned URL for S3 Key
  static Future<String?> getPresignedUrl(String s3Key) async {
    try {
      final token = await getToken();
      if (token == null || token.isEmpty) return null;

      final encodedKey = Uri.encodeComponent(s3Key);
      final response = await http.get(
        Uri.parse('$baseUrl/api/uploads/presigned-url/$encodedKey'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['url'];
      }
      return null;
    } catch (e) {
      print('❌ [getPresignedUrl] Error: $e');
      return null;
    }
  }

  /// Upload Profile Photo
  /// Uploads a profile photo to S3 and updates user profile
  static Future<Map<String, dynamic>> uploadProfilePhoto({
    required File file,
  }) async {
    try {
      final token = await getToken();
      if (token == null || token.isEmpty) {
        return {'success': false, 'message': 'يجب تسجيل الدخول أولاً'};
      }

      print('📸 [uploadProfilePhoto] Uploading profile photo...');

      // First upload to S3
      var request = http.MultipartRequest(
        'POST',
        Uri.parse('$baseUrl/api/uploads'),
      );

      request.headers['Authorization'] = 'Bearer $token';

      // Detect mimetype
      String fileName = file.path.split('/').last;
      String fileExtension = fileName.split('.').last.toLowerCase();
      MediaType contentType;

      if (['jpg', 'jpeg'].contains(fileExtension)) {
        contentType = MediaType('image', 'jpeg');
      } else if (fileExtension == 'png') {
        contentType = MediaType('image', 'png');
      } else {
        contentType = MediaType('image', 'jpeg');
      }

      var fileStream = http.ByteStream(file.openRead());
      var fileLength = await file.length();

      var multipartFile = http.MultipartFile(
        'file',
        fileStream,
        fileLength,
        filename: fileName,
        contentType: contentType,
      );
      request.files.add(multipartFile);

      // Use 'archive' category since 'profile' is not supported
      request.fields['category'] = 'archive';
      // Don't send documentType for profile photos (not in backend enum)
      request.fields['description'] = 'صورة البروفايل';
      request.fields['userType'] = 'client';

      var streamedResponse = await request.send();
      var response = await http.Response.fromStream(streamedResponse);

      print('📸 [uploadProfilePhoto] Upload status: ${response.statusCode}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        final uploadData = jsonDecode(response.body);
        final s3Key =
            uploadData['data']?['s3Key'] ?? uploadData['upload']?['s3Key'];

        if (s3Key != null) {
          // Update user profile with the S3 key
          final updateResult = await updateUserProfilePhoto(s3Key: s3Key);
          if (updateResult['success'] == true) {
            // Get presigned URL for the new photo
            final photoUrl = await getPresignedUrl(s3Key);
            return {
              'success': true,
              'message': 'تم رفع صورة البروفايل بنجاح',
              's3Key': s3Key,
              'photoUrl': photoUrl,
            };
          } else {
            return updateResult;
          }
        }

        return {
          'success': true,
          'message': 'تم رفع الصورة بنجاح',
          'data': uploadData,
        };
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'فشل رفع صورة البروفايل',
        };
      }
    } catch (e) {
      print('❌ [uploadProfilePhoto] Error: $e');
      return {
        'success': false,
        'message': 'خطأ في رفع صورة البروفايل',
        'error': e.toString(),
      };
    }
  }

  /// Update User Profile Photo
  /// Updates user's profilePhoto field with S3 key
  static Future<Map<String, dynamic>> updateUserProfilePhoto({
    required String s3Key,
  }) async {
    try {
      final token = await getToken();
      if (token == null || token.isEmpty) {
        return {'success': false, 'message': 'يجب تسجيل الدخول أولاً'};
      }

      // Get current user data first
      final profileResponse = await http.get(
        Uri.parse('$baseUrl/api/users/profile'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (profileResponse.statusCode != 200) {
        return {'success': false, 'message': 'فشل جلب بيانات المستخدم'};
      }

      final profileData = jsonDecode(profileResponse.body);
      final user = profileData['user'];

      print('📸 [updateUserProfilePhoto] Updating profile photo to: $s3Key');

      final response = await http.put(
        Uri.parse('$baseUrl/api/users/profile'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'fullname': user['fullname'],
          'username': user['username'],
          'phone': user['phone'],
          'email': user['email'],
          'profilePhoto': s3Key,
        }),
      );

      print('📸 [updateUserProfilePhoto] Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        // Update local storage
        final data = jsonDecode(response.body);
        if (data['user'] != null) {
          await SecureStorage.saveUserData(data['user']);
        }
        return {
          'success': true,
          'message': 'تم تحديث صورة البروفايل بنجاح',
          'user': data['user'],
        };
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'فشل تحديث صورة البروفايل',
        };
      }
    } catch (e) {
      print('❌ [updateUserProfilePhoto] Error: $e');
      return {
        'success': false,
        'message': 'خطأ في تحديث صورة البروفايل',
        'error': e.toString(),
      };
    }
  }

  /// Delete Profile Photo
  /// Removes profile photo from user profile
  static Future<Map<String, dynamic>> deleteProfilePhoto() async {
    try {
      final token = await getToken();
      if (token == null || token.isEmpty) {
        return {'success': false, 'message': 'يجب تسجيل الدخول أولاً'};
      }

      // Get current user data first
      final profileResponse = await http.get(
        Uri.parse('$baseUrl/api/users/profile'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (profileResponse.statusCode != 200) {
        return {'success': false, 'message': 'فشل جلب بيانات المستخدم'};
      }

      final profileData = jsonDecode(profileResponse.body);
      final user = profileData['user'];

      print('🗑️ [deleteProfilePhoto] Removing profile photo...');

      final response = await http.put(
        Uri.parse('$baseUrl/api/users/profile'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'fullname': user['fullname'],
          'username': user['username'],
          'phone': user['phone'],
          'email': user['email'],
          'profilePhoto': null,
        }),
      );

      print('🗑️ [deleteProfilePhoto] Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        return {'success': true, 'message': 'تم حذف صورة البروفايل بنجاح'};
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'فشل حذف صورة البروفايل',
        };
      }
    } catch (e) {
      print('❌ [deleteProfilePhoto] Error: $e');
      return {
        'success': false,
        'message': 'خطأ في حذف صورة البروفايل',
        'error': e.toString(),
      };
    }
  }

  // =====================================================
  // UCR REQUEST ENDPOINTS (Export)
  // =====================================================

  /// Create UCR Request
  /// Creates a new UCR (export) request
  static Future<Map<String, dynamic>> createUcrRequest(
    Map<String, dynamic> requestData,
  ) async {
    try {
      final token = await getToken();
      if (token == null || token.isEmpty) {
        return {'success': false, 'message': 'يجب تسجيل الدخول أولاً'};
      }

      print('📤 [createUcrRequest] Creating UCR request...');
      print('📤 [createUcrRequest] Data: $requestData');

      final response = await http.post(
        Uri.parse('$baseUrl/api/ucr'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(requestData),
      );

      print('📤 [createUcrRequest] Status: ${response.statusCode}');
      print('📤 [createUcrRequest] Response: ${response.body}');

      final data = jsonDecode(response.body);

      if (response.statusCode == 201 || response.statusCode == 200) {
        return {
          'success': true,
          'message': data['message'] ?? 'تم إنشاء طلب UCR بنجاح',
          'request': data['request'],
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'فشل إنشاء طلب UCR',
        };
      }
    } catch (e) {
      print('❌ [createUcrRequest] Error: $e');
      return {
        'success': false,
        'message': 'خطأ في إنشاء طلب UCR',
        'error': e.toString(),
      };
    }
  }

  /// Get My UCR Requests
  /// Gets all UCR requests for current user
  static Future<Map<String, dynamic>> getMyUcrRequests() async {
    try {
      final token = await getToken();
      if (token == null || token.isEmpty) {
        return {'success': false, 'message': 'يجب تسجيل الدخول أولاً'};
      }

      print('📋 [getMyUcrRequests] Fetching UCR requests...');

      final response = await http.get(
        Uri.parse('$baseUrl/api/ucr'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      print('📋 [getMyUcrRequests] Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {'success': true, 'data': data['data'] ?? []};
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'فشل جلب طلبات UCR',
        };
      }
    } catch (e) {
      print('❌ [getMyUcrRequests] Error: $e');
      return {
        'success': false,
        'message': 'خطأ في جلب طلبات UCR',
        'error': e.toString(),
      };
    }
  }

  /// Get My Export Shipments
  /// Gets all export shipments for the current user
  static Future<Map<String, dynamic>> getMyExportShipments() async {
    try {
      final token = await getToken();
      if (token == null || token.isEmpty) {
        return {'success': false, 'message': 'يجب تسجيل الدخول أولاً'};
      }

      print('📦 [getMyExportShipments] Fetching export shipments...');

      final response = await http.get(
        Uri.parse('$baseUrl/api/export-shipments'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      print('📦 [getMyExportShipments] Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('📦 [getMyExportShipments] Response keys: ${data.keys}');

        // Backend returns 'shipments' not 'data'
        final shipments = data['shipments'] ?? data['data'] ?? [];
        print('📦 [getMyExportShipments] Got ${shipments.length} shipments');

        return {'success': true, 'data': shipments};
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'فشل جلب شحنات التصدير',
        };
      }
    } catch (e) {
      print('❌ [getMyExportShipments] Error: $e');
      return {
        'success': false,
        'message': 'خطأ في جلب شحنات التصدير',
        'error': e.toString(),
      };
    }
  }

  /// Get Export Shipment by ID
  /// Gets a single export shipment by its ID
  static Future<Map<String, dynamic>> getExportShipmentById({
    required String id,
  }) async {
    try {
      final token = await getToken();
      if (token == null || token.isEmpty) {
        return {'success': false, 'message': 'يجب تسجيل الدخول أولاً'};
      }

      print('🚢 [getExportShipmentById] Fetching export shipment: $id');

      final response = await http.get(
        Uri.parse('$baseUrl/api/export-shipments/$id'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      print('🚢 [getExportShipmentById] Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'success': true,
          'data': data['shipment'] ?? data['data'] ?? data,
        };
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'فشل جلب تفاصيل الشحنة',
        };
      }
    } catch (e) {
      print('❌ [getExportShipmentById] Error: $e');
      return {
        'success': false,
        'message': 'خطأ في جلب تفاصيل الشحنة',
        'error': e.toString(),
      };
    }
  }

  /// Get UCR Request by ID
  /// Gets a single UCR request by its ID
  static Future<Map<String, dynamic>> getUcrRequestById({
    required String id,
  }) async {
    try {
      final token = await getToken();
      if (token == null || token.isEmpty) {
        return {'success': false, 'message': 'يجب تسجيل الدخول أولاً'};
      }

      print('📋 [getUcrRequestById] Fetching UCR request: $id');

      final response = await http.get(
        Uri.parse('$baseUrl/api/ucr/$id'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      print('📋 [getUcrRequestById] Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {'success': true, 'data': data['data'] ?? data};
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'فشل جلب تفاصيل الطلب',
        };
      }
    } catch (e) {
      print('❌ [getUcrRequestById] Error: $e');
      return {
        'success': false,
        'message': 'خطأ في جلب تفاصيل الطلب',
        'error': e.toString(),
      };
    }
  }

  // =====================================================
  // 🔔 NOTIFICATIONS API
  // =====================================================

  /// Get user notifications with pagination
  static Future<Map<String, dynamic>> getNotifications({
    int page = 1,
    int limit = 20,
    String? type,
    bool? isRead,
  }) async {
    try {
      final token = await getToken();
      if (token == null || token.isEmpty) {
        return {'success': false, 'message': 'يجب تسجيل الدخول أولاً'};
      }

      print('🔔 [getNotifications] Fetching notifications... page: $page');

      String url = '$baseUrl/api/notifications?page=$page&limit=$limit';
      if (type != null) url += '&type=$type';
      if (isRead != null) url += '&isRead=$isRead';

      final response = await http.get(
        Uri.parse(url),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      print('🔔 [getNotifications] Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'success': true,
          'notifications': data['notifications'] ?? [],
          'pagination': data['pagination'],
        };
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'فشل جلب الإشعارات',
        };
      }
    } catch (e) {
      print('❌ [getNotifications] Error: $e');
      return {
        'success': false,
        'message': 'خطأ في جلب الإشعارات',
        'error': e.toString(),
      };
    }
  }

  /// Get unread notifications count
  static Future<Map<String, dynamic>> getUnreadNotificationsCount() async {
    try {
      final token = await getToken();
      if (token == null || token.isEmpty) {
        return {'success': false, 'message': 'يجب تسجيل الدخول أولاً'};
      }

      print('🔔 [getUnreadCount] Fetching unread count...');

      final response = await http.get(
        Uri.parse('$baseUrl/api/notifications/unread-count'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      print('🔔 [getUnreadCount] Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        print('🔔 [getUnreadCount] Response: $data');
        // Backend returns 'unreadCount' not 'count'
        final count = data['unreadCount'] ?? data['count'] ?? 0;
        return {'success': true, 'count': count};
      } else {
        return {'success': false, 'count': 0};
      }
    } catch (e) {
      print('❌ [getUnreadCount] Error: $e');
      return {'success': false, 'count': 0};
    }
  }

  /// Mark notification as read
  static Future<Map<String, dynamic>> markNotificationAsRead(
    String notificationId,
  ) async {
    try {
      final token = await getToken();
      if (token == null || token.isEmpty) {
        return {'success': false, 'message': 'يجب تسجيل الدخول أولاً'};
      }

      print('🔔 [markAsRead] Marking notification $notificationId as read...');

      final response = await http.put(
        Uri.parse('$baseUrl/api/notifications/$notificationId/read'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      print('🔔 [markAsRead] Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        return {'success': true, 'message': 'تم تحديد الإشعار كمقروء'};
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'فشل تحديث الإشعار',
        };
      }
    } catch (e) {
      print('❌ [markAsRead] Error: $e');
      return {
        'success': false,
        'message': 'خطأ في تحديث الإشعار',
        'error': e.toString(),
      };
    }
  }

  /// Mark all notifications as read
  static Future<Map<String, dynamic>> markAllNotificationsAsRead() async {
    try {
      final token = await getToken();
      if (token == null || token.isEmpty) {
        return {'success': false, 'message': 'يجب تسجيل الدخول أولاً'};
      }

      print('🔔 [markAllAsRead] Marking all notifications as read...');

      final response = await http.put(
        Uri.parse('$baseUrl/api/notifications/read-all'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      print('🔔 [markAllAsRead] Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'success': true,
          'message': 'تم تحديد جميع الإشعارات كمقروءة',
          'modifiedCount': data['modifiedCount'] ?? 0,
        };
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'فشل تحديث الإشعارات',
        };
      }
    } catch (e) {
      print('❌ [markAllAsRead] Error: $e');
      return {
        'success': false,
        'message': 'خطأ في تحديث الإشعارات',
        'error': e.toString(),
      };
    }
  }

  /// Delete a notification
  static Future<Map<String, dynamic>> deleteNotification(
    String notificationId,
  ) async {
    try {
      final token = await getToken();
      if (token == null || token.isEmpty) {
        return {'success': false, 'message': 'يجب تسجيل الدخول أولاً'};
      }

      print('🔔 [deleteNotification] Deleting notification $notificationId...');

      final response = await http.delete(
        Uri.parse('$baseUrl/api/notifications/$notificationId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      print('🔔 [deleteNotification] Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        return {'success': true, 'message': 'تم حذف الإشعار بنجاح'};
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'فشل حذف الإشعار',
        };
      }
    } catch (e) {
      print('❌ [deleteNotification] Error: $e');
      return {
        'success': false,
        'message': 'خطأ في حذف الإشعار',
        'error': e.toString(),
      };
    }
  }

  /// Clear all read notifications
  static Future<Map<String, dynamic>> clearReadNotifications() async {
    try {
      final token = await getToken();
      if (token == null || token.isEmpty) {
        return {'success': false, 'message': 'يجب تسجيل الدخول أولاً'};
      }

      print('🔔 [clearReadNotifications] Clearing read notifications...');

      final response = await http.delete(
        Uri.parse('$baseUrl/api/notifications/clear-read'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      print('🔔 [clearReadNotifications] Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'success': true,
          'message': 'تم حذف الإشعارات المقروءة بنجاح',
          'deletedCount': data['deletedCount'] ?? 0,
        };
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'فشل حذف الإشعارات المقروءة',
        };
      }
    } catch (e) {
      print('❌ [clearReadNotifications] Error: $e');
      return {
        'success': false,
        'message': 'خطأ في حذف الإشعارات المقروءة',
        'error': e.toString(),
      };
    }
  }

  /// Update FCM token for push notifications
  static Future<Map<String, dynamic>> updateFCMToken(String fcmToken) async {
    try {
      final token = await getToken();
      if (token == null || token.isEmpty) {
        return {'success': false, 'message': 'يجب تسجيل الدخول أولاً'};
      }

      print('🔔 [updateFCMToken] Updating FCM token...');

      final response = await http.put(
        Uri.parse('$baseUrl/api/notifications/fcm-token'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({'fcmToken': fcmToken}),
      );

      print('🔔 [updateFCMToken] Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        return {'success': true, 'message': 'تم تحديث الـ FCM Token بنجاح'};
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'فشل تحديث الـ FCM Token',
        };
      }
    } catch (e) {
      print('❌ [updateFCMToken] Error: $e');
      return {
        'success': false,
        'message': 'خطأ في تحديث الـ FCM Token',
        'error': e.toString(),
      };
    }
  }

  /// Get notification settings
  static Future<Map<String, dynamic>> getNotificationSettings() async {
    try {
      final token = await getToken();
      if (token == null || token.isEmpty) {
        return {'success': false, 'message': 'يجب تسجيل الدخول أولاً'};
      }

      print('🔔 [getNotificationSettings] Fetching settings...');

      final response = await http.get(
        Uri.parse('$baseUrl/api/notifications/settings'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      print('🔔 [getNotificationSettings] Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {'success': true, 'settings': data['settings']};
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'فشل جلب إعدادات الإشعارات',
        };
      }
    } catch (e) {
      print('❌ [getNotificationSettings] Error: $e');
      return {
        'success': false,
        'message': 'خطأ في جلب إعدادات الإشعارات',
        'error': e.toString(),
      };
    }
  }

  /// Update notification settings
  static Future<Map<String, dynamic>> updateNotificationSettings({
    bool? pushEnabled,
    bool? emailEnabled,
    bool? soundEnabled,
    Map<String, bool>? categories,
  }) async {
    try {
      final token = await getToken();
      if (token == null || token.isEmpty) {
        return {'success': false, 'message': 'يجب تسجيل الدخول أولاً'};
      }

      print('🔔 [updateNotificationSettings] Updating settings...');

      final Map<String, dynamic> body = {};
      if (pushEnabled != null) body['pushEnabled'] = pushEnabled;
      if (emailEnabled != null) body['emailEnabled'] = emailEnabled;
      if (soundEnabled != null) body['soundEnabled'] = soundEnabled;
      if (categories != null) body['categories'] = categories;

      final response = await http.put(
        Uri.parse('$baseUrl/api/notifications/settings'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(body),
      );

      print('🔔 [updateNotificationSettings] Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'success': true,
          'message': 'تم تحديث إعدادات الإشعارات بنجاح',
          'settings': data['settings'],
        };
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'فشل تحديث إعدادات الإشعارات',
        };
      }
    } catch (e) {
      print('❌ [updateNotificationSettings] Error: $e');
      return {
        'success': false,
        'message': 'خطأ في تحديث إعدادات الإشعارات',
        'error': e.toString(),
      };
    }
  }

  /// Update FCM Token for push notifications
  static Future<Map<String, dynamic>> updateFcmToken(String fcmToken) async {
    try {
      final token = await getToken();
      if (token == null || token.isEmpty) {
        return {'success': false, 'message': 'يجب تسجيل الدخول أولاً'};
      }

      print('🔔 [updateFcmToken] Sending FCM token to server...');

      final response = await http.put(
        Uri.parse('$baseUrl/api/notifications/fcm-token'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({'fcmToken': fcmToken}),
      );

      print('🔔 [updateFcmToken] Status: ${response.statusCode}');

      if (response.statusCode == 200) {
        return {'success': true, 'message': 'تم حفظ FCM Token بنجاح'};
      } else {
        final data = jsonDecode(response.body);
        return {
          'success': false,
          'message': data['message'] ?? 'فشل حفظ FCM Token',
        };
      }
    } catch (e) {
      print('❌ [updateFcmToken] Error: $e');
      return {
        'success': false,
        'message': 'خطأ في حفظ FCM Token',
        'error': e.toString(),
      };
    }
  }
}
