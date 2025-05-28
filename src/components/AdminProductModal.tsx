import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { Product } from '../types';

interface AdminProductModalProps {
  product?: Product; // Si fourni, mode édition; sinon, mode création
  onClose: () => void;
  onSave: (product: Product) => void;
}

export function AdminProductModal({ product, onClose, onSave }: AdminProductModalProps) {
  const [productData, setProductData] = useState<Omit<Product, 'id'>>({
    name: '',
    filmType: 'virgin',
    sourceType: 'virgin',
    quantity: 0,
    price: 0,
    startDate: new Date(),
    source: 'inProcess',
    inputQuantity: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setProductData({
        name: product.name || (product.sourceType === 'virgin' ? 'Virgin Films' : 'Colored Films'),
        filmType: product.filmType || 'virgin',
        sourceType: product.sourceType || 'virgin',
        quantity: product.quantity || 0,
        price: product.price || 0,
        startDate: product.startDate || new Date(),
        source: product.source || 'inProcess',
        inputQuantity: product.inputQuantity || 0
      });
    } else {
      // Mode création: définir des valeurs par défaut
      const defaultType = 'virgin';
      const defaultName = defaultType === 'virgin' ? 'Virgin Films' : 'Colored Films';
      const defaultPrice = defaultType === 'virgin' ? 1500 : 1200; // Prix en FCFA
      
      setProductData({
        name: defaultName,
        filmType: defaultType,
        sourceType: defaultType,
        quantity: 0,
        price: defaultPrice,
        startDate: new Date(),
        source: 'inProcess',
        inputQuantity: 0
      });
    }
  }, [product]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setProductData({
        ...productData,
        [name]: parseFloat(value) || 0
      });
    } else if (name === 'filmType' || name === 'sourceType') {
      // Mettre à jour le nom et le prix lorsque le type change
      const newType = value as 'virgin' | 'colored';
      const newName = newType === 'virgin' ? 'Virgin Films' : 'Colored Films';
      const newPrice = newType === 'virgin' ? 1500 : 1200; // Prix en FCFA
      
      setProductData({
        ...productData,
        [name]: newType,
        name: newName,
        price: newPrice
      });
    } else {
      setProductData({
        ...productData,
        [name]: value
      });
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    setProductData({
      ...productData,
      startDate: date
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
      // S'assurer que le nom et le type sont cohérents
      const type = productData.sourceType as 'virgin' | 'colored';
      const name = type === 'virgin' ? 'Virgin Films' : 'Colored Films';
      
      // Utiliser le prix saisi par l'utilisateur au lieu de le réinitialiser
      const formattedData = {
        ...productData,
        name,
        sourceType: type
      };
      
      if (product?.id) {
        // Mode édition
        const currentQuantity = product.quantity || 0;
        const newQuantity = formattedData.quantity || 0;
        
        // Mettre à jour le produit
        await updateDoc(doc(db, 'products', product.id), {
          ...formattedData,
          updatedAt: serverTimestamp()
        });
        
        // Ajouter à l'historique
        await addDoc(collection(db, 'productsHistory'), {
          ...formattedData,
          productId: product.id,
          previousQuantity: currentQuantity,
          quantityAdded: newQuantity - currentQuantity,
          updatedAt: serverTimestamp()
        });
        
        onSave({
          ...formattedData,
          id: product.id
        });
      } else {
        // Mode création
        const docRef = await addDoc(collection(db, 'products'), {
          ...formattedData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        onSave({
          ...formattedData,
          id: docRef.id
        });
      }
    } catch (error) {
      console.error('Error saving product:', error);
      setError('Une erreur est survenue lors de l\'enregistrement. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            {product ? 'Modifier le produit' : 'Ajouter un nouveau produit'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Type de produit</label>
              <select
                name="sourceType"
                value={productData.sourceType}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              >
                <option value="virgin">Virgin Films</option>
                <option value="colored">Colored Films</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Prix (FCFA/kg)</label>
              <input
                type="number"
                name="price"
                value={productData.price}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Quantité en stock (kg)</label>
              <input
                type="number"
                name="quantity"
                value={productData.quantity}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Date de production</label>
              <input
                type="date"
                value={format(productData.startDate, 'yyyy-MM-dd')}
                onChange={handleDateChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Source</label>
              <select
                name="source"
                value={productData.source}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              >
                <option value="inProcess">En Production</option>
                <option value="outsourcing">Sous-traitance</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Quantité initiale (kg)</label>
              <input
                type="number"
                name="inputQuantity"
                value={productData.inputQuantity}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Valeur totale</label>
              <div className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2">
                {new Intl.NumberFormat('fr-FR').format((productData.quantity || 0) * (productData.price || 0))} FCFA
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enregistrement...
                </div>
              ) : (
                product ? 'Mettre à jour' : 'Créer'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}