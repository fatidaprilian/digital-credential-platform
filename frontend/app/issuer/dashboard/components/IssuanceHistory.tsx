'use client';

import { History, Loader } from 'lucide-react';
import { IssuanceLog } from '../types';

interface IssuanceHistoryProps {
  history: IssuanceLog[];
  isLoading: boolean;
}

export function IssuanceHistory({ history, isLoading }: IssuanceHistoryProps) {
  return (
    <div className="bg-gradient-to-br from-[#EEEEEE]/10 to-[#EEEEEE]/5 backdrop-blur-sm border border-[#EEEEEE]/20 rounded-2xl p-6 sm:p-8">
      <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
        <History className="w-8 h-8 mr-4 text-[#00ADB5]" />
        Riwayat Penerbitan
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#EEEEEE]/20">
          <thead className="bg-black/20">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#EEEEEE]/70 uppercase tracking-wider">Tanggal</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#EEEEEE]/70 uppercase tracking-wider">Template</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#EEEEEE]/70 uppercase tracking-wider">Penerima</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#EEEEEE]/70 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#EEEEEE]/70 uppercase tracking-wider">Hash Transaksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEEEEE]/10">
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-10"><Loader className="animate-spin inline-block w-8 h-8 text-[#00ADB5]" /></td></tr>
            ) : history.length > 0 ? (
              history.map((log) => (
                <tr key={log.id} className="hover:bg-black/10">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{new Date(log.issuedAt).toLocaleString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{log.template.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#00ADB5] font-mono" title={log.recipientAddress}>
                    {log.recipientAddress.substring(0, 6)}...{log.recipientAddress.substring(log.recipientAddress.length - 4)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-500/20 text-green-200">{log.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#EEEEEE]/80">
                     <a href={`https://amoy.polygonscan.com/tx/${log.transactionHash}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                       {log.transactionHash.substring(0, 8)}...
                     </a>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="text-center py-10 text-[#EEEEEE]/70">Belum ada riwayat penerbitan.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}