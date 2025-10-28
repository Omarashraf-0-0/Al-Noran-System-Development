const { body } = require('express-validator');

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

      if (!actualClientType || !['commercial', 'factory', 'personal'].includes(actualClientType)) {
        throw new Error('نوع الحساب غير صحيح. يجب أن يكون تجاري أو مصنع أو شخصي');
      }
      if (actualClientType === 'personal' && (!actualSSN || actualSSN.trim() === '')) {
        throw new Error('الرقم القومي مطلوب للحسابات الشخصية');
      }
      if (actualClientType === 'personal' && actualSSN && actualSSN.length !== 14) {
        throw new Error('الرقم القومي يجب أن يكون 14 رقم');
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

module.exports = {
  signupValidationRules
};

