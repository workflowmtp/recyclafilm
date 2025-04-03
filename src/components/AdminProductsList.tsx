import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, Search } from 'lucide-react';
import { collection, getDocs, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import type { Product } from '../types';
import { AdminProductModal } from './AdminProductModal';

interface AdminProductsListProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

export function AdminProductsList({ products, setProducts }: AdminProductsListProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

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

  const handleDelete = async (id: string) => {
    try {
      if (confirmDelete !== id) {
        setConfirmDelete(id);
        return;
      }
      
      setIsLoading(true);
      await deleteDoc(doc(db, 'products', id));
      
      // Mettre à jour la liste locale
      setProducts(products.filter(product => product.id !== id));
      setIsLoading(false);
      setConfirmDelete(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      setIsLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handleAddNew = () => {
    setSelectedProduct(null);
    setShowAddModal(true);
  };

  const onProductAdded = (newProduct: Product) => {
    setProducts([newProduct, ...products]);
    setShowAddModal(false);
  };

  const onProductUpdated = (updatedProduct: Product) => {
    setProducts(products.map(product => 
      product.id === updatedProduct.id ? updatedProduct : product
    ));
    setShowEditModal(false);
    setSelectedProduct(null);
  };

  const filteredProducts = products.filter(product => {
    const name = product.name || (product.sourceType === 'virgin' ? 'Virgin Films' : 'Colored Films');
    const searchLower = searchTerm.toLowerCase();
    return name.toLowerCase().includes(searchLower) || 
           (product.sourceType || '').toLowerCase().includes(searchLower);
  });

  // Fonction pour formater les nombres avec séparateur de milliers
  const formatNumber = (num: number | undefined) => {
    if (num === undefined) return '0';
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h2 className="text-2xl font-bold">Gestion des Produits</h2>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto mt-2 sm:mt-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 w-full sm:w-64"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          
          <button
            onClick={handleAddNew}
            className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un produit
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => {
                const name = product.name || (product.sourceType === 'virgin' ? 'Virgin Films' : 'Colored Films');
                const sourceType = product.sourceType || 'virgin';
                const quantity = product.quantity || 0;
                const price = product.price || 0;
                
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-1 text-blue-600 hover:text-blue-900 focus:outline-none"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id || '')}
                          className={`p-1 ${confirmDelete === product.id ? 'text-red-600 font-bold' : 'text-gray-600 hover:text-red-900'} focus:outline-none`}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                    Aucun produit trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <AdminProductModal
          onClose={() => setShowAddModal(false)}
          onSave={onProductAdded}
        />
      )}

      {showEditModal && selectedProduct && (
        <AdminProductModal
          product={selectedProduct}
          onClose={() => {
            setShowEditModal(false);
            setSelectedProduct(null);
          }}
          onSave={onProductUpdated}
        />
      )}
    </div>
  );
}