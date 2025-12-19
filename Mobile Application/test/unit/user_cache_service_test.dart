import 'package:flutter_test/flutter_test.dart';
import 'package:alnoran_mobile_application/core/services/user_cache_service.dart';

/// =====================================================
/// 📚 شرح الـ UserCacheService:
/// =====================================================
///
/// ده Singleton Service معناها:
/// - فيه instance واحدة بس في الـ App كلها
/// - أي حد يعمل UserCacheService() هياخد نفس الـ instance
///
/// ليه Singleton؟
/// - عشان الـ cache يكون واحد في كل الـ App
/// - لو كل صفحة عملت instance جديدة، كل واحدة هيكون عندها cache مختلف!
///
/// الوظائف:
/// 1. initialize() - بيجيب بيانات اليوزر من الـ Storage والـ API
/// 2. clear() - بيمسح الـ Cache (لما اليوزر يعمل logout)
/// 3. getCachedData() - بيرجع البيانات المحفوظة
/// 4. updateProfilePhoto() - بيحدث صورة البروفايل
/// 5. refresh() - بيعمل refresh للبيانات من الـ API
///
/// الـ Stream:
/// - بيسمح للـ widgets إنها تسمع للتغييرات
/// - لما البيانات تتغير، كل اللي subscribed بيتنبهوا
///
/// ملاحظة: الـ Service دي Singleton فالـ state بيفضل
/// لازم نعمل clear() بعد كل test عشان نضمن عزل الـ tests
/// =====================================================

void main() {
  // نجيب الـ singleton instance
  late UserCacheService service;

  setUp(() {
    service = UserCacheService();
    // نمسح الـ cache قبل كل test عشان نبدأ من الأول
    service.clear();
  });

  tearDown(() {
    // نمسح الـ cache بعد كل test
    service.clear();
  });

  group('UserCacheService', () {
    // ==================== Singleton Tests ====================
    group('Singleton Pattern', () {
      test('should return same instance when called multiple times', () {
        // ده بيختبر إن الـ singleton شغال صح
        final instance1 = UserCacheService();
        final instance2 = UserCacheService();

        expect(identical(instance1, instance2), isTrue);
      });
    });

    // ==================== Initial State Tests ====================
    group('Initial State (after clear)', () {
      test('should have empty userName initially', () {
        expect(service.userName, equals(''));
      });

      test('should have empty userEmail initially', () {
        expect(service.userEmail, equals(''));
      });

      test('should have null profilePhotoUrl initially', () {
        expect(service.profilePhotoUrl, isNull);
      });

      test('should have null userId initially', () {
        expect(service.userId, isNull);
      });

      test('should have null fullUserData initially', () {
        expect(service.fullUserData, isNull);
      });

      test('should not be initialized initially', () {
        expect(service.isInitialized, isFalse);
      });

      test('should not be loading initially', () {
        expect(service.isLoading, isFalse);
      });
    });

    // ==================== getCachedData Tests ====================
    group('getCachedData', () {
      test('should return empty data when not initialized', () {
        final data = service.getCachedData();

        expect(data['userName'], equals(''));
        expect(data['userEmail'], equals(''));
        expect(data['profilePhotoUrl'], isNull);
        expect(data['userId'], isNull);
        expect(data['isInitialized'], isFalse);
      });

      test('should return map with correct keys', () {
        final data = service.getCachedData();

        expect(data.containsKey('userName'), isTrue);
        expect(data.containsKey('userEmail'), isTrue);
        expect(data.containsKey('profilePhotoUrl'), isTrue);
        expect(data.containsKey('userId'), isTrue);
        expect(data.containsKey('isInitialized'), isTrue);
      });
    });

    // ==================== clear Tests ====================
    group('clear', () {
      test('should reset all cached values', () {
        // هنا مش هنقدر نـ populate الـ cache بدون mocking
        // بس نقدر نتأكد إن clear() مش بتعمل crash
        // ودي defensive programming
        expect(() => service.clear(), returnsNormally);
      });

      test('should set isInitialized to false after clear', () {
        service.clear();
        expect(service.isInitialized, isFalse);
      });

      test('should clear userName after clear', () {
        service.clear();
        expect(service.userName, equals(''));
      });

      test('should clear userEmail after clear', () {
        service.clear();
        expect(service.userEmail, equals(''));
      });

      test('should clear profilePhotoUrl after clear', () {
        service.clear();
        expect(service.profilePhotoUrl, isNull);
      });

      test('should clear userId after clear', () {
        service.clear();
        expect(service.userId, isNull);
      });
    });

    // ==================== updateProfilePhoto Tests ====================
    group('updateProfilePhoto', () {
      test('should update profilePhotoUrl', () {
        const newUrl = 'https://example.com/photo.jpg';
        service.updateProfilePhoto(newUrl);
        expect(service.profilePhotoUrl, equals(newUrl));
      });

      test('should handle null URL', () {
        service.updateProfilePhoto('https://example.com/photo.jpg');
        service.updateProfilePhoto(null);
        expect(service.profilePhotoUrl, isNull);
      });

      test('should handle empty string URL', () {
        service.updateProfilePhoto('');
        expect(service.profilePhotoUrl, equals(''));
      });

      test('should update multiple times', () {
        service.updateProfilePhoto('url1');
        expect(service.profilePhotoUrl, equals('url1'));

        service.updateProfilePhoto('url2');
        expect(service.profilePhotoUrl, equals('url2'));

        service.updateProfilePhoto('url3');
        expect(service.profilePhotoUrl, equals('url3'));
      });
    });

    // ==================== Stream Tests ====================
    group('userDataStream', () {
      test('should have a broadcast stream', () {
        // Broadcast streams allow multiple listeners
        expect(service.userDataStream.isBroadcast, isTrue);
      });

      test('should emit null when clear is called', () async {
        // نسمع للـ stream
        final futureValue = service.userDataStream.first;

        // نعمل clear
        service.clear();

        // نتأكد إن null اتبعتت
        final value = await futureValue;
        expect(value, isNull);
      });

      test('should emit when updateProfilePhoto is called', () async {
        // نسمع للـ stream
        final futureValue = service.userDataStream.first;

        // نحدث الصورة
        service.updateProfilePhoto('https://test.com/photo.jpg');

        // الـ stream لازم يـ emit (حتى لو null لأن fullUserData null)
        final value = await futureValue;
        // fullUserData is null initially, so stream emits null
        expect(value, isNull);
      });
    });

    // ==================== Getter Edge Cases ====================
    group('Getters Edge Cases', () {
      test('userName should return empty string not null', () {
        // ده مهم عشان الـ UI متكسرش لو استخدمت userName مباشرة
        expect(service.userName, isA<String>());
        expect(service.userName, isNotNull);
      });

      test('userEmail should return empty string not null', () {
        expect(service.userEmail, isA<String>());
        expect(service.userEmail, isNotNull);
      });

      test('all getters should be accessible without initialization', () {
        // Defensive test - كل الـ getters لازم تشتغل حتى قبل initialize
        expect(() => service.userName, returnsNormally);
        expect(() => service.userEmail, returnsNormally);
        expect(() => service.profilePhotoUrl, returnsNormally);
        expect(() => service.userId, returnsNormally);
        expect(() => service.fullUserData, returnsNormally);
        expect(() => service.isInitialized, returnsNormally);
        expect(() => service.isLoading, returnsNormally);
      });
    });

    // ==================== State Consistency Tests ====================
    group('State Consistency', () {
      test('getCachedData should be consistent with getters', () {
        service.updateProfilePhoto('https://test.com/photo.jpg');

        final data = service.getCachedData();

        expect(data['userName'], equals(service.userName));
        expect(data['userEmail'], equals(service.userEmail));
        expect(data['profilePhotoUrl'], equals(service.profilePhotoUrl));
        expect(data['userId'], equals(service.userId));
        expect(data['isInitialized'], equals(service.isInitialized));
      });

      test('clear should be safe to call multiple times', () {
        expect(() {
          service.clear();
          service.clear();
          service.clear();
        }, returnsNormally);
      });

      test('stream should allow multiple listeners', () {
        expect(() {
          service.userDataStream.listen((_) {});
          service.userDataStream.listen((_) {});
          service.userDataStream.listen((_) {});
        }, returnsNormally);
      });

      test('updateProfilePhoto should reflect in getCachedData', () {
        service.updateProfilePhoto('https://example.com/new.png');
        final data = service.getCachedData();
        expect(data['profilePhotoUrl'], equals('https://example.com/new.png'));
      });
    });
  });
}
