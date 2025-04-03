import { useState } from 'react';
import { Recycle, Mail, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface ForgotPasswordProps {
  onBackToLoginClick: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBackToLoginClick }) => {
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { sendPasswordReset } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setErrorMessage('Please enter your email address');
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage(null);
    
    try {
      await sendPasswordReset(email);
      setSuccessMessage('Password reset email sent. Please check your inbox.');
      setEmail('');
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('user-not-found')) {
          setErrorMessage('No account exists with this email address');
        } else if (error.message.includes('invalid-email')) {
          setErrorMessage('Please enter a valid email address');
        } else {
          setErrorMessage(error.message);
        }
      } else {
        setErrorMessage('Failed to send password reset email. Please try again');
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
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password
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
                className="appearance-none rounded-md relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Sending...' : 'Send reset link'}
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