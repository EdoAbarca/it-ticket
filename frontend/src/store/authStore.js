import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  // Initialize from localStorage
  initAuth: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      try {
        set({
          token,
          user: JSON.parse(user),
          isAuthenticated: true,
        });
      } catch {
        // If parsing fails, clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  },

  // Login
  login: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({
      token,
      user,
      isAuthenticated: true,
    });
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({
      token: null,
      user: null,
      isAuthenticated: false,
    });
  },
}));

export default useAuthStore;
