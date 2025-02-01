describe('Recycling Flow', () => {
  beforeEach(() => {
    // Login before each test
    cy.intercept('POST', '/auth/v1/token*', {
      statusCode: 200,
      body: {
        access_token: 'test-token',
        user: {
          id: 'test-user',
          email: 'test@example.com'
        }
      }
    });

    cy.visit('/');
  });

  it('should show recycling form and handle submission', () => {
    cy.intercept('POST', '/rest/v1/recycling_entries*', {
      statusCode: 200,
      body: {
        id: 'test-entry',
        user_id: 'test-user',
        material_type: 'Plastic',
        weight_kg: 2.5,
        co2_saved_kg: 6.25,
        created_at: new Date().toISOString()
      }
    }).as('addEntry');

    cy.get('[data-testid="add-recycling-button"]').click();
    cy.get('[data-testid="material-type-select"]').select('Plastic');
    cy.get('[data-testid="weight-input"]').type('2.5');
    cy.get('[data-testid="submit-recycling"]').click();

    cy.wait('@addEntry');
    cy.get('[data-testid="success-message"]').should('be.visible');
    cy.get('[data-testid="recycling-table"]').should('contain.text', 'Plastic');
  });

  it('should update tasks and achievements', () => {
    // Mock initial tasks
    cy.intercept('GET', '/rest/v1/tasks*', {
      statusCode: 200,
      body: [{
        id: 'daily-task',
        type: 'daily',
        progress: 0,
        targetKg: 1,
        completed: false
      }]
    });

    // Add recycling entry
    cy.intercept('POST', '/rest/v1/recycling_entries*', {
      statusCode: 200,
      body: {
        id: 'test-entry',
        weight_kg: 1.5
      }
    }).as('addEntry');

    cy.get('[data-testid="add-recycling-button"]').click();
    cy.get('[data-testid="material-type-select"]').select('Plastic');
    cy.get('[data-testid="weight-input"]').type('1.5');
    cy.get('[data-testid="submit-recycling"]').click();

    cy.wait('@addEntry');
    cy.get('[data-testid="task-completed"]').should('be.visible');
    cy.get('[data-testid="achievement-notification"]').should('be.visible');
  });

  it('should handle errors gracefully', () => {
    cy.intercept('POST', '/rest/v1/recycling_entries*', {
      statusCode: 500,
      body: {
        error: 'Server error'
      }
    }).as('failedSubmission');

    cy.get('[data-testid="add-recycling-button"]').click();
    cy.get('[data-testid="material-type-select"]').select('Plastic');
    cy.get('[data-testid="weight-input"]').type('2.5');
    cy.get('[data-testid="submit-recycling"]').click();

    cy.wait('@failedSubmission');
    cy.get('[data-testid="error-message"]')
      .should('be.visible')
      .and('contain.text', 'Server error');
  });

  it('should validate input fields', () => {
    cy.get('[data-testid="add-recycling-button"]').click();
    cy.get('[data-testid="submit-recycling"]').click();
    
    cy.get('[data-testid="material-type-error"]').should('be.visible');
    cy.get('[data-testid="weight-error"]').should('be.visible');

    cy.get('[data-testid="weight-input"]').type('-1');
    cy.get('[data-testid="submit-recycling"]').click();
    cy.get('[data-testid="weight-error"]')
      .should('be.visible')
      .and('contain.text', 'must be positive');
  });
}); 