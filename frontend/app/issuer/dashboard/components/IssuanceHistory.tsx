'use client';

import { History, Loader2, ChevronsRight, ChevronsLeft, AlertCircle, Copy, Hash } from 'lucide-react';
import { IssuanceLog } from '../types';
import { useState } from 'react';

interface IssuanceHistoryProps {
  history: IssuanceLog[];
  isLoading: boolean;
}

export function IssuanceHistory({ history, isLoading }: IssuanceHistoryProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const ITEMS_PER_PAGE = 10;

    const totalPages = Math.ceil(history.length / ITEMS_PER_PAGE);
    const paginatedHistory = history.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handleCopy = (text: string, id: number) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const getStatusChip = (status: string) => {
        switch(status.toLowerCase()){
            case 'completed':
            case 'confirmed':
                return <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-500/20 text-green-300">{status}</span>;
            case 'pending':
                return <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-500/20 text-yellow-300">{status}</span>;
            case 'failed':
                return <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-500/20 text-red-300">{status}</span>;
            default:
                return <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-500/20 text-gray-300">{status}</span>;
        }
    }

    return (
        <div className="bg-gradient-to-br from-[#EEEEEE]/10 to-[#EEEEEE]/5 backdrop-blur-sm border border-[#EEEEEE]/20 rounded-2xl p-6 sm:p-8">
            <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-4">
                <History className="w-8 h-8 text-[#00ADB5]" />
                Riwayat Penerbitan
            </h2>
            <p className="text-md text-[#EEEEEE]/70 mb-8">Lacak semua kredensial yang telah Anda terbitkan.</p>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#EEEEEE]/10">
                    <thead className="bg-black/20">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#EEEEEE]/70 uppercase tracking-wider">Tanggal & Waktu</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#EEEEEE]/70 uppercase tracking-wider">Template</th>
                            {/* --- KOLOM BARU --- */}
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#EEEEEE]/70 uppercase tracking-wider">Public ID (Untuk Verifikasi)</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#EEEEEE]/70 uppercase tracking-wider">On-Chain ID</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#EEEEEE]/70 uppercase tracking-wider">Penerima</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#EEEEEE]/70 uppercase tracking-wider">Status</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#EEEEEE]/70 uppercase tracking-wider">Hash Transaksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EEEEEE]/10">
                        {isLoading ? (
                            <tr><td colSpan={7} className="text-center py-20"><Loader2 className="animate-spin inline-block w-10 h-10 text-[#00ADB5]" /></td></tr>
                        ) : history.length > 0 ? (
                            paginatedHistory.map((log) => (
                                <tr key={log.id} className="hover:bg-black/20 transition-colors duration-200">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{new Date(log.issuedAt).toLocaleString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">{log.template.name}</td>
                                    {/* --- DATA BARU --- */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-mono">
                                        <div className="flex items-center gap-2">
                                            <span>{log.publicId.substring(0, 8)}...</span>
                                            <button onClick={() => handleCopy(log.publicId, log.id)} className="text-[#00ADB5] hover:text-white transition-colors">
                                                {copiedId === log.id ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-mono">
                                        <div className="flex items-center gap-2">
                                            <Hash className="w-4 h-4 text-[#EEEEEE]/50" />
                                            {log.credentialId}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#00ADB5] font-mono" title={log.recipientAddress}>
                                        {log.recipientAddress.substring(0, 6)}...{log.recipientAddress.substring(log.recipientAddress.length - 4)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusChip(log.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#EEEEEE]/80">
                                       <a href={`https://www.oklink.com/amoy/tx/${log.transactionHash}`} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-[#00ADB5] transition-colors">
                                            {log.transactionHash.substring(0, 8)}...
                                        </a>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="text-center py-20 text-[#EEEEEE]/70">
                                    <div className="flex flex-col items-center">
                                        <AlertCircle className="w-12 h-12 text-[#EEEEEE]/30 mb-4"/>
                                        <h3 className="text-xl font-semibold">Belum Ada Riwayat</h3>
                                        <p>Riwayat penerbitan Anda akan muncul di sini.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex justify-between items-center pt-6 mt-4 border-t border-white/10 text-sm">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 rounded-lg bg-black/20 hover:bg-white/10 disabled:opacity-50 flex items-center gap-2">
                        <ChevronsLeft className="w-4 h-4"/>
                        Sebelumnya
                    </button>
                    <span className="font-semibold">Halaman {currentPage} dari {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 rounded-lg bg-black/20 hover:bg-white/10 disabled:opacity-50 flex items-center gap-2">
                        Berikutnya
                        <ChevronsRight className="w-4 h-4"/>
                    </button>
                </div>
            )}
        </div>
    );
}
