"use client";

import { useEffect, useState, useCallback, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, Transition } from '@headlessui/react';
import {
    Building, Users, FileCheck, Clock, Eye, X, CheckCircle, LogOut, Search, RefreshCw, AlertTriangle, ShieldCheck, ShieldX, PauseCircle, PlayCircle
} from 'lucide-react';

// --- Type Definitions ---
interface Institution {
  id: number;
  name: string;
  officialEmail: string;
  status: 'ACTIVE' | 'PENDING_ADMIN_VERIFICATION' | 'REJECTED' | 'SUSPENDED';
  issuanceCredits: number;
  verificationDocumentUrl?: string; // Diperbarui untuk bisa undefined
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

// --- Reusable Components ---
const StatCard = ({ title, value, icon: Icon, isLoading }: any) => (
    <motion.div 
      className="bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-5 flex items-center gap-5 transform hover:-translate-y-1 transition-transform duration-300"
      whileHover={{ scale: 1.03 }}
    >
        <div className="bg-gradient-to-br from-[#00ADB5]/30 to-gray-800 p-4 rounded-lg">
            <Icon className={`w-7 h-7 text-[#00ADB5] ${isLoading ? 'animate-spin' : ''}`} />
        </div>
        <div>
            <p className="text-gray-400 text-sm font-medium">{title}</p>
            {isLoading ? <div className="h-8 w-16 bg-gray-700/50 rounded-md animate-pulse mt-1"></div> : <p className="text-3xl font-bold text-white">{value}</p> }
        </div>
    </motion.div>
);

const StatusBadge = ({ status }: { status: Institution['status'] }) => {
    const statusMap = {
        ACTIVE: { text: 'Aktif', color: 'bg-green-500/20 text-green-300', icon: <PlayCircle size={14}/> },
        PENDING_ADMIN_VERIFICATION: { text: 'Pending', color: 'bg-yellow-500/20 text-yellow-300', icon: <Clock size={14}/> },
        SUSPENDED: { text: 'Ditangguhkan', color: 'bg-orange-500/20 text-orange-300', icon: <PauseCircle size={14}/> },
        REJECTED: { text: 'Ditolak', color: 'bg-red-500/20 text-red-300', icon: <ShieldX size={14}/> },
    };
    const currentStatus = statusMap[status] || statusMap.REJECTED;
    return <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full ${currentStatus.color}`}>{currentStatus.icon}<span>{currentStatus.text}</span></div>;
};

// --- Modal Components ---
const ActionConfirmationModal = ({ isOpen, onClose, onConfirm, action, institutionName, isLoading }: any) => {
    const actionDetails = {
        approve: { title: "Setujui Pendaftaran", message: `Anda akan menyetujui dan mengaktifkan akun untuk`, color: "green", icon: <ShieldCheck/> },
        reject: { title: "Tolak Pendaftaran", message: `Anda akan menolak pendaftaran untuk`, color: "red", icon: <ShieldX/> },
        suspend: { title: "Tangguhkan Institusi", message: `Anda akan menangguhkan akun untuk`, color: "orange", icon: <PauseCircle/> },
        activate: { title: "Aktifkan Kembali", message: `Anda akan mengaktifkan kembali akun untuk`, color: "blue", icon: <PlayCircle/> },
    };
    const details = actionDetails[action] || {};

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                </Transition.Child>
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gray-800 border border-white/10 p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className={`text-lg font-bold leading-6 text-${details.color}-400 flex items-center gap-2`}>{details.icon} {details.title}</Dialog.Title>
                                <div className="mt-4">
                                    <p className="text-sm text-gray-300">{details.message} <strong>{institutionName}</strong>. Apakah Anda yakin?</p>
                                </div>
                                <div className="mt-6 flex justify-end gap-3">
                                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-200 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition">Batal</button>
                                    <button onClick={onConfirm} disabled={isLoading} className={`px-4 py-2 text-sm font-medium text-white bg-${details.color}-500 rounded-lg hover:bg-${details.color}-600 transition disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2`}>
                                        {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                                        Ya, Lanjutkan
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

const InstitutionDetailModal = ({ isOpen, onClose, institution, onAction, onOpenDocument, isActionLoading, isDocLoading }: any) => {
    if (!institution) return null;
    
    return (
         <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                 <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                </Transition.Child>
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                         <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-gray-800 border border-white/10 p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-white flex items-center gap-3"><Building /> Detail Pendaftar</Dialog.Title>
                                
                                <div className="mt-4 space-y-3">
                                    <p className="text-gray-400"><strong>Nama Institusi:</strong> <span className="text-gray-200">{institution.name}</span></p>
                                    <p className="text-gray-400"><strong>Email Resmi:</strong> <span className="text-gray-200">{institution.officialEmail}</span></p>
                                    <p className="text-gray-400"><strong>Email Pendaftar:</strong> <span className="text-gray-200">{institution.adminUser?.email}</span></p>
                                    <p className="text-gray-400"><strong>Tanggal Daftar:</strong> <span className="text-gray-200">{new Date(institution.adminUser?.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span></p>
                                </div>

                                <div className="mt-6 border-t border-white/10 pt-4 flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={onOpenDocument}
                                        disabled={!institution.verificationDocumentUrl || isDocLoading}
                                        className="w-full flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isDocLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                                        Lihat Dokumen
                                    </button>
                                    <div className="flex-1 flex gap-3">
                                      <button onClick={() => onAction('reject')} disabled={isActionLoading} className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2 disabled:opacity-50">
                                          {isActionLoading && onAction.current === 'reject' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />} Tolak
                                      </button>
                                      <button onClick={() => onAction('approve')} disabled={isActionLoading} className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50">
                                          {isActionLoading && onAction.current === 'approve' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Setujui
                                      </button>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};


// --- Main Dashboard Component ---
export default function AdminDashboardPage() {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [managedInstitutions, setManagedInstitutions] =useState<Institution[]>([]);
    const [pendingInstitutions, setPendingInstitutions] = useState<Institution[]>([]);
    const [isLoading, setIsLoading] = useState({ stats: true, table: true });
    const [activeTab, setActiveTab] = useState<'manage' | 'pending'>('manage');
    const [searchQuery, setSearchQuery] = useState('');
    const [modalState, setModalState] = useState<{ type: 'action' | 'detail' | null; data: any }>({ type: null, data: {} });
    const [submitting, setSubmitting] = useState({ id: null, type: null, loading: false });
    const [viewingDoc, setViewingDoc] = useState(false);
    
    const router = useRouter();

    const apiRequest = useCallback(async (endpoint: string, options: RequestInit = {}) => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            router.push('/admin/login');
            return Promise.reject(new Error("No auth token"));
        }
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${apiUrl}${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            if (response.status === 401) router.push('/admin/login');
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.message || 'Request failed');
        }
        
        if (response.headers.get("Content-Type")?.includes("application/json")) {
           return response.json();
        }
        return response.blob(); // Handle file responses
    }, [router]);

    const fetchData = useCallback(async () => {
        setIsLoading({ stats: true, table: true });
        try {
            const [statsData, managedData, pendingData] = await Promise.all([
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
        const handler = setTimeout(() => { fetchData(); }, searchQuery ? 300 : 0);
        return () => clearTimeout(handler);
    }, [fetchData, searchQuery]);

    const openActionModal = (action: string, institution: Institution) => {
        setModalState({ type: 'action', data: { action, institution }});
    };

    const openDetailModal = (institution: Institution) => {
        setModalState({ type: 'detail', data: { institution } });
    };

    const handleConfirmAction = async () => {
        const { action, institution } = modalState.data;
        setSubmitting({ id: institution.id, type: action, loading: true });
        try {
            let body;
            if (action === 'reject') {
                const reason = prompt('Masukkan alasan penolakan:');
                if (!reason) { 
                    setSubmitting({ id: null, type: null, loading: false });
                    return; 
                }
                body = { rejectionReason: reason };
            }
            await apiRequest(`/admin/institutions/${institution.id}/${action}`, { method: 'PATCH', body: JSON.stringify(body) });
            await fetchData();
            setModalState({ type: null, data: {} });
        } catch (error: any) {
            console.error(`Failed to ${action} institution:`, error);
            alert(`Gagal melakukan aksi: ${action}. Pesan: ${error.message}`);
        } finally {
            setSubmitting({ id: null, type: null, loading: false });
        }
    };
    
    const handleViewDocument = async (id: number) => {
        setViewingDoc(true);
        try {
            const blob: any = await apiRequest(`/admin/institutions/${id}/document`);
            const fileURL = URL.createObjectURL(blob);
            window.open(fileURL, '_blank');
        } catch (error) {
            console.error('Error viewing document:', error);
            alert('Tidak dapat menampilkan dokumen.');
        } finally {
            setViewingDoc(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        router.push('/admin/login');
    };

    return (
        <div className="min-h-screen bg-gray-900 text-[#EEEEEE] p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Dasbor Admin</h1>
                        <p className="text-gray-400 mt-1">Monitoring dan manajemen platform VERITASID.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={fetchData} className="p-2.5 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors" title="Refresh Data"><RefreshCw size={18} className={isLoading.stats || isLoading.table ? 'animate-spin' : ''} /></button>
                      <button onClick={handleLogout} className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/40 text-red-300 font-semibold px-4 py-2 rounded-lg transition-colors" title="Keluar">
                          <LogOut size={16} /> <span className="hidden sm:inline">Logout</span>
                      </button>
                    </div>
                </header>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard title="Total Institusi" value={stats?.totalInstitutions ?? '-'} icon={Building} isLoading={isLoading.stats} />
                        <StatCard title="Pending" value={stats?.pendingInstitutions ?? '-'} icon={Clock} isLoading={isLoading.stats} />
                        <StatCard title="Total Pengguna" value={stats?.totalUsers ?? '-'} icon={Users} isLoading={isLoading.stats} />
                        <StatCard title="Kredensial Terbit" value={stats?.credentialsIssued ?? '-'} icon={FileCheck} isLoading={isLoading.stats} />
                    </div>
                </motion.div>

                <div className="bg-gray-800/50 border border-white/10 rounded-2xl p-2 sm:p-4">
                  <div className="flex border-b border-white/10 mb-4">
                      <button onClick={() => setActiveTab('manage')} className={`px-3 sm:px-4 py-3 font-semibold transition-colors text-sm sm:text-base ${activeTab === 'manage' ? 'text-[#00ADB5] border-b-2 border-[#00ADB5]' : 'text-gray-400 hover:text-white'}`}>Manajemen</button>
                      <button onClick={() => setActiveTab('pending')} className={`px-3 sm:px-4 py-3 font-semibold transition-colors relative text-sm sm:text-base ${activeTab === 'pending' ? 'text-[#00ADB5] border-b-2 border-[#00ADB5]' : 'text-gray-400 hover:text-white'}`}>
                          Persetujuan Baru 
                          <AnimatePresence>
                          {pendingInstitutions && pendingInstitutions.length > 0 && 
                            <motion.span initial={{scale:0}} animate={{scale:1}} exit={{scale:0}} className="absolute top-2 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                              {pendingInstitutions.length}
                            </motion.span>}
                          </AnimatePresence>
                      </button>
                  </div>

                  <AnimatePresence mode="wait">
                      <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                          {activeTab === 'manage' && (
                              <div>
                                  <div className="p-2 mb-4"><div className="relative"><input type="text" placeholder="Cari institusi (nama atau email)..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-900/50 border-2 border-white/10 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-[#00ADB5] focus:outline-none transition" /><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" /></div></div>
                                  <div className="overflow-x-auto">
                                      <table className="min-w-full">
                                          <thead className="border-b-2 border-white/10"><tr><th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Nama Institusi</th><th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th><th className="px-6 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Kredit</th><th className="px-6 py-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Aksi</th></tr></thead>
                                          <tbody className="divide-y divide-white/10">
                                              {isLoading.table ? Array.from({length: 3}).map((_, i) => <tr key={i}><td colSpan={4} className="p-4"><div className="h-12 bg-gray-700/50 rounded-md animate-pulse"></div></td></tr>)
                                              : managedInstitutions.length === 0 ? <tr><td colSpan={4} className="text-center py-10 text-gray-400">Tidak ada data ditemukan.</td></tr>
                                              : managedInstitutions.map(inst => (
                                                  <tr key={inst.id} className="hover:bg-white/5">
                                                      <td className="px-6 py-4 whitespace-nowrap"><div className="font-semibold text-white">{inst.name}</div><div className="text-sm text-gray-400">{inst.officialEmail}</div></td>
                                                      <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={inst.status} /></td>
                                                      <td className="px-6 py-4 whitespace-nowrap text-white font-mono">{inst.issuanceCredits}</td>
                                                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                          {submitting.loading && submitting.id === inst.id ? <RefreshCw className="w-4 h-4 animate-spin text-gray-400 ml-auto" /> : 
                                                            <div className="flex gap-2 justify-end">
                                                              {inst.status === 'ACTIVE' && <button onClick={() => openActionModal('suspend', inst)} className="text-orange-400 hover:text-orange-300">Tangguhkan</button>}
                                                              {inst.status === 'SUSPENDED' && <button onClick={() => openActionModal('activate', inst)} className="text-blue-400 hover:text-blue-300">Aktifkan</button>}
                                                            </div>
                                                          }
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
                                  {isLoading.table ? Array.from({length: 2}).map((_, i) => <div key={i} className="p-4 m-2"><div className="h-16 bg-gray-700/50 rounded-md animate-pulse"></div></div>) 
                                  : pendingInstitutions.length > 0 ? <div className="space-y-3 p-2">{pendingInstitutions.map(inst => (
                                      <motion.div whileHover={{ scale: 1.01, borderColor: '#00ADB5' }} key={inst.id} className="bg-gray-900/50 p-4 rounded-lg border border-transparent flex justify-between items-center transition-colors">
                                          <div>
                                              <p className="font-bold text-white">{inst.name}</p>
                                              <p className="text-sm text-gray-400">{inst.adminUser?.email || 'N/A'}</p>
                                          </div>
                                          <button onClick={() => openDetailModal(inst)} className="px-4 py-2 bg-[#00ADB5]/20 text-[#00ADB5] hover:bg-[#00ADB5]/40 rounded-lg text-sm font-semibold flex items-center gap-2 transition">
                                              <Eye size={16}/> Tindak Lanjut
                                          </button>
                                      </motion.div>
                                  ))}</div> 
                                  : <p className="text-center text-gray-400 py-16">Tidak ada institusi yang menunggu persetujuan.</p>}
                              </div>
                          )}
                      </motion.div>
                  </AnimatePresence>
                </div>
            </div>
            
            {/* --- Modals Render --- */}
            <ActionConfirmationModal 
                isOpen={modalState.type === 'action'}
                onClose={() => setModalState({ type: null, data: {} })}
                onConfirm={handleConfirmAction}
                action={modalState.data.action}
                institutionName={modalState.data.institution?.name}
                isLoading={submitting.loading}
            />

            <InstitutionDetailModal
                isOpen={modalState.type === 'detail'}
                onClose={() => setModalState({ type: null, data: {} })}
                institution={modalState.data.institution}
                onAction={(action: string) => openActionModal(action, modalState.data.institution)}
                onOpenDocument={() => handleViewDocument(modalState.data.institution.id)}
                isActionLoading={submitting.loading}
                isDocLoading={viewingDoc}
            />

        </div>
    );
}