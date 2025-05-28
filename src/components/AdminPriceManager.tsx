import React, { useState, useEffect } from 'react';
import { Save, DollarSign } from 'lucide-react';
import { collection, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { Product } from '../types';

interface AdminPriceManagerProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

export function AdminPriceManager({ products, setProducts }: AdminPriceManagerProps) {
  // État pour gérer le chargement et la sauvegarde
  const [isSaving, setIsSaving] = useState(false);
  const [virginPrice, setVirginPrice] = useState(1500);
  const [coloredPrice, setColoredPrice] = useState(1200);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Initialiser les prix à partir des produits existants
    const virgin = products.find(p => p.sourceType === 'virgin');
    const colored = products.find(p => p.sourceType === 'colored');
    
    if (virgin && virgin.price) {
      setVirginPrice(virgin.price);
    }
    
    if (colored && colored.price) {
      setColoredPrice(colored.price);
    }
  }, [products]);

  const handleSavePrices = async () => {
    try {
      setIsSaving(true);
      setSuccessMessage('');
      
      // S'assurer que les prix sont des nombres entiers (pas de décimales)
      const adjustedVirginPrice = virginPrice < 100 ? virginPrice * 1000 : virginPrice;
      const adjustedColoredPrice = coloredPrice < 100 ? coloredPrice * 1000 : coloredPrice;
      
      // Trouver les produits existants
      const virginProduct = products.find(p => p.sourceType === 'virgin');
      const coloredProduct = products.find(p => p.sourceType === 'colored');
      
      // Mettre à jour ou créer le produit vierge
      if (virginProduct && virginProduct.id) {
        // Mettre à jour le produit existant
        await updateDoc(doc(db, 'products', virginProduct.id), {
          price: adjustedVirginPrice,
          updatedAt: serverTimestamp()
        });
        
        // Ajouter une entrée dans l'historique des produits
        await addDoc(collection(db, 'productHistory'), {
          productId: virginProduct.id,
          action: 'update',
          field: 'price',
          oldValue: virginProduct.price,
          newValue: adjustedVirginPrice,
          timestamp: serverTimestamp()
        });
        
        // Mettre à jour l'état local
        setProducts(products.map(p => 
          p.id === virginProduct.id ? { ...p, price: adjustedVirginPrice } : p
        ));
      } else {
        // Créer un nouveau produit
        const newProduct = {
          name: 'Virgin Film',
          sourceType: 'virgin',
          price: adjustedVirginPrice,
          quantity: 0,
          createdAt: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, 'products'), newProduct);
        
        // Mettre à jour l'état local
        setProducts([...products, { 
          id: docRef.id, 
          ...newProduct, 
          createdAt: new Date() 
        } as unknown as Product]);
      }
      
      // Mettre à jour ou créer le produit coloré
      if (coloredProduct && coloredProduct.id) {
        // Mettre à jour le produit existant
        await updateDoc(doc(db, 'products', coloredProduct.id), {
          price: adjustedColoredPrice,
          updatedAt: serverTimestamp()
        });
        
        // Ajouter une entrée dans l'historique des produits
        await addDoc(collection(db, 'productHistory'), {
          productId: coloredProduct.id,
          action: 'update',
          field: 'price',
          oldValue: coloredProduct.price,
          newValue: adjustedColoredPrice,
          timestamp: serverTimestamp()
        });
        
        // Mettre à jour l'état local
        setProducts(products.map(p => 
          p.id === coloredProduct.id ? { ...p, price: adjustedColoredPrice } : p
        ));
      } else {
        // Créer un nouveau produit
        const newProduct = {
          name: 'Colored Film',
          sourceType: 'colored',
          price: adjustedColoredPrice,
          quantity: 0,
          createdAt: serverTimestamp()
        };
        
        const docRef = await addDoc(collection(db, 'products'), newProduct);
        
        // Mettre à jour l'état local
        setProducts([...products, { 
          id: docRef.id, 
          ...newProduct, 
          createdAt: new Date() 
        } as unknown as Product]);
      }
      
      // Forcer le rechargement de la page pour s'assurer que les modifications sont prises en compte
      setSuccessMessage('Prix mis à jour avec succès ! La page va se recharger pour appliquer les modifications...');
      setIsSaving(false);
      
      // Attendre 2 secondes avant de recharger la page
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour des prix:', error);
      setIsSaving(false);
      alert('Une erreur est survenue lors de la mise à jour des prix. Veuillez réessayer.');
    }
  };

  // Fonction pour formater les nombres avec séparateur de milliers
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gestion des Prix</h2>
        <DollarSign className="h-8 w-8 text-green-600" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-green-50 rounded-lg p-6 border border-green-100">
          <h3 className="text-lg font-semibold text-green-800 mb-4">Prix du Film Vierge</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prix par kilogramme (FCFA/kg)
            </label>
            <div className="flex items-center">
              <input
                type="number"
                min="0"
                value={virginPrice}
                onChange={(e) => setVirginPrice(Number(e.target.value))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              />
              <span className="ml-2 text-gray-600">FCFA</span>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Prix actuel: <span className="font-semibold text-green-700">{formatNumber(virginPrice)} FCFA/kg</span>
          </div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">Prix du Film Coloré</h3>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prix par kilogramme (FCFA/kg)
            </label>
            <div className="flex items-center">
              <input
                type="number"
                min="0"
                value={coloredPrice}
                onChange={(e) => setColoredPrice(Number(e.target.value))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <span className="ml-2 text-gray-600">FCFA</span>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Prix actuel: <span className="font-semibold text-blue-700">{formatNumber(coloredPrice)} FCFA/kg</span>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        {successMessage && (
          <div className="mr-4 px-4 py-2 bg-green-100 text-green-800 rounded-md">
            {successMessage}
          </div>
        )}
        <button
          onClick={handleSavePrices}
          disabled={isSaving}
          className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Enregistrer les prix
            </>
          )}
        </button>
      </div>
    </div>
  );
}
