import React, { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { Recycle, Package, TrendingUp, Factory, Truck, Plus, Timer, X, ShoppingCart, FileText } from 'lucide-react';
import type { Transaction, Stock, RecyclingProcess, Product, Sale } from './types';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { Dashboard } from './components/Dashboard';
import { Header } from './components/Layout/Header';
import { LoadingSpinner } from './components/Layout/LoadingSpinner';
import { ProductSheetModal } from './components/Dashboard/ProductSheetModal';
import { auth, db } from './firebase';
import { collection, query, where, getDocs, addDoc, doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { createCashInflowEntry } from './services/externalFirebase';
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentView, setCurrentView] = useState<'login' | 'register' | 'adminLogin'>('login');
  const [activeTab, setActiveTab] = useState<string>('transactions');
  const [showNewProcessModal, setShowNewProcessModal] = useState(false);
  const [showNewOutsourcingModal, setShowNewOutsourcingModal] = useState(false);
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [showProductSheetModal, setShowProductSheetModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [newProcess, setNewProcess] = useState({
    filmType: 'virgin',
    inputQuantity: 0,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    expectedDays: 3
  });

  const [newOutsourcing, setNewOutsourcing] = useState({
    filmType: 'virgin',
    inputQuantity: 0,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    expectedDays: 3,
    outsourcingPartner: ''
  });

  const [newSale, setNewSale] = useState({
    productId: '1',
    quantity: 0,
    date: format(new Date(), 'yyyy-MM-dd')
  });
  
  const [stock, setStock] = useState<Stock>({
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

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [processes, setProcesses] = useState<RecyclingProcess[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
    }
  }, [isAuthenticated]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      setIsAdmin(false);
      setCurrentView('login');
    } catch (error) {
      console.error('Error logging out:', error);
      alert('Failed to log out. Please try again.');
    }
  };

  const loadInitialData = async () => {
    try {
      setIsLoading(true);

      // Chargement des stocks directement depuis les collections Firestore
      const collections = {
        rawMaterial: 'rawMaterialStock',
        inProcess: 'inProcessStock',
        outsourcing: 'outsourcingStock',
        finished: 'finishedProductsStock'
      };

      const newStock = {
        rawMaterial: { virgin: 0, colored: 0 },
        inProcess: { virgin: 0, colored: 0 },
        outsourcing: { virgin: 0, colored: 0 },
        finished: { virgin: 0, colored: 0 }
      };

      for (const [section, collectionName] of Object.entries(collections)) {
        const stockRef = doc(db, collectionName, 'current');
        const stockDoc = await getDoc(stockRef);
        
        if (stockDoc.exists()) {
          const data = stockDoc.data();
          newStock[section as keyof Stock] = {
            virgin: data.virgin || 0,
            colored: data.colored || 0
          };
        }
      }

      // Load transactions
      const transactionsQuery = query(collection(db, 'transactions'));
      const transactionsSnapshot = await getDocs(transactionsQuery);
      const loadedTransactions: Transaction[] = [];

      transactionsSnapshot.forEach((doc) => {
        const data = doc.data();
        const transaction: Transaction = {
          id: doc.id,
          date: data.date.toDate(),
          type: data.type,
          quantity: data.quantity,
          description: data.description,
          filmType: data.filmType,
          fromSection: data.fromSection,
          toSection: data.toSection,
          processId: data.processId
        };
        loadedTransactions.push(transaction);
      });

      // Load processes
      const processesQuery = query(collection(db, 'processes'));
      const processesSnapshot = await getDocs(processesQuery);
      const loadedProcesses: RecyclingProcess[] = processesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate.toDate(),
        expectedCompletion: doc.data().expectedCompletion.toDate()
      })) as RecyclingProcess[];

      // Load products
      const productsQuery = query(collection(db, 'products'));
      const productsSnapshot = await getDocs(productsQuery);
      const loadedProducts: Product[] = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate.toDate()
      })) as Product[];

      // Load sales
      const salesQuery = query(collection(db, 'sales'));
      const salesSnapshot = await getDocs(salesQuery);
      const loadedSales: Sale[] = salesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate()
      })) as Sale[];

      // Sort transactions by date
      loadedTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());

      setTransactions(loadedTransactions);
      setProcesses(loadedProcesses);
      setProducts(loadedProducts);
      setSales(loadedSales);
      setStock(newStock);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading initial data:', error);
      setIsLoading(false);
    }
  };
  const handleNewSaleFromDashboard = (sale: Sale, updatedProduct: Product, stockUpdate: any) => {
    console.log('handleNewSaleFromDashboard called with:', { sale, updatedProduct, stockUpdate });
    
    // Update sales
    setSales([...sales, sale]);
    
    // Update products
    setProducts(
      products.map(p => p.id === updatedProduct.id ? updatedProduct : p)
    );
    
    // Update stock
    setStock(prevStock => ({
      ...prevStock,
      finished: {
        ...prevStock.finished,
        ...stockUpdate.finished
      }
    }));
  };
  const handleNewProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const startDate = new Date(newProcess.startDate);
      const expectedCompletion = addDays(startDate, newProcess.expectedDays);
      const filmType = newProcess.filmType as 'virgin' | 'colored';
      const inputQuantity = Number(newProcess.inputQuantity);
      
      // Vérifier si le stock disponible est suffisant
      if (inputQuantity > stock.rawMaterial[filmType]) {
        alert(`Insufficient ${filmType} film stock. Available: ${stock.rawMaterial[filmType]} kg`);
        return;
      }
      
      // Mettre à jour le stock de matières premières dans Firebase
      const rawMaterialStockRef = doc(db, 'rawMaterialStock', 'current');
      const rawMaterialStockDoc = await getDoc(rawMaterialStockRef);
      
      if (!rawMaterialStockDoc.exists()) {
        throw new Error('Raw material stock document not found');
      }
      
      const currentRawStock = rawMaterialStockDoc.data();
      
      // Vérifier à nouveau avec les données les plus récentes
      if (currentRawStock[filmType] < inputQuantity) {
        alert(`Insufficient ${filmType} film stock. Available: ${currentRawStock[filmType]} kg`);
        return;
      }
      
      // Mettre à jour le document current de rawMaterialStock
      await setDoc(rawMaterialStockRef, {
        ...currentRawStock,
        [filmType]: currentRawStock[filmType] - inputQuantity,
        updatedAt: serverTimestamp()
      });
      
      // Ajouter à l'historique
      await addDoc(collection(db, 'rawMaterialStock'), {
        virgin: filmType === 'virgin' ? -inputQuantity : 0,
        colored: filmType === 'colored' ? -inputQuantity : 0,
        timestamp: serverTimestamp(),
        type: 'decrement',
        description: 'Stock used for processing'
      });
      
      // Mettre à jour le document current de inProcessStock
      const inProcessStockRef = doc(db, 'inProcessStock', 'current');
      const inProcessStockDoc = await getDoc(inProcessStockRef);
      
      let currentInProcessStock = { virgin: 0, colored: 0 };
      if (inProcessStockDoc.exists()) {
        currentInProcessStock = inProcessStockDoc.data();
      }
      
      await setDoc(inProcessStockRef, {
        ...currentInProcessStock,
        [filmType]: (currentInProcessStock[filmType] || 0) + inputQuantity,
        updatedAt: serverTimestamp()
      });
      
      // Ajouter à l'historique
      await addDoc(collection(db, 'inProcessStock'), {
        virgin: filmType === 'virgin' ? inputQuantity : 0,
        colored: filmType === 'colored' ? inputQuantity : 0,
        timestamp: serverTimestamp(),
        type: 'increment',
        description: 'Stock added for processing'
      });
      
      // Créer un nouveau processus
      const processData = {
        startDate,
        inputQuantity,
        status: 'processing',
        outsourced: false,
        filmType,
        cycleNumber: `RC-2025-${String(processes.length + 1).padStart(3, '0')}`,
        expectedCompletion,
        yieldRate: filmType === 'virgin' ? 95 : 92,
        createdAt: new Date(),
        source: 'rawMaterial'
      };

      // Ajouter le processus à Firebase
      const docRef = await addDoc(collection(db, 'processes'), processData);

      // Créer une transaction
      await addDoc(collection(db, 'transactions'), {
        date: new Date(),
        type: 'transfer',
        quantity: inputQuantity,
        description: `Transfer from Raw Material to In Process`,
        filmType,
        fromSection: 'rawMaterial',
        toSection: 'inProcess',
        processId: docRef.id
      });

      // Mettre à jour l'état local
      const processWithId: RecyclingProcess = {
        ...processData,
        id: docRef.id,
        outsourcingPartner: null,
        filmType
      };
      
      setProcesses([...processes, processWithId]);

      // Mettre à jour le stock local
      setStock(prevStock => ({
        ...prevStock,
        rawMaterial: {
          ...prevStock.rawMaterial,
          [filmType]: prevStock.rawMaterial[filmType] - inputQuantity
        },
        inProcess: {
          ...prevStock.inProcess,
          [filmType]: prevStock.inProcess[filmType] + inputQuantity
        }
      }));

      // Réinitialiser le formulaire
      setNewProcess({
        filmType: 'virgin',
        inputQuantity: 0,
        startDate: format(new Date(), 'yyyy-MM-dd'),
        expectedDays: 3
      });
      
      setShowNewProcessModal(false);
    } catch (error) {
      console.error('Error creating new process:', error);
      alert('Failed to create new process. Please try again.');
    }
  };

  const handleNewOutsourcing = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const startDate = new Date(newOutsourcing.startDate);
      const expectedCompletion = addDays(startDate, newOutsourcing.expectedDays);
      const filmType = newOutsourcing.filmType as 'virgin' | 'colored';
      const inputQuantity = Number(newOutsourcing.inputQuantity);
      
      // Vérifier si le stock disponible est suffisant
      if (inputQuantity > stock.rawMaterial[filmType]) {
        alert(`Insufficient ${filmType} film stock. Available: ${stock.rawMaterial[filmType]} kg`);
        return;
      }
      
      // Mettre à jour le stock de matières premières dans Firebase
      const rawMaterialStockRef = doc(db, 'rawMaterialStock', 'current');
      const rawMaterialStockDoc = await getDoc(rawMaterialStockRef);
      
      if (!rawMaterialStockDoc.exists()) {
        throw new Error('Raw material stock document not found');
      }
      
      const currentRawStock = rawMaterialStockDoc.data();
      
      // Vérifier à nouveau avec les données les plus récentes
      if (currentRawStock[filmType] < inputQuantity) {
        alert(`Insufficient ${filmType} film stock. Available: ${currentRawStock[filmType]} kg`);
        return;
      }
      
      // Mettre à jour le document current de rawMaterialStock
      await setDoc(rawMaterialStockRef, {
        ...currentRawStock,
        [filmType]: currentRawStock[filmType] - inputQuantity,
        updatedAt: serverTimestamp()
      });
      
      // Ajouter à l'historique
      await addDoc(collection(db, 'rawMaterialStock'), {
        virgin: filmType === 'virgin' ? -inputQuantity : 0,
        colored: filmType === 'colored' ? -inputQuantity : 0,
        timestamp: serverTimestamp(),
        type: 'decrement',
        description: 'Stock used for outsourcing'
      });
      
      // Mettre à jour le document current de outsourcingStock
      const outsourcingStockRef = doc(db, 'outsourcingStock', 'current');
      const outsourcingStockDoc = await getDoc(outsourcingStockRef);
      
      let currentOutsourcingStock = { virgin: 0, colored: 0 };
      if (outsourcingStockDoc.exists()) {
        currentOutsourcingStock = outsourcingStockDoc.data();
      }
      
      await setDoc(outsourcingStockRef, {
        ...currentOutsourcingStock,
        [filmType]: (currentOutsourcingStock[filmType] || 0) + inputQuantity,
        updatedAt: serverTimestamp()
      });
      
      // Ajouter à l'historique
      await addDoc(collection(db, 'outsourcingStock'), {
        virgin: filmType === 'virgin' ? inputQuantity : 0,
        colored: filmType === 'colored' ? inputQuantity : 0,
        timestamp: serverTimestamp(),
        type: 'increment',
        description: 'Stock sent for outsourcing'
      });
      
      // Créer un nouveau processus
      const processData = {
        startDate,
        inputQuantity,
        status: 'processing',
        outsourced: true,
        outsourcingPartner: newOutsourcing.outsourcingPartner || null,
        filmType,
        cycleNumber: `RC-2025-${String(processes.length + 1).padStart(3, '0')}`,
        expectedCompletion,
        yieldRate: filmType === 'virgin' ? 95 : 92,
        createdAt: new Date(),
        source: 'rawMaterial'
      };

      // Ajouter le processus à Firebase
      const docRef = await addDoc(collection(db, 'processes'), processData);

      // Créer une transaction
      await addDoc(collection(db, 'transactions'), {
        date: new Date(),
        type: 'transfer',
        quantity: inputQuantity,
        description: `Transfer from Raw Material to Outsourcing`,
        filmType,
        fromSection: 'rawMaterial',
        toSection: 'outsourcing',
        processId: docRef.id
      });

      // Mettre à jour l'état local
      const processWithId: RecyclingProcess = {
        ...processData,
        id: docRef.id,
        filmType
      };
      
      setProcesses([...processes, processWithId]);

      // Mettre à jour le stock local
      setStock(prevStock => ({
        ...prevStock,
        rawMaterial: {
          ...prevStock.rawMaterial,
          [filmType]: prevStock.rawMaterial[filmType] - inputQuantity
        },
        outsourcing: {
          ...prevStock.outsourcing,
          [filmType]: prevStock.outsourcing[filmType] + inputQuantity
        }
      }));

      // Réinitialiser le formulaire
      setNewOutsourcing({
        filmType: 'virgin',
        inputQuantity: 0,
        startDate: format(new Date(), 'yyyy-MM-dd'),
        expectedDays: 3,
        outsourcingPartner: ''
      });
      
      setShowNewOutsourcingModal(false);
    } catch (error) {
      console.error('Error creating new outsourcing request:', error);
      alert('Failed to create outsourcing request. Please try again.');
    }
  };

  const handleNewSale = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const product = products.find(p => p.id === newSale.productId);
    if (!product) return;
  
    const quantity = Number(newSale.quantity);
    const totalAmount = quantity * (product.price || 0);
  
    try {
      // 1. Create the sale in the local system
      const sale: Sale = {
        id: `${sales.length + 1}`,
        date: new Date(newSale.date),
        productId: newSale.productId,
        quantity,
        unitPrice: product.price || 0,
        totalAmount
      };
  
      // 2. Create a description for the cash inflow
      const description = `Sale of ${quantity}kg of ${product.name} (${product.sourceType || 'virgin'})`;
  
      // 3. Create an entry in the external cash management system
      await createCashInflowEntry(totalAmount, description);
  
      // 4. Update local state
      setSales([...sales, sale]);
  
      setProducts(products.map(p => 
        p.id === product.id 
          ? { ...p, quantity: (p.quantity || 0) - quantity }
          : p
      ));
  
      setStock(prevStock => ({
        ...prevStock,
        finished: {
          ...prevStock.finished,
          [product.sourceType || 'virgin']: prevStock.finished[product.sourceType || 'virgin'] - quantity
        }
      }));
  
      // 5. Reset form
      setNewSale({
        productId: '1',
        quantity: 0,
        date: format(new Date(), 'yyyy-MM-dd')
      });
      setShowNewSaleModal(false);
    } catch (error) {
      console.error('Error processing sale:', error);
      alert('Failed to complete the sale. Please try again.');
    }
  };

  const handleNewProduct = async (productData: Omit<Product, 'id'>) => {
    try {
      const filmType = productData.filmType as 'virgin' | 'colored';
      const source = productData.source as 'inProcess' | 'outsourcing';
      const inputQuantity = productData.inputQuantity;
      
      // Vérifier si le stock disponible est suffisant
      if (stock[source][filmType] < inputQuantity) {
        alert(`Insufficient ${filmType} ${source} stock. Available: ${stock[source][filmType]} kg`);
        return;
      }
      
      // Mettre à jour le document current de la source
      const sourceStockRef = doc(db, source === 'inProcess' ? 'inProcessStock' : 'outsourcingStock', 'current');
      const sourceStockDoc = await getDoc(sourceStockRef);
      
      if (!sourceStockDoc.exists()) {
        throw new Error(`${source} stock document not found`);
      }
      
      const currentSourceStock = sourceStockDoc.data();
      
      // Vérifier à nouveau avec les données les plus récentes
      if (currentSourceStock[filmType] < inputQuantity) {
        alert(`Insufficient ${filmType} ${source} stock. Available: ${currentSourceStock[filmType]} kg`);
        return;
      }
      
      // Mettre à jour le document current de la source
      await setDoc(sourceStockRef, {
        ...currentSourceStock,
        [filmType]: currentSourceStock[filmType] - inputQuantity,
        updatedAt: serverTimestamp()
      });
      
      // Ajouter à l'historique de la source
      await addDoc(collection(db, source === 'inProcess' ? 'inProcessStock' : 'outsourcingStock'), {
        virgin: filmType === 'virgin' ? -inputQuantity : 0,
        colored: filmType === 'colored' ? -inputQuantity : 0,
        timestamp: serverTimestamp(),
        type: 'decrement',
        description: 'Stock transferred to finished products'
      });
      
      // Mettre à jour le document current de finishedProductsStock
      const finishedStockRef = doc(db, 'finishedProductsStock', 'current');
      const finishedStockDoc = await getDoc(finishedStockRef);
      
      let currentFinishedStock = { virgin: 0, colored: 0 };
      if (finishedStockDoc.exists()) {
        currentFinishedStock = finishedStockDoc.data();
      }
      
      await setDoc(finishedStockRef, {
        ...currentFinishedStock,
        [filmType]: (currentFinishedStock[filmType] || 0) + inputQuantity,
        updatedAt: serverTimestamp()
      });
      
      // Ajouter à l'historique des produits finis
      await addDoc(collection(db, 'finishedProductsStock'), {
        virgin: filmType === 'virgin' ? inputQuantity : 0,
        colored: filmType === 'colored' ? inputQuantity : 0,
        timestamp: serverTimestamp(),
        type: 'increment',
        description: `Stock added from ${source}`
      });

      // Créer le produit fini
      const productName = filmType === 'virgin' ? 'Virgin PE Pellets' : 'Colored PE Pellets';
      const productPrice = filmType === 'virgin' ? 1.5 : 1.2;
      
      const product: Omit<Product, 'id'> = {
        ...productData,
        startDate: productData.startDate,
        name: productName,
        price: productPrice,
        quantity: inputQuantity,
        sourceType: filmType,
       
      };

      // Ajouter à Firebase
      const docRef = await addDoc(collection(db, 'products'), product);

      // Créer une transaction
      await addDoc(collection(db, 'transactions'), {
        date: new Date(),
        type: 'transfer',
        quantity: inputQuantity,
        description: `Transfer from ${source} to Finished Products`,
        filmType,
        fromSection: source,
        toSection: 'finished',
        productId: docRef.id
      });

      // Mettre à jour l'état local
      const newProduct: Product = {
        id: docRef.id,
        ...product
      };

      setProducts([...products, newProduct]);
      
      setStock(prevStock => ({
        ...prevStock,
        [source]: {
          ...prevStock[source],
          [filmType]: prevStock[source][filmType] - inputQuantity
        },
        finished: {
          ...prevStock.finished,
          [filmType]: prevStock.finished[filmType] + inputQuantity
        }
      }));

      setShowProductSheetModal(false);
    } catch (error) {
      console.error('Error creating new product:', error);
      alert('Failed to create product. Please try again.');
    }
  };

  if (!isAuthenticated) {
    if (currentView === 'login') {
      return (
        <Login 
          onLogin={() => setIsAuthenticated(true)} 
          onSwitchToRegister={() => setCurrentView('register')}
          onSwitchToAdminLogin={() => setCurrentView('adminLogin')}
        />
      );
    }
    if (currentView === 'register') {
      return (
        <Register 
          onRegister={() => setIsAuthenticated(true)}
          onSwitchToLogin={() => setCurrentView('login')}
        />
      );
    }
    if (currentView === 'adminLogin') {
      return (
        <AdminLogin 
          onLogin={() => {
            setIsAuthenticated(true);
            setIsAdmin(true);
          }}
          onSwitchToRegister={() => setCurrentView('register')}
        />
      );
    }
  }

  if (isAdmin) {
    return (
      <AdminDashboard 
        stock={stock}
        setStock={setStock}
        transactions={transactions}
        setTransactions={setTransactions}
      />
    );
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onLogout={handleLogout} />
      
      <Dashboard
  stock={stock}
  transactions={transactions}
  processes={processes}
  products={products}
  sales={sales}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  onNewProcess={() => setShowNewProcessModal(true)}
  onNewOutsourcing={() => setShowNewOutsourcingModal(true)}
  onNewSale={handleNewSaleFromDashboard} // Assurez-vous que cette prop est passée ici
  onNewProduct={() => setShowProductSheetModal(true)}
/>

      {showNewProcessModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-medium text-gray-900">Start New Recycling Cycle</h3>
              <button
                onClick={() => setShowNewProcessModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleNewProcess} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    value={newProcess.startDate}
                    onChange={(e) => setNewProcess({ ...newProcess, startDate: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Film Type</label>
                  <select
                    value={newProcess.filmType}
                    onChange={(e) => setNewProcess({ ...newProcess, filmType: e.target.value as 'virgin' | 'colored' })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="virgin">Virgin PE Film</option>
                    <option value="colored">Colored PE Film</option>
                  </select>
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700">Input Quantity (kg)</label>
                  <input
                    type="number"
                    min="0"
                    max={stock.rawMaterial[newProcess.filmType as 'virgin' | 'colored']}
                    value={newProcess.inputQuantity}
                    onChange={(e) => setNewProcess({ ...newProcess, inputQuantity: Number(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Available: {stock.rawMaterial[newProcess.filmType as 'virgin' | 'colored']} kg
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expected Duration (days)</label>
                  <input
                    type="number"
                    min="1"
                    value={newProcess.expectedDays}
                    onChange={(e) => setNewProcess({ ...newProcess, expectedDays: Number(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewProcessModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Start Process
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNewOutsourcingModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-medium text-gray-900">New Outsourcing Request</h3>
              <button
                onClick={() => setShowNewOutsourcingModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleNewOutsourcing} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    value={newOutsourcing.startDate}
                    onChange={(e) => setNewOutsourcing({ ...newOutsourcing, startDate: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Film Type</label>
                  <select
                    value={newOutsourcing.filmType}
                    onChange={(e) => setNewOutsourcing({ ...newOutsourcing, filmType: e.target.value as 'virgin' | 'colored' })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                  >
                    <option value="virgin">Virgin PE Film</option>
                    <option value="colored">Colored PE Film</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Input Quantity (kg)</label>
                  <input
                    type="number"
                    min="0"
                    max={stock.rawMaterial[newOutsourcing.filmType as 'virgin' | 'colored']}
                    value={newOutsourcing.inputQuantity}
                    onChange={(e) => setNewOutsourcing({ ...newOutsourcing, inputQuantity: Number(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Available: {stock.rawMaterial[newOutsourcing.filmType as 'virgin' | 'colored']} kg
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expected Duration (days)</label>
                  <input
                    type="number"
                    min="1"
                    value={newOutsourcing.expectedDays}
                    onChange={(e) => setNewOutsourcing({ ...newOutsourcing, expectedDays: Number(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Outsourcing Partner</label>
                  <input
                    type="text"
                    value={newOutsourcing.outsourcingPartner}
                    onChange={(e) => setNewOutsourcing({ ...newOutsourcing, outsourcingPartner: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                    required
                    placeholder="Enter partner name"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewOutsourcingModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  Create Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

{showNewSaleModal && (
  <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
      <div className="flex justify-between items-center p-6 border-b">
        <h3 className="text-lg font-medium text-gray-900">Nouvelle Vente</h3>
        <button
          onClick={() => setShowNewSaleModal(false)}
          className="text-gray-400 hover:text-gray-500"
        >
          <X size={20} />
        </button>
      </div>
      <form onSubmit={handleNewSale} className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date de vente</label>
            <input
              type="date"
              value={newSale.date}
              onChange={(e) => setNewSale({ ...newSale, date: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Produit</label>
            <select
              value={newSale.productId}
              onChange={(e) => setNewSale({ ...newSale, productId: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            >
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.sourceType === 'virgin' ? 'Virgin Films' : 'Colored Films'} - {product.price?.toLocaleString('fr-FR')} FCFA/kg
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Quantité (kg)</label>
            <input
              type="number"
              min="0"
              max={products.find(p => p.id === newSale.productId)?.quantity || 0}
              value={newSale.quantity}
              onChange={(e) => setNewSale({ ...newSale, quantity: Number(e.target.value) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Disponible: {products.find(p => p.id === newSale.productId)?.quantity || 0} kg
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Prix Unitaire</label>
            <div className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2">
              {(products.find(p => p.id === newSale.productId)?.price || 0).toLocaleString('fr-FR')} FCFA/kg
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Montant Total</label>
            <div className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2">
              {(newSale.quantity * (products.find(p => p.id === newSale.productId)?.price || 0)).toLocaleString('fr-FR')} FCFA
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => setShowNewSaleModal(false)}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Finaliser la vente
          </button>
        </div>
      </form>
    </div>
  </div>
)}

      {showProductSheetModal && (
        <ProductSheetModal
          onClose={() => setShowProductSheetModal(false)}
          onSubmit={handleNewProduct}
        />
      )}
    </div>
  );
}

export default App;