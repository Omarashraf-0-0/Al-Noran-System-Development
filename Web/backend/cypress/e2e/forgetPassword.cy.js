describe('Forgot Password OTP Test', () => {
  it('Invokes Forgot Password flow and requests OTP', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    cy.contains('هل نسيت كلمة المرور؟').click();

     cy.url().should('include', '/forgetpassword');
    cy.wait(2000);

    cy.get('#email')
      .type('ialy24405@gmail.com')
      .should('have.value', 'ialy24405@gmail.com');

    cy.get('button[type="submit"]',{timeout:1000}).click();

    cy.wait(3000);
    
    cy.contains('تم إرسال رمز التحقق إلى بريدك الإلكتروني').should('exist')


});
});
