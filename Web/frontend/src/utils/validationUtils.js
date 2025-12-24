/**
 * Validates an Egyptian National ID (14 digits).
 * Structure: XYYMMDDSSGGGC
 * - X: Century (2=1900s, 3=2000s)
 * - YY: Year
 * - MM: Month (01-12)
 * - DD: Day (01-31)
 * - SS: Governorate code (01-35)
 * - GGG: Sequence number
 * - C: Check digit
 *
 * @param {string} nationalId - The national ID to validate.
 * @returns {Object} - { isValid: boolean, error: string|null }
 */
export const isValidEgyptianNationalId = (nationalId) => {
    if (!nationalId) return { isValid: false, error: "رقم البطاقة مطلوب" };

    // Remove all spaces and dashes
    const cleanId = nationalId.replace(/[\s-]/g, "");

    // Must be exactly 14 digits
    if (cleanId.length !== 14) {
        return { isValid: false, error: "يجب أن يتكون الرقم القومي من 14 رقم" };
    }

    // Must contain only digits
    if (!/^[0-9]{14}$/.test(cleanId)) {
        return { isValid: false, error: "يجب أن يحتوي الرقم القومي على أرقام فقط" };
    }

    // First digit must be 2 or 3 (century indicator)
    const century = parseInt(cleanId[0]);
    if (century !== 2 && century !== 3) {
        return { isValid: false, error: "رقم البطاقة غير صحيح (القرن غير صالح)" };
    }

    // Extract date components
    const month = parseInt(cleanId.substring(3, 5));
    const day = parseInt(cleanId.substring(5, 7));

    // Validate month (01-12)
    if (month < 1 || month > 12) {
        return { isValid: false, error: "رقم البطاقة غير صحيح (الشهر غير صالح)" };
    }

    // Validate day (01-31)
    if (day < 1 || day > 31) {
        return { isValid: false, error: "رقم البطاقة غير صحيح (اليوم غير صالح)" };
    }

    // Validate governorate code (01-35) or 88 for foreign born
    const governorate = parseInt(cleanId.substring(7, 9));
    // Standard codes 01-35, and special code 88 for citizens born abroad
    if ((governorate < 1 || governorate > 35) && governorate !== 88) {
        return {
            isValid: false,
            error: "رقم البطاقة غير صحيح (كود المحافظة غير صالح)",
        };
    }

    return { isValid: true, error: null };
};

/**
 * Validates a passport number.
 * Most passports are 6-9 alphanumeric characters.
 * 
 * @param {string} passportNumber - The passport number to validate.
 * @returns {Object} - { isValid: boolean, error: string|null }
 */
export const isValidPassportNumber = (passportNumber) => {
    if (!passportNumber) return { isValid: false, error: "رقم الباسبور مطلوب" };

    // Remove spaces
    const cleanPassport = passportNumber.replace(/\s/g, "");

    // Check length (typically 6-9 characters)
    if (cleanPassport.length < 6 || cleanPassport.length > 9) {
        return { isValid: false, error: "يجب أن يتكون رقم الباسبور من 6 إلى 9 أحرف" };
    }

    // Must contain only alphanumeric characters
    if (!/^[A-Z0-9]{6,9}$/i.test(cleanPassport)) {
        return { isValid: false, error: "يجب أن يحتوي رقم الباسبور على أحرف وأرقام فقط" };
    }

    return { isValid: true, error: null };
};

/**
 * Validates an Egyptian mobile phone number.
 * Must start with 01 and be followed by 0,1,2,5 and then 8 digits (11 total).
 * 
 * @param {string} phone - The phone number to validate.
 * @returns {Object} - { isValid: boolean, error: string|null }
 */
export const isValidPhoneNumber = (phone) => {
    if (!phone) return { isValid: false, error: "رقم الهاتف مطلوب" };

    const regex = /^01[0-2,5]{1}[0-9]{8}$/;
    if (!regex.test(phone)) {
        return { isValid: false, error: "رقم الهاتف غير صحيح. يجب أن يكون رقم مصري مكون من 11 رقم ويبدأ بـ 01" };
    }

    return { isValid: true, error: null };
};

/**
 * Validates a password.
 * Must be at least 8 characters long and contain:
 * - One lowercase letter
 * - One uppercase letter
 * - One number
 * - One special character (@$!%*?&)
 * 
 * @param {string} password - The password to validate.
 * @returns {Object} - { isValid: boolean, error: string|null }
 */
export const isValidPassword = (password) => {
    if (!password) return { isValid: false, error: "كلمة المرور مطلوبة" };

    if (password.length < 8) {
        return { isValid: false, error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" };
    }

    // Strong password regex
    // (?=.*[a-z]) - At least one lowercase letter
    // (?=.*[A-Z]) - At least one uppercase letter
    // (?=.*\d) - At least one number
    // (?=.*[@$!%*?&]) - At least one special character
    const regex = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

    if (!regex.test(password)) {
        return {
            isValid: false,
            error: "كلمة المرور يجب أن تحتوي على حرف كبير، حرف صغير، رقم، وحرف خاص (@$!%*?&)"
        };
    }

    return { isValid: true, error: null };
};
