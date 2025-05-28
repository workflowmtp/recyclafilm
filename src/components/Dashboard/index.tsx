// Modification à apporter au composant Dashboard (components/index.tsx)

import React, { useEffect, useState } from 'react';
import { Plus, ShoppingCart, FileText, X } from 'lucide-react';
import { StockCard } from './StockCard';
import { RevenueCard } from './RevenueCard';
import { TabNavigation } from './TabNavigation';
import { TransactionsTable } from './TransactionsTable';
import { ProcessesTable } from './ProcessesTable';
import { ProductsTable } from './ProductsTable';
import { SalesTable } from './SalesTable';
import { EstimatedValueCard } from './EstimatedValueCard';
import { collection, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import type { Stock, Transaction, RecyclingProcess, Product, Sale } from '../../types';
import { format } from 'date-fns';
import { createCashInflowEntry } from '../../services/externalFirebase';
import { 
   
  updateDoc, 
   
  addDoc, 
  increment 
} from 'firebase/firestore';

interface DashboardProps {
  stock: Stock;
  transactions: Transaction[];
  processes: RecyclingProcess[];
  products: Product[];
  sales: Sale[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onNewProcess: () => void;
  onNewOutsourcing: () => void;
  onNewSale: (sale: Sale, updatedProduct: Product, stockUpdate: any) => void; // Assurez-vous que cette prop est définie ici
  onNewProduct: () => void;
  virginPrice: number; // Prix par kg pour le film vierge
  coloredPrice: number; // Prix par kg pour le film coloré
}

export function Dashboard({
  stock,
  transactions,
  processes,
  products,
  sales,
  activeTab,
  onTabChange,
  onNewProcess,
  onNewOutsourcing,
  onNewSale, // Assurez-vous que cette prop est extraite ici
  onNewProduct,
  virginPrice,
  coloredPrice
}: DashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [currentStock, setCurrentStock] = useState<Stock>(stock);
  const [localSales, setLocalSales] = useState<Sale[]>(sales);
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [newSale, setNewSale] = useState({
    filmType: 'virgin' as 'virgin' | 'colored',
    quantity: 0,
    date: format(new Date(), 'yyyy-MM-dd'),
    unitPrice: virginPrice, // Initialiser avec le prix du film vierge
    destinationCaisse: 'achats' as 'locale' | 'achats'
  });
  
  const totalRevenue = localSales.reduce((sum, sale) => sum + sale.totalAmount, 0);

  useEffect(() => {
    loadLatestStock();
  }, []);

  useEffect(() => {
    // Mettre à jour l'état local quand les props changent
    setLocalSales(sales);
  }, [sales]);

  const loadLatestStock = async () => {
    try {
      setIsLoading(true);

      // Get current raw material stock
      const rawMaterialStockRef = doc(db, 'rawMaterialStock', 'current');
      const rawMaterialStockDoc = await getDoc(rawMaterialStockRef);
      
      let rawMaterialStock = {
        virgin: 0,
        colored: 0
      };

      if (rawMaterialStockDoc.exists()) {
        const data = rawMaterialStockDoc.data();
        rawMaterialStock = {
          virgin: data.virgin || 0,
          colored: data.colored || 0
        };
      }

      // Get other stock collections
      const collections = {
        inProcess: 'inProcessStock',
        outsourcing: 'outsourcingStock',
        finished: 'finishedProductsStock'
      };

      const newStock = {
        rawMaterial: rawMaterialStock,
        inProcess: { virgin: 0, colored: 0 },
        outsourcing: { virgin: 0, colored: 0 },
        finished: { virgin: 0, colored: 0 }
      };

      for (const [section, collectionName] of Object.entries(collections)) {
        const stockRef = doc(db, collectionName, 'current');
        const stockDoc = await getDoc(stockRef);
        
        if (stockDoc.exists()) {
          const data = stockDoc.data();
          newStock[section as keyof Omit<Stock, 'rawMaterial'>] = {
            virgin: data.virgin || 0,
            colored: data.colored || 0
          };
        }
      }

      setCurrentStock(newStock);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading stock:', error);
      setIsLoading(false);
    }
  };

  const handleNewSale = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Verify Firestore initialization
      if (!db) {
        console.error('Firestore is not initialized');
        alert('Erreur de connexion à la base de données');
        return;
      }
  
      // 1. Validate available stock
      if (newSale.quantity > stock.finished[newSale.filmType]) {
        alert('Stock insuffisant pour le type de film sélectionné');
        return;
      }
  
      // 2. Prepare sale data - Utiliser le prix du type de film sélectionné
      const currentPrice = newSale.filmType === 'virgin' ? virginPrice : coloredPrice;
      const totalAmount = newSale.quantity * currentPrice;
      
      // 3. Prepare description for cash inflow
      const description = `Vente de ${newSale.quantity} kg de film ${newSale.filmType}`;
  
      // 4. Create cash inflow entry - Utiliser la base externe uniquement si destinationCaisse est 'achats'
      const useExternalDb = newSale.destinationCaisse === 'achats';
      let cashInflowId: string | undefined;
      try {
        const cashInflowRef = await createCashInflowEntry(totalAmount, description, useExternalDb);
        
        // Vérifiez la structure de cashInflowRef
        console.log('Type de cashInflowRef:', typeof cashInflowRef);
        console.log('Structure de cashInflowRef:', cashInflowRef);

        // Extraction de l'ID
        if (cashInflowRef && 'id' in cashInflowRef) {
          cashInflowId = cashInflowRef.id;
        }

        console.log('Entrée de flux de trésorerie créée avec succès, ID:', cashInflowId);
      } catch (cashError) {
        console.error('Erreur lors de la création de l\'entrée de flux de trésorerie:', cashError);
      }
  
      // 5. Prepare Firestore references
      const finishedStockRef = doc(db, 'finishedProductsStock', 'current');
  
      // 6. Atomic updates to Firestore
      const saleDocRef = await addDoc(collection(db, 'sales'), {
        date: new Date(newSale.date),
        filmType: newSale.filmType,
        quantity: newSale.quantity,
        unitPrice: newSale.filmType === 'virgin' ? virginPrice : coloredPrice, // Utiliser le prix correct
        totalAmount,
        ...(cashInflowId ? { cashInflowId } : {}),
        createdAt: new Date()
      });
  
      // Update finished stock
      await updateDoc(finishedStockRef, {
        [newSale.filmType]: increment(-newSale.quantity)
      });
  
      // 7. Create sale object for local state
      const sale: Sale = {
        id: saleDocRef.id,
        date: new Date(newSale.date),
        filmType: newSale.filmType,
        quantity: newSale.quantity,
        unitPrice: newSale.filmType === 'virgin' ? virginPrice : coloredPrice, // Utiliser le prix correct
        totalAmount
      };
  
      // 8. Update local state with the new sale
      setLocalSales([...localSales, sale]);
      
      // 9. Update stock in local state
      const stockUpdate = {
        finished: {
          [newSale.filmType]: currentStock.finished[newSale.filmType] - newSale.quantity
        }
      };
      
      // Update current stock state
      setCurrentStock(prevStock => ({
        ...prevStock,
        finished: {
          ...prevStock.finished,
          [newSale.filmType]: prevStock.finished[newSale.filmType] - newSale.quantity
        }
      }));
      
      // 10. Call the onNewSale function passed from parent component
      // Create a dummy product since onNewSale expects a product
      const dummyProduct: Product = {
        id: 'temp-id',
        name: newSale.filmType === 'virgin' ? 'Virgin PE Pellets' : 'Colored PE Pellets',
        quantity: newSale.quantity,
        price: newSale.unitPrice,
        startDate: new Date(),
        sourceType: newSale.filmType,
        source: 'inProcess',
        filmType: newSale.filmType,
        inputQuantity: newSale.quantity
      };
      
      // Call the parent function to ensure App component is updated
      onNewSale(sale, dummyProduct, stockUpdate);
     
      // 11. Reset form and close modal
      setNewSale({
        filmType: 'virgin',
        quantity: 0,
        date: format(new Date(), 'yyyy-MM-dd'),
        unitPrice: virginPrice, // Réinitialiser avec le prix du film vierge
        destinationCaisse: 'achats'
      });
      setShowNewSaleModal(false);
      
    } catch (error) {
      console.error('Erreur détaillée lors de la création de la vente:', error);
      alert('Une erreur est survenue lors de la création de la vente. Veuillez réessayer.');
    }
  };
  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StockCard
          title="Matière première"
          virginStock={currentStock.rawMaterial.virgin}
          coloredStock={currentStock.rawMaterial.colored}
          buttonConfig={{
            isDisabled: true,
            text: "Admin seulement",
            icon: <Plus className="w-4 h-4 mr-2" />,
            color: "green"
          }}
          isLoading={isLoading}
        />
        
        <StockCard
          title="En cours de recyclage"
          virginStock={currentStock.inProcess.virgin}
          coloredStock={currentStock.inProcess.colored}
          buttonConfig={{
            onClick: onNewProcess,
            text: "Démarrer un nouveau cycle de recyclage",
            icon: <Plus className="w-4 h-4 mr-2" />,
            color: "blue"
          }}
          isLoading={isLoading}
        />

        <StockCard
          title="Sous-traitance"
          virginStock={currentStock.outsourcing.virgin}
          coloredStock={currentStock.outsourcing.colored}
          buttonConfig={{
            onClick: onNewOutsourcing,
            text: "Nouvelle demande de sous-traitance",
            icon: <Plus className="w-4 h-4 mr-2" />,
            color: "orange"
          }}
          isLoading={isLoading}
        />

        <StockCard
          title="Produits finis"
          virginStock={currentStock.finished.virgin}
          coloredStock={currentStock.finished.colored}
          buttonConfig={{
            onClick: onNewProduct,
            text: "Fiche produit",
            icon: <FileText className="w-4 h-4 mr-2" />,
            color: "purple"
          }}
          isLoading={isLoading}
        />

        <EstimatedValueCard
          virginStock={currentStock.finished.virgin}
          coloredStock={currentStock.finished.colored}
          virginPrice={virginPrice}
          coloredPrice={coloredPrice}
          isLoading={isLoading}
        />

        <div className="col-span-2 flex flex-col space-y-4">
          <RevenueCard totalRevenue={totalRevenue} />
          <button
            onClick={() => setShowNewSaleModal(true)}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Nouvelle vente
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <TabNavigation activeTab={activeTab} onTabChange={onTabChange} />
        </div>

        <div className="p-4">
          {activeTab === 'transactions' && <TransactionsTable transactions={transactions} />}
          {activeTab === 'processes' && <ProcessesTable processes={processes} />}
          {activeTab === 'products' && <ProductsTable products={products} />}
          {activeTab === 'sales' && <SalesTable sales={localSales} products={products} />}
        </div>
      </div>

      {showNewSaleModal && (
  <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
      <div className="flex justify-between items-center p-6 border-b">
        <h3 className="text-lg font-medium text-gray-900">Démarrer un nouveau cycle de recyclage</h3>
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
            <label className="block text-sm font-medium text-gray-700">Date de début</label>
            <input
              type="date"
              value={newSale.date}
              onChange={(e) => setNewSale({ ...newSale, date: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Type de film</label>
            <select
              value={newSale.filmType}
              onChange={(e) => {
                const selectedFilmType = e.target.value as 'virgin' | 'colored';
                // Mettre à jour le prix unitaire en fonction du type de film sélectionné
                const newUnitPrice = selectedFilmType === 'virgin' ? virginPrice : coloredPrice;
                
                setNewSale({ 
                  ...newSale, 
                  filmType: selectedFilmType,
                  unitPrice: newUnitPrice // Mettre à jour automatiquement le prix unitaire
                });
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            >
              <option value="virgin">Film vierge</option>
              <option value="colored">Film coloré</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Quantité disponible (kg)</label>
            <div className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2">
              {stock.finished[newSale.filmType]} kg
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Quantité à traiter (kg)</label>
            <input
              type="number"
              min="0"
              max={stock.finished[newSale.filmType]}
              value={newSale.quantity}
              onChange={(e) => setNewSale({ 
                ...newSale, 
                quantity: Number(e.target.value) 
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Unit Price (FCFA/kg)</label>
            <div className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2">
              {newSale.filmType === 'virgin' ? virginPrice.toLocaleString('fr-FR') : coloredPrice.toLocaleString('fr-FR')} FCFA/kg
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Total Amount</label>
            <div className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2">
              FCFA {(newSale.quantity * (newSale.filmType === 'virgin' ? virginPrice : coloredPrice)).toLocaleString('fr-FR')}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Destination de la caisse</label>
            <div className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2">
              Caisse d'Achats (Externe)
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => setShowNewSaleModal(false)}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Complete Sale
          </button>
        </div>
      </form>
    </div>
  </div>
)}
    </div>
  );
}
