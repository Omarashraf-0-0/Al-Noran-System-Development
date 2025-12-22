describe('Register test', () => {

  it('Register with correct credentials', () => {
    cy.visit('http://localhost:5173/register');
    cy.wait(3000);

    // Use placeholder selectors since inputs don't have id attributes
    cy.get('input[placeholder="ادخل الاسم الكامل"]').type('Salah Gamal').should('have.value', 'Salah Gamal');
    cy.get('input[placeholder="example@email.com"]').type('SalahGamal@gmail.com').should('have.value', 'SalahGamal@gmail.com');
    cy.get('input[placeholder="01xxxxxxxxx"]').type('01123456789').should('have.value', '01123456789');
    cy.get('input[placeholder="ادخل اسم المستخدم"]').type('SalahTheBest').should('have.value', 'SalahTheBest');
    
    // Password fields (both have same placeholder)
    cy.get('input[placeholder="••••••••"]').first().type('123456').should('have.value', '123456');
    cy.get('input[placeholder="••••••••"]').last().type('123456').should('have.value', '123456');
    
    // Select personal account type by clicking the label
    cy.contains('شخصي').click();
    
    // Select Egyptian nationality
    cy.contains('مصري').click();
    
    // Fill SSN (appears after selecting Egyptian)
    cy.get('input[placeholder="ادخل رقم البطاقة القومية (14 رقم)"]').type('30404162800033').should('have.value', '30404162800033');
    
    // Terms checkbox has id="terms"
    cy.get('#terms').click();

    cy.get('button[type="submit"]').click();

    cy.get('.go3958317564').should('contain', 'تم إنشاء الحساب بنجاح');
  });
  


  it('Register with bad credentials (used email)', () => {
    cy.visit('http://localhost:5173/register');
    cy.wait(3000);

    cy.get('input[placeholder="ادخل الاسم الكامل"]').type('Fake User').should('have.value', 'Fake User');
    cy.get('input[placeholder="example@email.com"]').type('ialy24405@gmail.com').should('have.value', 'ialy24405@gmail.com');
    cy.get('input[placeholder="01xxxxxxxxx"]').type('01100000000').should('have.value', '01100000000');
    cy.get('input[placeholder="ادخل اسم المستخدم"]').type('FakeUser123').should('have.value', 'FakeUser123');
    
    // Password fields
    cy.get('input[placeholder="••••••••"]').first().type('123456').should('have.value', '123456');
    cy.get('input[placeholder="••••••••"]').last().type('123456').should('have.value', '123456');
    
    // Select personal account type
    cy.contains('شخصي').click();
    
    // Select Egyptian nationality
    cy.contains('مصري').click();
    
    // Fill SSN
    cy.get('input[placeholder="ادخل رقم البطاقة القومية (14 رقم)"]').type('12345671234567').should('have.value', '12345671234567');
    
    cy.get('#terms').click();

    cy.get('button[type="submit"]', { timeout: 1000 }).click();

    cy.wait(1500); 

    cy.contains('فشل في إنشاء الحساب')
      .should('be.visible');
  });


  it('Register with existing email', () => {
    cy.visit('http://localhost:5173/register');
    cy.wait(3000);

    cy.get('input[placeholder="ادخل الاسم الكامل"]').type('Salah Gamal').should('have.value', 'Salah Gamal');
    cy.get('input[placeholder="example@email.com"]').type('SalahGamal@gmail.com');
    cy.get('input[placeholder="01xxxxxxxxx"]').type('01123456789');
    cy.get('input[placeholder="ادخل اسم المستخدم"]').type('SalahTheBest');
    
    // Password fields
    cy.get('input[placeholder="••••••••"]').first().type('123456');
    cy.get('input[placeholder="••••••••"]').last().type('123456');
    
    // Select personal account type
    cy.contains('شخصي').click();
    
    // Select Egyptian nationality
    cy.contains('مصري').click();
    
    // Fill SSN
    cy.get('input[placeholder="ادخل رقم البطاقة القومية (14 رقم)"]').type('30404162800033');
    
    cy.get('#terms').click();

    cy.get('button[type="submit"]').click();

    cy.get('.go3958317564').should('contain', 'فشل في إنشاء الحساب'); 
  });

});
