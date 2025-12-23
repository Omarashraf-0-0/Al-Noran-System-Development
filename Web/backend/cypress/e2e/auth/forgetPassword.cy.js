describe('Forgot Password OTP Test', () => {
  it('Invokes Forgot Password flow and requests OTP', () => {
    cy.visit('http://localhost:5173/login');
    cy.wait(3000);

    // Click forgot password link
    cy.contains('نسيت كلمة المرور؟').click();

    cy.url().should('include', '/forgetpassword');
    cy.wait(2000);

    // Use placeholder selector since input doesn't have id attribute
    cy.get('input[placeholder="example@email.com"]')
      .type('ialy24405@gmail.com')
      .should('have.value', 'ialy24405@gmail.com');

    cy.get('button[type="submit"]', { timeout: 1000 }).click();

    cy.wait(3000);
    
    cy.contains('تم إرسال رمز التحقق إلى بريدك الإلكتروني').should('exist');
  });
});
