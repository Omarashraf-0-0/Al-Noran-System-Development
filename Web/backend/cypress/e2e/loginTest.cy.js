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
    cy.get('.go3958317564').should('contain', "تم تسجيل الدخول بنجاح");
  })
})