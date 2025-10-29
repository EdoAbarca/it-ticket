import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'react-toastify';
import { ticketService } from '../services/api';
import useAuthStore from '../store/authStore';

const CommentSection = ({ ticketId }) => {
  const { token } = useAuthStore();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const data = await ticketService.getComments(ticketId, token);
      setComments(data);
    } catch (error) {
      toast.error(error.message || 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate comment is not empty
    if (!newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    try {
      setSubmitting(true);
      const result = await ticketService.createComment(ticketId, newComment.trim(), token);
      toast.success(result.message || 'Comment added successfully');
      setNewComment('');
      setShowPreview(false);
      // Add the new comment to the list
      setComments([...comments, result.comment]);
    } catch (error) {
      toast.error(error.message || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 sm:p-6 border-t border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Comments ({comments.length})
      </h3>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-3">
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
              Add a comment
            </label>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              {showPreview ? 'Edit' : 'Preview'}
            </button>
          </div>
          
          {!showPreview ? (
            <textarea
              id="comment"
              rows="4"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write your comment here... (Markdown supported)"
              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
              disabled={submitting}
            />
          ) : (
            <div className="prose prose-sm max-w-none p-3 border border-gray-300 rounded-md bg-gray-50 min-h-[100px]">
              {newComment.trim() ? (
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Customize rendering to add security
                    a: ({...props}) => (
                      <a {...props} target="_blank" rel="noopener noreferrer" />
                    ),
                  }}
                >
                  {newComment}
                </ReactMarkdown>
              ) : (
                <p className="text-gray-400 italic">Nothing to preview</p>
              )}
            </div>
          )}
          
          <p className="mt-1 text-xs text-gray-500">
            Supports basic Markdown: **bold**, *italic*, [links](url), lists, and more
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting || !newComment.trim()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Posting...
            </>
          ) : (
            'Post Comment'
          )}
        </button>
      </form>

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <p className="mt-2">No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {comment.user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {comment.user.username}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(comment.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="prose prose-sm max-w-none mt-2">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Customize rendering to add security
                    a: ({...props}) => (
                      <a {...props} target="_blank" rel="noopener noreferrer" />
                    ),
                  }}
                >
                  {comment.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
