import React from 'react';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs = [
    { id: 'transactions', label: 'Transactions' },
    { id: 'processes', label: 'Recycling Processes' },
    { id: 'products', label: 'Products' },
    { id: 'sales', label: 'Sales' },
  ];

  return (
    <nav className="flex border-b">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === tab.id
              ? 'border-b-2 border-green-600 text-green-600'
              : 'text-gray-500'
          }`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}