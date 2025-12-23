import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:alnoran_mobile_application/core/services/document_verification_service.dart';

void main() {
  group('DocumentVerificationService', () {
    late DocumentVerificationService service;

    setUp(() {
      SharedPreferences.setMockInitialValues({});
      service = DocumentVerificationService();
      service.clearCache();
    });

    // ==================== getRequiredDocuments Tests ====================
    group('getRequiredDocuments', () {
      test('should return correct documents for personal client type', () {
        final docs = DocumentVerificationService.getRequiredDocuments(
          'personal',
        );

        expect(docs, isNotEmpty);
        expect(docs, contains('personal_id'));
        expect(docs, contains('power_of_attorney'));
        expect(docs.length, equals(2));
      });

      test('should return correct documents for commercial client type', () {
        final docs = DocumentVerificationService.getRequiredDocuments(
          'commercial',
        );

        expect(docs, isNotEmpty);
        expect(docs, contains('contract'));
        expect(docs, contains('tax_card'));
        expect(docs, contains('commercial_register'));
        expect(docs, contains('certificate_vat'));
        expect(docs, contains('import_export_card'));
        expect(docs.length, equals(5));
      });

      test('should return correct documents for factory client type', () {
        final docs = DocumentVerificationService.getRequiredDocuments(
          'factory',
        );

        expect(docs, isNotEmpty);
        expect(docs, contains('contract'));
        expect(docs, contains('tax_card'));
        expect(docs, contains('commercial_register'));
        expect(docs, contains('certificate_vat'));
        expect(docs, contains('production_supplies'));
        expect(docs, contains('industrial_register'));
        expect(docs.length, equals(6));
      });

      test(
        'should return default (personal) documents for unknown client type',
        () {
          final docs = DocumentVerificationService.getRequiredDocuments(
            'unknown_type',
          );

          // Should return personal documents as default
          expect(docs, contains('personal_id'));
          expect(docs, contains('power_of_attorney'));
          expect(docs.length, equals(2));
        },
      );

      test(
        'should return default (personal) documents for empty client type',
        () {
          final docs = DocumentVerificationService.getRequiredDocuments('');

          expect(docs, contains('personal_id'));
          expect(docs.length, equals(2));
        },
      );
    });

    // ==================== getDocumentTypeName Tests ====================
    group('getDocumentTypeName', () {
      test('should return Arabic name for personal_id', () {
        final name = DocumentVerificationService.getDocumentTypeName(
          'personal_id',
        );
        expect(name, equals('البطاقة الشخصية'));
      });

      test('should return Arabic name for power_of_attorney', () {
        final name = DocumentVerificationService.getDocumentTypeName(
          'power_of_attorney',
        );
        expect(name, equals('التوكيل'));
      });

      test('should return Arabic name for tax_card', () {
        final name = DocumentVerificationService.getDocumentTypeName(
          'tax_card',
        );
        expect(name, equals('البطاقة الضريبية'));
      });

      test('should return Arabic name for commercial_register', () {
        final name = DocumentVerificationService.getDocumentTypeName(
          'commercial_register',
        );
        expect(name, equals('السجل التجاري'));
      });

      test('should return Arabic name for certificate_vat', () {
        final name = DocumentVerificationService.getDocumentTypeName(
          'certificate_vat',
        );
        expect(name, equals('شهادة القيمة المضافة'));
      });

      test('should return Arabic name for industrial_register', () {
        final name = DocumentVerificationService.getDocumentTypeName(
          'industrial_register',
        );
        expect(name, equals('السجل الصناعي'));
      });

      test('should return Arabic name for production_supplies', () {
        final name = DocumentVerificationService.getDocumentTypeName(
          'production_supplies',
        );
        expect(name, equals('مستلزمات الإنتاج'));
      });

      test('should return Arabic name for import_export_card', () {
        final name = DocumentVerificationService.getDocumentTypeName(
          'import_export_card',
        );
        expect(name, equals('بطاقة استيراد/تصدير'));
      });

      test('should return original type name for unknown document type', () {
        final name = DocumentVerificationService.getDocumentTypeName(
          'unknownDocument',
        );
        expect(name, equals('unknownDocument'));
      });

      test('should return Arabic name for contract', () {
        final name = DocumentVerificationService.getDocumentTypeName(
          'contract',
        );
        expect(name, equals('العقد'));
      });
    });

    // ==================== clearCache Tests ====================
    group('clearCache', () {
      test('should not throw when clearing cache', () {
        expect(() => service.clearCache(), returnsNormally);
      });

      test('should be able to clear cache multiple times', () {
        service.clearCache();
        service.clearCache();
        service.clearCache();

        // No exception should be thrown
        expect(true, isTrue);
      });
    });

    // ==================== Client Type Document Requirements ====================
    group('Client Type Document Requirements', () {
      test('all client types should have at least one required document', () {
        final clientTypes = ['personal', 'commercial', 'factory'];

        for (final type in clientTypes) {
          final docs = DocumentVerificationService.getRequiredDocuments(type);
          expect(
            docs.isNotEmpty,
            isTrue,
            reason: 'Client type "$type" should have required documents',
          );
        }
      });

      test('commercial and factory should have different documents', () {
        final commercialDocs = DocumentVerificationService.getRequiredDocuments(
          'commercial',
        );
        final factoryDocs = DocumentVerificationService.getRequiredDocuments(
          'factory',
        );

        // Both have some common docs
        expect(commercialDocs, contains('tax_card'));
        expect(factoryDocs, contains('tax_card'));

        // But factory has unique docs
        expect(factoryDocs, contains('industrial_register'));
        expect(commercialDocs.contains('industrial_register'), isFalse);
      });

      test('personal has fewest required documents', () {
        final personalDocs = DocumentVerificationService.getRequiredDocuments(
          'personal',
        );
        final commercialDocs = DocumentVerificationService.getRequiredDocuments(
          'commercial',
        );
        final factoryDocs = DocumentVerificationService.getRequiredDocuments(
          'factory',
        );

        expect(personalDocs.length, lessThan(commercialDocs.length));
        expect(personalDocs.length, lessThan(factoryDocs.length));
      });
    });
  });
}
