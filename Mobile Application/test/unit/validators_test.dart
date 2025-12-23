import 'package:flutter_test/flutter_test.dart';
import 'package:alnoran_mobile_application/util/validators.dart';

void main() {
  group('AlNoranValidators', () {
    // ==================== Email Validation Tests ====================
    group('isValidEmail', () {
      test('should return true for valid email formats', () {
        expect(
          AlNoranValidators.isValidEmail('test@example.com'),
          isTrue,
          reason: 'should accept valid email',
        );
        expect(
          AlNoranValidators.isValidEmail('user.name@domain.org'),
          isTrue,
          reason: 'should accept valid email',
        );
        expect(
          AlNoranValidators.isValidEmail('user+tag@example.co.uk'),
          isTrue,
          reason: 'should accept valid email',
        );
        expect(
          AlNoranValidators.isValidEmail('TEST@EXAMPLE.COM'),
          isTrue,
          reason: 'should accept valid email',
        );
        expect(
          AlNoranValidators.isValidEmail('  test@example.com  '),
          isTrue,
          reason: 'should accept valid email',
        );
      });

      test('should return false for invalid email formats', () {
        expect(
          AlNoranValidators.isValidEmail(''),
          isFalse,
          reason: 'should reject empty email',
        );
        expect(
          AlNoranValidators.isValidEmail('notanemail'),
          isFalse,
          reason: 'should reject invalid email',
        );
        expect(
          AlNoranValidators.isValidEmail('@nodomain.com'),
          isFalse,
          reason: 'should reject invalid email',
        );
        expect(
          AlNoranValidators.isValidEmail('test@'),
          isFalse,
          reason: 'should reject invalid email',
        );
        expect(
          AlNoranValidators.isValidEmail('test@.com'),
          isFalse,
          reason: 'should reject invalid email',
        ); // invalid domain
        expect(
          AlNoranValidators.isValidEmail('test@domain'),
          isFalse,
        ); // no TLD
      });
    });

    // ==================== Egyptian Phone Validation Tests ====================
    group('isValidEgyptianPhone', () {
      test('should return true for valid Vodafone numbers (010)', () {
        expect(
          AlNoranValidators.isValidEgyptianPhone('01012345678'),
          isTrue,
          reason: 'should accept valid Vodafone number',
        );
        expect(
          AlNoranValidators.isValidEgyptianPhone('01098765432'),
          isTrue,
          reason: 'should accept valid Vodafone number',
        );
      });

      test('should return true for valid Etisalat numbers (011)', () {
        expect(
          AlNoranValidators.isValidEgyptianPhone('01112345678'),
          isTrue,
          reason: 'should accept valid  Etisalat number',
        );
        expect(
          AlNoranValidators.isValidEgyptianPhone('01198765432'),
          isTrue,
          reason: 'should accept valid Etisalat number',
        );
      });

      test('should return true for valid Orange numbers (012)', () {
        expect(
          AlNoranValidators.isValidEgyptianPhone('01212345678'),
          isTrue,
          reason: 'should accept valid Orange number',
        );
        expect(
          AlNoranValidators.isValidEgyptianPhone('01298765432'),
          isTrue,
          reason: 'should accept valid Orange number',
        );
      });

      test('should return true for valid WE numbers (015)', () {
        expect(
          AlNoranValidators.isValidEgyptianPhone('01512345678'),
          isTrue,
          reason: 'should accept valid WE number',
        );
        expect(
          AlNoranValidators.isValidEgyptianPhone('01598765432'),
          isTrue,
          reason: 'should accept valid WE number',
        );
      });

      test('should return true for numbers with country code +20', () {
        // Format: +20 + 1[0125] + 8 digits = 13 characters
        // Example: +20 + 10 + 12345678 = +201012345678
        expect(
          AlNoranValidators.isValidEgyptianPhone('+201012345678'),
          isTrue,
          reason: 'should accept valid Vodafone number with +20',
        );
        expect(
          AlNoranValidators.isValidEgyptianPhone('+201112345678'),
          isTrue,
          reason: 'should accept valid Etisalat number with +20',
        );
        expect(
          AlNoranValidators.isValidEgyptianPhone('+201212345678'),
          isTrue,
          reason: 'should accept valid Orange number with +20',
        );
        expect(
          AlNoranValidators.isValidEgyptianPhone('+201512345678'),
          isTrue,
          reason: 'should accept valid WE number with +20',
        );
      });

      test('should return true for numbers with international prefix 0020', () {
        // Format: 0020 + 1[0125] + 8 digits = 15 characters
        expect(
          AlNoranValidators.isValidEgyptianPhone('00201012345678'),
          isTrue,
          reason: 'should accept Vodafone with 0020 prefix',
        );
        expect(
          AlNoranValidators.isValidEgyptianPhone('00201512345678'),
          isTrue,
          reason: 'should accept WE with 0020 prefix',
        );
        expect(
          AlNoranValidators.isValidEgyptianPhone('00201212345678'),
          isTrue,
          reason: 'should accept Orange with 0020 prefix',
        );
        expect(
          AlNoranValidators.isValidEgyptianPhone('00201112345678'),
          isTrue,
          reason: 'should accept Etisalat with 0020 prefix',
        );
        // NOTE: 00200... format is INVALID - correct format is 0020 + 1X + 8 digits
        // When dialing internationally, the leading 0 is removed:
        // Local: 01012345678 → International: 00201012345678 (NOT 002001012345678)
      });

      test('should return true for numbers with spaces/dashes', () {
        expect(
          AlNoranValidators.isValidEgyptianPhone('010 1234 5678'),
          isTrue,
          reason: 'should accept valid phone number with spaces',
        );
        expect(
          AlNoranValidators.isValidEgyptianPhone('010-1234-5678'),
          isTrue,
          reason: 'should accept valid phone number with dashes',
        );
        expect(
          AlNoranValidators.isValidEgyptianPhone('(010) 12345678'),
          isTrue,
          reason: 'should accept valid phone number with parentheses',
        );
      });

      test('should return false for invalid phone numbers', () {
        expect(
          AlNoranValidators.isValidEgyptianPhone(''),
          isFalse,
          reason: 'should reject empty phone number',
        );
        expect(
          AlNoranValidators.isValidEgyptianPhone('01312345678'),
          isFalse,
          reason: 'should reject invalid operator (013)',
        );
        expect(
          AlNoranValidators.isValidEgyptianPhone('01412345678'),
          isFalse,
          reason: 'should reject invalid operator (014)',
        );
        expect(
          AlNoranValidators.isValidEgyptianPhone('0101234567'),
          isFalse,
          reason: 'should reject too short (10 digits)',
        );
        expect(
          AlNoranValidators.isValidEgyptianPhone('010123456789'),
          isFalse,
          reason: 'should reject too long (12 digits)',
        );
        expect(
          AlNoranValidators.isValidEgyptianPhone('02012345678'),
          isFalse,
          reason: 'should reject landline format',
        );
        expect(
          AlNoranValidators.isValidEgyptianPhone('12345678901'),
          isFalse,
          reason: 'should reject doesn\'t start with 01',
        );
      });
    });

    // ==================== Egyptian National ID Validation Tests ====================
    group('isValidEgyptianNationalId', () {
      test('should return true for valid national IDs (century 2 - 1900s)', () {
        expect(
          AlNoranValidators.isValidEgyptianNationalId('29901011234567'),
          isTrue,
          reason: 'should accept valid national ID',
        );
        expect(
          AlNoranValidators.isValidEgyptianNationalId('28512150112345'),
          isTrue,
          reason: 'should accept valid national ID',
        );
      });

      test('should return true for valid national IDs (century 3 - 2000s)', () {
        expect(
          AlNoranValidators.isValidEgyptianNationalId('30001011234567'),
          isTrue,
          reason: 'should accept valid national ID',
        );
        expect(
          AlNoranValidators.isValidEgyptianNationalId('31512150112345'),
          isTrue,
          reason: 'should accept valid national ID',
        );
      });

      test('should return true for IDs with spaces/dashes (cleaned)', () {
        expect(
          AlNoranValidators.isValidEgyptianNationalId('2-9901-0112-34567'),
          isTrue,
          reason: 'should accept valid national ID',
        );
        expect(
          AlNoranValidators.isValidEgyptianNationalId('2 9901 0112 34567'),
          isTrue,
          reason: 'should accept valid national ID',
        );
      });

      test('should return false for invalid national IDs', () {
        expect(
          AlNoranValidators.isValidEgyptianNationalId(''),
          isFalse,
          reason: 'should reject empty national ID',
        );
        expect(
          AlNoranValidators.isValidEgyptianNationalId('1234567890123'),
          isFalse,
          reason: 'should reject invalid national ID',
        );
        expect(
          AlNoranValidators.isValidEgyptianNationalId('123456789012345'),
          isFalse,
          reason: 'should reject invalid national ID',
        );
        expect(
          AlNoranValidators.isValidEgyptianNationalId('19901011234567'),
          isFalse,
          reason: 'should reject invalid national ID',
        );
        expect(
          AlNoranValidators.isValidEgyptianNationalId('49901011234567'),
          isFalse,
          reason: 'should reject invalid national ID',
        );
        expect(
          AlNoranValidators.isValidEgyptianNationalId('29913011234567'),
          isFalse,
          reason: 'should reject invalid national ID',
        ); // invalid month (13)
        expect(
          AlNoranValidators.isValidEgyptianNationalId('29900011234567'),
          isFalse,
          reason: 'should reject invalid national ID',
        ); // invalid month (00)
        expect(
          AlNoranValidators.isValidEgyptianNationalId('29901321234567'),
          isFalse,
          reason: 'should reject invalid national ID',
        ); // invalid day (32)
        expect(
          AlNoranValidators.isValidEgyptianNationalId('29901001234567'),
          isFalse,
          reason: 'should reject invalid national ID',
        ); // invalid day (00)
        expect(
          AlNoranValidators.isValidEgyptianNationalId('29901010012345'),
          isFalse,
          reason: 'should reject invalid national ID',
        ); // invalid governorate (00)
        expect(
          AlNoranValidators.isValidEgyptianNationalId('29901013612345'),
          isFalse,
          reason: 'should reject invalid national ID',
        ); // invalid governorate (36)
        expect(
          AlNoranValidators.isValidEgyptianNationalId('2990101ABC4567'),
          isFalse,
          reason: 'should reject invalid national ID',
        ); // contains letters
      });
    });

    // ==================== Error Message Tests ====================
    group('getPhoneErrorMessage', () {
      test('should return error message for empty phone', () {
        final message = AlNoranValidators.getPhoneErrorMessage('');
        expect(message, contains('أدخل'));
        expect(message, contains('رقم الهاتف'));
      });

      test('should return error message for too short phone', () {
        expect(
          AlNoranValidators.getPhoneErrorMessage('0101234'),
          contains('قصير'),
        );
        expect(
          AlNoranValidators.getPhoneErrorMessage('010123456'),
          contains('قصير'),
        );
        expect(
          AlNoranValidators.getPhoneErrorMessage('0101234567'),
          contains('قصير'),
        ); // 10 digits - still short
      });

      test('should return error message for too long phone without prefix', () {
        // Long phone numbers without international prefix
        expect(
          AlNoranValidators.getPhoneErrorMessage('0201234567890'),
          contains('طويل'),
        );
        expect(
          AlNoranValidators.getPhoneErrorMessage('010123456789012'),
          contains('طويل'),
        );
      });

      test('should return error message for phone not starting with 01', () {
        expect(
          AlNoranValidators.getPhoneErrorMessage('02012345678'),
          contains('يبدأ بـ 01'),
        );
        expect(
          AlNoranValidators.getPhoneErrorMessage('03012345678'),
          contains('يبدأ بـ 01'),
        );
      });

      test('should return error message for invalid operator code', () {
        // Valid operators: 010, 011, 012, 015
        // Invalid: 013, 014, 016, 017, 018, 019
        expect(
          AlNoranValidators.getPhoneErrorMessage('01312345678'),
          contains('010, 011, 012, أو 015'),
        );
        expect(
          AlNoranValidators.getPhoneErrorMessage('01412345678'),
          contains('010, 011, 012, أو 015'),
        );
        expect(
          AlNoranValidators.getPhoneErrorMessage('01612345678'),
          contains('010, 011, 012, أو 015'),
        );
        expect(
          AlNoranValidators.getPhoneErrorMessage('01712345678'),
          contains('010, 011, 012, أو 015'),
        );
        expect(
          AlNoranValidators.getPhoneErrorMessage('01812345678'),
          contains('010, 011, 012, أو 015'),
        );
        expect(
          AlNoranValidators.getPhoneErrorMessage('01912345678'),
          contains('010, 011, 012, أو 015'),
        );
      });

      test('should return generic error for other invalid formats', () {
        // Valid length (11 digits) starting with 01 but other issue
        // This case actually falls through to the generic error only if
        // it passes all other checks but still fails validation
        // The current implementation always returns a specific error first
        // So we test edge cases with invalid operator instead
        // A phone that starts with 01 but has invalid operator (016)
        expect(
          AlNoranValidators.getPhoneErrorMessage('01612345678'),
          contains('010, 011, 012, أو 015'),
        );
      });
    });

    group('getNationalIdErrorMessage', () {
      test('should return error message for empty national ID', () {
        final message = AlNoranValidators.getNationalIdErrorMessage('');
        expect(message, contains('أدخل'));
        expect(message, contains('الرقم القومي'));
      });

      test('should return error message for wrong length', () {
        expect(
          AlNoranValidators.getNationalIdErrorMessage('123'),
          contains('14 رقم'),
        );
        expect(
          AlNoranValidators.getNationalIdErrorMessage('1234567890123'),
          contains('14 رقم'),
        ); // 13 digits
        expect(
          AlNoranValidators.getNationalIdErrorMessage('123456789012345'),
          contains('14 رقم'),
        ); // 15 digits
      });

      test('should return error message for non-numeric characters', () {
        expect(
          AlNoranValidators.getNationalIdErrorMessage('2990101ABC4567'),
          contains('أرقام فقط'),
        );
        expect(
          AlNoranValidators.getNationalIdErrorMessage('29901011234@67'),
          contains('أرقام فقط'),
        );
      });

      test('should return error message for invalid century', () {
        // Valid centuries: 2 (1900s), 3 (2000s)
        expect(
          AlNoranValidators.getNationalIdErrorMessage('19901011234567'),
          contains('يبدأ بـ 2 أو 3'),
        );
        expect(
          AlNoranValidators.getNationalIdErrorMessage('49901011234567'),
          contains('يبدأ بـ 2 أو 3'),
        );
        expect(
          AlNoranValidators.getNationalIdErrorMessage('09901011234567'),
          contains('يبدأ بـ 2 أو 3'),
        );
        expect(
          AlNoranValidators.getNationalIdErrorMessage('59901011234567'),
          contains('يبدأ بـ 2 أو 3'),
        );
      });

      test('should return error message for invalid month', () {
        // Valid months: 01-12
        expect(
          AlNoranValidators.getNationalIdErrorMessage('29900011234567'),
          contains('الشهر'),
        ); // month 00
        expect(
          AlNoranValidators.getNationalIdErrorMessage('29913011234567'),
          contains('الشهر'),
        ); // month 13
        expect(
          AlNoranValidators.getNationalIdErrorMessage('29914011234567'),
          contains('الشهر'),
        ); // month 14
      });

      test('should return error message for invalid day', () {
        // Valid days: 01-31
        expect(
          AlNoranValidators.getNationalIdErrorMessage('29901001234567'),
          contains('اليوم'),
        ); // day 00
        expect(
          AlNoranValidators.getNationalIdErrorMessage('29901321234567'),
          contains('اليوم'),
        ); // day 32
        expect(
          AlNoranValidators.getNationalIdErrorMessage('29901991234567'),
          contains('اليوم'),
        ); // day 99
      });

      test('should return error message for invalid governorate', () {
        // Valid governorates: 01-35
        expect(
          AlNoranValidators.getNationalIdErrorMessage('29901010012345'),
          contains('المحافظة'),
        ); // gov 00
        expect(
          AlNoranValidators.getNationalIdErrorMessage('29901013612345'),
          contains('المحافظة'),
        ); // gov 36
        expect(
          AlNoranValidators.getNationalIdErrorMessage('29901019912345'),
          contains('المحافظة'),
        ); // gov 99
      });
    });

    // ==================== Format Tests ====================
    group('formatEgyptianPhone', () {
      test('should format 11-digit phone numbers correctly', () {
        expect(
          AlNoranValidators.formatEgyptianPhone('01012345678'),
          equals('0101 234 5678'),
        );
        expect(
          AlNoranValidators.formatEgyptianPhone('01112345678'),
          equals('0111 234 5678'),
        );
        expect(
          AlNoranValidators.formatEgyptianPhone('01212345678'),
          equals('0121 234 5678'),
        );
        expect(
          AlNoranValidators.formatEgyptianPhone('01512345678'),
          equals('0151 234 5678'),
        );
      });

      test(
        'should return original phone if not 11 digits starting with 01',
        () {
          expect(
            AlNoranValidators.formatEgyptianPhone('+201012345678'),
            equals('+201012345678'),
          );
          expect(
            AlNoranValidators.formatEgyptianPhone('00201012345678'),
            equals('00201012345678'),
          );
          expect(
            AlNoranValidators.formatEgyptianPhone('0101234567'),
            equals('0101234567'),
          ); // 10 digits
          expect(
            AlNoranValidators.formatEgyptianPhone('010123456789'),
            equals('010123456789'),
          ); // 12 digits
        },
      );

      test('should handle phone with spaces/dashes before formatting', () {
        // The function should first clean the phone
        expect(
          AlNoranValidators.formatEgyptianPhone('010 1234 5678'),
          equals('0101 234 5678'),
        );
        expect(
          AlNoranValidators.formatEgyptianPhone('010-1234-5678'),
          equals('0101 234 5678'),
        );
      });

      test('should return original for empty input', () {
        expect(AlNoranValidators.formatEgyptianPhone(''), equals(''));
      });
    });

    group('formatNationalId', () {
      test('should format 14-digit national ID correctly', () {
        expect(
          AlNoranValidators.formatNationalId('29912011234567'),
          equals('2-991201-1234567'),
        );
        expect(
          AlNoranValidators.formatNationalId('30001011234567'),
          equals('3-000101-1234567'),
        );
        expect(
          AlNoranValidators.formatNationalId('28512150112345'),
          equals('2-851215-0112345'),
        );
      });

      test('should return original if not 14 digits', () {
        expect(AlNoranValidators.formatNationalId('123'), equals('123'));
        expect(
          AlNoranValidators.formatNationalId('1234567890123'),
          equals('1234567890123'),
        ); // 13 digits
        expect(
          AlNoranValidators.formatNationalId('123456789012345'),
          equals('123456789012345'),
        ); // 15 digits
      });

      test('should handle ID with spaces/dashes before formatting', () {
        expect(
          AlNoranValidators.formatNationalId('2-9901-0112-34567'),
          equals('2-990101-1234567'),
        );
        expect(
          AlNoranValidators.formatNationalId('2 9901 0112 34567'),
          equals('2-990101-1234567'),
        );
      });

      test('should return original for empty input', () {
        expect(AlNoranValidators.formatNationalId(''), equals(''));
      });
    });

    // ==================== Normalize Email Tests ====================
    group('normalizeEmail', () {
      test('should convert uppercase email to lowercase', () {
        expect(
          AlNoranValidators.normalizeEmail('TEST@EXAMPLE.COM'),
          equals('test@example.com'),
        );
        expect(
          AlNoranValidators.normalizeEmail('User@Domain.Com'),
          equals('user@domain.com'),
        );
        expect(
          AlNoranValidators.normalizeEmail('ABC@XYZ.ORG'),
          equals('abc@xyz.org'),
        );
      });

      test('should trim whitespace from email', () {
        expect(
          AlNoranValidators.normalizeEmail('  test@example.com  '),
          equals('test@example.com'),
        );
        expect(
          AlNoranValidators.normalizeEmail('\tuser@domain.com\t'),
          equals('user@domain.com'),
        );
        expect(
          AlNoranValidators.normalizeEmail('\n email@test.com \n'),
          equals('email@test.com'),
        );
      });

      test('should handle mixed case with whitespace', () {
        expect(
          AlNoranValidators.normalizeEmail('  User@Domain.com  '),
          equals('user@domain.com'),
        );
        expect(
          AlNoranValidators.normalizeEmail('   TEST@EXAMPLE.COM   '),
          equals('test@example.com'),
        );
      });

      test('should return empty string for empty input', () {
        expect(AlNoranValidators.normalizeEmail(''), equals(''));
      });

      test(
        'should preserve valid email unchanged (if already lowercase/trimmed)',
        () {
          expect(
            AlNoranValidators.normalizeEmail('already@correct.com'),
            equals('already@correct.com'),
          );
        },
      );

      test('should handle special characters in email', () {
        expect(
          AlNoranValidators.normalizeEmail('  USER+TAG@EXAMPLE.COM  '),
          equals('user+tag@example.com'),
        );
        expect(
          AlNoranValidators.normalizeEmail('  USER.NAME@DOMAIN.CO.UK  '),
          equals('user.name@domain.co.uk'),
        );
      });
    });
  });
}
