describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display login page by default', () => {
    cy.url().should('include', '/login');
    cy.get('h1').should('contain', 'Vision79 SIWM');
    cy.get('input[name="email"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('contain', 'Sign In');
  });

  it('should show validation errors for empty form submission', () => {
    cy.get('button[type="submit"]').click();
    cy.get('[data-testid="error-message"]').should('be.visible');
  });

  it('should show validation errors for invalid email format', () => {
    cy.get('input[name="email"]').type('invalid-email');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    cy.get('[data-testid="error-message"]').should('be.visible');
  });

  it('should successfully login with valid credentials', () => {
    // Mock successful login response
    cy.intercept('POST', '/api/v1/auth/login', {
      statusCode: 200,
      body: {
        _id: 1,
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin',
        permissions: ['dashboard', 'inventory', 'users'],
        token: 'mock-jwt-token'
      }
    }).as('loginRequest');

    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest');
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid="sidebar"]').should('be.visible');
  });

  it('should show error message for invalid credentials', () => {
    // Mock failed login response
    cy.intercept('POST', '/api/v1/auth/login', {
      statusCode: 401,
      body: {
        message: 'Invalid email or password'
      }
    }).as('loginRequest');

    cy.get('input[name="email"]').type('wrong@example.com');
    cy.get('input[name="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginRequest');
    cy.get('[data-testid="error-message"]').should('contain', 'Invalid email or password');
  });

  it('should navigate to registration page', () => {
    cy.get('a').contains('Register').click();
    cy.url().should('include', '/register');
    cy.get('h1').should('contain', 'Create Account');
  });

  it('should successfully register a new user', () => {
    cy.intercept('POST', '/api/v1/auth/register', {
      statusCode: 201,
      body: {
        _id: 2,
        name: 'New User',
        email: 'newuser@example.com',
        role: 'Requester',
        permissions: ['dashboard'],
        token: 'mock-jwt-token'
      }
    }).as('registerRequest');

    cy.visit('/register');
    cy.get('input[name="name"]').type('New User');
    cy.get('input[name="email"]').type('newuser@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    cy.wait('@registerRequest');
    cy.url().should('include', '/dashboard');
  });

  it('should handle network errors gracefully', () => {
    cy.intercept('POST', '/api/v1/auth/login', {
      forceNetworkError: true
    }).as('networkError');

    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    cy.get('[data-testid="error-message"]').should('be.visible');
  });

  it('should maintain focus management for accessibility', () => {
    cy.get('input[name="email"]').focus();
    cy.focused().should('have.attr', 'name', 'email');
    
    cy.get('input[name="password"]').focus();
    cy.focused().should('have.attr', 'name', 'password');
  });

  it('should support keyboard navigation', () => {
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('input[name="password"]').type('{enter}');
    
    // Should attempt to submit the form
    cy.get('button[type="submit"]').should('be.focused');
  });
}); 