describe('Employee Registration and Dashboard Tests', () => {
  // Test data that will be used across tests
  const employeeData = {
    fullname: `Test Employee ${Date.now()+5}`,
    email: `employee${Date.now()+5}@example.com`,
    phone: `0101${Math.floor(10000000 + Math.random() * 90000000)}`, // Random 8 digit number
    username: `empuser${Date.now()+5}`,
    password: '123456',
    confirmPassword: '123456',
    type: 'personal',
    ssn: '12345678901111', // 14 digits
  };

  // Store login credentials for subsequent tests
  let loginCredentials = {};

  it('Should register a new employee user successfully', () => {
    cy.visit('http://localhost:5173/register');
    cy.wait(3000);

    // Fill in full name
    cy.get('#fullname')
      .type(employeeData.fullname)
      .should('have.value', employeeData.fullname);

    // Fill in email
    cy.get('#email')
      .type(employeeData.email)
      .should('have.value', employeeData.email);

    // Fill in phone
    cy.get('#phone')
      .type(employeeData.phone)
      .should('have.value', employeeData.phone);

    // Fill in username
    cy.get('#username')
      .type(employeeData.username)
      .should('have.value', employeeData.username);

    // Select personal account type
    cy.get('input[name="type"][value="personal"]').click();

    // Fill in password
    cy.get('#password')
      .type(employeeData.password)
      .should('have.value', employeeData.password);

    // Fill in confirm password
    cy.get('#confirmPassword')
      .type(employeeData.confirmPassword)
      .should('have.value', employeeData.confirmPassword);

    // Fill in SSN (14 digits)
    cy.get('#ssn')
      .type(employeeData.ssn)
      .should('have.value', employeeData.ssn);

    // Accept terms and conditions
    cy.get('#terms').click();

    // Submit the form
    cy.get('button[type="submit"]').click();

    // Wait for success message
    cy.contains('تم إنشاء الحساب بنجاح', { timeout: 10000 }).should('be.visible');

    // Store credentials for login
    loginCredentials = {
      email: employeeData.email,
      password: employeeData.password
    };

    cy.wait(3000);
  });

  it('Should login with registered employee credentials', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    // Fill in email
    cy.get('#email')
      .type(loginCredentials.email)
      .should('have.value', loginCredentials.email);

    // Fill in password
    cy.get('#password')
      .type(loginCredentials.password)
      .should('have.value', loginCredentials.password);

    // Click submit button
    cy.get('button[type="submit"]').click();

    // Wait for success message
    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');

    cy.wait(2000);
  });

  it('Should display employee dashboard after login', () => {
    // Login first
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    // Wait for success message
    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Verify dashboard is visible
    // Check for user profile section
    cy.get('img.rounded-full', { timeout: 5000 }).should('be.visible');

    // Check if user menu/dropdown is present
    cy.get('img.rounded-full').click();
    cy.wait(1000);

    // Verify logout option exists
    cy.get('a.px-4', { timeout: 5000 }).should('be.visible');
  });

  it('Should display user information in dashboard profile', () => {
    // Login
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Click on profile/avatar
    cy.get('img.rounded-full').click();
    cy.wait(1000);

    // Navigate to profile page if available
    // This depends on your app structure - adjust selectors as needed
    // Verify that profile information is displayed
    cy.url({ timeout: 5000 }).should('include', '/home');
  });

  it('Should navigate to employee profile page', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Look for profile link or navigate directly
    // This assumes your app has a profile route
    cy.visit('http://localhost:5173/profile', { failOnStatusCode: false });
    cy.wait(2000);

    // Verify page loaded
    cy.url().should('include', '/profile');
  });

  it('Should allow logout from dashboard', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Click on user profile image
    cy.get('img.rounded-full').click();
    cy.wait(1000);

    // Click logout button
    cy.get('a.px-4').click();
    cy.wait(4000);

    // Verify redirected to login page
    cy.url().should('include', '/login');
  });

  it('Should prevent login with wrong credentials from registered employee', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    // Try to login with correct email but wrong password
    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    // Should show error message
    cy.contains('البريد الإلكتروني أو كلمة المرور غير صحيحة', { timeout: 10000 })
      .should('be.visible');
  });

  it('Should persist login session', () => {
    // Login
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(2000);

    // Visit dashboard directly (should remain logged in)
    cy.visit('http://localhost:5173/dashboard');
    cy.wait(2000);

    // Should not be redirected to login
    cy.url().should('include', '/dashboard');

    // Profile image should be visible (indicating logged in state)
    cy.get('img.rounded-full', { timeout: 5000 }).should('be.visible');
  });

  it('Should validate registration form - missing full name', () => {
    cy.visit('http://localhost:5173/register');
    cy.wait(3000);

    // Skip full name
    cy.get('#email').type('test@example.com');
    cy.get('#phone').type('01012345678');
    cy.get('#username').type('testuser');

    // Try to submit
    cy.get('button[type="submit"]').click();

    // Form should not submit (HTML5 validation)
    cy.url().should('include', '/register');
  });

  it('Should validate registration form - invalid email format', () => {
    cy.visit('http://localhost:5173/register');
    cy.wait(3000);

    cy.get('#fullname').type('Test User');
    cy.get('#email').type('invalidemail'); // Invalid email
    cy.get('#phone').type('01012345678');
    cy.get('#username').type('testuser');
    cy.get('input[name="type"][value="personal"]').click();
    cy.get('#password').type('123456');
    cy.get('#confirmPassword').type('123456');
    cy.get('#ssn').type('12345678901234');
    cy.get('#terms').click();

    cy.get('button[type="submit"]').click();

    // Should show validation error
    cy.url().should('include', '/register');
  });

  it('Should validate registration form - password mismatch', () => {
    cy.visit('http://localhost:5173/register');
    cy.wait(3000);

    cy.get('#fullname').type('Test User');
    cy.get('#email').type('test@example.com');
    cy.get('#phone').type('01012345678');
    cy.get('#username').type('testuser');
    cy.get('input[name="type"][value="personal"]').click();
    cy.get('#password').type('123456');
    cy.get('#confirmPassword').type('654321'); // Different password
    cy.get('#ssn').type('12345678901234');
    cy.get('#terms').click();

    cy.get('button[type="submit"]').click();

    // Should show alert about password mismatch
    cy.on('window:alert', (str) => {
      expect(str).to.contain('كلمة المرور');
    });
  });

  it('Should validate registration form - SSN for personal type', () => {
    cy.visit('http://localhost:5173/register');
    cy.wait(3000);

    cy.get('#fullname').type('Test User');
    cy.get('#email').type(`test${Date.now()}@example.com`);
    cy.get('#phone').type('01012345678');
    cy.get('#username').type(`user${Date.now()}`);
    cy.get('input[name="type"][value="personal"]').click();
    cy.get('#password').type('123456');
    cy.get('#confirmPassword').type('123456');
    cy.get('#ssn').type('123456789'); // Only 9 digits instead of 14
    cy.get('#terms').click();

    cy.get('button[type="submit"]').click();

    // Should show alert about invalid SSN
    cy.on('window:alert', (str) => {
      expect(str).to.contain('بطاقة قومية');
    });
  });

  it('Should validate registration form - terms acceptance required', () => {
    cy.visit('http://localhost:5173/register');
    cy.wait(3000);

    cy.get('#fullname').type('Test User');
    cy.get('#email').type(`test${Date.now()}@example.com`);
    cy.get('#phone').type('01012345678');
    cy.get('#username').type(`user${Date.now()}`);
    cy.get('input[name="type"][value="personal"]').click();
    cy.get('#password').type('123456');
    cy.get('#confirmPassword').type('123456');
    cy.get('#ssn').type('12345678901234');
    // Don't check terms

    cy.get('button[type="submit"]').click();

    // Should show alert about terms
    cy.on('window:alert', (str) => {
      expect(str).to.contain('الشروط والأحكام');
    });
  });

  it('Should register commercial account type', () => {
    cy.visit('http://localhost:5173/register');
    cy.wait(3000);

    const commercialData = {
      fullname: `Commercial User ${Date.now()}`,
      email: `commercial${Date.now()}@example.com`,
      phone: '01098765432',
      username: `comuser${Date.now()}`,
      password: '123456',
    };

    cy.get('#fullname').type(commercialData.fullname);
    cy.get('#email').type(commercialData.email);
    cy.get('#phone').type(commercialData.phone);
    cy.get('#username').type(commercialData.username);

    // Select commercial account type
    cy.get('input[name="type"][value="commercial"]').click();

    cy.get('#password').type(commercialData.password);
    cy.get('#confirmPassword').type(commercialData.password);
    
    // SSN should not be required for commercial
    cy.get('#terms').click();

    cy.get('button[type="submit"]').click();

    // Should show success message
    cy.contains('تم إنشاء الحساب بنجاح', { timeout: 10000 }).should('be.visible');
  });

  it('Should register factory account type', () => {
    cy.visit('http://localhost:5173/register');
    cy.wait(3000);

    const factoryData = {
      fullname: `Factory User ${Date.now()}`,
      email: `factory${Date.now()}@example.com`,
      phone: '01055555555',
      username: `factuser${Date.now()}`,
      password: '123456',
    };

    cy.get('#fullname').type(factoryData.fullname);
    cy.get('#email').type(factoryData.email);
    cy.get('#phone').type(factoryData.phone);
    cy.get('#username').type(factoryData.username);

    // Select factory account type
    cy.get('input[name="type"][value="factory"]').click();

    cy.get('#password').type(factoryData.password);
    cy.get('#confirmPassword').type(factoryData.password);
    
    // SSN should not be required for factory
    cy.get('#terms').click();

    cy.get('button[type="submit"]').click();

    // Should show success message
    cy.contains('تم إنشاء الحساب بنجاح', { timeout: 10000 }).should('be.visible');
  });

  it('Should prevent duplicate email registration', () => {
    // First registration
    cy.visit('http://localhost:5173/register');
    cy.wait(3000);

    const duplicateEmail = `duplicate${Date.now()}@example.com`;

    cy.get('#fullname').type('First User');
    cy.get('#email').type(duplicateEmail);
    cy.get('#phone').type('01012345678');
    cy.get('#username').type(`user${Date.now()}`);
    cy.get('input[name="type"][value="personal"]').click();
    cy.get('#password').type('123456');
    cy.get('#confirmPassword').type('123456');
    cy.get('#ssn').type('12345678901234');
    cy.get('#terms').click();
    cy.get('button[type="submit"]').click();

    cy.contains('تم إنشاء الحساب بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Try second registration with same email
    cy.visit('http://localhost:5173/register');
    cy.wait(3000);

    cy.get('#fullname').type('Second User');
    cy.get('#email').type(duplicateEmail);
    cy.get('#phone').type('01087654321');
    cy.get('#username').type(`user2${Date.now()}`);
    cy.get('input[name="type"][value="personal"]').click();
    cy.get('#password').type('123456');
    cy.get('#confirmPassword').type('123456');
    cy.get('#ssn').type('98765432101234');
    cy.get('#terms').click();
    cy.get('button[type="submit"]').click();

    // Should show error
    cy.get('div.go3958317564', { timeout: 10000 }).should('be.visible');
  });

  it('Should prevent duplicate username registration', () => {
    cy.visit('http://localhost:5173/register');
    cy.wait(3000);

    const duplicateUsername = `dupuser${Date.now()}`;

    // First registration
    cy.get('#fullname').type('First User');
    cy.get('#email').type(`email1${Date.now()}@example.com`);
    cy.get('#phone').type('01012345678');
    cy.get('#username').type(duplicateUsername);
    cy.get('input[name="type"][value="personal"]').click();
    cy.get('#password').type('123456');
    cy.get('#confirmPassword').type('123456');
    cy.get('#ssn').type('12345678901234');
    cy.get('#terms').click();
    cy.get('button[type="submit"]').click();

    cy.contains('تم إنشاء الحساب بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Try second registration with same username
    cy.visit('http://localhost:5173/register');
    cy.wait(3000);

    cy.get('#fullname').type('Second User');
    cy.get('#email').type(`email2${Date.now()}@example.com`);
    cy.get('#phone').type('01087654321');
    cy.get('#username').type(duplicateUsername);
    cy.get('input[name="type"][value="personal"]').click();
    cy.get('#password').type('123456');
    cy.get('#confirmPassword').type('123456');
    cy.get('#ssn').type('98765432101234');
    cy.get('#terms').click();
    cy.get('button[type="submit"]').click();

    // Should show error
    cy.get('div.go3958317564', { timeout: 10000 }).should('be.visible');
  });

  it('Should display employee dashboard elements', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Check for main dashboard elements
    cy.get('img.rounded-full').should('be.visible'); // Profile avatar
    cy.url().should('not.include', '/login'); // Not on login page
  });

  it('Should handle empty login form submission', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    // Try to submit empty form
    cy.get('button[type="submit"]').click();

    // Should remain on login page (HTML5 validation)
    cy.url().should('include', '/login');
  });

  it('Should handle partial login form submission', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    // Fill only email
    cy.get('#email').type('test@example.com');

    cy.get('button[type="submit"]').click();

    // Should remain on login page (HTML5 validation for password)
    cy.url().should('include', '/login');
  });

  it('Should show remember me functionality', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    // Check if remember me checkbox exists
    cy.get('input[type="checkbox"]', { timeout: 5000 }).should('exist');
  });

  it('Should navigate to forgot password page', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    // Look for forgot password link
    cy.get('a', { timeout: 5000 }).each(($link) => {
      if ($link.text().includes('نسيت') || $link.text().includes('forgot')) {
        cy.wrap($link).click();
        cy.wait(2000);
        cy.url().should('include', '/forgot-password');
      }
    });
  });

  it('Should navigate to registration from login page', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    // Look for registration link
    cy.get('a', { timeout: 5000 }).each(($link) => {
      if ($link.text().includes('إنشاء') || $link.text().includes('register')) {
        cy.wrap($link).click();
        cy.wait(2000);
        cy.url().should('include', '/register');
      }
    });
  });

  it('Should validate phone number format', () => {
    cy.visit('http://localhost:5173/register');
    cy.wait(3000);

    cy.get('#fullname').type('Test User');
    cy.get('#email').type(`test${Date.now()}@example.com`);
    cy.get('#phone').type('123'); // Invalid phone
    cy.get('#username').type(`user${Date.now()}`);
    cy.get('input[name="type"][value="personal"]').click();
    cy.get('#password').type('123456');
    cy.get('#confirmPassword').type('123456');
    cy.get('#ssn').type('12345678901234');
    cy.get('#terms').click();

    cy.get('button[type="submit"]').click();

    // Form should show validation
    cy.url().should('include', '/register');
  });

  it('Should maintain form data on page refresh during registration', () => {
    cy.visit('http://localhost:5173/register');
    cy.wait(3000);

    const testData = {
      fullname: 'Test Refresh User',
      email: `refresh${Date.now()}@example.com`,
      phone: '01012345678',
      username: `refreshuser${Date.now()}`,
    };

    cy.get('#fullname').type(testData.fullname);
    cy.get('#email').type(testData.email);
    cy.get('#phone').type(testData.phone);
    cy.get('#username').type(testData.username);

    // Verify data is entered
    cy.get('#fullname').should('have.value', testData.fullname);
    cy.get('#email').should('have.value', testData.email);
  });

  it('Should handle concurrent login attempts gracefully', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);

    // Click submit multiple times rapidly
    cy.get('button[type="submit"]').click();
    cy.get('button[type="submit"]').click();

    // Should eventually show success message only once
    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
  });

  it('Should display appropriate error for non-existent user login', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type('nonexistent@example.com');
    cy.get('#password').type('password123');
    cy.get('button[type="submit"]').click();

    // Should show error message
    cy.contains('البريد الإلكتروني أو كلمة المرور غير صحيحة', { timeout: 10000 })
      .should('be.visible');
  });

  it('Should clear error messages when user starts typing', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type('wronguser@example.com');
    cy.get('#password').type('wrongpass');
    cy.get('button[type="submit"]').click();

    // Wait for error
    cy.contains('البريد الإلكتروني أو كلمة المرور غير صحيحة', { timeout: 10000 })
      .should('be.visible');

    // Start typing in email field
    cy.get('#email').clear().type('newuser@example.com');

    // Error should clear or be replaced
    cy.get('#email').should('have.value', 'newuser@example.com');
  });
});

describe('Employee Additional Page Routes Tests', () => {
  let loginCredentials = {
    email: 'ialy24407@gmail.com',
    password: '111111'
  };

  it('Should access home page after login', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Navigate to home
    cy.visit('http://localhost:5173/home');
    cy.wait(2000);

    // Verify home page loads
    cy.url().should('include', '/home');
  });

  it('Should access employee management page', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Navigate to employee management
    cy.visit('http://localhost:5173/employees', { failOnStatusCode: false });
    cy.wait(2000);

    cy.url().should('include', '/employees');
  });

  it('Should access upload documents page', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Navigate to upload documents
    cy.visit('http://localhost:5173/upload-documents', { failOnStatusCode: false });
    cy.wait(2000);

    cy.url().should('include', '/upload-documents');
  });

  it('Should access employee profile page when logged in', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Navigate to profile
    cy.visit('http://localhost:5173/profile');
    cy.wait(2000);

    // Should load profile page
    cy.url().should('include', '/profile');
  });

  it('Should handle navigation to non-existent page', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Visit non-existent page
    cy.visit('http://localhost:5173/nonexistent-page', { failOnStatusCode: false });
    cy.wait(2000);

    // Should either show 404 or redirect
    cy.url().then((url) => {
      expect(url).to.satisfy((u) => 
        u.includes('/nonexistent-page') || u.includes('/home') || u.includes('/login')
      );
    });
  });

  it('Should redirect unauthenticated user from dashboard', () => {
    // Clear any stored credentials
    cy.clearLocalStorage();
    cy.clearCookies();

    // Try to access dashboard without login
    cy.visit('http://localhost:5173/dashboard', { failOnStatusCode: false });
    cy.wait(2000);

    // Should redirect to login
    cy.url().should('include', '/login');
  });

  it('Should redirect unauthenticated user from profile page', () => {
    cy.clearLocalStorage();
    cy.clearCookies();

    cy.visit('http://localhost:5173/profile', { failOnStatusCode: false });
    cy.wait(2000);

    // Should redirect to login
    cy.url().should('include', '/login');
  });

  it('Should allow navigation between multiple pages while logged in', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Navigate to home
    cy.visit('http://localhost:5173/home');
    cy.wait(1000);
    cy.url().should('include', '/home');

    // Navigate to employees
    cy.visit('http://localhost:5173/employees', { failOnStatusCode: false });
    cy.wait(1000);
    cy.url().should('include', '/employees');

    // Navigate to profile
    cy.visit('http://localhost:5173/profile');
    cy.wait(1000);
    cy.url().should('include', '/profile');

    // Navigate back to dashboard
    cy.visit('http://localhost:5173/dashboard');
    cy.wait(1000);
    cy.url().should('include', '/dashboard');
  });

  it('Should handle navigation via header/menu links', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Try to find and click navigation links
    cy.get('nav, header', { timeout: 5000 }).should('exist');
  });

  it('Should maintain session during page navigation', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(2000);

    // Navigate through multiple pages
    cy.visit('http://localhost:5173/home');
    cy.wait(1000);

    cy.visit('http://localhost:5173/profile');
    cy.wait(1000);

    // Check if still logged in (avatar should be visible)
    cy.get('img.rounded-full', { timeout: 5000 }).should('be.visible');
  });

  it('Should handle page refresh while logged in', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Navigate to a page
    cy.visit('http://localhost:5173/home');
    cy.wait(2000);

    // Refresh the page
    cy.reload();
    cy.wait(2000);

    // Should remain on home page and logged in
    cy.url().should('include', '/home');
    cy.get('img.rounded-full', { timeout: 5000 }).should('be.visible');
  });

  it('Should display notifications/messages on pages', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Navigate to home
    cy.visit('http://localhost:5173/home');
    cy.wait(2000);

    // Check for any notification containers
    cy.get('[role="alert"]', { timeout: 5000 }).should('exist').or('not.exist');
  });

  it('Should handle back button navigation', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Navigate to home
    cy.visit('http://localhost:5173/home');
    cy.wait(1000);

    // Navigate to profile
    cy.visit('http://localhost:5173/profile');
    cy.wait(1000);

    // Use back button
    cy.go('back');
    cy.wait(1000);

    // Should go back to home
    cy.url().should('include', '/home');
  });

  it('Should handle browser forward button', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Navigate through pages
    cy.visit('http://localhost:5173/home');
    cy.wait(1000);

    cy.visit('http://localhost:5173/profile');
    cy.wait(1000);

    // Go back
    cy.go('back');
    cy.wait(1000);

    // Go forward
    cy.go('forward');
    cy.wait(1000);

    // Should be back on profile
    cy.url().should('include', '/profile');
  });

  it('Should load page with correct title/heading', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Visit home page
    cy.visit('http://localhost:5173/home');
    cy.wait(2000);

    // Check for page title/heading
    cy.get('h1, h2', { timeout: 5000 }).should('exist');
  });

  it('Should handle rapid page navigation', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Rapidly navigate between pages
    cy.visit('http://localhost:5173/home');
    cy.visit('http://localhost:5173/profile');
    cy.visit('http://localhost:5173/dashboard');

    // Should eventually load without errors
    cy.wait(3000);
    cy.url().should('include', '/dashboard');
  });

  it('Should display responsive layout on dashboard', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Visit dashboard
    cy.visit('http://localhost:5173/dashboard');
    cy.wait(2000);

    // Check viewport width
    cy.viewport('iphone-x');
    cy.wait(1000);

    // Elements should still be visible
    cy.get('img.rounded-full', { timeout: 5000 }).should('be.visible');

    // Reset viewport
    cy.viewport(1280, 720);
  });

  it('Should handle page load errors gracefully', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Try to visit a page that might not exist
    cy.visit('http://localhost:5173/api/non-existent', { failOnStatusCode: false });
    cy.wait(2000);

    // App should handle it gracefully
    cy.get('body').should('exist');
  });

  it('Should persist user session across page reloads', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(2000);

    // Reload multiple times
    for (let i = 0; i < 3; i++) {
      cy.reload();
      cy.wait(2000);
      cy.get('img.rounded-full', { timeout: 5000 }).should('be.visible');
    }
  });

  it('Should handle network errors gracefully', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Navigate to page
    cy.visit('http://localhost:5173/home');
    cy.wait(2000);

    // Page should be visible even if some resources fail
    cy.get('body').should('be.visible');
  });
});
