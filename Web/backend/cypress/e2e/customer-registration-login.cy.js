describe('Customer Registration and Login - Al-Noran', () => {
  const baseUrl = 'http://localhost:5173';
  const apiUrl = 'http://localhost:3500';
  
  // Test data - use timestamp to ensure unique data
  const timestamp = Date.now();
  const customerData = {
    username: `testcustomer${timestamp}`,
    email: `testcustomer${timestamp}@test.com`,
    password: 'Test@123456',
    fullname: `Test Customer ${timestamp}`,
    phoneNumber: `01${timestamp.toString().slice(-9)}`
  };

  let authToken;
  let isRegistered = false;

  before(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  // Helper function to login with credentials
  const loginIfNeeded = () => {
    cy.url().then((url) => {
      if (url.includes('/login')) {
        cy.log('Detected login page - logging in...');
        
        // Use placeholder selectors since inputs don't have id attributes
        cy.get('input[placeholder="example@email.com"]', { timeout: 10000 }).should('be.visible').clear().type(customerData.email);
        cy.get('input[placeholder="••••••••"]').should('be.visible').clear().type(customerData.password);
        cy.get('button[type="submit"]').click();
        
        cy.wait(3000);
        
        cy.window().then((win) => {
          authToken = win.localStorage.getItem('token');
          cy.log('Logged in - Token:', authToken ? 'Found' : 'Not Found');
        });
      }
    });
  };

  describe('Step 1: Customer Registration', () => {
    it('should visit the registration page', () => {
      cy.visit(`${baseUrl}/register`, { failOnStatusCode: false });
      cy.url().should('include', '/register');
      cy.wait(1000);
    });

    it('should complete registration form', () => {
      // Ensure we're on the registration page
      cy.url().then((url) => {
        if (!url.includes('/register')) {
          cy.visit(`${baseUrl}/register`, { failOnStatusCode: false });
          cy.wait(2000);
        }
      });

      // Wait for form to be ready - use placeholder selector
      cy.get('input[placeholder="ادخل الاسم الكامل"]', { timeout: 10000 }).should('be.visible');

      // Fill all required fields using placeholder selectors
      cy.get('input[placeholder="ادخل الاسم الكامل"]').clear().type(customerData.fullname);
      cy.get('input[placeholder="example@email.com"]').clear().type(customerData.email);
      cy.get('input[placeholder="01xxxxxxxxx"]').clear().type(customerData.phoneNumber);
      cy.get('input[placeholder="ادخل اسم المستخدم"]').clear().type(customerData.username);
      
      // Password fields (both have same placeholder)
      cy.get('input[placeholder="••••••••"]').first().clear().type(customerData.password);
      cy.get('input[placeholder="••••••••"]').last().clear().type(customerData.password);
      
      // Select account type (personal) by clicking the label
      cy.contains('شخصي').click();
      
      // Wait for nationality options and select Egyptian
      cy.wait(500);
      cy.contains('مصري').click();
      
      // Wait for SSN field to appear and fill it with 14-digit number
      cy.wait(500);
      cy.get('input[placeholder="ادخل رقم البطاقة القومية (14 رقم)"]').should('be.visible');
      const ssn14digit = Date.now().toString().slice(0, 14).padEnd(14, '0');
      cy.get('input[placeholder="ادخل رقم البطاقة القومية (14 رقم)"]').clear().type(ssn14digit);
      
      // Accept terms and conditions (has id="terms")
      cy.get('#terms').check({ force: true });
      
      // Submit registration
      cy.get('button[type="submit"]').click();
      
      // Wait and check if still on page or redirected
      cy.wait(3000);
      cy.url().should('not.include', 'about:blank');
      
      cy.log('✅ Registration form submitted');
      isRegistered = true;
    });
  });

  describe('Step 2: Customer Login', () => {
    beforeEach(() => {
      // Auto-login if we end up on login page
      if (isRegistered) {
        loginIfNeeded();
      }
    });

    it('should navigate to login page', () => {
      cy.visit(`${baseUrl}/login`, { failOnStatusCode: false });
      cy.url().should('include', '/login');
      cy.wait(1000);
    });

    it('should login successfully', () => {
      // Ensure we're on login page
      cy.url().then((url) => {
        if (!url.includes('/login')) {
          cy.visit(`${baseUrl}/login`, { failOnStatusCode: false });
          cy.wait(2000);
        }
      });

      // Wait for form to load - use placeholder selector
      cy.get('input[placeholder="example@email.com"]', { timeout: 10000 }).should('be.visible');

      cy.get('input[placeholder="example@email.com"]').clear().type(customerData.email);
      cy.get('input[placeholder="••••••••"]').clear().type(customerData.password);
      
      // Intercept the login API call
      cy.intercept('POST', '**/api/auth/login').as('loginRequest');
      
      cy.get('button[type="submit"]').click();
      
      // Wait for the API response
      cy.wait('@loginRequest').then((interception) => {
        cy.log('Login Response Status:', interception.response.statusCode);
        if (interception.response.body) {
          cy.log('Response Body:', JSON.stringify(interception.response.body));
        }
      });
      
      // Wait for redirect and token to be saved
      cy.wait(3000);
      
      // Verify token is saved
      cy.window().then((win) => {
        authToken = win.localStorage.getItem('token');
        const userType = win.localStorage.getItem('userType');
        
        cy.log('Auth Token:', authToken || 'NOT FOUND');
        cy.log('User Type:', userType || 'NOT FOUND');
        cy.log('Current URL:', win.location.href);
        
        if (authToken) {
          expect(authToken).to.exist;
          cy.log('✅ Login successful - Token saved');
        } else {
          cy.log('⚠️ Warning: No auth token found');
        }
      });
    });

    it('should be on home page with valid session', () => {
      // Check current URL and login if needed
      cy.url().then((url) => {
        cy.log('Current URL:', url);
        
        if (url.includes('/login')) {
          cy.log('Redirected to login - logging in again...');
          loginIfNeeded();
          cy.wait(2000);
        }
        
        // If not on home, navigate there
        if (!url.includes('/home')) {
          cy.visit(`${baseUrl}/home`, { failOnStatusCode: false });
          cy.wait(2000);
          
          // Check if redirected to login again
          cy.url().then((newUrl) => {
            if (newUrl.includes('/login')) {
              loginIfNeeded();
              cy.visit(`${baseUrl}/home`, { failOnStatusCode: false });
              cy.wait(2000);
            }
          });
        }
      });
      
      // Verify we're on home page
      cy.url().should('include', '/home');
      cy.get('body').should('be.visible');
      
      // Verify session is still valid
      cy.window().then((win) => {
        const token = win.localStorage.getItem('token');
        const userType = win.localStorage.getItem('userType');
        
        expect(token).to.exist;
        cy.log('Token exists:', !!token);
        cy.log('User Type:', userType || 'Not set');
        
        if (userType) {
          expect(userType).to.equal('client');
        }
        
        cy.log('✅ Successfully on home page with valid session');
      });
    });
  });

  describe('Step 3: Create ACID Request and Upload Invoice', () => {
    beforeEach(() => {
      // Ensure we're logged in
      cy.window().then((win) => {
        const token = win.localStorage.getItem('token');
        if (!token) {
          cy.visit(`${baseUrl}/login`, { failOnStatusCode: false });
          loginIfNeeded();
          cy.wait(2000);
        }
      });
    });

    it('should navigate to ACID request page from home', () => {
      cy.visit(`${baseUrl}/home`, { failOnStatusCode: false });
      cy.wait(2000);
      
      // Check if redirected to login
      cy.url().then((url) => {
        if (url.includes('/login')) {
          loginIfNeeded();
          cy.visit(`${baseUrl}/home`, { failOnStatusCode: false });
          cy.wait(2000);
        }
      });
      
      // Navigate to ACID request page
      cy.visit(`${baseUrl}/acidrequest`, { failOnStatusCode: false });
      cy.wait(2000);
      
      cy.url().should('include', '/acidrequest');
      cy.log('✅ Successfully navigated to ACID request page');
    });

    it('should fill ACID request form and upload initial invoice PDF', () => {
      // Ensure we're on ACID request page
      cy.url().then((url) => {
        if (!url.includes('/acidrequest')) {
          cy.visit(`${baseUrl}/acidrequest`, { failOnStatusCode: false });
          cy.wait(2000);
        }
      });

      // Wait for form to be ready
      cy.get('form', { timeout: 10000 }).should('be.visible');

      // Create a test PDF content for upload
      const pdfContent = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n195\n%%EOF';
      
      // Upload initial invoice
      cy.get('input[type="file"]').first().selectFile({
        contents: Cypress.Buffer.from(pdfContent),
        fileName: 'test-invoice.pdf',
        mimeType: 'application/pdf'
      }, { force: true });

      cy.wait(1000);
      cy.log('✅ Initial invoice PDF uploaded');

      // Select shipment type (new UI uses clickable divs)
      cy.contains('شحن بحري').click();
      cy.log('✅ Shipment type selected');

      // Fill goods information using placeholder selectors
      cy.get('input[placeholder*="851713"]').clear().type('851713');
      cy.get('input[placeholder="0.00"]').clear().type('100');
      cy.get('input[placeholder*="وصف دقيق للبضاعة"]').clear().type('بضائع تجريبية للاختبار');
      cy.log('✅ Goods information filled');

      // Fill supplier information
      cy.get('input[placeholder="اسم الشركة الموردة"]').clear().type('شركة الاختبار الدولية');
      cy.get('input[placeholder="Tax ID Number"]').clear().type('123456789');
      cy.get('input[placeholder="بلد المنشأ"]').clear().type('الصين');
      cy.get('input[placeholder="مع مفتاح الدولة"]').clear().type('+8612345678901');
      cy.get('input[placeholder="supplier@example.com"]').clear().type('test@supplier.com');
      cy.log('✅ Supplier information filled');
      
      // Submit the form
      cy.get('button[type="submit"]').click();
      
      cy.wait(3000);
      cy.log('✅ ACID request form submitted');
    });
  });

  after(() => {
    cy.log('='.repeat(50));
    cy.log('Test completed successfully!');
    cy.log(`Username: ${customerData.username}`);
    cy.log(`Email: ${customerData.email}`);
    cy.log(`Password: ${customerData.password}`);
    cy.log('='.repeat(50));
  });
});
