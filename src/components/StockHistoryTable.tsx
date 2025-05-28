import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface StockHistoryItem {
  id: string;
  virgin: number;
  colored: number;
  timestamp: Timestamp;
  type: string;
  added?: {
    virgin: number;
    colored: number;
  };
}

interface StockHistoryTableProps {
  section: 'rawMaterial' | 'inProcess' | 'outsourcing' | 'finished';
}

export function StockHistoryTable({ section }: StockHistoryTableProps) {
  const [history, setHistory] = useState<StockHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mapping des sections vers les noms de collections Firestore
  const collectionMapping = {
    rawMaterial: 'rawMaterialStock',
    inProcess: 'inProcessStock',
    outsourcing: 'outsourcingStock',
    finished: 'finishedProductsStock'
  };

  // Mapping des sections vers des noms plus lisibles
  const sectionNames = {
    rawMaterial: 'Matière Première',
    inProcess: 'En Production',
    outsourcing: 'Sous-traitance',
    finished: 'Produits Finis'
  };

  useEffect(() => {
    loadHistory();
  }, [section]);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const collectionName = collectionMapping[section];
      
      // Récupérer les 50 dernières entrées d'historique, triées par date décroissante
      const historyQuery = query(
        collection(db, collectionName),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      
      const historySnapshot = await getDocs(historyQuery);
      
      const historyItems = historySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp
      })) as StockHistoryItem[];
      
      setHistory(historyItems);
      setIsLoading(false);
    } catch (error) {
      console.error(`Error loading ${section} history:`, error);
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
        Historique des ajouts - {sectionNames[section]}
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
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantité ajoutée (Virgin)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantité ajoutée (Colored)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total après ajout (Virgin)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total après ajout (Colored)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {history.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatDate(item.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      item.type === 'update' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.type === 'update' ? 'Mise à jour' : item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.added ? (
                      <span className="text-green-600 font-medium">+{formatNumber(item.added.virgin)} kg</span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.added ? (
                      <span className="text-green-600 font-medium">+{formatNumber(item.added.colored)} kg</span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatNumber(item.virgin)} kg
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatNumber(item.colored)} kg
                  </td>
                </tr>
              ))}
              
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
