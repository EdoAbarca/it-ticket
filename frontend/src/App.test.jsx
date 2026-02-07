import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import useAuthStore from './store/authStore';

// Mock the auth store
vi.mock('./store/authStore');

// Mock all page components
vi.mock('./pages/Register', () => ({ default: () => <div>Register Page</div> }));
vi.mock('./pages/Login', () => ({ default: () => <div>Login Page</div> }));
vi.mock('./pages/ForgotPassword', () => ({ default: () => <div>Forgot Password Page</div> }));
vi.mock('./pages/ResetPassword', () => ({ default: () => <div>Reset Password Page</div> }));
vi.mock('./pages/Dashboard', () => ({ default: () => <div>Dashboard Page</div> }));
vi.mock('./pages/CreateTicket', () => ({ default: () => <div>Create Ticket Page</div> }));
vi.mock('./pages/TicketDetail', () => ({ default: () => <div>Ticket Detail Page</div> }));
vi.mock('./pages/AdminDashboard', () => ({ default: () => <div>Admin Dashboard Page</div> }));
vi.mock('./pages/AdminTicketDetail', () => ({ default: () => <div>Admin Ticket Detail Page</div> }));

// Mock react-toastify
vi.mock('react-toastify', () => ({
  ToastContainer: () => <div>Toast Container</div>,
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('App', () => {
  const mockInitAuth = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.mockReturnValue({
      initAuth: mockInitAuth,
      isAuthenticated: false,
    });
  });

  it('renders without crashing', () => {
    render(<App />);
    expect(mockInitAuth).toHaveBeenCalled();
  });

  it('initializes authentication on mount', () => {
    render(<App />);
    expect(mockInitAuth).toHaveBeenCalledTimes(1);
  });

  it('renders login page on root path redirect', () => {
    window.history.pushState({}, 'Test', '/');
    render(<App />);
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('renders register page when navigating to /register', () => {
    window.history.pushState({}, 'Test', '/register');
    render(<App />);
    expect(screen.getByText('Register Page')).toBeInTheDocument();
  });

  it('renders forgot password page when navigating to /forgot-password', () => {
    window.history.pushState({}, 'Test', '/forgot-password');
    render(<App />);
    expect(screen.getByText('Forgot Password Page')).toBeInTheDocument();
  });

  it('includes ToastContainer for notifications', () => {
    render(<App />);
    expect(screen.getByText('Toast Container')).toBeInTheDocument();
  });
});
