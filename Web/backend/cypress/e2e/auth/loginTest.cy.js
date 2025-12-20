describe('Login Test', () => {
it('Login with correct credintials', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(5000)
    cy.get('#email')
  .type('ialy24405@gmail.com')
  .should('have.value', 'ialy24405@gmail.com');
    cy.get('#password')
  .type('123456')
  .should('have.value', '123456');
    cy.get('button[type="submit"]' ).click();
    // cy.get('.go3958317564').should('contain', "تم تسجيل الدخول بنجاح");
    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
  
    // cy.url().should('include', '/login'); 
    // later
  })

  it('Login with wrong credentials', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('#email')
      .type('wronguser@example.com')
      .should('have.value', 'wronguser@example.com');

    cy.get('#password')
      .type('wrongpassword')
      .should('have.value', 'wrongpassword');

    cy.get('button[type="submit"]').click();

    cy.contains('فشل تسجيل الدخول. رجاءً تحقق من بياناتك وحاول مرة أخرى.', { timeout: 10000 })
      .should('be.visible');
      
    // cy.url().should('include', '/login'); 
    // later
  });



})