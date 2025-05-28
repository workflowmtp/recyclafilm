import React from 'react';
import { Recycle, LogOut } from 'lucide-react';

interface HeaderProps {
  onDéconnexion: () => void;
}

export function Header({ onDéconnexion }: HeaderProps) {
  return (
    <nav className="bg-green-600 text-white p-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Recycle size={24} />
          <h1 className="text-xl font-bold">Gestion du recyclage des films PE</h1>
        </div>
        <button
          onClick={onDéconnexion}
          className="flex items-center space-x-2 px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
        >
          <LogOut size={20} />
          <span>Déconnexion</span>
        </button>
      </div>
    </nav>
  );
}