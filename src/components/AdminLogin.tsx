import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { AuthLayout } from './AuthLayout';
import { ShieldCheck } from 'lucide-react';

export function AdminLogin({ onLogin, onSwitchToRegister }: { onLogin: () => void; onSwitchToRegister: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    let retries = 3;
    let delay = 1000; // Initial delay of 1 second

    while (retries > 0) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Check if user exists and is an admin
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        const userData = userDoc.data();
        
        if (!userData || userData.role !== 'admin') {
          // If not an admin, sign out and show error
          await auth.signOut();
          setError('Access denied. Admin privileges required.');
          setIsLoading(false);
          return;
        }
        
        onLogin();
        return; // Login successful, exit the loop
      } catch (err: any) {
        console.error('Login error:', err);
        if (err.code === 'auth/network-request-failed' && retries > 1) {
          setError(`Network error. Retrying... (${retries - 1} retries remaining)`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
          retries--;
          continue;
        }
        
        if (err.code === 'auth/invalid-credential') {
          setError('Invalid email or password');
        } else if (err.code === 'auth/network-request-failed') {
          setError('Network error. Please check your connection and try again.');
        } else {
          setError(err.message || 'Failed to sign in');
        }
        break;
      }
    }

    setIsLoading(false);
  };

  return (
    <AuthLayout title="Admin Sign In">
      <div className="flex justify-center mb-6">
        <ShieldCheck className="h-12 w-12 text-green-600" />
      </div>
      
      <div className="text-center mb-6">
        <p className="text-sm text-gray-600">
          This area is restricted to administrators only.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Admin Email
          </label>
          <div className="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <div className="mt-1">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
              disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Signing in...
              </div>
            ) : (
              'Sign in as Administrator'
            )}
          </button>
        </div>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Need an admin account?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="font-medium text-green-600 hover:text-green-500"
              disabled={isLoading}
            >
              Register here
            </button>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}