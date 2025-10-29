import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import { adminTicketService, API_BASE_URL } from '../services/api';

const AdminTicketDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { token } = useAuthStore();
  const [ticket, setTicket] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

  const fetchTicket = async () => {
    try {
      const data = await adminTicketService.getTicketById(id, token);
      setTicket(data);
      setSelectedStatus(data.status);
      
      // Fetch status history
      const historyData = await adminTicketService.getTicketStatusHistory(id, token);
      setStatusHistory(historyData.history);
    } catch (error) {
      if (error.message.includes('Admin access required') || error.message.includes('Access denied')) {
        toast.error('Admin access required');
        navigate('/dashboard');
      } else {
        toast.error('Failed to load ticket');
        navigate('/admin/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    
    if (selectedStatus === ticket.status) {
      toast.info('Status unchanged');
      return;
    }

    setUpdatingStatus(true);
    try {
      await adminTicketService.updateTicketStatus(id, selectedStatus, token);
      toast.success('Ticket status updated successfully');
      await fetchTicket(); // Refresh ticket and history
    } catch (error) {
      toast.error(error.message || 'Failed to update ticket status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-purple-100 text-purple-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900">Ticket not found</h3>
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="mt-4 text-indigo-600 hover:text-indigo-700"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="text-gray-600 hover:text-gray-900 mr-4"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-gray-900">Ticket Details (Admin)</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Ticket Info */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {ticket.title}
                  </h3>
                  <div className="mt-2 flex items-center space-x-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}
                    >
                      {ticket.priority}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}
                    >
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Description</dt>
                      <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{ticket.description}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Created by</dt>
                      <dd className="mt-1 text-sm text-gray-900">{ticket.user.username}</dd>
                      <dd className="mt-1 text-sm text-gray-500">{ticket.user.email}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Created at</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatDate(ticket.createdAt)}</dd>
                    </div>
                    <div className="sm:col-span-1">
                      <dt className="text-sm font-medium text-gray-500">Last updated</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatDate(ticket.updatedAt)}</dd>
                    </div>
                    {ticket.imageUrl && (
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500 mb-2">Attachment</dt>
                        <dd className="mt-1">
                          <img
                            src={`${API_BASE_URL}${ticket.imageUrl}`}
                            alt="Ticket attachment"
                            className="max-w-full h-auto rounded-lg shadow-lg"
                          />
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </div>

            {/* Status Update Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Update Status
                  </h3>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                  <form onSubmit={handleStatusUpdate}>
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                        New Status
                      </label>
                      <select
                        id="status"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={updatingStatus || selectedStatus === ticket.status}
                      className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatingStatus ? 'Updating...' : 'Update Status'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Status History */}
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Status History
                  </h3>
                </div>
                <div className="border-t border-gray-200">
                  {statusHistory.length === 0 ? (
                    <div className="px-4 py-5 sm:px-6 text-sm text-gray-500">
                      No status changes yet
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {statusHistory.map((history) => (
                        <li key={history.id} className="px-4 py-4 sm:px-6">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(history.oldStatus)}`}
                                >
                                  {history.oldStatus.replace('_', ' ')}
                                </span>
                                {' → '}
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(history.newStatus)}`}
                                >
                                  {history.newStatus.replace('_', ' ')}
                                </span>
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                by {history.changedBy.username}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                {formatDate(history.createdAt)}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminTicketDetail;
