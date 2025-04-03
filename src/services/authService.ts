import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged,
    User,
    updateProfile
  } from 'firebase/auth';
  import { setDoc, doc, getDoc } from 'firebase/firestore';
  import { auth, db } from '../firebase';
  
  // Register a new user
  export const registerUser = async (
    email: string, 
    password: string, 
    displayName: string
  ): Promise<User> => {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update profile with display name
      await updateProfile(user, { displayName });
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email,
        displayName,
        role: 'user', // Default role
        createdAt: new Date()
      });
      
      return user;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  };
  
  // Login with email and password
  export const loginUser = async (email: string, password: string) => {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  };
  
  // Logout
  export const logoutUser = async () => {
    try {
      return await signOut(auth);
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  };
  
  // Reset password
  export const resetPassword = async (email: string) => {
    try {
      return await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  };
  
  // Get current authenticated user
  export const getCurrentUser = (): User | null => {
    return auth.currentUser;
  };
  
  // Check if user has admin role
  export const isUserAdmin = async (userId: string): Promise<boolean> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.role === 'admin';
      }
      return false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };
  
  // Auth state observer hook setup
  export const onAuthStateChange = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
  };