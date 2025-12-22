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
      customsItem: '851713',
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
    cy.get('input[placeholder="example@email.com"]', { timeout: 10000 }).should('be.visible');
    cy.get('input[placeholder="example@email.com"]').clear().type(testUser.email);
    cy.get('input[placeholder="••••••••"]').clear().type(testUser.password);
    
    cy.intercept('POST', '**/api/auth/login').as('loginRequest');
    cy.get('button[type="submit"]').click();
    
    // Wait for login response
    cy.wait('@loginRequest', { timeout: 15000 }).then((interception) => {
      expect(interception.response.statusCode).to.be.oneOf([200, 201]);
    });
    cy.wait(3000);
    
    // Verify token exists with retry
    cy.window().should((win) => {
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
      cy.get('input[placeholder="example@email.com"]', { timeout: 10000 }).should('be.visible');
      cy.get('input[placeholder="example@email.com"]').clear().type(testUser.email);
      cy.get('input[placeholder="••••••••"]').clear().type(testUser.password);
      
      cy.intercept('POST', '**/api/auth/login').as('loginRequest');
      cy.get('button[type="submit"]').click();
      
      // Wait for login response and check it was successful
      cy.wait('@loginRequest', { timeout: 15000 }).then((interception) => {
        if (interception.response) {
          cy.log('Login Response Status:', interception.response.statusCode);
          expect(interception.response.statusCode).to.be.oneOf([200, 201]);
        } else {
          cy.log('Login request sent, waiting for token verification');
        }
      });
      
      // Wait for redirect and token storage
      cy.wait(3000);

      // Verify login success - use retry logic for token check
      cy.window().should((win) => {
        const token = win.localStorage.getItem('token');
        expect(token).to.exist;
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
      // The new UI uses a hidden file input with a clickable div overlay
      const pdfContent = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n195\n%%EOF';
      
      cy.get('input[type="file"]').first().selectFile({
        contents: Cypress.Buffer.from(pdfContent),
        fileName: 'فاتورة-مبدائية.pdf',
        mimeType: 'application/pdf'
      }, { force: true });
      cy.wait(1000);
      cy.log('✅ Step 4: Invoice uploaded (الفاتورة المبدائية)');

      // Step 5: Select shipment type (new UI uses clickable divs instead of radio buttons)
      // By default "بحري" is already selected, but we click it to confirm
      cy.contains('شحن بحري').click();
      cy.log('✅ Step 5: Shipment type selected (بحري)');

      // Step 6: Fill goods information
      // New UI uses InputGroup components with placeholders as identifiers
      cy.get('input[placeholder*="851713"]').clear().type(acidRequestData.goods.customsItem);
      cy.get('input[placeholder="0.00"]').clear().type(acidRequestData.goods.weight);
      cy.get('input[placeholder*="وصف دقيق للبضاعة"]').clear().type(acidRequestData.goods.description);
      cy.log('✅ Step 6: Goods information filled');

      // Step 7: Fill supplier information
      // Using placeholder selectors for the new InputGroup components
      cy.get('input[placeholder="اسم الشركة الموردة"]').clear().type(acidRequestData.supplier.name);
      cy.get('input[placeholder="Tax ID Number"]').clear().type(acidRequestData.supplier.taxNum);
      cy.get('input[placeholder="بلد المنشأ"]').clear().type(acidRequestData.supplier.country);
      cy.get('input[placeholder="مع مفتاح الدولة"]').clear().type(acidRequestData.supplier.mobileNum);
      cy.get('input[placeholder="supplier@example.com"]').clear().type(acidRequestData.supplier.email);
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
      cy.wait(10000);
      cy.url().should('include', '/acidrequests');
      cy.log('✅ Complete flow finished successfully - Navigated to ACID requests page');
    });

    it('should navigate to UCR request page and complete UCR request flow', () => {
      // First need to login (each test starts fresh)
      performLogin();
      cy.log('✅ UCR Step 0: Login successful');

      // Wait 10 seconds before starting UCR flow
      cy.wait(3000);
      cy.log('✅ Waited 10 seconds before UCR flow');

      // Navigate to home page
      cy.visit(`${baseUrl}/home`, { failOnStatusCode: false });
      cy.wait(2000);
      cy.url().should('include', '/home');
      cy.log('✅ UCR Step 1: On home page');

      // Click on "طلب رقم UCR" quick action
      cy.contains('طلب رقم UCR').click();
      cy.wait(2000);
      cy.url().should('include', '/ucr-request');
      cy.get('form', { timeout: 10000 }).should('be.visible');
      cy.log('✅ UCR Step 2: On UCR request page');

      // Step 3: Select certification type (النوران is default)
      // Click on "على بطاقة الشركة (النوران)" to ensure it's selected
      cy.get('input[name="certificationType"][value="noran"]').check({ force: true });
      cy.log('✅ UCR Step 3: Certification type selected (النوران)');

      // Step 4: Select shipping method (air/جوي)
      cy.get('input[name="shippingMethod"][value="air"]').check({ force: true });
      cy.log('✅ UCR Step 4: Shipping method selected (جوي)');

      // Step 5: Fill destination info
      // Select destination country from dropdown (full name from COUNTRIES array)
      cy.get('select[name="destinationCountry"]').select('المملكة العربية السعودية');
      cy.wait(500);
      
      // Fill destination port
      cy.get('input[placeholder*="ميناء جدة"]').clear().type('مطار الملك عبدالعزيز الدولي');
      cy.log('✅ UCR Step 5: Destination info filled');

      // Step 6: Fill goods basic info
      // General description
      cy.get('textarea[id="generalDescription"]').clear().type('أجهزة إلكترونية للتصدير - هواتف محمولة وملحقاتها');
      
      // Total weight
      cy.get('input[id="totalWeight"]').clear().type('250');
      
      // Packages count (for air shipment)
      cy.get('input[id="packagesCount"]').clear().type('15');
      cy.log('✅ UCR Step 6: Goods basic info filled');

      // Step 7: Fill invoice info
      // Value in EGP
      cy.get('input[id="valueInEGP"]').clear().type('75000');
      
      // Original invoice number
      cy.get('input[id="originalInvoiceNumber"]').clear().type('EXP-2025-001');
      
      // Invoice date (today)
      const today = new Date().toISOString().split('T')[0];
      cy.get('input[id="invoiceDate"]').clear().type(today);
      cy.log('✅ UCR Step 7: Invoice info filled');

      // Step 8: Fill first item details (required)
      // Item description
      cy.get('input[placeholder*="برتقال طازج"]').first().clear().type('هواتف محمولة ذكية');
      
      // Item HS Code
      cy.get('input[placeholder*="0805.10"]').first().clear().type('8517.13');
      
      // Item quantity
      cy.get('input[placeholder="100"]').first().clear().type('50');
      
      // Item value
      cy.get('input[placeholder="5000"]').first().clear().type('50000');
      
      // Item unit
      cy.get('input[placeholder*="كجم / كرتون"]').first().clear().type('قطعة');
      cy.log('✅ UCR Step 8: First item details filled');

      // Step 9: Upload first document (التنازل البنكي for noran certification)
      const pdfContent = '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n195\n%%EOF';
      
      cy.get('input[type="file"]').first().selectFile({
        contents: Cypress.Buffer.from(pdfContent),
        fileName: 'تنازل-بنكي.pdf',
        mimeType: 'application/pdf'
      }, { force: true });
      cy.wait(2000);
      cy.log('✅ UCR Step 9: First document uploaded (التنازل البنكي)');

      // Step 10: Submit UCR form
      cy.intercept('POST', '**/api/ucr').as('ucrRequest');

      cy.get('button[type="submit"]').click();
      cy.log('✅ UCR Step 10: Form submitted');

      // Wait for API response
      cy.wait('@ucrRequest', { timeout: 30000 }).then((interception) => {
        expect(interception.response.statusCode).to.be.oneOf([200, 201]);
        cy.log('✅ UCR request API successful');
      });

      // Wait for redirect
      cy.wait(3000);

      // Verify navigation to UCR requests list
      cy.url().should('include', '/ucr-requests');
      cy.log('✅ UCR Complete flow finished successfully - Navigated to UCR requests page');
    });
  });

  after(() => {
    cy.log('='.repeat(60));
    cy.log('ACID & UCR Request Flow Tests Completed!');
    cy.log('Test User Email:', testUser.email);
    cy.log('='.repeat(60));
  });
});
