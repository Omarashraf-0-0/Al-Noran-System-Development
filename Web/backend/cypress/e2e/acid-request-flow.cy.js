describe('ACID Request Flow - Login, Navigate and Upload Invoice', () => {
  const baseUrl = 'http://localhost:5173';
  const apiUrl = 'http://localhost:3500';

  // Test credentials - update these with valid credentials
  const testUser = {
    email: 'ialy24405@gmail.com',
    password: '111111'
  };

  // ACID Request test data
  const acidRequestData = {
    shipmentType: 'بحري', // Sea or 'جوي' for Air
    goods: {
      weight: '100',
      customsItem: '8471.30',
      description: 'أجهزة كمبيوتر محمولة'
    },
    supplier: {
      name: 'شركة التصدير الدولية',
      taxNum: '123456789',
      country: 'الصين',
      email: 'supplier@example.com',
      mobileNum: '+8612345678901'
    }
  };

  // Helper function to perform login
  const performLogin = () => {
    cy.visit(`${baseUrl}/login`, { failOnStatusCode: false });
    cy.get('input#email', { timeout: 10000 }).should('be.visible');
    cy.get('input#email').clear().type(testUser.email);
    cy.get('input#password').clear().type(testUser.password);
    
    cy.intercept('POST', '**/api/auth/login').as('loginRequest');
    cy.get('button[type="submit"]').click();
    cy.wait('@loginRequest', { timeout: 15000 });
    cy.wait(2000);
    
    // Verify token exists
    cy.window().then((win) => {
      expect(win.localStorage.getItem('token')).to.exist;
    });
  };

  before(() => {
    // Clear storage before tests
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  describe('Complete ACID Request Flow', () => {
    it('should login and fill complete form with invoice, goods, supplier info and submit', () => {
      // Clear storage
      cy.clearLocalStorage();
      cy.clearCookies();

      // Step 1: Login
      cy.visit(`${baseUrl}/login`, { failOnStatusCode: false });
      cy.get('input#email', { timeout: 10000 }).should('be.visible');
      cy.get('input#email').clear().type(testUser.email);
      cy.get('input#password').clear().type(testUser.password);
      
      cy.intercept('POST', '**/api/auth/login').as('loginRequest');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest', { timeout: 15000 });
      cy.wait(2000);

      // Verify login success
      cy.window().then((win) => {
        expect(win.localStorage.getItem('token')).to.exist;
      });
      cy.log('✅ Step 1: Login successful');

      // Step 2: Verify on home page
      cy.url().should('include', '/home');
      cy.log('✅ Step 2: On home page');

      // Step 3: Navigate to ACID request page
      cy.visit(`${baseUrl}/acidrequest`, { failOnStatusCode: false });
      cy.wait(2000);
      cy.url().should('include', '/acidrequest');
      cy.get('form', { timeout: 10000 }).should('be.visible');
      cy.log('✅ Step 3: On ACID request page');

      // Step 4: Upload initial invoice (الفاتورة المبدائية)
      const pdfContent = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n195\n%%EOF';
      
      cy.get('input[type="file"]').first().selectFile({
        contents: Cypress.Buffer.from(pdfContent),
        fileName: 'فاتورة-مبدائية.pdf',
        mimeType: 'application/pdf'
      }, { force: true });
      cy.wait(1000);
      cy.log('✅ Step 4: Invoice uploaded (الفاتورة المبدائية)');

      // Step 5: Select shipment type
      cy.get('input[name="shipmentType"][value="بحري"]').check({ force: true });
      cy.log('✅ Step 5: Shipment type selected (بحري)');

      // Step 6: Fill goods information
      cy.get('input#goods\\.weight').clear().type(acidRequestData.goods.weight);
      cy.get('input#goods\\.customsItem').clear().type(acidRequestData.goods.customsItem);
      cy.get('input#goods\\.description').clear().type(acidRequestData.goods.description);
      cy.log('✅ Step 6: Goods information filled');

      // Step 7: Fill supplier information
      cy.get('input#supplier\\.name').clear().type(acidRequestData.supplier.name);
      cy.get('input#supplier\\.taxNum').clear().type(acidRequestData.supplier.taxNum);
      cy.get('input#supplier\\.country').clear().type(acidRequestData.supplier.country);
      cy.get('input#supplier\\.email').clear().type(acidRequestData.supplier.email);
      cy.get('input#supplier\\.mobileNum').clear().type(acidRequestData.supplier.mobileNum);
      cy.log('✅ Step 7: Supplier information filled');

      // Step 8: Submit form
      cy.intercept('POST', '**/api/uploads').as('uploadRequest');
      cy.intercept('POST', '**/api/acid').as('acidRequest');

      cy.get('button[type="submit"]').click();
      cy.log('✅ Step 8: Form submitted');

      // Wait for API responses
      cy.wait('@acidRequest', { timeout: 30000 }).then((interception) => {
        expect(interception.response.statusCode).to.be.oneOf([200, 201]);
        cy.log('✅ ACID request API successful');
      });

      // Wait for redirect
      cy.wait(3000);

      // Navigate to ACID requests page to view submitted requests
      cy.visit(`${baseUrl}/acidrequests`, { failOnStatusCode: false });
      cy.wait(2000);
      cy.url().should('include', '/acidrequests');
      cy.log('✅ Complete flow finished successfully - Navigated to ACID requests page');
    });
  });

  after(() => {
    cy.log('='.repeat(60));
    cy.log('ACID Request Flow Test Completed!');
    cy.log('Test User Email:', testUser.email);
    cy.log('='.repeat(60));
  });
});
