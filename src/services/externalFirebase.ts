import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

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
const EXTERNAL_PROJECT_ID = "dBa5NepZLDH0bauubmAM";

/**
 * Creates a cash inflow entry in the external database when a sale is made
 * @param saleAmount - The total amount of the sale
 * @param description - Description of the sale
 * @param useExternalDb - Whether to use the external database or the local database
 */
export const createCashInflowEntry = async (amount: number, description: string, useExternalDb: boolean = true) => {
    try {
      // Utiliser la base de données externe ou locale selon le paramètre
      const database = useExternalDb ? externalDb : db;
      const collectionName = useExternalDb ? 'cash_inflow' : 'localCashInflows';
      
      const cashInflowRef = await addDoc(collection(database, collectionName), {
        amount,
        description,
        date: new Date().toISOString().split('T')[0],
        source: "granule",
        // Ajouter des informations supplémentaires pour la base externe
        ...(useExternalDb ? {
          userId: EXTERNAL_USER_ID,
          projectId: EXTERNAL_PROJECT_ID
        } : {})
      });
      
      return cashInflowRef; // Retourne la référence du document
    } catch (error) {
      console.error('Erreur lors de la création de l\'entrée de flux de trésorerie:', error);
      throw error;
    }
  };