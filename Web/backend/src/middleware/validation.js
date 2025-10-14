const { body } = require('express-validator');

const signupValidationRules = [
  body('fullname', 'الاسم الكامل مطلوب').not().isEmpty().trim().escape(),
  body('username', 'اسم المستخدم مطلوب').not().isEmpty().trim().escape(),
  body('phone', 'رقم الهاتف غير صحيح').isMobilePhone('any'),
  body('email', 'البريد الإلكتروني غير صحيح').isEmail().normalizeEmail(),
  body('password', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل').isLength({ min: 6 }),
  body('type', 'نوع المستخدم يجب أن يكون عميل أو موظف').isIn(['client', 'employee']),

  body().custom((value, { req }) => {
    const { type, clientType, employeeType, ssn } = req.body;

    if (type === 'client') {
      if (!['commercial', 'factory', 'personal'].includes(clientType)) {
        throw new Error('نوع الحساب غير صحيح. يجب أن يكون تجاري أو مصنع أو شخصي');
      }
      if (clientType === 'personal' && (!ssn || ssn.trim() === '')) {
        throw new Error('الرقم القومي مطلوب للحسابات الشخصية');
      }
      if (clientType === 'personal' && ssn.length !== 14) {
        throw new Error('الرقم القومي يجب أن يكون 14 رقم');
      }
    }

    if (type === 'employee') {
      if (!['Regular Employee', 'Certified Employee', 'Department Manager', 'System Admin'].includes(employeeType)) {
        throw new Error('نوع الموظف غير صحيح');
      }
    }
    
    return true;
  }),
];

module.exports = {
  signupValidationRules
};

