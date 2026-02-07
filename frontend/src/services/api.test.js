import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authService, ticketService, API_BASE_URL } from './api';

// Mock global fetch
global.fetch = vi.fn();

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('register', () => {
    it('successfully registers a new user', async () => {
      const mockResponse = {
        message: 'Registration successful',
        user: { id: 1, email: 'test@example.com', username: 'testuser' },
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await authService.register('testuser', 'test@example.com', 'password123');

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/auth/register`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('throws error when registration fails', async () => {
      const errorMessage = 'Email already exists';
      global.fetch.mockResolvedValue({
        ok: false,
        json: async () => ({ message: errorMessage }),
      });

      await expect(
        authService.register('testuser', 'test@example.com', 'password123')
      ).rejects.toThrow(errorMessage);
    });
  });

  describe('login', () => {
    it('successfully logs in a user', async () => {
      const mockResponse = {
        accessToken: 'token-123',
        user: { id: 1, email: 'test@example.com' },
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await authService.login('test@example.com', 'password123');

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/auth/login`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('throws error when login fails', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'Invalid credentials' }),
      });

      await expect(
        authService.login('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('successfully logs out a user', async () => {
      const mockResponse = { message: 'Logout successful' };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await authService.logout('token-123');

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/auth/logout`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer token-123',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });
});

describe('ticketService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTickets', () => {
    it('fetches tickets successfully', async () => {
      const mockTickets = {
        tickets: [
          { id: 1, title: 'Test Ticket', status: 'OPEN' },
          { id: 2, title: 'Another Ticket', status: 'IN_PROGRESS' },
        ],
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockTickets,
      });

      const result = await ticketService.getTickets('token-123');

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/tickets`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer token-123',
          }),
        })
      );
      expect(result).toEqual(mockTickets);
    });
  });

  describe('getComments', () => {
    it('fetches comments for a ticket', async () => {
      const mockComments = [
        { id: 1, content: 'First comment', authorName: 'User1' },
        { id: 2, content: 'Second comment', authorName: 'User2' },
      ];

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockComments,
      });

      const result = await ticketService.getComments(1, 'token-123');

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/tickets/1/comments`,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer token-123',
          }),
        })
      );
      expect(result).toEqual(mockComments);
    });
  });

  describe('createComment', () => {
    it('creates a new comment on a ticket', async () => {
      const mockResponse = {
        message: 'Comment added',
        comment: { id: 3, content: 'New comment' },
      };

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await ticketService.createComment(1, 'New comment', 'token-123');

      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/tickets/1/comments`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ content: 'New comment' }),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
