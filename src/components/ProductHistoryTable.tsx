import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Product } from '../types';

interface ProductHistoryItem extends Product {
  updatedAt: Timestamp;
  previousQuantity?: number;
  quantityAdded?: number;
}

export function ProductHistoryTable() {
  const [history, setHistory] = useState<ProductHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      
      // Récupérer les 50 derniers produits modifiés, triés par date de mise à jour décroissante
      const historyQuery = query(
        collection(db, 'productsHistory'),
        orderBy('updatedAt', 'desc'),
        limit(50)
      );
      
      const historySnapshot = await getDocs(historyQuery);
      
      const historyItems = historySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startDate: data.startDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt,
          source: data.source || 'inProcess',
          filmType: data.filmType || 'virgin',
          inputQuantity: data.inputQuantity || 0,
          previousQuantity: data.previousQuantity,
          quantityAdded: data.quantityAdded,
          quantity: data.quantity || 0
        } as ProductHistoryItem;
      });
      
      setHistory(historyItems);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading product history:', error);
      setIsLoading(false);
    }
  };

  // Fonction pour formater les nombres avec séparateur de milliers
  const formatNumber = (num: number | undefined) => {
    if (num === undefined) return '0';
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  // Fonction pour formater la date
  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp || !timestamp.toDate) return 'Date inconnue';
    return format(timestamp.toDate(), 'dd MMMM yyyy à HH:mm', { locale: fr });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Historique des ajouts de produits
      </h2>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantité précédente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantité ajoutée
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantité totale
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {history.map((item) => {
                const name = item.name || (item.sourceType === 'virgin' ? 'Virgin Films' : 'Colored Films');
                const sourceType = item.sourceType || 'virgin';
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDate(item.updatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        sourceType === 'virgin' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {sourceType === 'virgin' ? 'Virgin' : 'Colored'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatNumber(item.previousQuantity)} kg
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.quantityAdded ? (
                        <span className="text-green-600 font-medium">+{formatNumber(item.quantityAdded)} kg</span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatNumber(item.quantity)} kg
                    </td>
                  </tr>
                );
              })}
              
              {history.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                    Aucun historique trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
