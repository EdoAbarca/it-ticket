import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useAuthStore from '../store/authStore';
import { authService } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      // Call backend logout endpoint
      await authService.logout(token);
      
      // Clear local state
      logout();
      
      // Show success message
      toast.success('Logged out successfully');
      
      // Redirect to login
      navigate('/login');
    } catch {
      // Even if backend call fails, still logout locally
      logout();
      toast.info('Logged out');
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">IT Ticket System</h1>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-4">Welcome, {user?.username}!</span>
              <button
                onClick={handleLogout}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h2>
              <p className="text-gray-600">Your tickets will appear here</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
