describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/auth');
  });

  it('should display login form by default', () => {
    cy.get('h2').should('contain', 'Sign in to your account');
    cy.get('input[type="email"]').should('exist');
    cy.get('input[type="password"]').should('exist');
    cy.get('button[type="submit"]').should('contain', 'Sign in');
  });

  it('should switch to signup form', () => {
    cy.contains("Don't have an account? Sign up").click();
    cy.get('h2').should('contain', 'Create your account');
    cy.get('input[placeholder="Acme Corp"]').should('exist');
    cy.get('select[name="industry"]').should('exist');
  });

  it('should show validation errors for empty form submission', () => {
    cy.get('button[type="submit"]').click();
    cy.get('[data-testid="error-message"]').should('be.visible');
  });

  it('should show error for invalid email', () => {
    cy.get('input[type="email"]').type('invalid-email');
    cy.get('button[type="submit"]').click();
    cy.get('[data-testid="error-message"]')
      .should('be.visible')
      .and('contain', 'Please enter a valid email');
  });

  it('should show password mismatch error in signup', () => {
    cy.contains("Don't have an account? Sign up").click();
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('input[name="confirmPassword"]').type('password456');
    cy.get('button[type="submit"]').click();
    cy.get('[data-testid="error-message"]')
      .should('be.visible')
      .and('contain', 'Passwords do not match');
  });

  it('should handle successful login', () => {
    cy.intercept('POST', '/auth/v1/token*', {
      statusCode: 200,
      body: {
        access_token: 'mock-token',
        user: {
          id: '123',
          email: 'test@example.com'
        }
      }
    }).as('loginRequest');

    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest');
    cy.url().should('include', '/dashboard');
  });

  it('should handle login error', () => {
    cy.intercept('POST', '/auth/v1/token*', {
      statusCode: 401,
      body: {
        error: 'Invalid credentials'
      }
    }).as('loginRequest');

    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest');
    cy.get('[data-testid="error-message"]')
      .should('be.visible')
      .and('contain', 'Invalid credentials');
  });

  it('should complete onboarding flow after signup', () => {
    cy.contains("Don't have an account? Sign up").click();
    
    // Fill signup form
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('input[name="confirmPassword"]').type('password123');
    cy.get('input[name="companyName"]').type('Acme Corp');
    cy.get('select[name="industry"]').select('Retail');

    // Mock signup request
    cy.intercept('POST', '/auth/v1/signup', {
      statusCode: 200,
      body: {
        user: {
          id: '123',
          email: 'test@example.com'
        }
      }
    }).as('signupRequest');

    cy.get('button[type="submit"]').click();
    cy.wait('@signupRequest');

    // Verify onboarding wizard steps
    cy.get('[data-testid="onboarding-wizard"]').should('be.visible');
    cy.get('h3').should('contain', 'Set Your Sustainability Goals');
    
    // Complete goals step
    cy.get('input[name="recyclingGoal"]').type('75');
    cy.get('button').contains('Next').click();

    // Complete team step
    cy.get('input[name="teamMemberEmail"]').type('team@example.com');
    cy.get('select[name="role"]').select('Analyst');
    cy.get('button').contains('Add Member').click();
    cy.get('button').contains('Complete Setup').click();

    // Should redirect to dashboard
    cy.url().should('include', '/dashboard');
  });
}); 