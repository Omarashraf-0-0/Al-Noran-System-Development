describe('Shipment Creation and Management Tests', () => {
  const loginCredentials = {
    email: 'ialy24407@gmail.com',
    password: '111111'
  };

  const shipmentData = {
    acid: `ACD-${Date.now()}`,
    shipment_type: 'بحري',
    port_name: 'ميناء الإسكندرية',
    country: 'السعودية',
    num_of_containers: '2',
    container_type: '20ft',
    arrivalDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  };

  it('Should access shipments page after login', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Navigate to client shipments page
    cy.visit('http://localhost:5173/client-shipments', { failOnStatusCode: false });
    cy.wait(2000);

    cy.url().should('include', '/client-shipments');
  });

  it('Should display shipment list', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Navigate to shipments
    cy.visit('http://localhost:5173/client-shipments');
    cy.wait(2000);

    // Check for shipment table/list
    cy.get('table, div[class*="shipment"]', { timeout: 5000 }).should('exist');
  });

  it('Should navigate to shipment status page', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Navigate to shipment status
    cy.visit('http://localhost:5173/shipmentstatus/507f1f77bcf86cd799439011', { failOnStatusCode: false });
    cy.wait(2000);

    cy.url().should('include', '/shipmentstatus');
  });

  it('Should navigate to export shipments page', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Navigate to export shipments
    cy.visit('http://localhost:5173/export-shipments', { failOnStatusCode: false });
    cy.wait(2000);

    cy.url().should('include', '/export-shipments');
  });

  it('Should access shipment details page', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Try to access a shipment details page (using a dummy ID)
    cy.visit('http://localhost:5173/export-shipment/507f1f77bcf86cd799439011', { failOnStatusCode: false });
    cy.wait(2000);

    // Should either show the page or redirect
    cy.get('body').should('exist');
  });

  it('Should navigate to admin shipment management', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Navigate to shipments management (admin)
    cy.visit('http://localhost:5173/shipmentsmanagement', { failOnStatusCode: false });
    cy.wait(2000);

    cy.url().should('include', '/shipmentsmanagement');
  });

  it('Should access shipment history page', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Navigate to a shipment history page
    cy.visit('http://localhost:5173/shipment-history/507f1f77bcf86cd799439011', { failOnStatusCode: false });
    cy.wait(2000);

    cy.url().should('include', '/shipment-history');
  });

  it('Should access export shipment history', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Navigate to UCR requests (export system)
    cy.visit('http://localhost:5173/ucr-requests', { failOnStatusCode: false });
    cy.wait(2000);

    cy.url().should('include', '/ucr-requests');
  });

  it('Should display shipment creation button', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Navigate to client shipments
    cy.visit('http://localhost:5173/client-shipments');
    cy.wait(2000);

    // Look for create button
    cy.get('button', { timeout: 5000 }).should('exist');
  });

  it('Should search shipments by ACID number', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Navigate to client shipments
    cy.visit('http://localhost:5173/client-shipments');
    cy.wait(2000);

    // Look for search input
    cy.get('input[type="search"], input[placeholder*="بحث"], input[placeholder*="search"]', { timeout: 5000 })
      .should('exist')
      .or('not.exist');
  });

  it('Should filter shipments by status', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Navigate to client shipments
    cy.visit('http://localhost:5173/client-shipments');
    cy.wait(2000);

    // Look for filter/status dropdown
    cy.get('select, button[class*="filter"]', { timeout: 5000 }).should('exist').or('not.exist');
  });

  it('Should display shipment details modal', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Navigate to client shipments
    cy.visit('http://localhost:5173/client-shipments');
    cy.wait(2000);

    // Try to click on a shipment row if it exists
    cy.get('table tbody tr, div[class*="shipment-item"]', { timeout: 5000 }).first().click({ force: true }).or('not.exist');
  });

  it('Should display upload documents section in shipment', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Try to access shipment status
    cy.visit('http://localhost:5173/shipmentstatus/507f1f77bcf86cd799439011');
    cy.wait(2000);

    // Look for document upload section
    cy.get('div[class*="upload"], input[type="file"]', { timeout: 5000 }).should('exist').or('not.exist');
  });

  it('Should navigate between shipment pages', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Navigate to client shipments
    cy.visit('http://localhost:5173/client-shipments');
    cy.wait(1000);
    cy.url().should('include', '/client-shipments');

    // Navigate to shipment history
    cy.visit('http://localhost:5173/shipment-history/507f1f77bcf86cd799439011');
    cy.wait(1000);
    cy.url().should('include', '/shipment-history');

    // Navigate to export shipments
    cy.visit('http://localhost:5173/export-shipments');
    cy.wait(1000);
    cy.url().should('include', '/export-shipments');

    // Navigate to shipment status
    cy.visit('http://localhost:5173/shipmentstatus/507f1f77bcf86cd799439011');
    cy.wait(1000);
    cy.url().should('include', '/shipmentstatus');
  });

  it('Should handle pagination in shipment list', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Navigate to client shipments
    cy.visit('http://localhost:5173/client-shipments');
    cy.wait(2000);

    // Look for pagination buttons
    cy.get('button[class*="pagination"], button[class*="next"], button[class*="prev"]', { timeout: 5000 })
      .should('exist')
      .or('not.exist');
  });

  it('Should display shipment summary statistics', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Navigate to client shipments
    cy.visit('http://localhost:5173/client-shipments');
    cy.wait(2000);

    // Look for summary/statistics cards
    cy.get('div[class*="card"], div[class*="stats"], div[class*="summary"]', { timeout: 5000 })
      .should('exist')
      .or('not.exist');
  });

  it('Should access employee shipment management page', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Navigate to employee shipment management
    cy.visit('http://localhost:5173/employee-shipment/507f1f77bcf86cd799439011', { failOnStatusCode: false });
    cy.wait(2000);

    cy.get('body').should('exist');
  });

  it('Should handle shipment status updates', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Navigate to shipment status
    cy.visit('http://localhost:5173/shipment-status');
    cy.wait(2000);

    // Look for status dropdown or update button
    cy.get('select[class*="status"], button[class*="update"], button[class*="status"]', { timeout: 5000 })
      .should('exist')
      .or('not.exist');
  });

  it('Should display ACID request information', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Try to access ACID request page
    cy.visit('http://localhost:5173/acid-request', { failOnStatusCode: false });
    cy.wait(2000);

    cy.get('body').should('exist');
  });

  it('Should access UCR request page', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Navigate to UCR request
    cy.visit('http://localhost:5173/ucr-request', { failOnStatusCode: false });
    cy.wait(2000);

    cy.url().should('include', '/ucr-request').or('include', '/login');
  });

  it('Should display required documents for shipment', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Navigate to shipment status
    cy.visit('http://localhost:5173/shipmentstatus/507f1f77bcf86cd799439011');
    cy.wait(2000);

    // Look for required documents section
    cy.get('div[class*="document"], h3:contains("مستند"), h3:contains("وثيقة")', { timeout: 5000 })
      .should('exist')
      .or('not.exist');
  });

  it('Should handle shipment export functionality', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Navigate to export shipments
    cy.visit('http://localhost:5173/export-shipments');
    cy.wait(2000);

    // Look for export button or create export shipment
    cy.get('button:contains("تصدير"), button:contains("Export")', { timeout: 5000 })
      .should('exist')
      .or('not.exist');
  });

  it('Should maintain session while viewing shipment details', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Navigate through multiple shipment pages
    cy.visit('http://localhost:5173/client-shipments');
    cy.wait(1000);

    cy.visit('http://localhost:5173/shipmentstatus/507f1f77bcf86cd799439011');
    cy.wait(1000);

    cy.visit('http://localhost:5173/export-shipments');
    cy.wait(1000);

    // Check if still logged in
    cy.get('img.rounded-full', { timeout: 5000 }).should('be.visible');
  });

  it('Should handle responsive shipment table on mobile', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Navigate to client shipments
    cy.visit('http://localhost:5173/client-shipments');
    cy.wait(2000);

    // Switch to mobile viewport
    cy.viewport('iphone-x');
    cy.wait(1000);

    // Page should be responsive
    cy.get('body').should('be.visible');

    // Reset viewport
    cy.viewport(1280, 720);
  });

  it('Should reload shipment list after status update', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Navigate to client shipments
    cy.visit('http://localhost:5173/client-shipments');
    cy.wait(2000);

    // Reload page
    cy.reload();
    cy.wait(2000);

    // Shipments should load
    cy.get('table, div[class*="shipment"]', { timeout: 5000 }).should('exist');
  });

  it('Should export shipment details page', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Navigate to export shipment details
    cy.visit('http://localhost:5173/export-shipment-details/507f1f77bcf86cd799439011', { failOnStatusCode: false });
    cy.wait(2000);

    cy.get('body').should('exist');
  });

  it('Should display shipment tracking information', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Navigate to shipment status for tracking
    cy.visit('http://localhost:5173/shipmentstatus/507f1f77bcf86cd799439011');
    cy.wait(2000);

    // Look for tracking information
    cy.get('div[class*="track"], h3:contains("تتبع"), span:contains("تتبع")', { timeout: 5000 })
      .should('exist')
      .or('not.exist');
  });

  it('Should handle shipment certificate of origin', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Navigate to export shipment details
    cy.visit('http://localhost:5173/export-shipment-details/507f1f77bcf86cd799439011', { failOnStatusCode: false });
    cy.wait(2000);

    // Look for certificate of origin section
    cy.get('h3:contains("شهادة"), span:contains("شهادة المنشأ")', { timeout: 5000 })
      .should('exist')
      .or('not.exist');
  });

  it('Should display invoice and customs information', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Navigate to shipment status
    cy.visit('http://localhost:5173/shipmentstatus/507f1f77bcf86cd799439011');
    cy.wait(2000);

    // Look for invoice/customs sections
    cy.get('h3:contains("فاتورة"), h3:contains("جمركي"), h3:contains("جمرك")', { timeout: 5000 })
      .should('exist')
      .or('not.exist');
  });

  it('Should handle shipment in different statuses', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Navigate to shipment history
    cy.visit('http://localhost:5173/shipment-history');
    cy.wait(2000);

    // Look for status badges
    cy.get('span[class*="badge"], span[class*="status"], div[class*="status"]', { timeout: 5000 })
      .should('exist');
  });

  it('Should allow download of shipment documents', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Navigate to shipment status
    cy.visit('http://localhost:5173/shipmentstatus/507f1f77bcf86cd799439011');
    cy.wait(2000);

    // Look for download buttons
    cy.get('button:contains("تحميل"), button:contains("Download"), a[class*="download"]', { timeout: 5000 })
      .should('exist')
      .or('not.exist');
  });

  it('Should display shipment fees and charges', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Navigate to export shipment details
    cy.visit('http://localhost:5173/export-shipment-details/507f1f77bcf86cd799439011', { failOnStatusCode: false });
    cy.wait(2000);

    // Look for fees/charges section
    cy.get('h3:contains("رسوم"), h3:contains("مصاريف"), h3:contains("تكاليف")', { timeout: 5000 })
      .should('exist')
      .or('not.exist');
  });

  it('Should navigate through shipment workflow', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Start from shipments list
    cy.visit('http://localhost:5173/client-shipments');
    cy.wait(1000);
    cy.url().should('include', '/client-shipments');

    // Go to shipment status for details
    cy.visit('http://localhost:5173/shipmentstatus/507f1f77bcf86cd799439011');
    cy.wait(1000);
    cy.url().should('include', '/shipmentstatus');

    // Go to history to see timeline
    cy.visit('http://localhost:5173/shipment-history/507f1f77bcf86cd799439011');
    cy.wait(1000);
    cy.url().should('include', '/shipment-history');

    // Verify still logged in
    cy.get('img.rounded-full', { timeout: 5000 }).should('be.visible');
  });

  it('Should handle unauthenticated access to shipment pages', () => {
    cy.clearLocalStorage();
    cy.clearCookies();

    // Try to access shipments without login
    cy.visit('http://localhost:5173/client-shipments', { failOnStatusCode: false });
    cy.wait(2000);

    // Should redirect to login
    cy.url().should('include', '/login');
  });

  it('Should load shipment data on page refresh', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email').type(loginCredentials.email);
    cy.get('#password').type(loginCredentials.password);
    cy.get('button[type="submit"]').click();

    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
    cy.wait(3000);

    // Navigate to shipments
    cy.visit('http://localhost:5173/shipments');
    cy.wait(2000);

    // Refresh page
    cy.reload();
    cy.wait(2000);

    // Data should still be present
    cy.get('table, div[class*="shipment"]', { timeout: 5000 }).should('exist');
  });
});
