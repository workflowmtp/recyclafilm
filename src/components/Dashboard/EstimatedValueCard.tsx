import React from 'react';
import { DollarSign } from 'lucide-react';

interface EstimatedValueCardProps {
  virginStock: number;
  coloredStock: number;
  virginPrice: number; // Prix par kg pour le film vierge
  coloredPrice: number; // Prix par kg pour le film coloré
  isLoading?: boolean;
}

export function EstimatedValueCard({ 
  virginStock, 
  coloredStock, 
  virginPrice = 1.5, // Prix par défaut pour le film vierge (1.5 FCFA/kg)
  coloredPrice = 1.2, // Prix par défaut pour le film coloré (1.2 FCFA/kg)
  isLoading = false 
}: EstimatedValueCardProps) {
  
  // Calcul des valeurs estimées
  const virginValue = virginStock * virginPrice;
  const coloredValue = coloredStock * coloredPrice;
  const totalValue = virginValue + coloredValue;

  if (isLoading) {
    return (
      <div className="col-span-2 bg-white rounded-lg shadow animate-pulse">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-6 w-6 bg-gray-200 rounded"></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-100 rounded-lg"></div>
            <div className="h-20 bg-gray-100 rounded-lg"></div>
          </div>
        </div>
        <div className="p-4">
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="col-span-2 bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-700">Valeur Estimée (Produits Finis)</h3>
          <DollarSign className="text-green-600" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Films Vierges</div>
            <div className="text-2xl font-bold text-green-600">FCFA {virginValue.toLocaleString()}</div>
            <div className="text-xs text-gray-500">{virginStock} kg × {virginPrice} FCFA/kg</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Films Colorés</div>
            <div className="text-2xl font-bold text-green-600">FCFA {coloredValue.toLocaleString()}</div>
            <div className="text-xs text-gray-500">{coloredStock} kg × {coloredPrice} FCFA/kg</div>
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Valeur Totale Estimée</div>
          <div className="text-2xl font-bold text-green-600">FCFA {totalValue.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}
