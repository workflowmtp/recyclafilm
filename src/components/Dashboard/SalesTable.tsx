import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Download, Search } from 'lucide-react';
import type { Sale, Product } from '../../types';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';

interface SalesTableProps {
  sales: Sale[];
  products: Product[];
}

export function SalesTable({ sales, products }: SalesTableProps) {
  const [localSales, setLocalSales] = useState<Sale[]>(sales);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  useEffect(() => {
    loadSalesHistory();
  }, []);

  const loadSalesHistory = async () => {
    try {
      setLoading(true);
      
      // Récupérer toutes les ventes depuis Firestore, triées par date
      const salesQuery = query(collection(db, 'sales'), orderBy('date', 'desc'));
      const salesSnapshot = await getDocs(salesQuery);
      
      const loadedSales: Sale[] = [];
      
      salesSnapshot.forEach(doc => {
        const data = doc.data();
        loadedSales.push({
          id: doc.id,
          date: data.date.toDate(),
          productId: data.productId,
          quantity: data.quantity,
          unitPrice: data.unitPrice,
          totalAmount: data.totalAmount
        });
      });
      
      setLocalSales(loadedSales);
      setLoading(false);
    } catch (error) {
      console.error('Error loading sales history:', error);
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || (product?.sourceType === 'virgin' ? 'Virgin Films' : 'Colored Films');
  };

  const handleExportCSV = () => {
    // Préparer les données pour l'export
    const headers = ['Date', 'Product', 'Quantity (kg)', 'Unit Price (FCFA)', 'Total Amount (FCFA)'];
    
    const csvData = localSales.map(sale => [
      format(sale.date, 'dd/MM/yyyy'),
      getProductName(sale.productId),
      sale.quantity.toString(),
      sale.unitPrice.toFixed(2),
      sale.totalAmount.toFixed(2)
    ]);
    
    // Créer le contenu CSV
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    // Créer un blob et un lien de téléchargement
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSales = localSales.filter(sale => {
    const productName = getProductName(sale.productId).toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    return productName.includes(searchLower) || 
           format(sale.date, 'dd/MM/yyyy').includes(searchTerm);
  });

  const sortedSales = [...filteredSales].sort((a, b) => {
    if (sortField === 'date') {
      return sortDirection === 'asc' 
        ? a.date.getTime() - b.date.getTime() 
        : b.date.getTime() - a.date.getTime();
    } else if (sortField === 'product') {
      const productA = getProductName(a.productId);
      const productB = getProductName(b.productId);
      return sortDirection === 'asc'
        ? productA.localeCompare(productB)
        : productB.localeCompare(productA);
    } else if (sortField === 'quantity') {
      return sortDirection === 'asc'
        ? a.quantity - b.quantity
        : b.quantity - a.quantity;
    } else if (sortField === 'unitPrice') {
      return sortDirection === 'asc'
        ? a.unitPrice - b.unitPrice
        : b.unitPrice - a.unitPrice;
    } else if (sortField === 'totalAmount') {
      return sortDirection === 'asc'
        ? a.totalAmount - b.totalAmount
        : b.totalAmount - a.totalAmount;
    }
    return 0;
  });

  const totalRevenue = sortedSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalQuantity = sortedSales.reduce((sum, sale) => sum + sale.quantity, 0);

  // Formatter pour afficher les nombres avec séparateurs de milliers
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Historique des Ventes</h2>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto mt-2 sm:mt-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher des ventes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 w-full sm:w-64"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg shadow">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('date')}
                  >
                    Date
                    {sortField === 'date' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('product')}
                  >
                    Produit
                    {sortField === 'product' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('quantity')}
                  >
                    Quantité (kg)
                    {sortField === 'quantity' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('unitPrice')}
                  >
                    Prix Unitaire (FCFA)
                    {sortField === 'unitPrice' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('totalAmount')}
                  >
                    Montant Total (FCFA)
                    {sortField === 'totalAmount' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedSales.map((sale) => {
                  const product = products.find(p => p.id === sale.productId);
                  const productName = product?.name || (product?.sourceType === 'virgin' ? 'Virgin Films' : 'Colored Films');
                  
                  return (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {format(sale.date, 'dd/MM/yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {productName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatNumber(sale.quantity)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatNumber(sale.unitPrice)} FCFA
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatNumber(sale.totalAmount)} FCFA
                      </td>
                    </tr>
                  );
                })}
                
                {sortedSales.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                      Aucune vente trouvée
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={2} className="px-6 py-4 text-sm font-medium text-gray-900">
                    Total
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {formatNumber(totalQuantity)} kg
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    -
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {formatNumber(totalRevenue)} FCFA
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          <div className="mt-4 flex justify-end text-sm text-gray-500">
            Affichage de {sortedSales.length} sur {localSales.length} ventes
          </div>
        </>
      )}
    </div>
  );
} 