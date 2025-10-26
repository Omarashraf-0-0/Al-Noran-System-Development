describe('Register test', () => {

  it('Register with correct credentials', () => {
    cy.visit('http://localhost:5173/register');
    cy.wait(3000);

    cy.get('#fullname').type('Salah Gamal').should('have.value', 'Salah Gamal');
    cy.get('#email').type('SalahGamal@gmail.com').should('have.value', 'SalahGamal@gmail.com');
    cy.get('#phone').type('01123456789').should('have.value', '01123456789');
    cy.get('#username').type('SalahTheBest').should('have.value', 'SalahTheBest');
    cy.get('#password').type('123456').should('have.value', '123456');
    cy.get('#confirmPassword').type('123456').should('have.value', '123456');
    cy.get('#personal').click();
    cy.get('#ssn').type('30404162800033').should('have.value', '30404162800033');
    cy.get('#terms').click();

    cy.get('button[type="submit"]').click();

    cy.get('.go3958317564').should('contain', 'تم إنشاء الحساب بنجاح');
  });
  


  it('Register with bad credentials (used email)', () => {
    cy.visit('http://localhost:5173/register');
    cy.wait(3000);

    cy.get('#fullname').type('Fake User').should('have.value', 'Fake User');
    cy.get('#email').type('ialy24405@gmail.com').should('have.value', 'ialy24405@gmail.com');
    cy.get('#phone').type('01100000000').should('have.value', '01100000000');
    cy.get('#username').type('FakeUser123').should('have.value', 'FakeUser123');
    cy.get('#password').type('123').should('have.value', '123'); 
    cy.get('#confirmPassword').type('123').should('have.value', '123');
    cy.get('#personal').click();
    cy.get('#ssn').type('12345671234567').should('have.value', '12345671234567');
    cy.get('#terms').click();


    cy.get('button[type="submit"]',{timeout:1000}).click();

    cy.wait(1500); 

    // cy.get('[data-testid="toast-message"]').should('contain', 'فشل في إنشاء الحساب. الرجاء المحاولة مرة أخرى.');
    cy.contains('فشل في إنشاء الحساب. الرجاء المحاولة مرة أخرى.')
    .should('be.visible');
  });


  it('Register with existing email', () => {
    cy.visit('http://localhost:5173/register');
    cy.wait(3000);

    cy.get('#fullname').type('Salah Gamal').should('have.value', 'Salah Gamal');
    cy.get('#email').type('SalahGamal@gmail.com');
    cy.get('#phone').type('01123456789');
    cy.get('#username').type('SalahTheBest');
    cy.get('#password').type('123456');
    cy.get('#confirmPassword').type('123456');
    cy.get('#personal').click();
    cy.get('#ssn').type('30404162800033');
    cy.get('#terms').click();

    cy.get('button[type="submit"]').click();

    cy.get('.go3958317564').should('contain', 'فشل في إنشاء الحساب. الرجاء المحاولة مرة أخرى.'); 
  });

});
