import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:alnoran_mobile_application/core/services/recent_shipments_service.dart';

/// =====================================================
/// 📚 شرح الـ RecentShipmentsService:
/// =====================================================
///
/// ده Service بيحفظ آخر 3 شحنات فتحها المستخدم
///
/// الـ Methods:
/// 1. addRecentShipment() - بتضيف شحنة للقائمة
/// 2. getRecentShipments() - بترجع آخر 3 شحنات
/// 3. clearRecentShipments() - بتمسح القائمة كلها
/// =====================================================

void main() {
  group('RecentShipmentsService', () {
    setUp(() {
      SharedPreferences.setMockInitialValues({});
    });

    // ==================== getRecentShipments ====================
    group('getRecentShipments', () {
      test('should return empty list when no shipments stored', () async {
        final result = await RecentShipmentsService.getRecentShipments();

        expect(result, isEmpty);
      });

      test('should return stored shipments', () async {
        SharedPreferences.setMockInitialValues({
          'recent_shipments': '[{"id":"ship1","acid":"ACID-001"}]',
        });

        final result = await RecentShipmentsService.getRecentShipments();

        expect(result.length, equals(1));
        expect(result.first['acid'], equals('ACID-001'));
      });

      test('should return multiple shipments', () async {
        SharedPreferences.setMockInitialValues({
          'recent_shipments': '[{"id":"1"},{"id":"2"},{"id":"3"}]',
        });

        final result = await RecentShipmentsService.getRecentShipments();

        expect(result.length, equals(3));
      });

      test('should return empty list for invalid JSON', () async {
        SharedPreferences.setMockInitialValues({
          'recent_shipments': 'invalid json {{{',
        });

        final result = await RecentShipmentsService.getRecentShipments();

        expect(result, isEmpty);
      });

      test('should return empty list for empty string', () async {
        SharedPreferences.setMockInitialValues({'recent_shipments': ''});

        final result = await RecentShipmentsService.getRecentShipments();

        expect(result, isEmpty);
      });
    });

    // ==================== addRecentShipment ====================
    group('addRecentShipment', () {
      test('should add shipment to empty list', () async {
        await RecentShipmentsService.addRecentShipment({
          'id': 'ship1',
          'acid': 'ACID-TEST-001',
        });

        final result = await RecentShipmentsService.getRecentShipments();

        expect(result.length, equals(1));
        expect(result.first['acid'], equals('ACID-TEST-001'));
      });

      test('should add viewedAt timestamp', () async {
        await RecentShipmentsService.addRecentShipment({'id': 'ship1'});

        final result = await RecentShipmentsService.getRecentShipments();

        expect(result.first['viewedAt'], isNotNull);
      });

      test('should add new shipment to beginning', () async {
        // Add first
        await RecentShipmentsService.addRecentShipment({'id': 'first'});
        // Add second
        await RecentShipmentsService.addRecentShipment({'id': 'second'});

        final result = await RecentShipmentsService.getRecentShipments();

        expect(result.first['id'], equals('second'));
        expect(result[1]['id'], equals('first'));
      });

      test('should keep max 3 shipments', () async {
        await RecentShipmentsService.addRecentShipment({'id': '1'});
        await RecentShipmentsService.addRecentShipment({'id': '2'});
        await RecentShipmentsService.addRecentShipment({'id': '3'});
        await RecentShipmentsService.addRecentShipment({'id': '4'});

        final result = await RecentShipmentsService.getRecentShipments();

        expect(result.length, equals(3));
        expect(result.first['id'], equals('4'));
        expect(result.last['id'], equals('2'));
      });

      test('should remove duplicate and add to front', () async {
        await RecentShipmentsService.addRecentShipment({'id': 'dup'});
        await RecentShipmentsService.addRecentShipment({'id': 'other'});
        await RecentShipmentsService.addRecentShipment({
          'id': 'dup',
        }); // duplicate

        final result = await RecentShipmentsService.getRecentShipments();

        expect(result.length, equals(2));
        expect(result.first['id'], equals('dup'));
      });

      test('should handle shipment with _id field', () async {
        await RecentShipmentsService.addRecentShipment({'_id': 'mongo_id'});

        final result = await RecentShipmentsService.getRecentShipments();

        expect(result.first['_id'], equals('mongo_id'));
      });

      test('should handle shipment with acid field', () async {
        await RecentShipmentsService.addRecentShipment({'acid': 'ACID-123'});

        final result = await RecentShipmentsService.getRecentShipments();

        expect(result.first['acid'], equals('ACID-123'));
      });

      test('should preserve all shipment data', () async {
        await RecentShipmentsService.addRecentShipment({
          'id': 'test',
          'acid': 'ACID-001',
          'status': 'pending',
          'importerName': 'أحمد محمد',
          'countryOfOrigin': 'الصين',
        });

        final result = await RecentShipmentsService.getRecentShipments();

        expect(result.first['status'], equals('pending'));
        expect(result.first['importerName'], equals('أحمد محمد'));
        expect(result.first['countryOfOrigin'], equals('الصين'));
      });
    });

    // ==================== clearRecentShipments ====================
    group('clearRecentShipments', () {
      test('should clear all shipments', () async {
        await RecentShipmentsService.addRecentShipment({'id': '1'});
        await RecentShipmentsService.addRecentShipment({'id': '2'});

        await RecentShipmentsService.clearRecentShipments();

        final result = await RecentShipmentsService.getRecentShipments();

        expect(result, isEmpty);
      });

      test('should not throw when clearing empty list', () async {
        expect(
          () async => await RecentShipmentsService.clearRecentShipments(),
          returnsNormally,
        );
      });

      test('should allow adding after clear', () async {
        await RecentShipmentsService.addRecentShipment({'id': '1'});
        await RecentShipmentsService.clearRecentShipments();
        await RecentShipmentsService.addRecentShipment({'id': '2'});

        final result = await RecentShipmentsService.getRecentShipments();

        expect(result.length, equals(1));
        expect(result.first['id'], equals('2'));
      });
    });

    // ==================== Boundary Values ====================
    group('Boundary Values', () {
      test('should handle exactly 3 shipments', () async {
        await RecentShipmentsService.addRecentShipment({'id': '1'});
        await RecentShipmentsService.addRecentShipment({'id': '2'});
        await RecentShipmentsService.addRecentShipment({'id': '3'});

        final result = await RecentShipmentsService.getRecentShipments();

        expect(result.length, equals(3));
      });

      test('should handle shipment with long Arabic text', () async {
        await RecentShipmentsService.addRecentShipment({
          'id': 'arabic',
          'importerName':
              'شركة التصدير المصرية للمنتجات الغذائية والزراعية المحدودة',
          'description': 'هذا وصف طويل جداً للشحنة يحتوي على تفاصيل كثيرة',
        });

        final result = await RecentShipmentsService.getRecentShipments();

        expect(result.first['id'], equals('arabic'));
        expect(result.first['importerName'], contains('التصدير'));
      });

      test('should handle shipment with special characters', () async {
        await RecentShipmentsService.addRecentShipment({
          'id': 'special',
          'notes': 'Test with special chars: @#\$%^&*()',
        });

        final result = await RecentShipmentsService.getRecentShipments();

        expect(result.first['notes'], contains('@#\$'));
      });
    });
  });
}
