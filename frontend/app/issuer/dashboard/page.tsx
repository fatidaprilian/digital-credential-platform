'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LogOut, 
    FilePlus, 
    LayoutTemplate, 
    CreditCard, 
    FileSpreadsheet, 
    History, 
    User, 
    Settings,
    Award,
    Bell,
    Search,
    Filter,
    Eye,
    Edit,
    Trash2,
    Calendar,
    CheckCircle,
    XCircle,
    Clock,
    Users,
    FileText,
    TrendingUp,
    Download,
    Send,
    ArrowLeft,
    Copy, // <-- Import Ikon
    Hash  // <-- Import Ikon
} from 'lucide-react';

// Import components
import { FloatingParticles } from './components/FloatingParticles';
import { Alert } from './components/Alert';
import { MintCredentialForm } from './components/MintCredentialForm';
import { BillingSection } from './components/BillingSection';
import { BatchIssueForm } from './components/BatchIssueForm';

// Import types
import { Template, UserProfile, IssuanceLog } from './types';

// Dynamic import for client-side components
const TemplateBuilder = dynamic(() => import('@/components/TemplateBuilder'), {
  ssr: false,
  loading: () => <div className="min-h-[80vh] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00ADB5]"></div></div>,
});

// ==================================
// NEW & REVISED COMPONENTS
// ==================================

// 1. Dashboard Header
const DashboardHeader = ({ user, onLogout }: { user: UserProfile | null; onLogout: () => void; }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="bg-[#222831]/80 backdrop-blur-lg border-b border-[#EEEEEE]/10 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-12 h-12 bg-gradient-to-r from-[#00ADB5] to-[#393E46] rounded-lg flex items-center justify-center shadow-lg"
            >
              <Award className="w-7 h-7 text-white" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold text-white">Dasbor Institusi</h1>
              <p className="text-sm text-[#EEEEEE]/60">{user?.institution?.name || 'Kelola kredensial Anda'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-[#EEEEEE]/60 hover:text-[#00ADB5] transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#222831]"></span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-[#393E46]/50 transition-colors"
              >
                <div className="w-10 h-10 bg-[#00ADB5] rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-white truncate max-w-[150px]">{user?.institution?.name || 'User'}</p>
                  <p className="text-xs text-[#EEEEEE]/60">{user?.email}</p>
                </div>
              </button>

              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 bg-[#2d343c] border border-[#EEEEEE]/20 rounded-xl shadow-2xl py-2"
                    onMouseLeave={() => setShowProfileMenu(false)}
                  >
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-sm font-semibold text-white">Signed in as</p>
                      <p className="text-sm text-[#EEEEEE]/70 truncate">{user?.email}</p>
                    </div>
                    <button className="w-full mt-1 px-4 py-2.5 text-left text-sm text-[#EEEEEE]/80 hover:bg-[#393E46]/50 flex items-center gap-3 transition-colors">
                      <Settings className="w-4 h-4" />
                      Pengaturan Akun
                    </button>
                    <button 
                      onClick={onLogout}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Keluar
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

// 2. Stats Card
const StatsCard = ({ icon: Icon, title, value, color = '#00ADB5' }: { icon: any; title: string; value: string | number; color?: string; }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-[#222831]/60 backdrop-blur-lg border border-[#EEEEEE]/10 rounded-2xl p-6 hover:border-[#EEEEEE]/20 transition-all duration-300"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[#EEEEEE]/60 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold text-white mt-1">{value}</p>
      </div>
      <div 
        className="w-14 h-14 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="w-7 h-7" style={{ color }} />
      </div>
    </div>
  </motion.div>
);

// 3. Quick Actions
const QuickActions = ({ onActionClick }: { onActionClick: (action: string) => void }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    {[
        { id: 'issue', title: 'Terbitkan Satuan', desc: 'Buat satu kredensial', icon: Send, primary: true },
        { id: 'batch-issue', title: 'Terbitkan Batch', desc: 'Unggah file CSV', icon: FileSpreadsheet },
        { id: 'builder', title: 'Desain Template', desc: 'Buat template baru', icon: FilePlus },
        { id: 'billing', title: 'Billing & Kredit', desc: 'Kelola pembayaran', icon: CreditCard }
    ].map(action => (
        <motion.button
            key={action.id}
            onClick={() => onActionClick(action.id)}
            whileHover={{ y: -5, scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className={`${action.primary 
                ? 'bg-gradient-to-r from-[#00ADB5] to-[#009da3] text-white hover:shadow-lg hover:shadow-[#00ADB5]/30' 
                : 'bg-[#222831]/60 backdrop-blur-lg border border-[#EEEEEE]/10 text-white hover:border-[#00ADB5]/30'
            } p-6 rounded-2xl flex items-center gap-4 transition-all text-left`}
        >
            <div className={`p-3 rounded-lg ${action.primary ? 'bg-white/20' : 'bg-[#00ADB5]/20'}`}>
                <action.icon className={`w-6 h-6 ${action.primary ? 'text-white' : 'text-[#00ADB5]'}`} />
            </div>
            <div>
                <p className="font-semibold">{action.title}</p>
                <p className={`text-sm ${action.primary ? 'opacity-90' : 'text-[#EEEEEE]/60'}`}>{action.desc}</p>
            </div>
        </motion.button>
    ))}
  </div>
);


// --- REVISI UTAMA DI SINI ---
// 4. Enhanced Issuance History Table
const IssuanceHistoryTable = ({ history }: { history: IssuanceLog[] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopy = (text: string, id: number) => {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredHistory = history.filter(log => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
        log.template.name.toLowerCase().includes(searchLower) ||
        log.recipientAddress.toLowerCase().includes(searchLower) ||
        log.publicId.toLowerCase().includes(searchLower) ||
        log.credentialId.toString().includes(searchLower);

    const matchesFilter = filterStatus === 'all' || log.status.toLowerCase() === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusChip = (status: string) => {
    const s = status.toLowerCase();
    switch (s) {
      case 'completed':
      case 'confirmed':
        return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium text-green-300 bg-green-500/20"><CheckCircle className="w-3.5 h-3.5" /> Diterbitkan</span>;
      case 'pending':
        return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium text-yellow-300 bg-yellow-500/20"><Clock className="w-3.5 h-3.5" /> Pending</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium text-red-300 bg-red-500/20"><XCircle className="w-3.5 h-3.5" /> Gagal</span>;
    }
  };
  
  return (
    <div className="bg-[#222831]/60 backdrop-blur-lg border border-[#EEEEEE]/10 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-[#EEEEEE]/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl font-bold text-white">Riwayat Penerbitan</h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#EEEEEE]/50" />
              <input
                type="text" placeholder="Cari ID, template, atau alamat..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-[#393E46]/50 border border-[#EEEEEE]/20 rounded-lg text-white placeholder:text-[#EEEEEE]/50 focus:border-[#00ADB5] focus:outline-none transition-all text-sm w-full sm:w-64"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#EEEEEE]/50" />
              <select
                value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-10 pr-8 py-2 bg-[#393E46]/50 border border-[#EEEEEE]/20 rounded-lg text-white focus:border-[#00ADB5] focus:outline-none transition-all text-sm appearance-none cursor-pointer w-full sm:w-auto"
              >
                <option value="all">Semua Status</option>
                <option value="confirmed">Diterbitkan</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#393E46]/30">
            <tr>
              <th className="text-left py-4 px-6 text-sm font-medium text-[#EEEEEE]/70">Public ID (Verifikasi)</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-[#EEEEEE]/70">On-Chain ID</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-[#EEEEEE]/70">Template</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-[#EEEEEE]/70">Penerima</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-[#EEEEEE]/70">Tanggal</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-[#EEEEEE]/70">Status</th>
              <th className="text-left py-4 px-6 text-sm font-medium text-[#EEEEEE]/70">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.map((log, index) => (
              <motion.tr
                key={log.id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 }}
                className="border-b border-[#EEEEEE]/5 hover:bg-[#393E46]/20 transition-colors"
              >
                <td className="py-4 px-6 text-sm text-white font-mono">
                    <div className="flex items-center gap-2">
                        <span>{log.publicId.substring(0, 8)}...</span>
                        <button onClick={() => handleCopy(log.publicId, log.id)} className="text-[#00ADB5] hover:text-white transition-colors">
                            {copiedId === log.id ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                    </div>
                </td>
                <td className="py-4 px-6 text-sm text-[#EEEEEE]/70 font-mono">#{log.credentialId}</td>
                <td className="py-4 px-6 font-medium text-white">{log.template.name}</td>
                <td className="py-4 px-6 text-sm text-[#EEEEEE]/70 font-mono" title={log.recipientAddress}>{log.recipientAddress.substring(0, 6)}...{log.recipientAddress.substring(log.recipientAddress.length - 4)}</td>
                <td className="py-4 px-6 text-sm text-[#EEEEEE]/70">{new Date(log.issuedAt).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})}</td>
                <td className="py-4 px-6">{getStatusChip(log.status)}</td>
                <td className="py-4 px-6">
                  <a href={`https://www.oklink.com/amoy/tx/${log.transactionHash}`} target="_blank" rel="noopener noreferrer"
                      className="p-2 inline-block text-[#EEEEEE]/60 hover:text-[#00ADB5] hover:bg-[#00ADB5]/10 rounded-lg transition-all" title="Lihat di Explorer">
                    <Eye className="w-4 h-4" />
                  </a>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {filteredHistory.length === 0 && (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 text-[#EEEEEE]/30 mx-auto mb-4" />
            <p className="text-[#EEEEEE]/60">Tidak ada riwayat yang cocok dengan filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// 5. Back Button Component
const BackButton = ({ onClick }: { onClick: () => void }) => (
    <motion.button
        onClick={onClick}
        className="flex items-center gap-2 text-[#EEEEEE]/70 hover:text-white mb-6 transition-colors"
        whileHover={{ x: -4 }}
    >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-semibold">Kembali ke Dasbor</span>
    </motion.button>
);


// ==================================
// MAIN DASHBOARD COMPONENT
// ==================================
function IssuerDashboard() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [issuanceHistory, setIssuanceHistory] = useState<IssuanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const showAlert = useCallback((message: string, type: 'success' | 'error') => {
    if (type === 'success') setSuccess(message);
    else setError(message);
    setTimeout(() => {
        setSuccess(null);
        setError(null);
    }, 5000);
  }, []);
  
  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/issuer/login');
      return;
    }
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const [userResponse, templatesResponse, historyResponse] = await Promise.all([
        fetch(`${apiUrl}/auth/profile`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiUrl}/templates`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${apiUrl}/credentials/history`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!userResponse.ok) throw new Error('Sesi tidak valid, silakan login kembali.');
      
      setUser(await userResponse.json());
      if (templatesResponse.ok) setTemplates(await templatesResponse.json());
      if (historyResponse.ok) setIssuanceHistory(await historyResponse.json());

    } catch (err: any) {
      setError(`Gagal memuat data: ${err.message}`);
      if (err.message.includes('Sesi')) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    router.push('/issuer/login');
  };

  const handleActionComplete = () => {
    showAlert('Aksi berhasil diselesaikan!', 'success');
    setActiveView('dashboard');
    fetchData(); // Refresh data after action
  };
  
  const pageVariants = {
      initial: { opacity: 0, x: -50 },
      in: { opacity: 1, x: 0 },
      out: { opacity: 0, x: 50 },
  };

  const pageTransition = {
      type: 'tween',
      ease: 'anticipate',
      duration: 0.5,
  };


  if (loading) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#222831] via-[#393E46] to-[#222831] flex items-center justify-center">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-[#00ADB5] border-t-transparent rounded-full"
            />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#222831] via-[#393E46] to-[#222831] relative">
        <FloatingParticles />
        <AnimatePresence>
            {error && <Alert message={error} type="error" onClose={() => setError(null)} />}
            {success && <Alert message={success} type="success" onClose={() => setSuccess(null)} />}
        </AnimatePresence>
      
        <div className="relative z-10">
            <DashboardHeader user={user} onLogout={handleLogout} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <AnimatePresence mode="wait">
                    {activeView === 'dashboard' && (
                        <motion.div
                            key="dashboard"
                            initial="initial" animate="in" exit="out"
                            variants={pageVariants} transition={pageTransition}
                        >
                            <div className="space-y-10">
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                    <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                                        Selamat datang, {user?.institution?.name.split(' ')[0]}! 👋
                                    </h1>
                                    <p className="text-[#EEEEEE]/70 text-lg">
                                        Berikut adalah ringkasan aktivitas kredensial Anda.
                                    </p>
                                </motion.div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <StatsCard icon={FileText} title="Total Terbit" value={issuanceHistory.length} />
                                    <StatsCard icon={LayoutTemplate} title="Total Template" value={templates.length} color="#3b82f6" />
                                    <StatsCard icon={Users} title="Penerima Unik" value={new Set(issuanceHistory.map(h => h.recipientAddress)).size} color="#8b5cf6" />
                                    <StatsCard icon={CreditCard} title="Sisa Kredit" value={user?.institution?.issuanceCredits ?? 0} color="#10b981" />
                                </div>

                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-6">Aksi Cepat</h2>
                                    <QuickActions onActionClick={setActiveView} />
                                </div>

                                <IssuanceHistoryTable history={issuanceHistory} />
                            </div>
                        </motion.div>
                    )}

                    {activeView !== 'dashboard' && (
                         <motion.div
                            key={activeView}
                            initial="initial" animate="in" exit="out"
                            variants={pageVariants} transition={pageTransition}
                         >
                            <BackButton onClick={() => setActiveView('dashboard')} />
                            {activeView === 'issue' && <MintCredentialForm templates={templates} showAlert={showAlert} />}
                            {activeView === 'batch-issue' && <BatchIssueForm templates={templates} showAlert={showAlert} onBatchComplete={handleActionComplete} />}
                            {activeView === 'billing' && user && <BillingSection user={user} showAlert={showAlert} />}
                            {activeView === 'builder' && (
                                <div className="bg-gradient-to-br from-[#EEEEEE]/10 to-[#EEEEEE]/5 backdrop-blur-sm border border-[#EEEEEE]/20 rounded-2xl p-4 sm:p-6">
                                    <div className="h-[85vh] rounded-lg overflow-hidden">
                                        <TemplateBuilder onSave={handleActionComplete} isSaving={false} />
                                    </div>
                                </div>
                            )}
                         </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    </div>
  );
}

// Suspense wrapper for the main component
export default function IssuerDashboardPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-[#222831] via-[#393E46] to-[#222831] flex items-center justify-center text-white">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-t-2 border-[#00ADB5]"></div>
            </div>
        }>
            <IssuerDashboard />
        </Suspense>
    )
}
