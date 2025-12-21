import 'package:flutter_test/flutter_test.dart';
import 'package:alnoran_mobile_application/core/services/document_verification_service.dart';

/// =====================================================
/// 📚 شرح الـ DocumentVerificationService:
/// =====================================================
///
/// ده Service بيتحقق من المستندات المرفوعة قبل تقديم طلبات ACID/UCR
///
/// الـ Methods اللي بنختبرها:
/// 1. getRequiredDocuments() - بترجع قائمة المستندات المطلوبة حسب نوع العميل
/// 2. getDocumentTypeName() - بترجع الاسم العربي لنوع المستند
/// 3. clearCache() - بتمسح الـ cached result
///
/// أنواع العملاء:
/// - personal: شخصي (بطاقة + توكيل)
/// - commercial: تجاري (عقد + ضريبية + سجل تجاري + VAT + استيراد/تصدير)
/// - factory: مصنع (عقد + ضريبية + سجل تجاري + VAT + مستلزمات + صناعي)
/// =====================================================

void main() {
  group('DocumentVerificationService', () {
    late DocumentVerificationService service;

    setUp(() {
      service = DocumentVerificationService();
      service.clearCache();
    });

    tearDown(() {
      service.clearCache();
    });

    // ==================== Singleton Pattern ====================
    group('Singleton Pattern', () {
      test('should return same instance', () {
        final instance1 = DocumentVerificationService();
        final instance2 = DocumentVerificationService();
        expect(identical(instance1, instance2), isTrue);
      });
    });

    // ==================== getRequiredDocuments Tests ====================
    group('getRequiredDocuments', () {
      group('Personal Client Type', () {
        test('should return correct documents for personal', () {
          final docs = DocumentVerificationService.getRequiredDocuments(
            'personal',
          );
          expect(docs, contains('personal_id'));
          expect(docs, contains('power_of_attorney'));
        });

        test('should return exactly 2 documents for personal', () {
          final docs = DocumentVerificationService.getRequiredDocuments(
            'personal',
          );
          expect(docs.length, equals(2));
        });

        test('should not contain commercial documents for personal', () {
          final docs = DocumentVerificationService.getRequiredDocuments(
            'personal',
          );
          expect(docs, isNot(contains('commercial_register')));
          expect(docs, isNot(contains('tax_card')));
        });
      });

      group('Commercial Client Type', () {
        test('should return correct documents for commercial', () {
          final docs = DocumentVerificationService.getRequiredDocuments(
            'commercial',
          );
          expect(docs, contains('contract'));
          expect(docs, contains('tax_card'));
          expect(docs, contains('commercial_register'));
          expect(docs, contains('certificate_vat'));
          expect(docs, contains('import_export_card'));
        });

        test('should return exactly 5 documents for commercial', () {
          final docs = DocumentVerificationService.getRequiredDocuments(
            'commercial',
          );
          expect(docs.length, equals(5));
        });

        test(
          'should not contain factory-specific documents for commercial',
          () {
            final docs = DocumentVerificationService.getRequiredDocuments(
              'commercial',
            );
            expect(docs, isNot(contains('industrial_register')));
            expect(docs, isNot(contains('production_supplies')));
          },
        );
      });

      group('Factory Client Type', () {
        test('should return correct documents for factory', () {
          final docs = DocumentVerificationService.getRequiredDocuments(
            'factory',
          );
          expect(docs, contains('contract'));
          expect(docs, contains('tax_card'));
          expect(docs, contains('commercial_register'));
          expect(docs, contains('certificate_vat'));
          expect(docs, contains('production_supplies'));
          expect(docs, contains('industrial_register'));
        });

        test('should return exactly 6 documents for factory', () {
          final docs = DocumentVerificationService.getRequiredDocuments(
            'factory',
          );
          expect(docs.length, equals(6));
        });

        test('should not contain import_export_card for factory', () {
          final docs = DocumentVerificationService.getRequiredDocuments(
            'factory',
          );
          expect(docs, isNot(contains('import_export_card')));
        });
      });

      group('Default/Unknown Client Type', () {
        test('should return personal documents for unknown type', () {
          final docs = DocumentVerificationService.getRequiredDocuments(
            'unknown_type',
          );
          expect(docs, contains('personal_id'));
          expect(docs, contains('power_of_attorney'));
        });

        test('should return personal documents for empty string', () {
          final docs = DocumentVerificationService.getRequiredDocuments('');
          expect(docs.length, equals(2));
        });

        test('should return personal documents for PERSONAL (uppercase)', () {
          // Note: The switch uses lowercase comparison, so uppercase won't match
          final docs = DocumentVerificationService.getRequiredDocuments(
            'PERSONAL',
          );
          // Will fall to default (personal docs)
          expect(docs.length, equals(2));
        });
      });

      group('Edge Cases', () {
        test('should return a new list each time (not reference)', () {
          final docs1 = DocumentVerificationService.getRequiredDocuments(
            'personal',
          );
          final docs2 = DocumentVerificationService.getRequiredDocuments(
            'personal',
          );
          expect(identical(docs1, docs2), isFalse);
        });

        test('should handle null-like values', () {
          // Closest we can get without actually passing null
          final docs = DocumentVerificationService.getRequiredDocuments('null');
          expect(docs, isNotEmpty);
        });
      });
    });

    // ==================== getDocumentTypeName Tests ====================
    group('getDocumentTypeName', () {
      group('Personal Documents', () {
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
      });

      group('Commercial Documents', () {
        test('should return Arabic name for contract', () {
          final name = DocumentVerificationService.getDocumentTypeName(
            'contract',
          );
          expect(name, equals('العقد'));
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

        test('should return Arabic name for import_export_card', () {
          final name = DocumentVerificationService.getDocumentTypeName(
            'import_export_card',
          );
          expect(name, equals('بطاقة استيراد/تصدير'));
        });
      });

      group('Factory Documents', () {
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
      });

      group('Unknown Document Types', () {
        test('should return same string for unknown type', () {
          final name = DocumentVerificationService.getDocumentTypeName(
            'unknown_document',
          );
          expect(name, equals('unknown_document'));
        });

        test('should return empty string for empty input', () {
          final name = DocumentVerificationService.getDocumentTypeName('');
          expect(name, equals(''));
        });

        test('should handle special characters', () {
          final name = DocumentVerificationService.getDocumentTypeName(
            'doc_@#\$%',
          );
          expect(name, equals('doc_@#\$%'));
        });
      });
    });

    // ==================== clearCache Tests ====================
    group('clearCache', () {
      test('should not throw when called', () {
        expect(() => service.clearCache(), returnsNormally);
      });

      test('should be safe to call multiple times', () {
        expect(() {
          service.clearCache();
          service.clearCache();
          service.clearCache();
        }, returnsNormally);
      });
    });

    // ==================== State Consistency Tests ====================
    group('State Consistency', () {
      test('getRequiredDocuments should be consistent across calls', () {
        final docs1 = DocumentVerificationService.getRequiredDocuments(
          'commercial',
        );
        final docs2 = DocumentVerificationService.getRequiredDocuments(
          'commercial',
        );
        expect(docs1, equals(docs2));
      });

      test('getDocumentTypeName should be consistent', () {
        final name1 = DocumentVerificationService.getDocumentTypeName(
          'tax_card',
        );
        final name2 = DocumentVerificationService.getDocumentTypeName(
          'tax_card',
        );
        expect(name1, equals(name2));
      });

      test('all required docs should have Arabic names', () {
        final allDocs = [
          'personal_id',
          'power_of_attorney',
          'contract',
          'tax_card',
          'commercial_register',
          'certificate_vat',
          'import_export_card',
          'industrial_register',
          'production_supplies',
        ];

        for (var doc in allDocs) {
          final name = DocumentVerificationService.getDocumentTypeName(doc);
          expect(name, isNotEmpty, reason: 'Doc $doc should have a name');
          expect(
            name,
            isNot(equals(doc)),
            reason: 'Doc $doc should have Arabic name',
          );
        }
      });
    });
  });
}
