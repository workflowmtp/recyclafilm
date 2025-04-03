import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  loginUser, 
  registerUser, 
  logoutUser, 
  resetPassword, 
  getCurrentUser,
  onAuthStateChange,
  isUserAdmin
} from '../services/authService';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(getCurrentUser());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (authUser) => {
      setUser(authUser);
      setLoading(false);
      
      // Check admin status if user is logged in
      if (authUser) {
        const adminStatus = await isUserAdmin(authUser.uid);
        setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Sign up
  const signup = async (email: string, password: string, displayName: string) => {
    try {
      setError(null);
      setLoading(true);
      const newUser = await registerUser(email, password, displayName);
      return newUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to register';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign in
  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      await loginUser(email, password);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to login';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const logout = async () => {
    try {
      setError(null);
      await logoutUser();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to logout';
      setError(errorMessage);
      throw err;
    }
  };

  // Reset password
  const sendPasswordReset = async (email: string) => {
    try {
      setError(null);
      setLoading(true);
      await resetPassword(email);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send password reset';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    isAdmin,
    loading,
    error,
    signup,
    login,
    logout,
    sendPasswordReset
  };
};