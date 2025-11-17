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
      print('🔐 [API] Login request to: $baseUrl/api/auth/login');

      final response = await http.post(
        Uri.parse('$baseUrl/api/auth/login'),
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true', // مهم لـ ngrok
        },
        body: jsonEncode({'email': email, 'password': password}),
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

      final response = await http.put(
        Uri.parse('$baseUrl/api/users/$userId/change-password'),
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
}
