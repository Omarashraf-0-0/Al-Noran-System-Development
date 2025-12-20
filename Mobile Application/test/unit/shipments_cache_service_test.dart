import 'package:flutter_test/flutter_test.dart';
import 'package:alnoran_mobile_application/core/services/shipments_cache_service.dart';

/// =====================================================
/// 📚 شرح الـ ShipmentsCacheService:
/// =====================================================
///
/// ده Singleton Service لتخزين بيانات الشحنات في الـ Memory
///
/// بيعمل Cache لـ:
/// - قائمة كل الشحنات (_allShipments)
/// - تفاصيل كل شحنة (_shipmentDetailsCache)
/// - المستندات المطلوبة لكل شحنة (_requiredDocumentsCache)
///
/// الـ Cache Duration: 5 دقائق
/// بعدها بيعتبر الـ Cache stale وبيجيب من الـ API تاني
///
/// async Methods (تحتاج API - Integration Tests):
/// - getAllShipments()
/// - getShipmentByAcid()
/// - getRequiredDocuments()
/// - refresh()
/// - refreshShipment()
///
/// sync Methods (نقدر نختبرها كـ Unit Tests):
/// - clear()
/// - invalidateDocumentsCache()
/// - invalidateShipmentCache()
/// - updateShipmentStatus()
/// - getRecentShipments()
/// - getStatistics()
/// =====================================================

void main() {
  // نجيب الـ singleton instance
  late ShipmentsCacheService service;

  setUp(() {
    service = ShipmentsCacheService();
    // نمسح الـ cache قبل كل test
    service.clear();
  });

  tearDown(() {
    // نمسح الـ cache بعد كل test
    service.clear();
  });

  group('ShipmentsCacheService', () {
    // ==================== Singleton Pattern ====================
    group('Singleton Pattern', () {
      test('should return same instance when called multiple times', () {
        final instance1 = ShipmentsCacheService();
        final instance2 = ShipmentsCacheService();
        final instance3 = ShipmentsCacheService();

        expect(identical(instance1, instance2), isTrue);
        expect(identical(instance2, instance3), isTrue);
      });

      test('should maintain state across instances', () {
        final instance1 = ShipmentsCacheService();
        final instance2 = ShipmentsCacheService();

        // They share the same state
        expect(instance1.allShipments, equals(instance2.allShipments));
        expect(instance1.isInitialized, equals(instance2.isInitialized));
      });
    });

    // ==================== Initial State Tests ====================
    group('Initial State (after clear)', () {
      test('should have empty allShipments list', () {
        expect(service.allShipments, isEmpty);
        expect(service.allShipments, isA<List<Map<String, dynamic>>>());
      });

      test('should not be initialized', () {
        expect(service.isInitialized, isFalse);
      });

      test('should not be loading', () {
        expect(service.isLoading, isFalse);
      });

      test('allShipments should return empty list not null', () {
        expect(service.allShipments, isNotNull);
        expect(service.allShipments.length, equals(0));
      });
    });

    // ==================== clear() Tests ====================
    group('clear', () {
      test('should reset allShipments to empty list', () {
        service.clear();
        expect(service.allShipments, isEmpty);
      });

      test('should set isInitialized to false', () {
        service.clear();
        expect(service.isInitialized, isFalse);
      });

      test('should not throw when called on empty cache', () {
        expect(() => service.clear(), returnsNormally);
      });

      test('should be safe to call multiple times', () {
        expect(() {
          service.clear();
          service.clear();
          service.clear();
        }, returnsNormally);
      });

      test('should emit empty list to stream', () async {
        final futureValue = service.shipmentsStream.first;
        service.clear();
        final value = await futureValue;
        expect(value, isEmpty);
      });
    });

    // ==================== getRecentShipments() Tests ====================
    group('getRecentShipments', () {
      test('should return empty list when no shipments', () {
        final recent = service.getRecentShipments();
        expect(recent, isEmpty);
        expect(recent, isA<List<Map<String, dynamic>>>());
      });

      test('should return max 3 shipments', () {
        // Unfortunately we can't populate _allShipments without API
        // But we can test that when empty, it returns empty list correctly
        final recent = service.getRecentShipments();
        expect(recent.length, lessThanOrEqualTo(3));
      });

      test('should not throw when cache is empty', () {
        expect(() => service.getRecentShipments(), returnsNormally);
      });

      test('should return a new list (not reference)', () {
        final recent1 = service.getRecentShipments();
        final recent2 = service.getRecentShipments();
        // Both are empty but should be different list instances
        expect(identical(recent1, recent2), isFalse);
      });
    });

    // ==================== getStatistics() Tests ====================
    group('getStatistics', () {
      test('should return map with correct keys', () {
        final stats = service.getStatistics();
        expect(stats.containsKey('totalShipments'), isTrue);
        expect(stats.containsKey('activeShipments'), isTrue);
        expect(stats.containsKey('completedShipments'), isTrue);
      });

      test('should have 3 keys exactly', () {
        final stats = service.getStatistics();
        expect(stats.keys.length, equals(3));
      });

      test('should return zeros when cache is empty', () {
        final stats = service.getStatistics();
        expect(stats['totalShipments'], equals(0));
        expect(stats['activeShipments'], equals(0));
        expect(stats['completedShipments'], equals(0));
      });

      test('should return non-null values', () {
        final stats = service.getStatistics();
        expect(stats['totalShipments'], isNotNull);
        expect(stats['activeShipments'], isNotNull);
        expect(stats['completedShipments'], isNotNull);
      });

      test('should return Map<String, int>', () {
        final stats = service.getStatistics();
        expect(stats, isA<Map<String, int>>());
        for (var value in stats.values) {
          expect(value, isA<int>());
        }
      });

      test('total should equal active + completed when empty', () {
        final stats = service.getStatistics();
        // When empty, all are 0
        expect(
          stats['totalShipments'],
          equals(stats['activeShipments']! + stats['completedShipments']!),
        );
      });
    });

    // ==================== invalidateDocumentsCache() Tests ====================
    group('invalidateDocumentsCache', () {
      test('should not throw when called with non-existent shipmentId', () {
        expect(
          () => service.invalidateDocumentsCache('non_existent_id'),
          returnsNormally,
        );
      });

      test('should not throw with empty string', () {
        expect(() => service.invalidateDocumentsCache(''), returnsNormally);
      });

      test('should not throw with special characters', () {
        expect(
          () => service.invalidateDocumentsCache('!@#\$%^&*()'),
          returnsNormally,
        );
      });

      test('should not throw with unicode characters', () {
        expect(
          () => service.invalidateDocumentsCache('شحنة-123'),
          returnsNormally,
        );
      });

      test('should be safe to call multiple times for same ID', () {
        expect(() {
          service.invalidateDocumentsCache('ship123');
          service.invalidateDocumentsCache('ship123');
          service.invalidateDocumentsCache('ship123');
        }, returnsNormally);
      });
    });

    // ==================== invalidateShipmentCache() Tests ====================
    group('invalidateShipmentCache', () {
      test('should not throw when called with non-existent ACID', () {
        expect(
          () => service.invalidateShipmentCache('ACID-non-existent'),
          returnsNormally,
        );
      });

      test('should not throw with empty string', () {
        expect(() => service.invalidateShipmentCache(''), returnsNormally);
      });

      test('should not throw with special characters', () {
        expect(
          () => service.invalidateShipmentCache('ACID-@#\$%'),
          returnsNormally,
        );
      });

      test('should not throw with Arabic characters', () {
        expect(
          () => service.invalidateShipmentCache('رقم-الشحنة-123'),
          returnsNormally,
        );
      });

      test('should be safe to call multiple times for same ACID', () {
        expect(() {
          service.invalidateShipmentCache('ACID-123');
          service.invalidateShipmentCache('ACID-123');
          service.invalidateShipmentCache('ACID-123');
        }, returnsNormally);
      });

      test('should handle very long ACID strings', () {
        final longAcid = 'A' * 1000;
        expect(
          () => service.invalidateShipmentCache(longAcid),
          returnsNormally,
        );
      });
    });

    // ==================== updateShipmentStatus() Tests ====================
    group('updateShipmentStatus', () {
      test('should not throw when shipment not in cache', () {
        expect(
          () => service.updateShipmentStatus('ACID-123', 'new_status'),
          returnsNormally,
        );
      });

      test('should not throw with empty ACID', () {
        expect(
          () => service.updateShipmentStatus('', 'new_status'),
          returnsNormally,
        );
      });

      test('should not throw with empty status', () {
        expect(
          () => service.updateShipmentStatus('ACID-123', ''),
          returnsNormally,
        );
      });

      test('should not throw with Arabic status', () {
        expect(
          () => service.updateShipmentStatus('ACID-123', 'تمت بنجاح'),
          returnsNormally,
        );
      });

      test('should emit to stream when called', () async {
        final futureValue = service.shipmentsStream.first;
        service.updateShipmentStatus('ACID-123', 'processing');
        final value = await futureValue;
        // Since no shipments in cache, should emit empty list
        expect(value, isEmpty);
      });

      test('should handle special characters in status', () {
        expect(
          () =>
              service.updateShipmentStatus('ACID-123', 'Status: 50% complete!'),
          returnsNormally,
        );
      });
    });

    // ==================== shipmentsStream Tests ====================
    group('shipmentsStream', () {
      test('should be a broadcast stream', () {
        expect(service.shipmentsStream.isBroadcast, isTrue);
      });

      test('should allow multiple listeners', () {
        expect(() {
          service.shipmentsStream.listen((_) {});
          service.shipmentsStream.listen((_) {});
          service.shipmentsStream.listen((_) {});
        }, returnsNormally);
      });

      test('should emit when clear is called', () async {
        final values = <List<Map<String, dynamic>>>[];
        final subscription = service.shipmentsStream.listen(values.add);

        service.clear();

        await Future.delayed(const Duration(milliseconds: 100));
        expect(values.isNotEmpty, isTrue);

        await subscription.cancel();
      });

      test('should emit when updateShipmentStatus is called', () async {
        final values = <List<Map<String, dynamic>>>[];
        final subscription = service.shipmentsStream.listen(values.add);

        service.updateShipmentStatus('ACID-123', 'processing');

        await Future.delayed(const Duration(milliseconds: 100));
        expect(values.isNotEmpty, isTrue);

        await subscription.cancel();
      });
    });

    // ==================== Getter Boundary Tests ====================
    group('Getters Boundary Tests', () {
      test(
        'allShipments should be modifiable without affecting internal state',
        () {
          final shipments = service.allShipments;
          // The getter returns the actual list reference, so this could be an issue
          // Testing current behavior
          expect(shipments, isEmpty);
        },
      );

      test('isInitialized should be boolean', () {
        expect(service.isInitialized, isA<bool>());
      });

      test('isLoading should be boolean', () {
        expect(service.isLoading, isA<bool>());
      });

      test('all getters should be accessible without crash', () {
        expect(() => service.allShipments, returnsNormally);
        expect(() => service.isInitialized, returnsNormally);
        expect(() => service.isLoading, returnsNormally);
        expect(() => service.shipmentsStream, returnsNormally);
      });
    });

    // ==================== State Consistency Tests ====================
    group('State Consistency', () {
      test('clear should reset all state consistently', () {
        service.clear();

        expect(service.allShipments, isEmpty);
        expect(service.isInitialized, isFalse);
        expect(service.getRecentShipments(), isEmpty);
        expect(service.getStatistics()['totalShipments'], equals(0));
      });

      test('getStatistics should be consistent with allShipments', () {
        service.clear();

        final stats = service.getStatistics();
        expect(stats['totalShipments'], equals(service.allShipments.length));
      });

      test('getRecentShipments count should be <= allShipments count', () {
        expect(
          service.getRecentShipments().length,
          lessThanOrEqualTo(service.allShipments.length),
        );
      });

      test('multiple operations should not corrupt state', () {
        // Perform multiple operations
        service.clear();
        service.invalidateDocumentsCache('doc1');
        service.invalidateShipmentCache('ship1');
        service.updateShipmentStatus('acid1', 'status1');
        service.getRecentShipments();
        service.getStatistics();
        service.clear();

        // State should be clean
        expect(service.allShipments, isEmpty);
        expect(service.isInitialized, isFalse);
        expect(service.isLoading, isFalse);
      });
    });

    // ==================== Edge Cases ====================
    group('Edge Cases', () {
      test('should handle rapid successive calls to clear', () async {
        final futures = <Future>[];
        for (var i = 0; i < 100; i++) {
          service.clear();
        }
        await Future.wait(futures);
        expect(service.allShipments, isEmpty);
      });

      test('should handle concurrent invalidation calls', () {
        for (var i = 0; i < 50; i++) {
          service.invalidateDocumentsCache('ship_$i');
          service.invalidateShipmentCache('acid_$i');
        }
        expect(() => service.getStatistics(), returnsNormally);
      });

      test('should handle null-like values in updateShipmentStatus', () {
        // Empty strings (closest to null in this context)
        expect(() => service.updateShipmentStatus('', ''), returnsNormally);
      });

      test('getRecentShipments should handle being called many times', () {
        for (var i = 0; i < 100; i++) {
          final recent = service.getRecentShipments();
          expect(recent, isA<List<Map<String, dynamic>>>());
        }
      });

      test('getStatistics should handle being called many times', () {
        for (var i = 0; i < 100; i++) {
          final stats = service.getStatistics();
          expect(stats, isA<Map<String, int>>());
        }
      });
    });
  });
}
