import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Login } from './Login';
import { Register } from './Register';
import { ForgotPassword } from './ForgotPassword';
import App from '../../App';
import { LogoutButton } from './LogoutButton';

type AuthView = 'login' | 'register' | 'forgotPassword' | 'app';

export const AuthRouter: React.FC = () => {
  const [currentView, setCurrentView] = useState<AuthView>('login');
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, show the app
  if (user) {
    return (
      <>
        <LogoutButton />
        <App />
      </>
    );
  }

  // Otherwise, show authentication views
  switch (currentView) {
    case 'register':
      return (
        <Register onBackToLoginClick={() => setCurrentView('login')} />
      );
    case 'forgotPassword':
      return (
        <ForgotPassword onBackToLoginClick={() => setCurrentView('login')} />
      );
    case 'login':
    default:
      return (
        <Login 
          onRegisterClick={() => setCurrentView('register')} 
          onForgotPasswordClick={() => setCurrentView('forgotPassword')} 
        />
      );
  }
};