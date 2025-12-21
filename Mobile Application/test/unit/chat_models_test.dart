import 'package:flutter_test/flutter_test.dart';
import 'package:alnoran_mobile_application/features/chat/models/chat_model.dart';
import 'package:alnoran_mobile_application/features/chat/models/message_model.dart';

/// =====================================================
/// 📚 شرح الـ Chat Models:
/// =====================================================
///
/// الـ Chat System في التطبيق عبارة عن:
///
/// 1. ChatModel - يمثل محادثة كاملة بين العميل والموظف حول شحنة معينة
///    - كل محادثة مرتبطة بـ: عميل (client) + موظف (employee) + شحنة (shipment)
///    - فيها معلومات زي: عدد الرسائل الغير مقروءة، آخر رسالة إمتى
///
/// 2. MessageModel - يمثل رسالة واحدة في المحادثة
///    - فيها: نص الرسالة، مين بعتها، الوقت، اتقرأت ولا لأ
///
/// 3. Helper Classes:
///    - ClientInfo: بيانات العميل (الاسم، الإيميل، اليوزرنيم)
///    - EmployeeInfo: بيانات الموظف (الاسم، الإيميل)
///    - ShipmentInfo: بيانات الشحنة (رقم ACID، الحالة، البلد)
///    - SenderInfo: بيانات مرسل الرسالة
///
/// الـ fromJson: بيحول الـ JSON اللي جاي من الـ API لـ Dart Object
/// الـ toJson: بيحول الـ Dart Object لـ JSON عشان نبعته للـ API
///
/// =====================================================

void main() {
  group('Chat Models', () {
    // ==================== ChatModel Tests ====================
    group('ChatModel', () {
      group('fromJson', () {
        test('should parse basic chat with string IDs', () {
          // ده الشكل اللي الـ API بيبعته لما الـ IDs تكون strings بسيطة
          final json = {
            '_id': 'chat123',
            'clientId': 'client456',
            'employeeId': 'emp789',
            'shipmentId': 'ship001',
            'status': 'active',
            'lastMessageAt': '2024-01-15T10:30:00.000Z',
            'unreadCount': 5,
          };

          final chat = ChatModel.fromJson(json);

          expect(chat.id, equals('chat123'));
          expect(chat.clientId, equals('client456'));
          expect(chat.employeeId, equals('emp789'));
          expect(chat.shipmentId, equals('ship001'));
          expect(chat.status, equals('active'));
          expect(chat.unreadCount, equals(5));
          expect(chat.lastMessageAt.year, equals(2024));
          expect(chat.clientInfo, isNull); // لأن clientId string مش object
          expect(chat.employeeInfo, isNull);
          expect(chat.shipmentInfo, isNull);
        });

        test('should parse chat with populated (nested) objects', () {
          // ده الشكل لما الـ API يعمل populate للـ relations
          // (يعني يجيب البيانات الكاملة مش بس الـ IDs)
          final json = {
            '_id': 'chat123',
            'clientId': {
              '_id': 'client456',
              'fullname': 'أحمد محمد',
              'username': 'ahmed_m',
              'email': 'ahmed@example.com',
            },
            'employeeId': {
              '_id': 'emp789',
              'fullname': 'سارة أحمد',
              'username': 'sara_a',
              'email': 'sara@alnoran.com',
            },
            'shipmentId': {
              '_id': 'ship001',
              'acid': 'ACID-2024-001',
              'status': 'processing',
              'country': 'مصر',
            },
            'status': 'active',
            'lastMessageAt': '2024-01-15T10:30:00.000Z',
            'unreadCount': 3,
          };

          final chat = ChatModel.fromJson(json);

          // الـ IDs بتتاخد من جوا الـ nested object
          expect(chat.clientId, equals('client456'));
          expect(chat.employeeId, equals('emp789'));
          expect(chat.shipmentId, equals('ship001'));

          // الـ Info objects بتتملى
          expect(chat.clientInfo, isNotNull);
          expect(chat.clientInfo!.fullname, equals('أحمد محمد'));
          expect(chat.clientInfo!.email, equals('ahmed@example.com'));

          expect(chat.employeeInfo, isNotNull);
          expect(chat.employeeInfo!.fullname, equals('سارة أحمد'));

          expect(chat.shipmentInfo, isNotNull);
          expect(chat.shipmentInfo!.acid, equals('ACID-2024-001'));
          expect(chat.shipmentInfo!.country, equals('مصر'));
        });

        test('should use default values for missing fields', () {
          // لو الـ API رجع JSON ناقصة حاجات، نستخدم default values
          final json = <String, dynamic>{'_id': 'chat123'};

          final chat = ChatModel.fromJson(json);

          expect(chat.id, equals('chat123'));
          expect(chat.clientId, equals('')); // default empty string
          expect(chat.status, equals('active')); // default status
          expect(chat.unreadCount, equals(0)); // default 0
          // lastMessageAt هيبقى DateTime.now() لأن مفيش قيمة
        });

        test('should handle null values gracefully', () {
          final json = {
            '_id': null,
            'clientId': null,
            'status': null,
            'unreadCount': null,
            'lastMessageAt': null,
          };

          final chat = ChatModel.fromJson(json);

          expect(chat.id, equals(''));
          expect(chat.clientId, equals(''));
          expect(chat.status, equals('active'));
          expect(chat.unreadCount, equals(0));
        });
      });
    });

    // ==================== ClientInfo Tests ====================
    group('ClientInfo', () {
      test('should parse client info correctly', () {
        final json = {
          '_id': 'client123',
          'fullname': 'أحمد محمود',
          'username': 'ahmed_m',
          'email': 'ahmed@test.com',
        };

        final client = ClientInfo.fromJson(json);

        expect(client.id, equals('client123'));
        expect(client.fullname, equals('أحمد محمود'));
        expect(client.username, equals('ahmed_m'));
        expect(client.email, equals('ahmed@test.com'));
      });

      test('should use empty strings for missing fields', () {
        final json = <String, dynamic>{'_id': 'client123'};

        final client = ClientInfo.fromJson(json);

        expect(client.id, equals('client123'));
        expect(client.fullname, equals(''));
        expect(client.username, equals(''));
        expect(client.email, equals(''));
      });
    });

    // ==================== EmployeeInfo Tests ====================
    group('EmployeeInfo', () {
      test('should parse employee info correctly', () {
        final json = {
          '_id': 'emp456',
          'fullname': 'سارة أحمد',
          'username': 'sara_support',
          'email': 'sara@alnoran.com',
        };

        final employee = EmployeeInfo.fromJson(json);

        expect(employee.id, equals('emp456'));
        expect(employee.fullname, equals('سارة أحمد'));
        expect(employee.username, equals('sara_support'));
        expect(employee.email, equals('sara@alnoran.com'));
      });

      test('should use empty strings for missing fields', () {
        final json = <String, dynamic>{};

        final employee = EmployeeInfo.fromJson(json);

        expect(employee.id, equals(''));
        expect(employee.fullname, equals(''));
      });
    });

    // ==================== ShipmentInfo Tests ====================
    group('ShipmentInfo', () {
      test('should parse shipment info correctly', () {
        final json = {
          '_id': 'ship789',
          'acid': 'ACID-2024-001',
          'status': 'pending',
          'country': 'الصين',
        };

        final shipment = ShipmentInfo.fromJson(json);

        expect(shipment.id, equals('ship789'));
        expect(shipment.acid, equals('ACID-2024-001'));
        expect(shipment.status, equals('pending'));
        expect(shipment.country, equals('الصين'));
      });

      test('should use empty strings for missing fields', () {
        final json = <String, dynamic>{'_id': 'ship789'};

        final shipment = ShipmentInfo.fromJson(json);

        expect(shipment.id, equals('ship789'));
        expect(shipment.acid, equals(''));
        expect(shipment.status, equals(''));
        expect(shipment.country, equals(''));
      });
    });
  });

  group('Message Models', () {
    // ==================== MessageModel Tests ====================
    group('MessageModel', () {
      group('fromJson', () {
        test('should parse message with string senderId', () {
          final json = {
            '_id': 'msg123',
            'chatId': 'chat456',
            'senderId': 'user789',
            'senderType': 'client',
            'text': 'مرحباً، أريد الاستفسار عن الشحنة',
            'isRead': true,
            'createdAt': '2024-01-15T10:30:00.000Z',
          };

          final message = MessageModel.fromJson(json);

          expect(message.id, equals('msg123'));
          expect(message.chatId, equals('chat456'));
          expect(message.senderId, equals('user789'));
          expect(message.senderType, equals('client'));
          expect(message.text, equals('مرحباً، أريد الاستفسار عن الشحنة'));
          expect(message.isRead, isTrue);
          expect(message.createdAt.year, equals(2024));
          expect(message.senderInfo, isNull);
        });

        test('should parse message with populated sender object', () {
          final json = {
            '_id': 'msg123',
            'chatId': 'chat456',
            'senderId': {
              '_id': 'user789',
              'fullname': 'أحمد محمد',
              'username': 'ahmed',
              'type': 'client',
            },
            'senderType': 'client',
            'text': 'شكراً لكم',
            'isRead': false,
            'createdAt': '2024-01-15T11:00:00.000Z',
          };

          final message = MessageModel.fromJson(json);

          expect(message.senderId, equals('user789'));
          expect(message.senderInfo, isNotNull);
          expect(message.senderInfo!.fullname, equals('أحمد محمد'));
          expect(message.senderInfo!.type, equals('client'));
        });

        test('should use default values for missing fields', () {
          final json = <String, dynamic>{'_id': 'msg123', 'chatId': 'chat456'};

          final message = MessageModel.fromJson(json);

          expect(message.id, equals('msg123'));
          expect(message.senderId, equals(''));
          expect(message.senderType, equals('client')); // default
          expect(message.text, equals(''));
          expect(message.isRead, isFalse); // default
        });
      });

      group('toJson', () {
        test('should convert message to JSON correctly', () {
          final message = MessageModel(
            id: 'msg123',
            chatId: 'chat456',
            senderId: 'user789',
            senderType: 'employee',
            text: 'الشحنة وصلت',
            isRead: true,
            createdAt: DateTime(2024, 1, 15, 10, 30),
          );

          final json = message.toJson();

          expect(json['_id'], equals('msg123'));
          expect(json['chatId'], equals('chat456'));
          expect(json['senderId'], equals('user789'));
          expect(json['senderType'], equals('employee'));
          expect(json['text'], equals('الشحنة وصلت'));
          expect(json['isRead'], isTrue);
          expect(json['createdAt'], contains('2024-01-15'));
        });

        test('should handle empty text in toJson', () {
          final message = MessageModel(
            id: 'msg123',
            chatId: 'chat456',
            senderId: 'user789',
            senderType: 'client',
            text: '',
            createdAt: DateTime.now(),
          );

          final json = message.toJson();

          expect(json['text'], equals(''));
        });

        test('should preserve isRead as false in toJson', () {
          final message = MessageModel(
            id: 'msg123',
            chatId: 'chat456',
            senderId: 'user789',
            senderType: 'client',
            text: 'test',
            isRead: false,
            createdAt: DateTime.now(),
          );

          final json = message.toJson();

          expect(json['isRead'], isFalse);
        });
      });

      group('round-trip (fromJson -> toJson)', () {
        test('should preserve data through serialization cycle', () {
          // ده بيختبر إن لو جبنا message من API، وبعتناها تاني
          // الداتا هتفضل زي ما هي
          final originalJson = {
            '_id': 'msg123',
            'chatId': 'chat456',
            'senderId': 'user789',
            'senderType': 'employee',
            'text': 'مرحباً بك',
            'isRead': false,
            'createdAt': '2024-01-15T10:30:00.000Z',
          };

          final message = MessageModel.fromJson(originalJson);
          final roundTripJson = message.toJson();

          expect(roundTripJson['_id'], equals('msg123'));
          expect(roundTripJson['chatId'], equals('chat456'));
          expect(roundTripJson['senderId'], equals('user789'));
          expect(roundTripJson['senderType'], equals('employee'));
          expect(roundTripJson['text'], equals('مرحباً بك'));
          expect(roundTripJson['isRead'], isFalse);
        });
      });
    });

    // ==================== SenderInfo Tests ====================
    group('SenderInfo', () {
      test('should parse sender info correctly', () {
        final json = {
          '_id': 'sender123',
          'fullname': 'محمد علي',
          'username': 'mohamed_a',
          'type': 'employee',
        };

        final sender = SenderInfo.fromJson(json);

        expect(sender.id, equals('sender123'));
        expect(sender.fullname, equals('محمد علي'));
        expect(sender.username, equals('mohamed_a'));
        expect(sender.type, equals('employee'));
      });

      test('should use default type as client', () {
        final json = <String, dynamic>{
          '_id': 'sender123',
          'fullname': 'أحمد',
          'username': 'ahmed',
          // type missing
        };

        final sender = SenderInfo.fromJson(json);

        expect(sender.type, equals('client')); // default
      });

      test('should handle missing fields', () {
        final json = <String, dynamic>{};

        final sender = SenderInfo.fromJson(json);

        expect(sender.id, equals(''));
        expect(sender.fullname, equals(''));
        expect(sender.username, equals(''));
        expect(sender.type, equals('client'));
      });
    });
  });

  // ==================== MessageModel Tests ====================
  group('MessageModel', () {
    group('fromJson', () {
      test('should parse complete message JSON', () {
        final json = {
          '_id': 'msg001',
          'chatId': 'chat001',
          'senderId': 'user001',
          'senderType': 'client',
          'text': 'مرحبا',
          'isRead': true,
          'createdAt': '2024-01-15T10:30:00.000Z',
        };

        final message = MessageModel.fromJson(json);

        expect(message.id, equals('msg001'));
        expect(message.chatId, equals('chat001'));
        expect(message.senderId, equals('user001'));
        expect(message.senderType, equals('client'));
        expect(message.text, equals('مرحبا'));
        expect(message.isRead, isTrue);
      });

      test('should handle senderId as nested object', () {
        final json = {
          '_id': 'msg002',
          'chatId': 'chat001',
          'senderId': {
            '_id': 'admin001',
            'fullname': 'أحمد المشرف',
            'username': 'admin',
            'type': 'admin',
          },
          'senderType': 'admin',
          'text': 'رسالة من المشرف',
          'createdAt': '2024-01-15T11:00:00.000Z',
        };

        final message = MessageModel.fromJson(json);

        expect(message.senderId, equals('admin001'));
        expect(message.senderInfo, isNotNull);
        expect(message.senderInfo!.fullname, equals('أحمد المشرف'));
      });

      test('should handle missing optional fields', () {
        final json = {'_id': 'msg003', 'createdAt': '2024-01-15T10:30:00.000Z'};

        final message = MessageModel.fromJson(json);

        expect(message.id, equals('msg003'));
        expect(message.chatId, equals(''));
        expect(message.senderId, equals(''));
        expect(message.senderType, equals('client'));
        expect(message.text, equals(''));
        expect(message.isRead, isFalse);
      });

      test('should handle Arabic text correctly', () {
        final json = {
          '_id': 'msg004',
          'text': 'هذه رسالة طويلة باللغة العربية تحتوي على تفاصيل كثيرة',
          'createdAt': '2024-01-15T10:30:00.000Z',
        };

        final message = MessageModel.fromJson(json);

        expect(message.text, contains('العربية'));
      });
    });

    group('toJson', () {
      test('should convert message to JSON', () {
        final message = MessageModel(
          id: 'msg005',
          chatId: 'chat001',
          senderId: 'user001',
          senderType: 'client',
          text: 'رسالة تجريبية',
          isRead: false,
          createdAt: DateTime(2024, 1, 15, 10, 30),
        );

        final json = message.toJson();

        expect(json['_id'], equals('msg005'));
        expect(json['chatId'], equals('chat001'));
        expect(json['senderId'], equals('user001'));
        expect(json['senderType'], equals('client'));
        expect(json['text'], equals('رسالة تجريبية'));
        expect(json['isRead'], isFalse);
        expect(json['createdAt'], isNotNull);
      });
    });
  });
}
