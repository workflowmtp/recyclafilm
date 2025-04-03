import React from 'react';
import { Recycle, LogOut } from 'lucide-react';

interface HeaderProps {
  onLogout: () => void;
}

export function Header({ onLogout }: HeaderProps) {
  return (
    <nav className="bg-green-600 text-white p-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Recycle size={24} />
          <h1 className="text-xl font-bold">PE Film Recycling Management</h1>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center space-x-2 px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}