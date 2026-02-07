import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'react-toastify';
import CommentSection from './CommentSection';
import { ticketService } from '../services/api';
import useAuthStore from '../store/authStore';

// Mock dependencies
vi.mock('react-toastify');
vi.mock('../services/api');
vi.mock('../store/authStore');

describe('CommentSection', () => {
  const mockToken = 'test-token';
  const mockComments = [
    {
      id: 1,
      content: 'First comment',
      authorName: 'John Doe',
      createdAt: '2026-02-01T10:00:00Z',
      user: { username: 'johndoe', id: 1 },
    },
    {
      id: 2,
      content: 'Second comment',
      authorName: 'Jane Smith',
      createdAt: '2026-02-02T15:30:00Z',
      user: { username: 'janesmith', id: 2 },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.mockReturnValue({
      token: mockToken,
    });
  });

  it('displays loading state while fetching comments', () => {
    ticketService.getComments.mockReturnValue(new Promise(() => {})); // Never resolves

    render(<CommentSection ticketId={1} />);

    // Check for loading spinner by class name
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders comments after loading', async () => {
    ticketService.getComments.mockResolvedValue(mockComments);

    render(<CommentSection ticketId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Comments (2)')).toBeInTheDocument();
      expect(screen.getByText('First comment')).toBeInTheDocument();
      expect(screen.getByText('Second comment')).toBeInTheDocument();
    });
  });

  it('shows error toast when fetching comments fails', async () => {
    const errorMessage = 'Failed to load comments';
    ticketService.getComments.mockRejectedValue(new Error(errorMessage));

    render(<CommentSection ticketId={1} />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(errorMessage);
    });
  });

  it('allows user to submit a new comment', async () => {
    ticketService.getComments.mockResolvedValue([]);
    const newComment = {
      id: 3,
      content: 'New comment',
      authorName: 'Test User',
      createdAt: '2026-02-07T12:00:00Z',
      user: { username: 'testuser', id: 3 },
    };
    ticketService.createComment.mockResolvedValue({
      message: 'Comment added successfully',
      comment: newComment,
    });

    render(<CommentSection ticketId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Comments (0)')).toBeInTheDocument();
    });

    const textarea = screen.getByLabelText(/add a comment/i);
    const submitButton = screen.getByRole('button', { name: /post comment/i });

    fireEvent.change(textarea, { target: { value: 'New comment' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(ticketService.createComment).toHaveBeenCalledWith(1, 'New comment', mockToken);
      expect(toast.success).toHaveBeenCalledWith('Comment added successfully');
      expect(screen.getByText('Comments (1)')).toBeInTheDocument();
    });
  });

  it('prevents submitting empty comments', async () => {
    ticketService.getComments.mockResolvedValue([]);

    render(<CommentSection ticketId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Comments (0)')).toBeInTheDocument();
    });

    // The button should be disabled when textarea is empty
    const submitButton = screen.getByRole('button', { name: /post comment/i });
    expect(submitButton).toBeDisabled();
  });

  it('toggles between edit and preview mode', async () => {
    ticketService.getComments.mockResolvedValue([]);

    render(<CommentSection ticketId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Comments (0)')).toBeInTheDocument();
    });

    const previewButton = screen.getByRole('button', { name: /preview/i });
    expect(screen.getByLabelText(/add a comment/i)).toBeInTheDocument();

    fireEvent.click(previewButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    });
  });

  it('shows error toast when comment submission fails', async () => {
    ticketService.getComments.mockResolvedValue([]);
    ticketService.createComment.mockRejectedValue(new Error('Failed to add comment'));

    render(<CommentSection ticketId={1} />);

    await waitFor(() => {
      expect(screen.getByText('Comments (0)')).toBeInTheDocument();
    });

    const textarea = screen.getByLabelText(/add a comment/i);
    const submitButton = screen.getByRole('button', { name: /post comment/i });

    fireEvent.change(textarea, { target: { value: 'Test comment' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to add comment');
    });
  });
});
