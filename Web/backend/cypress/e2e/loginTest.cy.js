describe('Login Test', () => {
it('Login with correct credintials', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(5000)
    cy.get('#email')
  .type('ialy24407@gmail.com')
  .should('have.value', 'ialy24407@gmail.com');
    cy.get('#password')
  .type('111111')
  .should('have.value', '111111');
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

    cy.contains('البريد الإلكتروني أو كلمة المرور غير صحيحة', { timeout: 10000 })
      .should('be.visible');
      
    // cy.url().should('include', '/login'); 
    // later
  });

  it('test', function() {
      cy.visit('http://localhost:5173/login')
      
      
      cy.get('#email').click();
      cy.get('#email').type('ialy24405@gmail.com');
      cy.get('#password').type('111111');
      cy.get('#root button.w-full').click();
      cy.get('#root div.go3958317564').should('be.visible')
      cy.get('#root img.rounded-full').click();
      cy.get('#root a.px-4').click();
     })

});


     