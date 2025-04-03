import React from 'react';
import { Package, Lock } from 'lucide-react';

interface ButtonConfig {
  isDisabled?: boolean;
  onClick?: () => void;
  icon: React.ReactNode;
  text: string;
  color: string;
  secondaryButton?: {
    onClick: () => void;
    icon: React.ReactNode;
    text: string;
    color: string;
  };
}

interface StockCardProps {
  title: string;
  virginStock: number;
  coloredStock: number;
  buttonConfig: ButtonConfig;
  isLoading?: boolean;
}

export function StockCard({ title, virginStock, coloredStock, buttonConfig, isLoading = false }: StockCardProps) {
  const { isDisabled, onClick, icon, text, color, secondaryButton } = buttonConfig;

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

  const getBgColor = () => {
    switch (color) {
      case 'orange':
        return 'bg-orange-50';
      case 'purple':
        return 'bg-purple-50';
      case 'blue':
        return 'bg-blue-50';
      default:
        return 'bg-green-50';
    }
  };

  const getTextColor = () => {
    switch (color) {
      case 'orange':
        return 'text-orange-600';
      case 'purple':
        return 'text-purple-600';
      case 'blue':
        return 'text-blue-600';
      default:
        return 'text-green-600';
    }
  };

  const getButtonClasses = () => {
    if (isDisabled) {
      return 'border-gray-300 text-gray-500 bg-gray-100 cursor-not-allowed';
    }
    switch (color) {
      case 'orange':
        return 'border-transparent text-white bg-orange-600 hover:bg-orange-700 focus:ring-orange-500';
      case 'purple':
        return 'border-transparent text-white bg-purple-600 hover:bg-purple-700 focus:ring-purple-500';
      case 'blue':
        return 'border-transparent text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
      default:
        return 'border-transparent text-white bg-green-600 hover:bg-green-700 focus:ring-green-500';
    }
  };

  return (
    <div className="col-span-2 bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
          <Package className={getTextColor()} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className={`${getBgColor()} p-3 rounded-lg`}>
            <div className="text-sm text-gray-600 mb-1">Virgin Films</div>
            <div className={`text-2xl font-bold ${getTextColor()}`}>{virginStock} kg</div>
          </div>
          <div className={`${getBgColor()} p-3 rounded-lg`}>
            <div className="text-sm text-gray-600 mb-1">Colored Films</div>
            <div className={`text-2xl font-bold ${getTextColor()}`}>{coloredStock} kg</div>
          </div>
        </div>
      </div>
      <div className="p-4 space-y-2">
        <button
          onClick={onClick}
          disabled={isDisabled}
          className={`w-full flex items-center justify-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${getButtonClasses()}`}
        >
          {isDisabled ? <Lock className="w-4 h-4 mr-2" /> : icon}
          {text}
        </button>
        
        {secondaryButton && (
          <button
            onClick={secondaryButton.onClick}
            className={`w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-${secondaryButton.color}-600 hover:bg-${secondaryButton.color}-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${secondaryButton.color}-500`}
          >
            {secondaryButton.icon}
            {secondaryButton.text}
          </button>
        )}
      </div>
    </div>
  );
}