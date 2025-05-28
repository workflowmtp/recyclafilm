import { useState, useEffect } from 'react';
import { Package, Plus, LogOut, LayoutDashboard, ShoppingBag } from 'lucide-react';
import type { Stock, Transaction, Product } from '../types';
import { db, auth } from '../firebase';
import { collection, addDoc, getDocs, query, doc, getDoc, setDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { AdminProductsList } from './AdminProductsList';
import { StockHistoryTable } from './StockHistoryTable';
import { ProductHistoryTable } from './ProductHistoryTable';
import { AdminPriceManager } from './AdminPriceManager';

interface AdminDashboardProps {
  stock: Stock;
  setStock: (stock: Stock) => void;
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
}

export function AdminDashboard({ stock, setStock, transactions, setTransactions }: AdminDashboardProps) {
  // Stocker les valeurs originales pour pouvoir les utiliser lors de l'ajout
  const [originalValues, setOriginalValues] = useState({
    rawMaterial: {
      virgin: 0,
      colored: 0
    },
    inProcess: {
      virgin: 0,
      colored: 0
    },
    outsourcing: {
      virgin: 0,
      colored: 0
    },
    finished: {
      virgin: 0,
      colored: 0
    }
  });

  // Stocker les valeurs à ajouter
  const [stockValues, setStockValues] = useState({
    rawMaterial: {
      virgin: stock.rawMaterial.virgin,
      colored: stock.rawMaterial.colored
    },
    inProcess: {
      virgin: stock.inProcess.virgin,
      colored: stock.inProcess.colored
    },
    outsourcing: {
      virgin: stock.outsourcing.virgin,
      colored: stock.outsourcing.colored
    },
    finished: {
      virgin: stock.finished.virgin,
      colored: stock.finished.colored
    }
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [editingSections, setEditingSections] = useState({
    rawMaterial: false,
    inProcess: false,
    outsourcing: false,
    finished: false
  });
  const [activeTab, setActiveTab] = useState('stocks');
  const [activeHistorySection, setActiveHistorySection] = useState<'rawMaterial' | 'inProcess' | 'outsourcing' | 'finished'>('rawMaterial');
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    loadStockData();
    loadProducts();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.reload(); // Reload the page to reset the app state
    } catch (error) {
      console.error('Error logging out:', error);
      alert('Failed to log out. Please try again.');
    }
  };

  const loadStockData = async () => {
    try {
      const collections = {
        rawMaterial: 'rawMaterialStock',
        inProcess: 'inProcessStock',
        outsourcing: 'outsourcingStock',
        finished: 'finishedProductsStock'
      };

      const newStock = { ...stock };

      for (const [section, collectionName] of Object.entries(collections)) {
        const stockRef = doc(db, collectionName, 'current');
        const stockDoc = await getDoc(stockRef);
        
        if (!stockDoc.exists()) {
          // Initialize if no data exists
          await setDoc(stockRef, {
            virgin: 0,
            colored: 0,
            updatedAt: serverTimestamp()
          });
          
          newStock[section as keyof Stock] = {
            virgin: 0,
            colored: 0
          };
        } else {
          const data = stockDoc.data();
          newStock[section as keyof Stock] = {
            virgin: data.virgin || 0,
            colored: data.colored || 0
          };
        }
      }

      setStock(newStock);
      setOriginalValues(newStock);
      // Initialiser les valeurs à ajouter à 0
      setStockValues({
        rawMaterial: { virgin: 0, colored: 0 },
        inProcess: { virgin: 0, colored: 0 },
        outsourcing: { virgin: 0, colored: 0 },
        finished: { virgin: 0, colored: 0 }
      });
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading stock data:', error);
      setIsLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const productsQuery = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
      const productsSnapshot = await getDocs(productsQuery);
      
      const loadedProducts = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as unknown as Product[];
      
      setProducts(loadedProducts);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading products:', error);
      setIsLoading(false);
    }
  };

  const handleUpdateSection = async (section: keyof Stock) => {
    // Vérifier si les valeurs à ajouter sont valides
    if (stockValues[section].virgin < 0 || stockValues[section].colored < 0) {
      alert('Les quantités à ajouter ne peuvent pas être négatives.');
      return;
    }
    
    // Calculer les nouvelles valeurs en ajoutant les quantités saisies aux quantités existantes
    const newVirginValue = originalValues[section].virgin + stockValues[section].virgin;
    const newColoredValue = originalValues[section].colored + stockValues[section].colored;
    try {
      const collections = {
        rawMaterial: 'rawMaterialStock',
        inProcess: 'inProcessStock',
        outsourcing: 'outsourcingStock',
        finished: 'finishedProductsStock'
      };

      const collectionName = collections[section];
      
      // Update current stock document avec les nouvelles valeurs (originales + ajoutées)
      const stockRef = doc(db, collectionName, 'current');
      await setDoc(stockRef, {
        virgin: newVirginValue,
        colored: newColoredValue,
        updatedAt: serverTimestamp()
      });

      // Add to history
      await addDoc(collection(db, collectionName), {
        virgin: newVirginValue,
        colored: newColoredValue,
        timestamp: serverTimestamp(),
        type: 'update',
        added: {
          virgin: stockValues[section].virgin,
          colored: stockValues[section].colored
        }
      });

      // Mettre à jour le stock avec les nouvelles valeurs
      const newStock = { ...stock };
      newStock[section] = {
        virgin: newVirginValue,
        colored: newColoredValue
      };
      setStock(newStock);
      setOriginalValues(newStock);
      
      // Réinitialiser les valeurs à ajouter
      setStockValues(prev => ({
        ...prev,
        [section]: {
          virgin: 0,
          colored: 0
        }
      }));

      setEditingSections(prev => ({ ...prev, [section]: false }));
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Failed to update stock. Please try again.');
    }
  };

  const renderSection = (
    section: keyof Stock,
    title: string,
    bgColor: string,
    textColor: string,
    borderColor: string
  ) => {
    const isEditing = editingSections[section];
    
    return (
      <div className={`bg-${bgColor}-50 rounded-lg p-4`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold text-${textColor}-700`}>{title}</h3>
          <div className="flex items-center space-x-2">
            <Package className={`text-${textColor}-600`} />
            <button
              onClick={() => setEditingSections(prev => ({ ...prev, [section]: !prev[section] }))}
              className={`px-2 py-1 text-sm font-medium text-${textColor}-600 hover:text-${textColor}-700`}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantité actuelle de Virgin PE Film</label>
                <div className="text-lg font-semibold">{originalValues[section].virgin} kg</div>
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantité de Virgin PE Film à ajouter (kg)</label>
              <input
                type="number"
                min="0"
                value={stockValues[section].virgin}
                onChange={(e) => setStockValues(prev => ({
                  ...prev,
                  [section]: {
                    ...prev[section],
                    virgin: Number(e.target.value)
                  }
                }))}
                className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${borderColor}-500 focus:border-${borderColor}-500`}
              />
            </div>
            <div>
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantité actuelle de Colored PE Film</label>
                <div className="text-lg font-semibold">{originalValues[section].colored} kg</div>
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantité de Colored PE Film à ajouter (kg)</label>
              <input
                type="number"
                min="0"
                value={stockValues[section].colored}
                onChange={(e) => setStockValues(prev => ({
                  ...prev,
                  [section]: {
                    ...prev[section],
                    colored: Number(e.target.value)
                  }
                }))}
                className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-${borderColor}-500 focus:border-${borderColor}-500`}
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => handleUpdateSection(section)}
                className={`flex items-center px-4 py-2 text-sm font-medium text-white bg-${textColor}-600 rounded-md hover:bg-${textColor}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${textColor}-500`}
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter à {title}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Virgin Films</div>
              <div className={`text-2xl font-bold text-${textColor}-700`}>{stock[section].virgin} kg</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Colored Films</div>
              <div className={`text-2xl font-bold text-${textColor}-700`}>{stock[section].colored} kg</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Tableau de Bord Administrateur</h2>
          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </button>
        </div>
        
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('stocks')}
              className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stocks'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <LayoutDashboard className="w-5 h-5 mr-2" />
                Gestion des Stocks
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('prices')}
              className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'prices'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <ShoppingBag className="w-5 h-5 mr-2" />
                Gestion des Prix
              </div>
            </button>
            <button
              onClick={() => setActiveTab('stockHistory')}
              className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stockHistory'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <LayoutDashboard className="w-5 h-5 mr-2" />
                Historique des Stocks
              </div>
            </button>
            <button
              onClick={() => setActiveTab('productHistory')}
              className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'productHistory'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <LayoutDashboard className="w-5 h-5 mr-2" />
                Historique des Produits
              </div>
            </button>
          </nav>
        </div>
        
        {activeTab === 'stocks' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderSection('rawMaterial', 'Matière Première', 'green', 'green', 'green')}
            {renderSection('inProcess', 'En Production', 'blue', 'blue', 'blue')}
            {renderSection('outsourcing', 'Sous-traitance', 'amber', 'amber', 'amber')}
            {renderSection('finished', 'Produits Finis', 'purple', 'purple', 'purple')}
          </div>
        )}
        
        {activeTab === 'prices' && (
          <AdminPriceManager products={products} setProducts={setProducts} />
        )}
        
        {activeTab === 'stockHistory' && (
          <div>
            <div className="flex items-center space-x-4 mb-6">
              <button
                onClick={() => setActiveHistorySection('rawMaterial')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${activeHistorySection === 'rawMaterial' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:text-gray-800'}`}
              >
                Matière Première
              </button>
              <button
                onClick={() => setActiveHistorySection('inProcess')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${activeHistorySection === 'inProcess' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800'}`}
              >
                En Production
              </button>
              <button
                onClick={() => setActiveHistorySection('outsourcing')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${activeHistorySection === 'outsourcing' ? 'bg-amber-100 text-amber-700' : 'text-gray-600 hover:text-gray-800'}`}
              >
                Sous-traitance
              </button>
              <button
                onClick={() => setActiveHistorySection('finished')}
                className={`px-4 py-2 text-sm font-medium rounded-md ${activeHistorySection === 'finished' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:text-gray-800'}`}
              >
                Produits Finis
              </button>
            </div>
            <StockHistoryTable section={activeHistorySection} />
          </div>
        )}
        
        {activeTab === 'productHistory' && (
          <ProductHistoryTable />
        )}
      </div>
    </div>
  );
}