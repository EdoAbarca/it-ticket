import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import useAuthStore from './authStore';

describe('authStore', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('initializes with null values when localStorage is empty', () => {
    const { user, token, isAuthenticated } = useAuthStore.getState();

    expect(user).toBeNull();
    expect(token).toBeNull();
    expect(isAuthenticated).toBe(false);
  });

  it('can login and store user data', () => {
    const mockToken = 'test-token-123';
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
    };

    const { login } = useAuthStore.getState();
    login(mockToken, mockUser);

    const state = useAuthStore.getState();
    expect(state.token).toBe(mockToken);
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
    expect(localStorage.getItem('token')).toBe(mockToken);
    expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
  });

  it('can logout and clear user data', () => {
    const mockToken = 'test-token-123';
    const mockUser = { id: 1, email: 'test@example.com' };

    const { login, logout } = useAuthStore.getState();
    
    // First login
    login(mockToken, mockUser);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    // Then logout
    logout();
    
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('initializes auth from localStorage on initAuth', () => {
    const mockToken = 'stored-token';
    const mockUser = { id: 2, email: 'stored@example.com' };

    // Simulate stored data
    localStorage.setItem('token', mockToken);
    localStorage.setItem('user', JSON.stringify(mockUser));

    const { initAuth } = useAuthStore.getState();
    initAuth();

    const state = useAuthStore.getState();
    expect(state.token).toBe(mockToken);
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
  });

  it('clears invalid data when initAuth fails to parse user', () => {
    // First, ensure the store is clean
    const { logout } = useAuthStore.getState();
    logout();

    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', 'invalid-json{');

    const { initAuth } = useAuthStore.getState();
    initAuth();

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});
