import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthForm } from '../AuthForm';
import { useAuthStore } from '../../../stores/authStore';
import { BrowserRouter } from 'react-router-dom';

// Mock useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

const renderAuthForm = () => {
  return render(
    <BrowserRouter>
      <AuthForm />
    </BrowserRouter>
  );
};

describe('AuthForm', () => {
  it('renders login form by default', () => {
    renderAuthForm();
    
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('corporate@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Acme Corp')).not.toBeInTheDocument();
  });

  it('switches to signup form when clicking the signup link', () => {
    renderAuthForm();
    
    fireEvent.click(screen.getByText(/don't have an account\? sign up/i));
    
    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByLabelText('Industry')).toBeInTheDocument();
  });

  it('validates matching passwords in signup mode', async () => {
    const mockSignUp = vi.fn();
    useAuthStore.setState({ signUp: mockSignUp });
    
    renderAuthForm();
    fireEvent.click(screen.getByText(/don't have an account\? sign up/i));
    
    // Fill out the form with non-matching passwords
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'password456' },
    });
    
    // Try to submit
    fireEvent.submit(screen.getByRole('form'));
    
    // Check that signUp wasn't called
    expect(mockSignUp).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    });
  });

  it('handles successful login', async () => {
    const mockSignIn = vi.fn().mockResolvedValue(undefined);
    const mockNavigate = vi.fn();
    useAuthStore.setState({ signIn: mockSignIn });
    vi.mock('react-router-dom', async () => ({
      ...await vi.importActual('react-router-dom'),
      useNavigate: () => mockNavigate,
    }));
    
    renderAuthForm();
    
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });
    
    fireEvent.submit(screen.getByRole('form'));
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('displays error messages', () => {
    useAuthStore.setState({
      error: new Error('Invalid credentials'),
    });
    
    renderAuthForm();
    
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });

  it('disables form submission while loading', () => {
    useAuthStore.setState({ isLoading: true });
    
    renderAuthForm();
    
    expect(screen.getByRole('button', { name: /please wait/i })).toBeDisabled();
  });
}); 