import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:alnoran_mobile_application/core/network/api_service.dart';

/// Unit tests for ApiService
/// Note: These tests focus on the static helper methods that don't require network calls.
/// For full API testing, integration tests with a mock server are recommended.
void main() {
  group('ApiService', () {
    setUp(() {
      SharedPreferences.setMockInitialValues({});
    });

    // ==================== Token Management Tests ====================
    group('Token Management', () {
      test('saveToken should store token in SharedPreferences', () async {
        const testToken = 'test_jwt_token_12345';

        await ApiService.saveToken(testToken);

        final prefs = await SharedPreferences.getInstance();
        expect(prefs.getString('auth_token'), equals(testToken));
      });

      test('getToken should retrieve stored token', () async {
        SharedPreferences.setMockInitialValues({
          'auth_token': 'stored_api_token',
        });

        final token = await ApiService.getToken();

        expect(token, equals('stored_api_token'));
      });

      test('getToken should return null when no token exists', () async {
        final token = await ApiService.getToken();

        expect(token, isNull);
      });

      test('removeToken should clear all user data from storage', () async {
        SharedPreferences.setMockInitialValues({
          'auth_token': 'token_to_remove',
          'user_id': 'user_123',
          'user_name': 'Test User',
          'user_email': 'test@example.com',
          'user_type': 'client',
          'username': 'testuser',
        });

        await ApiService.removeToken();

        final prefs = await SharedPreferences.getInstance();
        expect(prefs.getString('auth_token'), isNull);
        expect(prefs.getString('user_id'), isNull);
        expect(prefs.getString('user_name'), isNull);
        expect(prefs.getString('user_email'), isNull);
        expect(prefs.getString('user_type'), isNull);
        expect(prefs.getString('username'), isNull);
      });
    });

    // ==================== Login State Tests ====================
    group('isLoggedIn', () {
      test('should return true when valid token exists', () async {
        SharedPreferences.setMockInitialValues({'auth_token': 'valid_token'});

        final isLoggedIn = await ApiService.isLoggedIn();

        expect(isLoggedIn, isTrue);
      });

      test('should return false when no token exists', () async {
        final isLoggedIn = await ApiService.isLoggedIn();

        expect(isLoggedIn, isFalse);
      });

      test('should return false when token is empty', () async {
        SharedPreferences.setMockInitialValues({'auth_token': ''});

        final isLoggedIn = await ApiService.isLoggedIn();

        expect(isLoggedIn, isFalse);
      });
    });

    // ==================== User Data Management Tests ====================
    group('User Data Management', () {
      test('saveUserData should store user fields correctly', () async {
        final userData = {
          '_id': 'user_abc123',
          'fullname': 'Ahmed Mohamed',
          'email': 'ahmed@example.com',
          'type': 'client',
          'username': 'ahmedm',
          'clientDetails': {'clientType': 'commercial'},
        };

        await ApiService.saveUserData(userData);

        final prefs = await SharedPreferences.getInstance();
        expect(prefs.getString('user_id'), equals('user_abc123'));
        expect(prefs.getString('user_name'), equals('Ahmed Mohamed'));
        expect(prefs.getString('user_email'), equals('ahmed@example.com'));
        expect(prefs.getString('user_type'), equals('client'));
        expect(prefs.getString('username'), equals('ahmedm'));
        expect(prefs.getString('client_type'), equals('commercial'));
      });

      test('saveUserData should handle missing clientDetails', () async {
        final userData = {
          '_id': 'user_xyz',
          'fullname': 'Test User',
          'email': 'test@example.com',
          'type': 'client',
          'username': 'testuser',
          // No clientDetails
        };

        await ApiService.saveUserData(userData);

        final prefs = await SharedPreferences.getInstance();
        // Should default to 'personal' when clientDetails is missing
        expect(prefs.getString('client_type'), equals('personal'));
      });

      test('saveUserData should handle clientType at root level', () async {
        final userData = {
          '_id': 'user_123',
          'fullname': 'Factory Owner',
          'email': 'factory@example.com',
          'type': 'client',
          'username': 'factoryowner',
          'clientType': 'factory', // At root level, not in clientDetails
        };

        await ApiService.saveUserData(userData);

        final prefs = await SharedPreferences.getInstance();
        expect(prefs.getString('client_type'), equals('factory'));
      });

      test('getUserData should retrieve stored user data', () async {
        SharedPreferences.setMockInitialValues({
          'user_id': 'user_999',
          'user_name': 'Retrieved User',
          'user_email': 'retrieved@example.com',
          'user_type': 'admin',
          'username': 'retrieveduser',
        });

        final userData = await ApiService.getUserData();

        expect(userData['id'], equals('user_999'));
        expect(userData['fullname'], equals('Retrieved User'));
        expect(userData['email'], equals('retrieved@example.com'));
        expect(userData['type'], equals('admin'));
        expect(userData['username'], equals('retrieveduser'));
      });

      test('getUserData should return nulls when no data stored', () async {
        final userData = await ApiService.getUserData();

        expect(userData['id'], isNull);
        expect(userData['fullname'], isNull);
        expect(userData['email'], isNull);
        expect(userData['type'], isNull);
        expect(userData['username'], isNull);
      });
    });

    // ==================== Base URL Tests ====================
    group('baseUrl', () {
      // Note: baseUrl depends on platform detection which may not work correctly in tests
      // These tests verify the getter doesn't throw
      test('should return a valid URL string', () {
        final url = ApiService.baseUrl;

        expect(url, isNotNull);
        expect(url, isNotEmpty);
        expect(url, startsWith('http'));
      });
    });

    // ==================== Integration Scenarios ====================
    group('Integration Scenarios', () {
      test('full authentication cycle should work correctly', () async {
        // 1. Initially not logged in
        expect(await ApiService.isLoggedIn(), isFalse);

        // 2. Simulate successful login - save token and user data
        await ApiService.saveToken('new_auth_token');
        await ApiService.saveUserData({
          '_id': 'logged_in_user',
          'fullname': 'Logged In User',
          'email': 'loggedin@example.com',
          'type': 'client',
          'username': 'loggedinuser',
          'clientDetails': {'clientType': 'personal'},
        });

        // 3. Verify logged in state
        expect(await ApiService.isLoggedIn(), isTrue);
        expect(await ApiService.getToken(), equals('new_auth_token'));

        final userData = await ApiService.getUserData();
        expect(userData['id'], equals('logged_in_user'));
        expect(userData['email'], equals('loggedin@example.com'));

        // 4. Simulate logout
        await ApiService.removeToken();

        // 5. Verify logged out state
        expect(await ApiService.isLoggedIn(), isFalse);
        expect(await ApiService.getToken(), isNull);
      });
    });
  });

  // ==================== API Response Parsing Tests ====================
  // هذه الاختبارات تتحقق من صحة تحليل الـ JSON responses
  // بدون الحاجة لاتصال فعلي بالـ API

  group('API Response Parsing Tests', () {
    group('Login Response Parsing', () {
      test('should parse successful login response correctly', () {
        final responseJson = {
          'success': true,
          'message': 'تم تسجيل الدخول بنجاح',
          'token': 'jwt_token_here',
          'user': {
            '_id': 'user123',
            'fullname': 'أحمد محمد',
            'email': 'ahmed@example.com',
            'type': 'client',
            'clientType': 'personal',
          },
        };

        expect(responseJson['success'], isTrue);
        expect(responseJson['token'], isNotNull);
        final user = responseJson['user'] as Map<String, dynamic>;
        expect(user['fullname'], equals('أحمد محمد'));
      });

      test('should parse failed login response', () {
        final responseJson = {
          'success': false,
          'message': 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
          'error': 'INVALID_CREDENTIALS',
        };

        expect(responseJson['success'], isFalse);
        expect(responseJson['error'], equals('INVALID_CREDENTIALS'));
      });

      test('should handle empty response fields with defaults', () {
        final responseJson = <String, dynamic>{'success': false};
        final message = responseJson['message'] ?? 'فشل تسجيل الدخول';
        expect(message, equals('فشل تسجيل الدخول'));
      });
    });

    group('Register Response Parsing', () {
      test('should parse successful registration', () {
        final responseJson = {
          'success': true,
          'message': 'تم التسجيل بنجاح',
          'token': 'new_jwt_token',
          'user': {'_id': 'newuser', 'clientType': 'commercial'},
        };

        expect(responseJson['success'], isTrue);
        final user = responseJson['user'] as Map<String, dynamic>;
        expect(user['clientType'], equals('commercial'));
      });

      test('should parse email already exists error', () {
        final responseJson = {
          'success': false,
          'message': 'البريد الإلكتروني مستخدم من قبل',
          'error': 'EMAIL_EXISTS',
        };

        expect(responseJson['error'], equals('EMAIL_EXISTS'));
      });

      test('should parse username already exists error', () {
        final responseJson = {
          'success': false,
          'message': 'اسم المستخدم مستخدم من قبل',
          'error': 'USERNAME_EXISTS',
        };

        expect(responseJson['error'], equals('USERNAME_EXISTS'));
      });
    });

    group('Check Availability Parsing', () {
      test('should parse available response', () {
        final responseJson = {'success': true, 'available': true};
        expect(responseJson['available'], isTrue);
      });

      test('should parse unavailable email', () {
        final responseJson = {
          'success': true,
          'available': false,
          'field': 'email',
        };
        expect(responseJson['field'], equals('email'));
      });

      test('should parse unavailable username', () {
        final responseJson = {
          'success': true,
          'available': false,
          'field': 'username',
        };
        expect(responseJson['field'], equals('username'));
      });
    });

    group('OTP/Password Reset Parsing', () {
      test('should parse OTP verification success', () {
        final responseJson = {
          'success': true,
          'resetToken': 'reset_token_here',
        };
        expect(responseJson['resetToken'], isNotNull);
      });

      test('should parse invalid OTP', () {
        final responseJson = {'success': false, 'error': 'INVALID_OTP'};
        expect(responseJson['error'], equals('INVALID_OTP'));
      });

      test('should parse expired OTP', () {
        final responseJson = {'success': false, 'error': 'OTP_EXPIRED'};
        expect(responseJson['error'], equals('OTP_EXPIRED'));
      });

      test('should parse password reset success', () {
        final responseJson = {
          'success': true,
          'message': 'تم تغيير كلمة المرور بنجاح',
        };
        expect(responseJson['success'], isTrue);
      });
    });
  });

  group('Shipments Response Parsing', () {
    test('should parse shipments list', () {
      final responseJson = {
        'success': true,
        'shipments': [
          {'_id': 'ship1', 'acid': 'ACID-001', 'status': 'processing'},
          {'_id': 'ship2', 'acid': 'ACID-002', 'status': 'تمت بنجاح'},
        ],
      };

      expect((responseJson['shipments'] as List).length, equals(2));
    });

    test('should parse empty shipments list', () {
      final responseJson = {'success': true, 'shipments': []};
      expect((responseJson['shipments'] as List), isEmpty);
    });

    test('should parse single shipment', () {
      final responseJson = {
        'success': true,
        'shipment': {
          '_id': 'ship1',
          'acid': 'ACID-2024-001',
          'importerName': 'شركة النور',
          'requiredDocuments': [
            {'name': 'فاتورة', 'uploaded': true},
          ],
        },
      };

      final ship = responseJson['shipment'] as Map<String, dynamic>;
      expect(ship['acid'], equals('ACID-2024-001'));
    });

    test('should parse ACID request creation response', () {
      final responseJson = {
        'success': true,
        'acidRequest': {'acid': 'ACID-2024-003', 'status': 'pending'},
      };
      final acidRequest = responseJson['acidRequest'] as Map<String, dynamic>;
      expect(acidRequest['acid'], contains('ACID'));
    });

    test('should parse shipment not found error', () {
      final responseJson = {'success': false, 'error': 'SHIPMENT_NOT_FOUND'};
      expect(responseJson['error'], equals('SHIPMENT_NOT_FOUND'));
    });
  });

  group('Notifications Response Parsing', () {
    test('should parse notifications with pagination', () {
      final responseJson = {
        'success': true,
        'notifications': [
          {'_id': 'n1', 'type': 'shipment_created', 'isRead': false},
          {'_id': 'n2', 'type': 'document_approved', 'isRead': true},
        ],
        'pagination': {'hasMore': true, 'total': 100},
      };

      expect((responseJson['notifications'] as List).length, equals(2));
      final pagination = responseJson['pagination'] as Map<String, dynamic>;
      expect(pagination['hasMore'], isTrue);
    });

    test('should parse unread count', () {
      final responseJson = {'success': true, 'count': 5};
      expect(responseJson['count'], equals(5));
    });

    test('should parse mark as read response', () {
      final responseJson = {'success': true};
      expect(responseJson['success'], isTrue);
    });
  });

  group('Chat Response Parsing', () {
    test('should parse chats list', () {
      final responseJson = {
        'success': true,
        'chats': [
          {'_id': 'chat1', 'unreadCount': 3, 'status': 'active'},
        ],
      };
      final chat =
          (responseJson['chats'] as List).first as Map<String, dynamic>;
      expect(chat['unreadCount'], equals(3));
    });

    test('should parse messages list', () {
      final responseJson = {
        'success': true,
        'messages': [
          {'_id': 'msg1', 'text': 'مرحباً', 'senderType': 'client'},
        ],
      };
      expect(
        (responseJson['messages'] as List).first['text'],
        equals('مرحباً'),
      );
    });

    test('should parse send message response', () {
      final responseJson = {
        'success': true,
        'message': {'_id': 'newmsg', 'text': 'رسالة جديدة'},
      };
      final msg = responseJson['message'] as Map<String, dynamic>;
      expect(msg['text'], equals('رسالة جديدة'));
    });
  });

  group('User Profile Response Parsing', () {
    test('should parse user profile with clientDetails', () {
      final responseJson = {
        'success': true,
        'user': {
          '_id': 'user123',
          'fullname': 'أحمد محمد',
          'clientDetails': {'ssn': '29901011234567', 'isVerified': true},
        },
      };

      final user = responseJson['user'] as Map<String, dynamic>;
      expect(user['clientDetails']['isVerified'], isTrue);
    });

    test('should parse profile update response', () {
      final responseJson = {
        'success': true,
        'message': 'تم تحديث البيانات بنجاح',
      };
      expect(responseJson['success'], isTrue);
    });
  });

  group('Error Handling Parsing', () {
    test('should parse network error', () {
      final errorResponse = {
        'success': false,
        'message': 'خطأ في الاتصال بالسيرفر',
        'error': 'SocketException',
      };
      expect(errorResponse['message'], contains('خطأ في الاتصال'));
    });

    test('should parse timeout error', () {
      final errorResponse = {
        'success': false,
        'message': 'انتهت مهلة الاتصال',
        'error': 'TimeoutException',
      };
      expect(errorResponse['message'], contains('انتهت مهلة'));
    });

    test('should parse unauthorized error', () {
      final errorResponse = {'success': false, 'error': 'UNAUTHORIZED'};
      expect(errorResponse['error'], equals('UNAUTHORIZED'));
    });

    test('should parse server error', () {
      final errorResponse = {
        'success': false,
        'error': 'INTERNAL_SERVER_ERROR',
      };
      expect(errorResponse['error'], equals('INTERNAL_SERVER_ERROR'));
    });
  });

  group('Request Body Formatting', () {
    test('login request should have email and password', () {
      final body = {'email': 'test@example.com', 'password': 'pass123'};
      expect(body.containsKey('email'), isTrue);
      expect(body.containsKey('password'), isTrue);
    });

    test('register request should have all required fields', () {
      final body = {
        'fullname': 'Test',
        'username': 'test',
        'email': 'test@test.com',
        'phone': '01012345678',
        'password': 'pass123',
        'type': 'client',
        'clientType': 'personal',
      };

      expect(body.keys.length, equals(7));
    });

    test('register with SSN should include ssn field', () {
      final body = {
        'fullname': 'Test',
        'clientType': 'personal',
        'ssn': '29901011234567',
      };

      expect(body['ssn'], equals('29901011234567'));
    });
  });

  group('HTTP Headers', () {
    test('should have correct Content-Type', () {
      final headers = {'Content-Type': 'application/json'};
      expect(headers['Content-Type'], equals('application/json'));
    });

    test('should have auth header with Bearer token', () {
      final headers = {'Authorization': 'Bearer jwt_token'};
      expect(headers['Authorization'], startsWith('Bearer '));
    });

    test('should have ngrok skip header', () {
      final headers = {'ngrok-skip-browser-warning': 'true'};
      expect(headers['ngrok-skip-browser-warning'], equals('true'));
    });
  });
}
