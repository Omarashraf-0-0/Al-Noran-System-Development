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

    // Validate governorate code (01-35)
    const governorate = parseInt(cleanId.substring(7, 9));
    if (governorate < 1 || governorate > 35) {
        // Note: Governorate code 88 is used for people born outside Egypt in some contexts,
        // but standard validation is usually 01-35. We stick to the user's rule of 01-35.
        return {
            isValid: false,
            error: "رقم البطاقة غير صحيح (كود المحافظة غير صالح)",
        };
    }

    return { isValid: true, error: null };
};
