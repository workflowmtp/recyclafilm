import React from 'react';
import { TrendingUp } from 'lucide-react';

interface RevenueCardProps {
  totalRevenue: number;
}

export function RevenueCard({ totalRevenue }: RevenueCardProps) {
  return (
    <div className="col-span-2 bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-700">Revenue</h3>
        <TrendingUp className="text-green-600" />
      </div>
      <p className="text-2xl font-bold">{totalRevenue.toFixed(2)} FCFA</p>
    </div>
  );
}