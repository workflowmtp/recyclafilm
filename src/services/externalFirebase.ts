import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// External Firebase configuration for cash management
const externalFirebaseConfig = {
  apiKey: "AIzaSyCOU1QKdC9Nkc9xnaMFn1ngdd6wBEwciz4",
  authDomain: "gestion-de-caisse.firebaseapp.com",
  projectId: "gestion-de-caisse",
  storageBucket: "gestion-de-caisse.firebasestorage.app",
  messagingSenderId: "687375906007",
  appId: "1:687375906007:web:d101f8df6321a617a26c92",
  measurementId: "G-ZHH75YZCKF"
};

// Initialize the external Firebase app with a unique name to avoid conflicts
const externalApp = initializeApp(externalFirebaseConfig, "externalCashManagement");
const externalDb = getFirestore(externalApp);

// Constants for the external system
const EXTERNAL_USER_ID = "aOefRQCco0NHjGSZAcKCteZSX7f2";
const EXTERNAL_PROJECT_ID = "WeBcJkjuHvsr8Tc0Wjk2";

/**
 * Creates a cash inflow entry in the external database when a sale is made
 * @param saleAmount - The total amount of the sale
 * @param description - Description of the sale
 */
export const createCashInflowEntry = async (saleAmount: number, description: string) => {
  try {
    const newEntry = {
      date: new Date().toISOString().split('T')[0], // Format as YYYY-MM-DD
      amount: saleAmount,
      source: "sale", // Source is the sale in the recycling system
      description: description,
      projectId: EXTERNAL_PROJECT_ID,
      userId: EXTERNAL_USER_ID,
      createdAt: new Date().toISOString()
    };

    // Add to the cash_inflow collection in the external database
    const docRef = await addDoc(collection(externalDb, 'cash_inflow'), newEntry);
    console.log('Cash inflow entry created with ID:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating cash inflow entry:', error);
    throw error;
  }
};