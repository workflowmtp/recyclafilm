import React from 'react';
import type { Product } from '../../types';

interface ProductsTableProps {
  products: Product[];
}

export function ProductsTable({ products }: ProductsTableProps) {
  // Fonction pour formater les nombres avec séparateur de milliers
  const formatNumber = (num: number | undefined) => {
    if (num === undefined) return '0';
    return new Intl.NumberFormat('fr-FR').format(num);
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

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Produit
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Quantité (kg)
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Prix (FCFA/kg)
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Valeur Totale (FCFA)
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {products.map((product) => {
            // Sécuriser les propriétés du produit
            const name = product.name || (product.sourceType === 'virgin' ? 'Virgin Films' : 'Colored Films');
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
          
          {products.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                Aucun produit trouvé
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}