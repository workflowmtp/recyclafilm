import React from 'react';
import { format } from 'date-fns';
import { Timer } from 'lucide-react';
import type { RecyclingProcess } from '../../types';

interface ProcessesTableProps {
  processes: RecyclingProcess[];
}

export function ProcessesTable({ processes }: ProcessesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cycle Number
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Start Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Film Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Input (kg)
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Expected Completion
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Outsourced
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Yield Rate
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {processes.map((process) => (
            <tr key={process.id}>
              <td className="px-6 py-4 whitespace-nowrap font-medium">
                {process.cycleNumber}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {format(process.startDate, 'dd/MM/yyyy')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    process.filmType === 'virgin'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-blue-50 text-blue-700'
                  }`}
                >
                  {process.filmType}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {process.inputQuantity}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {process.expectedCompletion && (
                  <div className="flex items-center space-x-1">
                    <Timer size={16} className="text-gray-400" />
                    <span>{format(process.expectedCompletion, 'dd/MM/yyyy')}</span>
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    process.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : process.status === 'processing'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {process.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    process.outsourced
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {process.outsourced ? 'Yes' : 'No'}
                </span>
                {process.outsourcingPartner && (
                  <div className="text-xs text-gray-500 mt-1">
                    {process.outsourcingPartner}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {process.yieldRate && (
                  <span className="text-gray-900">{process.yieldRate}%</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}