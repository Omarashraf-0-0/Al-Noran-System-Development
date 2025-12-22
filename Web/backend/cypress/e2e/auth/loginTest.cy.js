describe('Login Test', () => {
  it('Login with correct credentials', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(5000);
    
    // Use placeholder selectors since inputs don't have id attributes
    cy.get('input[placeholder="example@email.com"]')
      .type('ialy24405@gmail.com')
      .should('have.value', 'ialy24405@gmail.com');
    
    cy.get('input[placeholder="••••••••"]')
      .type('123456')
      .should('have.value', '123456');
    
    cy.get('button[type="submit"]').click();
    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
  });

  it('Login with wrong credentials', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.get('input[placeholder="example@email.com"]')
      .type('wronguser@example.com')
      .should('have.value', 'wronguser@example.com');

    cy.get('input[placeholder="••••••••"]')
      .type('wrongpassword')
      .should('have.value', 'wrongpassword');

    cy.get('button[type="submit"]').click();

    // Updated error message to match actual frontend
    cy.contains('البريد الإلكتروني أو كلمة المرور غير صحيحة', { timeout: 10000 })
      .should('be.visible');
  });
});