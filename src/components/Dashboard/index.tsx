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
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import type { Stock, Transaction, RecyclingProcess, Product, Sale } from '../../types';
import { format } from 'date-fns';
import { createCashInflowEntry } from '../../services/externalFirebase';
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
  onNewProduct
}: DashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [currentStock, setCurrentStock] = useState<Stock>(stock);
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [newSale, setNewSale] = useState({
    productId: products[0]?.id || '',
    quantity: 0,
    date: format(new Date(), 'yyyy-MM-dd')
  });
  
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);

  useEffect(() => {
    loadLatestStock();
  }, []);

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
    // 1. Vérifier le produit
    const product = products.find(p => p.id === newSale.productId);
    if (!product) {
      alert('Produit non trouvé');
      return;
    }

    // 2. Préparer les données
    const quantity = Number(newSale.quantity);
    const totalAmount = quantity * (product.price || 0);
    
    // 3. Créer l'objet vente
    const sale = {
      id: `${sales.length + 1}`,
      date: new Date(newSale.date),
      productId: newSale.productId,
      quantity,
      unitPrice: product.price || 0,
      totalAmount
    };

    // 4. Préparer la description
    const description = `Sale of ${quantity}kg of ${product.name || 'product'} (${product.sourceType || 'virgin'})`;

    // 5. Intégration avec la base de données externe
    try {
      console.log('Attempting to create cash inflow entry with:', totalAmount, description);
      await createCashInflowEntry(totalAmount, description);
      console.log('Cash inflow entry created successfully');
    } catch (cashError) {
      console.error('Error creating cash inflow entry:', cashError);
      // Continuer même en cas d'erreur avec la base externe
    }

    // 6. Préparer les mises à jour
    const updatedProduct = {
      ...product,
      quantity: (product.quantity || 0) - quantity
    };

    const stockUpdate = {
      finished: {
        [product.sourceType || 'virgin']: stock.finished[product.sourceType || 'virgin'] - quantity
      }
    };

    // 7. Appeler le callback
    if (typeof onNewSale === 'function') {
      onNewSale(sale, updatedProduct, stockUpdate);
    } else {
      console.error('onNewSale is not a function');
    }

    // 8. Réinitialiser le formulaire
    setNewSale({
      productId: products[0]?.id || '',
      quantity: 0,
      date: format(new Date(), 'yyyy-MM-dd')
    });
    
    // 9. Fermer le modal
    setShowNewSaleModal(false);
    
  } catch (error) {
    console.error('Detailed error in handleNewSale:', error);
    alert('Une erreur est survenue lors de la création de la vente. Veuillez réessayer.');
  }
};

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StockCard
          title="Raw Material"
          virginStock={currentStock.rawMaterial.virgin}
          coloredStock={currentStock.rawMaterial.colored}
          buttonConfig={{
            isDisabled: true,
            text: "Admin Only",
            icon: <Plus className="w-4 h-4 mr-2" />,
            color: "green"
          }}
          isLoading={isLoading}
        />
        
        <StockCard
          title="In Process"
          virginStock={currentStock.inProcess.virgin}
          coloredStock={currentStock.inProcess.colored}
          buttonConfig={{
            onClick: onNewProcess,
            text: "Start New Recycling Cycle",
            icon: <Plus className="w-4 h-4 mr-2" />,
            color: "blue"
          }}
          isLoading={isLoading}
        />

        <StockCard
          title="Outsourcing"
          virginStock={currentStock.outsourcing.virgin}
          coloredStock={currentStock.outsourcing.colored}
          buttonConfig={{
            onClick: onNewOutsourcing,
            text: "New Outsourcing Request",
            icon: <Plus className="w-4 h-4 mr-2" />,
            color: "orange"
          }}
          isLoading={isLoading}
        />

        <StockCard
          title="Finished Products"
          virginStock={currentStock.finished.virgin}
          coloredStock={currentStock.finished.colored}
          buttonConfig={{
            onClick: onNewProduct,
            text: "Product Sheet",
            icon: <FileText className="w-4 h-4 mr-2" />,
            color: "purple"
          }}
          isLoading={isLoading}
        />

        <div className="col-span-2 flex flex-col space-y-4">
          <RevenueCard totalRevenue={totalRevenue} />
          <button
            onClick={() => setShowNewSaleModal(true)}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            New Sale
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
          {activeTab === 'sales' && <SalesTable sales={sales} products={products} />}
        </div>
      </div>

      {showNewSaleModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-medium text-gray-900">New Sale</h3>
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
                  <label className="block text-sm font-medium text-gray-700">Sale Date</label>
                  <input
                    type="date"
                    value={newSale.date}
                    onChange={(e) => setNewSale({ ...newSale, date: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Product</label>
                  <select
                    value={newSale.productId}
                    onChange={(e) => setNewSale({ ...newSale, productId: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  >
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} - FCFA{product.price?.toFixed(2)}/kg
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity (kg)</label>
                  <input
                    type="number"
                    min="0"
                    max={products.find(p => p.id === newSale.productId)?.quantity || 0}
                    value={newSale.quantity}
                    onChange={(e) => setNewSale({ ...newSale, quantity: Number(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Unit Price</label>
                  <div className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2">
                    FCFA{products.find(p => p.id === newSale.productId)?.price?.toFixed(2)}/kg
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                  <div className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2">
                    FCFA{(newSale.quantity * (products.find(p => p.id === newSale.productId)?.price || 0)).toFixed(2)}
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