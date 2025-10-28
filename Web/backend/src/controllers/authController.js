const User = require('../models/user');
const { validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    res.status(400);
    throw new Error('من فضلك أدخل البريد الإلكتروني وكلمة المرور');
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    res.status(401);
    throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
  }

  // Check if password matches
  const isPasswordMatch = await user.matchPassword(password);

  if (!isPasswordMatch) {
    res.status(401);
    throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
  }

  // Check if user is active
  if (!user.active) {
    res.status(403);
    throw new Error('تم إيقاف حسابك. تواصل مع الإدارة');
  }

  // Create token
  const token = user.getSignedJwtToken();

  res.status(200).json({
    success: true,
    message: 'تم تسجيل الدخول بنجاح',
    token,
    user: {
      id: user._id,
      fullname: user.fullname,
      username: user.username,
      email: user.email,
      type: user.type,
      phone: user.phone,
      clientDetails: user.clientDetails,
      employeeDetails: user.employeeDetails
    }
  });
});

// @desc    Register user
// @route   POST /api/auth/signup
// @access  Public
const signup = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array().map(e => e.msg).join(', '));
  }

  const {
    fullname,
    username,
    phone,
    email,
    password,
    type,
    clientType,
    ssn,
    employeeType
  } = req.body;

  const userExists = await User.findOne({ $or: [{ email }, { username }, { phone }] }).lean().exec();
  if (userExists) {
    res.status(409);
    throw new Error('البريد الإلكتروني أو اسم المستخدم أو رقم الهاتف مستخدم بالفعل');
  }

  const userData = {
    fullname,
    username,
    phone,
    email,
    password,
    type,
  };

  if (type === 'client') {
    userData.clientDetails = { clientType };
    if (clientType === 'personal') {
      userData.clientDetails.ssn = ssn;
    }
  } else if (type === 'employee') {
    userData.employeeDetails = { employeeType };
  }

  const user = await User.create(userData);

  if (user) {
    const token = user.getSignedJwtToken();
    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      token,
      user: {
          id: user._id,
          fullname: user.fullname,
          username: user.username,
          email: user.email,
          phone: user.phone,
          type: user.type,
          clientDetails: user.clientDetails,
          employeeDetails: user.employeeDetails
      }
    });
  } else {
    res.status(400);
    throw new Error('البيانات المدخلة غير صحيحة');
  }
});

// @desc    Check username/email availability
// @route   POST /api/auth/check-availability
// @access  Public
const checkAvailability = asyncHandler(async (req, res) => {
  const { username, email } = req.body;
  
  console.log('🔍🔍🔍 [Check Availability] Request:', { username, email });

  if (!username && !email) {
    res.status(400);
    throw new Error('يجب إدخال اسم المستخدم أو البريد الإلكتروني');
  }

  // Build OR conditions array
  const conditions = [];
  if (username) conditions.push({ username });
  if (email) conditions.push({ email: email.toLowerCase() });
  
  console.log('📋 Query conditions:', conditions);

  const existingUser = await User.findOne({ $or: conditions }).lean().exec();
  
  console.log('👤 Found user:', existingUser ? `Yes (${existingUser.username})` : 'No');

  if (existingUser) {
    let field = 'unknown';
    if (existingUser.username === username) {
      field = 'username';
    } else if (existingUser.email === email.toLowerCase()) {
      field = 'email';
    }
    
    console.log('❌ Data NOT available - Field:', field);

    return res.status(200).json({
      success: true,
      available: false,
      field,
      message: field === 'username' ? 'Username already taken' : 'Email already taken'
    });
  }
  
  console.log('✅ Data IS available - user can proceed');

  res.status(200).json({
    success: true,
    available: true,
    message: 'Data is available'
  });
});

module.exports = {
  login,
  signup,
  checkAvailability
};

