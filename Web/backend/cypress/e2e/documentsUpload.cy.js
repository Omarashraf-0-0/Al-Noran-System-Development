describe('Testing files uploading ',()=>{
    it('check and upload files' , () => {

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


        cy.visit('http://localhost:5173/upload-documents');
        cy.contains('📄 رفع المستندات المطلوبة').should('be.visible');
        if(cy.contains('نوع العميل: فردي'))
        {
            // todo m4 dlw2ti w m4 3aref kont h3mlha leh
            /*const el = cy.get('.text-2xl');
            if(el=='📎')
            {

            }*/

            cy.wait(2000)

            cy.get('label.btn.btn-sm.btn-primary.text-white input[type="file"]')
                .selectFile('cypress/fixtures/3823845791733489411.PNG', { 
                    force: true,
                    action: 'drag-drop',
                });

            cy.wait(2500);

            cy.get('.text-2xl').should('be.visible');

            cy.contains('تم رفع power_of_attorney بنجاح').should('be.visible');

        }
    })
});