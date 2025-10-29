import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import { ticketService, API_BASE_URL } from '../services/api';
import CommentSection from '../components/CommentSection';

const TicketDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { token } = useAuthStore();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTicket = async () => {
      setLoading(true);
      try {
        const data = await ticketService.getTicket(id, token);
        if (!data) {
          toast.error('Ticket not found or access denied');
          navigate('/dashboard');
          return;
        }
        setTicket(data);
      } catch {
        toast.error('Failed to load ticket details');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [id, token, navigate]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'IN_PROGRESS':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!ticket) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-indigo-600"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                My Tickets
              </button>
            </li>
            <li>
              <div className="flex items-center">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                  Ticket Details
                </span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Ticket Details Card */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {/* Header with Status and Priority */}
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex items-center justify-between flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900 mb-2 sm:mb-0">
                {ticket.title}
              </h1>
              <div className="flex items-center space-x-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(ticket.status)}`}
                >
                  {ticket.status.replace('_', ' ')}
                </span>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(ticket.priority)}`}
                >
                  {ticket.priority}
                </span>
              </div>
            </div>
          </div>

          {/* Ticket Information */}
          <div className="px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              {/* Description */}
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500 mb-2">
                  Description
                </dt>
                <dd className="text-base text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded-md">
                  {ticket.description}
                </dd>
              </div>

              {/* Created Date */}
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(ticket.createdAt)}
                </dd>
              </div>

              {/* Updated Date */}
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(ticket.updatedAt)}
                </dd>
              </div>

              {/* Created By */}
              <div>
                <dt className="text-sm font-medium text-gray-500">Created By</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {ticket.user.username} ({ticket.user.email})
                </dd>
              </div>

              {/* Ticket ID */}
              <div>
                <dt className="text-sm font-medium text-gray-500">Ticket ID</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{ticket.id}</dd>
              </div>

              {/* Attached Image */}
              {ticket.imageUrl && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500 mb-2">
                    Attached Image
                  </dt>
                  <dd className="mt-1">
                    <img
                      src={`${API_BASE_URL}${ticket.imageUrl}`}
                      alt="Ticket attachment"
                      className="max-w-full h-auto rounded-lg shadow-md"
                      style={{ maxHeight: '500px' }}
                    />
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Timeline/History Section */}
          <div className="px-4 py-5 sm:p-6 border-t border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Ticket Timeline
            </h3>
            <div className="flow-root">
              <ul className="-mb-8">
                <li>
                  <div className="relative pb-8">
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center ring-8 ring-white">
                          <svg
                            className="h-5 w-5 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div>
                          <p className="text-sm text-gray-900 font-medium">
                            Ticket Created
                          </p>
                          <p className="mt-0.5 text-sm text-gray-500">
                            {formatDate(ticket.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
                {ticket.updatedAt !== ticket.createdAt && (
                  <li>
                    <div className="relative pb-8">
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                            <svg
                              className="h-5 w-5 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div>
                            <p className="text-sm text-gray-900 font-medium">
                              Ticket Updated
                            </p>
                            <p className="mt-0.5 text-sm text-gray-500">
                              {formatDate(ticket.updatedAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Comment Section */}
          <CommentSection ticketId={id} />

          {/* Action Buttons */}
          <div className="px-4 py-4 sm:px-6 border-t border-gray-200 flex justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Tickets
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
