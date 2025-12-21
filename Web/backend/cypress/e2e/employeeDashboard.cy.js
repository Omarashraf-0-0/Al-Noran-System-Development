describe('Dahsboard login test' , () => {
    it('Login with correct credintials', () => {
        cy.visit('http://localhost:5173/login');
        cy.wait(5000)
        cy.get('#email')
      .type('ialy24407@gmail.com')
      cy.get('#password')
  .type('111111')
  .should('have.value', '111111');
    cy.get('button[type="submit"]' ).click();
    cy.contains('تم تسجيل الدخول بنجاح', { timeout: 10000 }).should('be.visible');
  
    cy.url().should('include', '/employeedashboard'); 

    cy.contains('لوحة التحكم').should('be.visible');
    cy.contains('الدعم').should('be.visible');
    cy.contains('عملائي').should('be.visible');
    cy.contains('التصدير').should('be.visible');
    cy.contains('الاستيراد').should('be.visible');
    cy.contains('مرحباً, ALy_3lewa!').should('be.visible');
    cy.contains('عدد الشحنات المكتملة').should('be.visible');
    cy.contains('عدد الشحنات قيد التوصيل').should('be.visible');
    cy.get('.relative').should('contain', 'aly');

    })
})