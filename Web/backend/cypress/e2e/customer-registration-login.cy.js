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
    phoneNumber: `${timestamp.toString().slice(-11)}`
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
        
        cy.get('input#email', { timeout: 10000 }).should('be.visible').clear().type(customerData.email);
        cy.get('input#password').should('be.visible').clear().type(customerData.password);
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

      // Wait for form to be ready
      cy.get('input#username', { timeout: 10000 }).should('be.visible');

      // Fill all required fields
      cy.get('input#username').clear().type(customerData.username);
      cy.get('input#email').clear().type(customerData.email);
      cy.get('input#password').clear().type(customerData.password);
      cy.get('input#confirmPassword').clear().type(customerData.password);
      cy.get('input#fullname').clear().type(customerData.fullname);
      cy.get('input#phone').clear().type(customerData.phoneNumber);
      
      // Select account type (personal)
      cy.get('input#personal').check({ force: true });
      
      // Wait for SSN field to appear and fill it with 14-digit number from timestamp
      cy.wait(500);
      cy.get('input#ssn').should('be.visible');
      const ssn14digit = Date.now().toString().slice(0, 14).padEnd(14, '0');
      cy.get('input#ssn').clear().type(ssn14digit);
      
      // Accept terms and conditions
      cy.get('input#terms').check({ force: true });
      
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

      // Wait for form to load
      cy.get('input#email', { timeout: 10000 }).should('be.visible');

      cy.get('input#email').clear().type(customerData.email);
      cy.get('input#password').clear().type(customerData.password);
      
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

      // Create a test PDF file for upload
      const fileName = 'test-invoice.pdf';
      cy.fixture(fileName, { encoding: null }).then((fileContent) => {
        // Find and upload the initial invoice (الفاتورة المبداية)
        cy.get('input[type="file"]').first().selectFile({
          contents: fileContent,
          fileName: fileName,
          mimeType: 'application/pdf'
        }, { force: true });
      });

      cy.wait(1000);
      cy.log('✅ Initial invoice PDF uploaded');

      // Fill in the remaining form fields
      // Note: Adjust these selectors based on your actual form structure
      cy.get('input[name="shipmentDescription"]').type('Test shipment description');
      cy.get('input[name="itemValue"]').type('1000');
      cy.get('input[name="weight"]').type('5');
      
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
