/// Validators for Al Noran Application
/// Egyptian Phone Numbers & National ID Validation

class AlNoranValidators {
  /// Email Validation (Case-Insensitive)
  /// Accepts both uppercase and lowercase
  static bool isValidEmail(String email) {
    if (email.isEmpty) return false;

    // Convert to lowercase for validation
    final emailLower = email.toLowerCase().trim();

    // Email Regex Pattern
    final emailRegex = RegExp(
      r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
    );

    return emailRegex.hasMatch(emailLower);
  }

  /// Egyptian Phone Number Validation
  /// Formats accepted:
  /// - 01XXXXXXXXX (11 digits starting with 01)
  /// - +2001XXXXXXXXX (with country code)
  /// - 002001XXXXXXXXX (with international prefix)
  ///
  /// Valid Egyptian mobile operators:
  /// - 010: Vodafone
  /// - 011: Etisalat
  /// - 012: Orange
  /// - 015: WE (We)
  static bool isValidEgyptianPhone(String phone) {
    if (phone.isEmpty) return false;

    // Remove all spaces, dashes, and parentheses
    final cleanPhone = phone.replaceAll(RegExp(r'[\s\-\(\)]'), '');

    // Egyptian Phone Regex Patterns
    // Pattern 1: 01[0125][0-9]{8} (11 digits starting with 01)
    final pattern1 = RegExp(r'^01[0125][0-9]{8}$');

    // Pattern 2: +2001[0125][0-9]{8} (with +20 country code)
    final pattern2 = RegExp(r'^\+2001[0125][0-9]{8}$');

    // Pattern 3: 002001[0125][0-9]{8} (with 00 international prefix)
    final pattern3 = RegExp(r'^002001[0125][0-9]{8}$');

    return pattern1.hasMatch(cleanPhone) ||
        pattern2.hasMatch(cleanPhone) ||
        pattern3.hasMatch(cleanPhone);
  }

  /// Egyptian National ID Validation
  /// Format: 14 digits
  /// Structure: XYYMMDDSSGGGC
  /// - X: Century (2=1900s, 3=2000s)
  /// - YY: Year
  /// - MM: Month (01-12)
  /// - DD: Day (01-31)
  /// - SS: Governorate code (01-35)
  /// - GGG: Sequence number
  /// - C: Check digit
  static bool isValidEgyptianNationalId(String nationalId) {
    if (nationalId.isEmpty) return false;

    // Remove all spaces and dashes
    final cleanId = nationalId.replaceAll(RegExp(r'[\s\-]'), '');

    // Must be exactly 14 digits
    if (cleanId.length != 14) return false;

    // Must contain only digits
    if (!RegExp(r'^[0-9]{14}$').hasMatch(cleanId)) return false;

    // First digit must be 2 or 3 (century indicator)
    final century = int.parse(cleanId[0]);
    if (century != 2 && century != 3) return false;

    // Extract date components
    // final year = int.parse(cleanId.substring(1, 3)); // Year validation not needed
    final month = int.parse(cleanId.substring(3, 5));
    final day = int.parse(cleanId.substring(5, 7));

    // Validate month (01-12)
    if (month < 1 || month > 12) return false;

    // Validate day (01-31)
    if (day < 1 || day > 31) return false;

    // Validate governorate code (01-35)
    final governorate = int.parse(cleanId.substring(7, 9));
    if (governorate < 1 || governorate > 35) return false;

    return true;
  }

  /// Get Egyptian Phone Error Message
  static String getPhoneErrorMessage(String phone) {
    if (phone.isEmpty) {
      return 'من فضلك أدخل رقم الهاتف';
    }

    final cleanPhone = phone.replaceAll(RegExp(r'[\s\-\(\)]'), '');

    if (cleanPhone.length < 11) {
      return 'رقم الهاتف قصير جداً';
    }

    if (cleanPhone.length > 11 &&
        !cleanPhone.startsWith('+20') &&
        !cleanPhone.startsWith('0020')) {
      return 'رقم الهاتف طويل جداً';
    }

    if (!cleanPhone.startsWith('01') &&
        !cleanPhone.startsWith('+2001') &&
        !cleanPhone.startsWith('002001')) {
      return 'رقم الهاتف يجب أن يبدأ بـ 01';
    }

    final secondDigit =
        cleanPhone.startsWith('01')
            ? cleanPhone[2]
            : cleanPhone.startsWith('+2001')
            ? cleanPhone[5]
            : cleanPhone[6];

    if (!['0', '1', '2', '5'].contains(secondDigit)) {
      return 'رقم الهاتف غير صحيح (يجب أن يكون 010, 011, 012, أو 015)';
    }

    return 'رقم الهاتف غير صحيح';
  }

  /// Get Egyptian National ID Error Message
  static String getNationalIdErrorMessage(String nationalId) {
    if (nationalId.isEmpty) {
      return 'من فضلك أدخل الرقم القومي';
    }

    final cleanId = nationalId.replaceAll(RegExp(r'[\s\-]'), '');

    if (cleanId.length != 14) {
      return 'الرقم القومي يجب أن يكون 14 رقم';
    }

    if (!RegExp(r'^[0-9]{14}$').hasMatch(cleanId)) {
      return 'الرقم القومي يجب أن يحتوي على أرقام فقط';
    }

    final century = int.parse(cleanId[0]);
    if (century != 2 && century != 3) {
      return 'الرقم القومي يجب أن يبدأ بـ 2 أو 3';
    }

    final month = int.parse(cleanId.substring(3, 5));
    if (month < 1 || month > 12) {
      return 'الشهر في الرقم القومي غير صحيح';
    }

    final day = int.parse(cleanId.substring(5, 7));
    if (day < 1 || day > 31) {
      return 'اليوم في الرقم القومي غير صحيح';
    }

    final governorate = int.parse(cleanId.substring(7, 9));
    if (governorate < 1 || governorate > 35) {
      return 'كود المحافظة في الرقم القومي غير صحيح';
    }

    return 'الرقم القومي غير صحيح';
  }

  /// Format Egyptian Phone Number for Display
  /// Example: 01012345678 -> 0101 234 5678
  static String formatEgyptianPhone(String phone) {
    final cleanPhone = phone.replaceAll(RegExp(r'[\s\-\(\)]'), '');

    if (cleanPhone.length == 11 && cleanPhone.startsWith('01')) {
      return '${cleanPhone.substring(0, 4)} ${cleanPhone.substring(4, 7)} ${cleanPhone.substring(7)}';
    }

    return phone;
  }

  /// Format Egyptian National ID for Display
  /// Example: 29912011234567 -> 2-991201-1234567
  static String formatNationalId(String nationalId) {
    final cleanId = nationalId.replaceAll(RegExp(r'[\s\-]'), '');

    if (cleanId.length == 14) {
      return '${cleanId.substring(0, 1)}-${cleanId.substring(1, 7)}-${cleanId.substring(7)}';
    }

    return nationalId;
  }

  /// Normalize Email (convert to lowercase and trim)
  static String normalizeEmail(String email) {
    return email.toLowerCase().trim();
  }
}
