import { useState } from 'react';
import { Recycle, Mail, Lock, User, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface RegisterProps {
  onBackToLoginClick: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onBackToLoginClick }) => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const { signup } = useAuth();

  const validateForm = () => {
    if (!displayName.trim()) {
      setErrorMessage('Please enter your name');
      return false;
    }
    
    if (!email.trim()) {
      setErrorMessage('Please enter your email');
      return false;
    }
    
    if (!password) {
      setErrorMessage('Please enter a password');
      return false;
    }
    
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return false;
    }
    
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setErrorMessage(null);
    
    try {
      await signup(email, password, displayName);
      setSuccessMessage('Registration successful. You can now log in.');
      
      // Clear the form
      setDisplayName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      
      // Redirect to login after a delay
      setTimeout(() => {
        onBackToLoginClick();
      }, 3000);
      
    } catch (error) {
      // Firebase auth errors
      if (error instanceof Error) {
        if (error.message.includes('email-already-in-use')) {
          setErrorMessage('An account with this email already exists');
        } else if (error.message.includes('invalid-email')) {
          setErrorMessage('Please enter a valid email address');
        } else if (error.message.includes('weak-password')) {
          setErrorMessage('Password is too weak. Please use a stronger password');
        } else {
          setErrorMessage(error.message);
        }
      } else {
        setErrorMessage('Failed to register. Please try again');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <Recycle size={48} className="text-green-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create an account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join PE Recycling Management
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {errorMessage && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded relative" role="alert">
              <div className="flex">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>{errorMessage}</span>
              </div>
            </div>
          )}
          
          {successMessage && (
            <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded relative" role="alert">
              <span>{successMessage}</span>
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="display-name" className="sr-only">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="display-name"
                  name="displayName"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  placeholder="Full Name"
                />
              </div>
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
              </div>
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm Password"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
        
        <div className="text-center">
          <button
            type="button"
            onClick={onBackToLoginClick}
            className="inline-flex items-center font-medium text-green-600 hover:text-green-500"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};