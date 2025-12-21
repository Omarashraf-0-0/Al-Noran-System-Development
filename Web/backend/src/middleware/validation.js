const { body , check } = require('express-validator');

const signupValidationRules = [
  body('fullname', 'الاسم الكامل مطلوب').not().isEmpty().trim().escape(),
  body('username', 'اسم المستخدم مطلوب').not().isEmpty().trim().escape(),
  body('phone', 'رقم الهاتف غير صحيح').isMobilePhone('any'),
  body('email', 'البريد الإلكتروني غير صحيح').isEmail().normalizeEmail(),
  body('password', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل').isLength({ min: 6 }),
  body('type', 'نوع المستخدم يجب أن يكون عميل أو موظف').isIn(['client', 'employee']),

  body().custom((value, { req }) => {
    const { type, clientType, employeeType, ssn, clientDetails, employeeDetails } = req.body;

    if (type === 'client') {
      // Get clientType from either nested or flat format
      const actualClientType = clientDetails?.clientType || clientType;
      const actualSSN = clientDetails?.ssn || ssn;
      const actualNationality = clientDetails?.nationality || '';
      const actualPassportNumber = clientDetails?.passportNumber || '';

      if (!actualClientType || !['commercial', 'factory', 'personal'].includes(actualClientType)) {
        throw new Error('نوع الحساب غير صحيح. يجب أن يكون تجاري أو مصنع أو شخصي');
      }
      
      // For personal accounts, validate based on nationality
      if (actualClientType === 'personal') {
        if (!actualNationality) {
          throw new Error('الجنسية مطلوبة للحسابات الشخصية');
        }
        
        if (actualNationality === 'egyptian') {
          if (!actualSSN || actualSSN.trim() === '') {
            throw new Error('الرقم القومي مطلوب للحسابات الشخصية');
          }
          if (actualSSN.length !== 14) {
            throw new Error('الرقم القومي يجب أن يكون 14 رقم');
          }
        } else if (actualNationality === 'nonEgyptian') {
          if (!actualPassportNumber || actualPassportNumber.trim() === '') {
            throw new Error('رقم الباسبور مطلوب');
          }
        }
      }
    }

    if (type === 'employee') {
      // Get employeeType from either nested or flat format
      const actualEmployeeType = employeeDetails?.employeeType || employeeType;
      
      if (!actualEmployeeType || !['Regular Employee', 'Certified Employee', 'Department Manager', 'System Admin'].includes(actualEmployeeType)) {
        throw new Error('نوع الموظف غير صحيح');
      }
    }
    
    return true;
  }),
];



const isPhoneNumberValid = (value) => {
  const phoneNumber = parsePhoneNumberFromString(value, 'EG');

  if (!phoneNumber || !phoneNumber.isValid()) {
    throw new Error('Please enter a valid phone number');
  }

  return true;
};

const phoneNumberValidation = [
  check('phoneNumber').custom(isPhoneNumberValid)
];




module.exports = {
  signupValidationRules,
  phoneNumberValidation
};

