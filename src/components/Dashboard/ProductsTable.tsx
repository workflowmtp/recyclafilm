import { useState } from 'react';
import { Search, Download } from 'lucide-react';
import type { Product } from '../../types';
import { format } from 'date-fns';

interface ProductsTableProps {
  products: Product[];
}

export function ProductsTable({ products }: ProductsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Fonction pour formater les nombres avec séparateur de milliers
  const formatNumber = (num: number | undefined) => {
    if (num === undefined) return '0';
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleExportCSV = () => {
    // Préparer les données pour l'export
    const headers = ['Produit', 'Type', 'Quantité (kg)', 'Prix (FCFA/kg)', 'Valeur totale (FCFA)'];
    
    const csvData = filteredProducts.map(product => {
      const name = product.name || (product.sourceType === 'virgin' ? 'Films vierges' : 'Films colorés');
      const quantity = product.quantity || 0;
      const price = product.price || 0;
      
      return [
        name,
        product.sourceType === 'virgin' ? 'Virgin' : 'Colored',
        quantity.toString(),
        price.toString(),
        (quantity * price).toString()
      ];
    });
    
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
    link.setAttribute('download', `export_produits_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Vérifier si products est défini et est un tableau
  if (!Array.isArray(products)) {
    console.error('Products is not an array:', products);
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        Erreur de chargement des produits. Veuillez rafraîchir la page.
      </div>
    );
  }

  const filteredProducts = products.filter(product => {
    const searchLower = searchTerm.toLowerCase();
    const name = product.name || (product.sourceType === 'virgin' ? 'Films vierges' : 'Films colorés');
    const sourceType = product.sourceType || 'virgin';
    
    return (
      name.toLowerCase().includes(searchLower) ||
      sourceType.toLowerCase().includes(searchLower)
    );
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const aName = a.name || (a.sourceType === 'virgin' ? 'Films vierges' : 'Films colorés');
    const bName = b.name || (b.sourceType === 'virgin' ? 'Films vierges' : 'Films colorés');
    const aQuantity = a.quantity || 0;
    const bQuantity = b.quantity || 0;
    const aPrice = a.price || 0;
    const bPrice = b.price || 0;
    const aSourceType = a.sourceType || 'virgin';
    const bSourceType = b.sourceType || 'virgin';
    
    if (sortField === 'name') {
      return sortDirection === 'asc'
        ? aName.localeCompare(bName)
        : bName.localeCompare(aName);
    } else if (sortField === 'sourceType') {
      return sortDirection === 'asc'
        ? aSourceType.localeCompare(bSourceType)
        : bSourceType.localeCompare(aSourceType);
    } else if (sortField === 'quantity') {
      return sortDirection === 'asc'
        ? aQuantity - bQuantity
        : bQuantity - aQuantity;
    } else if (sortField === 'price') {
      return sortDirection === 'asc'
        ? aPrice - bPrice
        : bPrice - aPrice;
    } else if (sortField === 'totalValue') {
      const aTotalValue = aQuantity * aPrice;
      const bTotalValue = bQuantity * bPrice;
      return sortDirection === 'asc'
        ? aTotalValue - bTotalValue
        : bTotalValue - aTotalValue;
    }
    return 0;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Produits</h2>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto mt-2 sm:mt-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher des produits..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:w-64"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('name')}
              >
                Produit
                {sortField === 'name' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('sourceType')}
              >
                Type
                {sortField === 'sourceType' && (
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
                onClick={() => handleSort('price')}
              >
                Prix (FCFA/kg)
                {sortField === 'price' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('totalValue')}
              >
                Valeur totale (FCFA)
                {sortField === 'totalValue' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedProducts.map((product) => {
              // Sécuriser les propriétés du produit
              const name = product.name || (product.sourceType === 'virgin' ? 'Films vierges' : 'Films colorés');
              const sourceType = product.sourceType || 'virgin';
              const quantity = product.quantity || 0;
              const price = product.price || 0;
              
              return (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        sourceType === 'virgin'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {sourceType === 'virgin' ? 'Virgin' : 'Colored'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatNumber(quantity)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatNumber(price)} FCFA
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatNumber(quantity * price)} FCFA
                  </td>
                </tr>
              );
            })}
            
            {sortedProducts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                  Aucun produit trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}