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
    employeeType,
    taxNumber,
    rank,
    clientDetails,
    employeeDetails
  } = req.body;

  const userExists = await User.findOne({ $or: [{ email }, { username }, { phone }] }).lean().exec();
  if (userExists) {
// <<<<<<< HEAD
//      res.status(409).json({
//       success: false,
//       error: 'A user with that email, username, or phone number already exists.'
//     });
//     throw new Error('A user with that email, username, or phone number already exists.');
// =======
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

  // Add taxNumber and rank if provided
  if (taxNumber) userData.taxNumber = taxNumber;
  if (rank) userData.rank = rank;

  // Handle client details - support both nested and flat formats
  if (type === 'client') {
    // Check if clientDetails object is provided (nested format)
    if (clientDetails) {
      userData.clientDetails = {
        clientType: clientDetails.clientType || null,
        ssn: clientDetails.ssn || ""
      };
    } 
    // Otherwise use flat format (backward compatibility)
    else if (clientType) {
      userData.clientDetails = { 
        clientType,
        ssn: ssn || ""
      };
    }
  } 
  // Handle employee details
  else if (type === 'employee') {
    if (employeeDetails) {
      userData.employeeDetails = {
        employeeType: employeeDetails.employeeType || null,
        verified: employeeDetails.verified || false
      };
    } else if (employeeType) {
      userData.employeeDetails = { employeeType };
    }
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
          type: user.type,
          clientDetails: user.clientDetails,
          employeeDetails: user.employeeDetails,
          taxNumber: user.taxNumber,
          rank: user.rank
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

// @desc    Get current user info
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  
  if (!user) {
    res.status(404);
    throw new Error('المستخدم غير موجود');
  }

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      fullname: user.fullname,
      username: user.username,
      email: user.email,
      phone: user.phone,
      type: user.type,
      active: user.active,
      clientDetails: user.clientDetails,
      employeeDetails: user.employeeDetails,
      taxNumber: user.taxNumber,
      rank: user.rank,
      createdAt: user.createdAt,
    }
  });
});

module.exports = {
  login,
  signup,
  checkAvailability,
  getMe
};

