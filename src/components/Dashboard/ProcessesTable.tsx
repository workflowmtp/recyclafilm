import { useState } from 'react';
import { format } from 'date-fns';
import { Timer, Search, Download } from 'lucide-react';
import type { RecyclingProcess } from '../../types';

interface ProcessesTableProps {
  processes: RecyclingProcess[];
}

export function ProcessesTable({ processes }: ProcessesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('startDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleExportCSV = () => {
    // Préparer les données pour l'export
    const headers = ['Cycle Number', 'Start Date', 'Film Type', 'Input (kg)', 'Expected Completion', 'Status', 'Outsourced', 'Outsourcing Partner', 'Yield Rate'];
    
    const csvData = filteredProcesses.map(process => [
      process.cycleNumber.toString(),
      format(process.startDate, 'dd/MM/yyyy'),
      process.filmType,
      process.inputQuantity.toString(),
      process.expectedCompletion ? format(process.expectedCompletion, 'dd/MM/yyyy') : '',
      process.status,
      process.outsourced ? 'Yes' : 'No',
      process.outsourcingPartner || '',
      process.yieldRate ? `${process.yieldRate}%` : ''
    ]);
    
    // Créer le contenu CSV
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    // Créer un blob et un lien de téléchargement
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `recycling_processes_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredProcesses = processes.filter(process => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (process.cycleNumber?.toString() || '').includes(searchTerm) ||
      (process.status?.toLowerCase() || '').includes(searchLower) ||
      (process.filmType?.toLowerCase() || '').includes(searchLower) ||
      (process.outsourcingPartner?.toLowerCase() || '').includes(searchLower) ||
      format(process.startDate, 'dd/MM/yyyy').includes(searchTerm)
    );
  });

  const sortedProcesses = [...filteredProcesses].sort((a, b) => {
    if (sortField === 'cycleNumber') {
      const aCycleNumber = a.cycleNumber !== undefined ? a.cycleNumber : 0;
      const bCycleNumber = b.cycleNumber !== undefined ? b.cycleNumber : 0;
      return sortDirection === 'asc' 
        ? aCycleNumber - bCycleNumber
        : bCycleNumber - aCycleNumber;
    } else if (sortField === 'startDate') {
      return sortDirection === 'asc' 
        ? a.startDate.getTime() - b.startDate.getTime() 
        : b.startDate.getTime() - a.startDate.getTime();
    } else if (sortField === 'filmType') {
      const aFilmType = a.filmType || '';
      const bFilmType = b.filmType || '';
      return sortDirection === 'asc'
        ? aFilmType.localeCompare(bFilmType)
        : bFilmType.localeCompare(aFilmType);
    } else if (sortField === 'inputQuantity') {
      const aInputQuantity = a.inputQuantity !== undefined ? a.inputQuantity : 0;
      const bInputQuantity = b.inputQuantity !== undefined ? b.inputQuantity : 0;
      return sortDirection === 'asc'
        ? aInputQuantity - bInputQuantity
        : bInputQuantity - aInputQuantity;
    } else if (sortField === 'expectedCompletion') {
      if (!a.expectedCompletion) return sortDirection === 'asc' ? -1 : 1;
      if (!b.expectedCompletion) return sortDirection === 'asc' ? 1 : -1;
      return sortDirection === 'asc'
        ? a.expectedCompletion.getTime() - b.expectedCompletion.getTime()
        : b.expectedCompletion.getTime() - a.expectedCompletion.getTime();
    } else if (sortField === 'status') {
      const aStatus = a.status || '';
      const bStatus = b.status || '';
      return sortDirection === 'asc'
        ? aStatus.localeCompare(bStatus)
        : bStatus.localeCompare(aStatus);
    } else if (sortField === 'outsourced') {
      const aValue = a.outsourced ? 1 : 0;
      const bValue = b.outsourced ? 1 : 0;
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    } else if (sortField === 'yieldRate') {
      const aYieldRate = a.yieldRate !== undefined ? a.yieldRate : 0;
      const bYieldRate = b.yieldRate !== undefined ? b.yieldRate : 0;
      return sortDirection === 'asc'
        ? aYieldRate - bYieldRate
        : bYieldRate - aYieldRate;
    }
    return 0;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Processus de Recyclage</h2>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto mt-2 sm:mt-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher des processus..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('cycleNumber')}
              >
                Cycle Number
                {sortField === 'cycleNumber' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('startDate')}
              >
                Start Date
                {sortField === 'startDate' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('filmType')}
              >
                Film Type
                {sortField === 'filmType' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('inputQuantity')}
              >
                Input (kg)
                {sortField === 'inputQuantity' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('expectedCompletion')}
              >
                Expected Completion
                {sortField === 'expectedCompletion' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('status')}
              >
                Status
                {sortField === 'status' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('outsourced')}
              >
                Outsourced
                {sortField === 'outsourced' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('yieldRate')}
              >
                Yield Rate
                {sortField === 'yieldRate' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedProcesses.map((process) => (
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
            {sortedProcesses.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500">
                  Aucun processus trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}