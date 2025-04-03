import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const LogoutButton: React.FC = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      // Auth state change will handle redirects
    } catch (error) {
      console.error('Error logging out:', error);
      setIsLoggingOut(false);
    }
  };

  if (!user) return null;

  return (
    <div className="absolute top-4 right-4 z-50">
      <div className="flex items-center">
        <span className="text-white mr-2 hidden sm:inline-block">
          {user.displayName || user.email}
        </span>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md"
        >
          <LogOut size={16} className="mr-1" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};