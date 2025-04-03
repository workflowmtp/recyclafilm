import React, { useState } from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import type { Product } from '../../types';

interface ProductSheetModalProps {
  onClose: () => void;
  onSubmit: (product: Omit<Product, 'id'>) => void;
}

export function ProductSheetModal({ onClose, onSubmit }: ProductSheetModalProps) {
  const [product, setProduct] = useState<Omit<Product, 'id'>>({
    startDate: new Date(),
    source: 'inProcess',
    filmType: 'virgin',
    inputQuantity: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Définir le prix en fonction du type de film
    const price = product.filmType === 'virgin' ? 1500 : 1200; // Prix en FCFA
    const name = product.filmType === 'virgin' ? 'Virgin Films' : 'Colored Films';
    
    onSubmit({
      ...product,
      price,
      name,
      sourceType: product.filmType
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">Fiche Produit</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date de début</label>
              <input
                type="date"
                value={format(product.startDate, 'yyyy-MM-dd')}
                onChange={(e) => setProduct({ ...product, startDate: new Date(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Source</label>
              <select
                value={product.source}
                onChange={(e) => setProduct({ ...product, source: e.target.value as 'inProcess' | 'outsourcing' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              >
                <option value="inProcess">En Traitement</option>
                <option value="outsourcing">Sous-traitance</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type de Film</label>
              <select
                value={product.filmType}
                onChange={(e) => setProduct({ ...product, filmType: e.target.value as 'virgin' | 'colored' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              >
                <option value="virgin">Virgin Films</option>
                <option value="colored">Colored Films</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Quantité d'entrée (kg)</label>
              <input
                type="number"
                min="0"
                value={product.inputQuantity}
                onChange={(e) => setProduct({ ...product, inputQuantity: Number(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Prix Unitaire (FCFA)</label>
              <div className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2">
                {product.filmType === 'virgin' ? '1 500' : '1 200'} FCFA/kg
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Créer Produit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}