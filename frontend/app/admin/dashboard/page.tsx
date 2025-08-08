"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building, Users, FileCheck, Search, X, CheckCircle, PauseCircle, Clock, Eye, RefreshCw, LogOut
} from 'lucide-react';

// Type Definitions
interface Institution {
  id: number;
  name: string;
  officialEmail: string;
  status: 'ACTIVE' | 'PENDING_ADMIN_VERIFICATION' | 'REJECTED' | 'SUSPENDED';
  issuanceCredits: number;
  adminUser: {
      email: string;
      createdAt: string;
  };
}

interface SystemStats {
    totalInstitutions: number;
    pendingInstitutions: number;
    totalUsers: number;
    credentialsIssued: number;
}

// Reusable Components
const StatCard = ({ title, value, icon: Icon, isLoading }: any) => (
    <div className="bg-[#393E46]/50 backdrop-blur-sm border border-white/10 rounded-xl p-5 flex items-center gap-5">
        <div className="bg-gradient-to-br from-[#00ADB5]/30 to-[#393E46] p-4 rounded-lg">
            <Icon className={`w-7 h-7 text-[#00ADB5] ${isLoading ? 'animate-spin' : ''}`} />
        </div>
        <div>
            <p className="text-gray-300 text-sm font-medium">{title}</p>
            {isLoading ? <div className="h-8 w-16 bg-gray-600/50 rounded-md animate-pulse mt-1"></div> : <p className="text-2xl font-bold text-white">{value}</p> }
        </div>
    </div>
);

const StatusBadge = ({ status }: { status: Institution['status'] }) => {
    const statusMap = {
        ACTIVE: { text: 'Aktif', color: 'bg-green-500/20 text-green-400', icon: <CheckCircle size={14}/> },
        PENDING_ADMIN_VERIFICATION: { text: 'Pending', color: 'bg-yellow-500/20 text-yellow-400', icon: <Clock size={14}/> },
        SUSPENDED: { text: 'Nonaktif', color: 'bg-red-500/20 text-red-400', icon: <PauseCircle size={14}/> },
        REJECTED: { text: 'Ditolak', color: 'bg-gray-500/20 text-gray-400', icon: <X size={14}/> },
    };
    const currentStatus = statusMap[status] || statusMap.REJECTED;
    return <div className={`flex items-center gap-2 text-xs font-medium px-2.5 py-1 rounded-full ${currentStatus.color}`}>{currentStatus.icon}<span>{currentStatus.text}</span></div>;
};


export default function AdminDashboardPage() {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [managedInstitutions, setManagedInstitutions] = useState<Institution[]>([]);
    const [pendingInstitutions, setPendingInstitutions] = useState<Institution[]>([]);
    const [isLoading, setIsLoading] = useState({ stats: true, table: true });
    const [activeTab, setActiveTab] = useState<'manage' | 'pending'>('manage');
    const [searchQuery, setSearchQuery] = useState('');
    const [submittingId, setSubmittingId] = useState<number | null>(null);
    const router = useRouter();

    const apiRequest = useCallback(async (endpoint: string, method: 'GET' | 'PATCH' = 'GET', body?: any) => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            router.push('/admin/login');
            return;
        }
        
        // --- REVISI UTAMA ADA DI SINI ---
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        
        const response = await fetch(`${apiUrl}${endpoint}`, {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            if(response.status === 401) router.push('/admin/login');
            throw new Error(`Request failed: ${response.statusText}`);
        }
        if (response.headers.get("content-length") === "0") return null;
        return response.json();
    }, [router]);

    const fetchData = useCallback(async () => {
        setIsLoading({ stats: true, table: true });
        try {
            const [statsData, managedData, pendingData] = await Promise.all([
                // Pastikan endpoint diawali dengan '/'
                apiRequest('/admin/stats'),
                apiRequest(`/admin/institutions/manage?search=${searchQuery}`),
                apiRequest('/admin/institutions/pending'),
            ]);
            setStats(statsData);
            setManagedInstitutions(managedData || []);
            setPendingInstitutions(pendingData || []);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setIsLoading({ stats: false, table: false });
        }
    }, [apiRequest, searchQuery]);

    useEffect(() => {
        const handler = setTimeout(() => {
            fetchData();
        }, 300);
        return () => clearTimeout(handler);
    }, [fetchData]);


    const handleAction = async (id: number, action: 'suspend' | 'activate' | 'approve' | 'reject') => {
        setSubmittingId(id);
        try {
            if (action === 'reject') {
                const reason = prompt('Masukkan alasan penolakan:');
                if (!reason) { setSubmittingId(null); return; }
                await apiRequest(`/admin/institutions/${id}/reject`, 'PATCH', { rejectionReason: reason });
            } else {
                await apiRequest(`/admin/institutions/${id}/${action}`, 'PATCH');
            }
            await fetchData();
        } catch (error) {
            console.error(`Failed to ${action} institution:`, error);
            alert(`Gagal melakukan aksi: ${action}. Silakan coba lagi.`);
        } finally {
            setSubmittingId(null);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        router.push('/admin/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#222831] via-[#393E46] to-[#222831] text-[#EEEEEE] p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Dasbor Admin</h1>
                        <p className="text-gray-300 mt-1">Monitoring dan manajemen platform VERITASID.</p>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 font-semibold px-4 py-2 rounded-lg transition-colors"
                        title="Keluar"
                    >
                        <LogOut size={16} />
                        <span>Logout</span>
                    </button>
                </header>

                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard title="Total Institusi" value={stats?.totalInstitutions ?? 0} icon={Building} isLoading={isLoading.stats} />
                        <StatCard title="Pending" value={stats?.pendingInstitutions ?? 0} icon={Clock} isLoading={isLoading.stats} />
                        <StatCard title="Total Pengguna" value={stats?.totalUsers ?? 0} icon={Users} isLoading={isLoading.stats} />
                        <StatCard title="Kredensial Terbit" value={stats?.credentialsIssued ?? 0} icon={FileCheck} isLoading={isLoading.stats} />
                    </div>
                </motion.div>

                <div className="flex border-b border-white/10 mb-6">
                     <button onClick={() => setActiveTab('manage')} className={`px-4 py-3 font-semibold transition-colors ${activeTab === 'manage' ? 'text-[#00ADB5] border-b-2 border-[#00ADB5]' : 'text-gray-400 hover:text-white'}`}>Manajemen Institusi</button>
                    <button onClick={() => setActiveTab('pending')} className={`px-4 py-3 font-semibold transition-colors relative ${activeTab === 'pending' ? 'text-[#00ADB5] border-b-2 border-[#00ADB5]' : 'text-gray-400 hover:text-white'}`}>
                        Persetujuan Baru {pendingInstitutions && pendingInstitutions.length > 0 && <span className="absolute top-2 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{pendingInstitutions.length}</span>}
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                        {activeTab === 'manage' && (
                             <div className="bg-[#222831]/50 border border-white/10 rounded-xl">
                                <div className="p-4 border-b border-white/10"><div className="relative"><input type="text" placeholder="Cari institusi (nama atau email)..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#393E46] border border-white/10 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-[#00ADB5] focus:border-transparent transition" /><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /></div></div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead className="border-b border-white/10"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Nama Institusi</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Kredit</th><th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Aksi</th></tr></thead>
                                        <tbody className="divide-y divide-white/10">
                                            {isLoading.table ? Array.from({length: 3}).map((_, i) => <tr key={i}><td colSpan={4} className="p-4"><div className="h-10 bg-gray-600/50 rounded-md animate-pulse"></div></td></tr>) : managedInstitutions && managedInstitutions.map(inst => (
                                                <tr key={inst.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap"><div className="font-semibold text-white">{inst.name}</div><div className="text-sm text-gray-400">{inst.officialEmail}</div></td>
                                                    <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={inst.status} /></td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-white font-mono">{inst.issuanceCredits}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        {submittingId === inst.id ? <RefreshCw className="w-4 h-4 animate-spin text-gray-400 ml-auto" /> : <>
                                                            {inst.status === 'ACTIVE' && <button onClick={() => handleAction(inst.id, 'suspend')} className="text-red-400 hover:text-red-300">Nonaktifkan</button>}
                                                            {inst.status === 'SUSPENDED' && <button onClick={() => handleAction(inst.id, 'activate')} className="text-green-400 hover:text-green-300">Aktifkan</button>}
                                                        </>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        {activeTab === 'pending' && (
                            <div>
                                {isLoading.table ? <div className="h-20 w-full bg-gray-600/50 rounded-md animate-pulse"></div> : pendingInstitutions && pendingInstitutions.length > 0 ? <div className="space-y-4">{pendingInstitutions.map(inst => (
                                    <div key={inst.id} className="bg-[#393E46]/50 p-4 rounded-lg border border-transparent hover:border-[#00ADB5]/50 flex justify-between items-center transition-colors">
                                        <div><p className="font-bold text-white">{inst.name}</p><p className="text-sm text-gray-400">Pendaftar: {inst.adminUser?.email || 'N/A'}</p></div>
                                        <div className="flex gap-1">
                                            {submittingId === inst.id ? <RefreshCw className="w-5 h-5 animate-spin text-gray-400 mx-auto my-2" /> : <>
                                                <button onClick={() => alert("Tampilkan detail pendaftar")} className="p-2 hover:bg-white/10 rounded-md transition-colors" title="Lihat Detail"><Eye size={16}/></button>
                                                <button onClick={() => handleAction(inst.id, 'reject')} className="p-2 text-red-400 hover:bg-red-500/20 rounded-md transition-colors" title="Tolak"><X size={16}/></button>
                                                <button onClick={() => handleAction(inst.id, 'approve')} className="p-2 text-green-400 hover:bg-green-500/20 rounded-md transition-colors" title="Setujui"><CheckCircle size={16}/></button>
                                            </>}
                                        </div>
                                    </div>
                                ))}</div> : <p className="text-center text-gray-400 py-10">Tidak ada institusi yang menunggu persetujuan.</p>}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}