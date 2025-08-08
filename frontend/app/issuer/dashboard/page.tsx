'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, FilePlus, LayoutTemplate, Send, Trash2, Edit, CreditCard, FileSpreadsheet, History } from 'lucide-react';

// Import components
import { FloatingParticles } from './components/FloatingParticles';
import { Section } from './components/Section';
import { Alert } from './components/Alert';
import { MintCredentialForm } from './components/MintCredentialForm';
import { BillingSection } from './components/BillingSection';
import { BatchIssueForm } from './components/BatchIssueForm';
import { IssuanceHistory } from './components/IssuanceHistory';

// Import types
import { Template, UserProfile, IssuanceLog } from './types';

const TemplateBuilder = dynamic(() => import('@/components/TemplateBuilder'), {
  ssr: false,
});

export default function IssuerDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#222831] via-[#393E46] to-[#222831] flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00ADB5]"></div>
      </div>
    }>
      <IssuerDashboard />
    </Suspense>
  )
}

function IssuerDashboard() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [issuanceHistory, setIssuanceHistory] = useState<IssuanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'issue' | 'batch-issue' | 'templates' | 'builder' | 'billing' | 'history'>('issue');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const showAlert = useCallback((message: string, type: 'success' | 'error') => {
    if (type === 'success') setSuccess(message);
    else setError(message);
    setTimeout(() => {
        setSuccess(null);
        setError(null);
    }, 5000);
  }, []);
  
  const fetchHistory = useCallback(async (token: string) => {
    setHistoryLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/credentials/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Gagal mengambil data riwayat.');
      const data = await response.json();
      setIssuanceHistory(data);
    } catch (err: any) {
      showAlert(err.message, 'error');
    } finally {
      setHistoryLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const initialTab = searchParams.get('tab');

    if (paymentStatus === 'success') {
      showAlert('Pembayaran berhasil! Saldo dan status langganan Anda telah diperbarui.', 'success');
    } else if (paymentStatus === 'failed') {
      showAlert('Pembayaran gagal atau dibatalkan. Silakan coba lagi.', 'error');
    }

    if (initialTab === 'billing') {
      setActiveTab('billing');
    }

    if (paymentStatus || initialTab) {
       const currentPath = window.location.pathname;
       window.history.replaceState(null, '', currentPath);
    }

    const fetchData = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/issuer/login');
        return;
      }
      try {
        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const [userResponse, templatesResponse] = await Promise.all([
          fetch(`${apiUrl}/auth/profile`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${apiUrl}/templates`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (!userResponse.ok) throw new Error('Sesi tidak valid, silakan login kembali.');
        const userData = await userResponse.json();
        setUser(userData);
        
        if (templatesResponse.ok) setTemplates(await templatesResponse.json());
        
        await fetchHistory(token);

      } catch (err: any) {
        setError(`Gagal memuat dasbor: ${err.message}`);
        if (err.message.includes('Sesi')) {
          router.push('/issuer/login');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router, fetchHistory, showAlert]);

  const handleBatchComplete = () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchHistory(token);
    }
  };

  const handleSaveTemplate = async (templateData: any) => {
    setIsSaving(true);
    try {
        const token = localStorage.getItem('access_token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

        const response = await fetch(`${apiUrl}/template-builder`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(templateData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error server: ${response.status}`);
        }

        const savedTemplate = await response.json();

        setTemplates(prev => [savedTemplate, ...prev]);
        setActiveTab('templates');
        showAlert('Template berhasil disimpan!', 'success');
    } catch (err: any) {
        console.error('Save template error:', err);
        showAlert(`Gagal menyimpan template: ${err.message}`, 'error');
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus template ini? Aksi ini tidak dapat dibatalkan.')) return;

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

      const response = await fetch(`${apiUrl}/template-builder/${templateId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal menghapus template');
      }

      setTemplates(prev => prev.filter(t => t.id !== templateId));
      showAlert('Template berhasil dihapus!', 'success');

    } catch (err: any) {
      showAlert(`Gagal menghapus template: ${err.message}`, 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    router.push('/issuer/login');
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#222831] via-[#393E46] to-[#222831] flex items-center justify-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00ADB5]"></div>
        </div>
    );
  }

  const tabs = [
    { id: 'issue', label: 'Terbitkan', icon: Send },
    { id: 'batch-issue', label: 'Batch (CSV)', icon: FileSpreadsheet },
    { id: 'templates', label: 'Kelola Template', icon: LayoutTemplate },
    { id: 'history', label: 'Riwayat', icon: History },
    { id: 'builder', label: 'Desain Template', icon: FilePlus },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#222831] via-[#393E46] to-[#222831] relative overflow-x-hidden text-[#EEEEEE]">
        <FloatingParticles />
        {error && <Alert message={error} type="error" onClose={() => setError(null)} />}
        {success && <Alert message={success} type="success" onClose={() => setSuccess(null)} />}

        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <header className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-12 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex-1">
                    <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        Dasbor Penerbit
                    </h1>
                    <p className="text-lg text-gray-300 mt-1">
                        {user?.institution?.name ?? user?.email}
                    </p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex-1 bg-black/20 p-4 rounded-xl border border-white/10 text-center">
                        <div className="text-sm text-[#EEEEEE]/70">Saldo Kredit</div>
                        <div className="text-2xl font-bold text-[#00ADB5]">{user?.institution?.issuanceCredits ?? 0}</div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-600/50 hover:bg-red-600/80 border border-red-500/50 text-white rounded-xl font-semibold transition-colors h-full"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="hidden sm:inline">Keluar</span>
                    </button>
                </div>
            </header>

            <div className="mb-8 p-1.5 bg-black/20 border border-white/10 rounded-xl flex flex-wrap items-center gap-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`w-full sm:w-auto flex-1 py-2.5 px-4 rounded-lg text-sm sm:text-base font-semibold flex items-center justify-center space-x-2 transition-colors ${
                          activeTab === tab.id
                            ? 'bg-[#00ADB5] text-white shadow-md shadow-[#00ADB5]/20'
                            : 'text-[#EEEEEE]/70 hover:bg-white/10'
                        }`}
                    >
                        <tab.icon className="w-5 h-5" />
                        <span>
                          {
                            tab.id === 'templates' ? `${tab.label} (${templates.length})` : 
                            tab.id === 'history' ? `${tab.label} (${issuanceHistory.length})` :
                            tab.label
                          }
                        </span>
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {activeTab === 'issue' && (
                      <Section>
                        <MintCredentialForm templates={templates} showAlert={showAlert} />
                      </Section>
                    )}
                    
                    {activeTab === 'batch-issue' && (
                      <Section>
                        <BatchIssueForm templates={templates} showAlert={showAlert} onBatchComplete={handleBatchComplete} />
                      </Section>
                    )}

                    {activeTab === 'history' && (
                      <Section>
                        <IssuanceHistory history={issuanceHistory} isLoading={historyLoading} />
                      </Section>
                    )}
                    
                    {activeTab === 'billing' && user && (
                        <Section>
                            <BillingSection user={user} showAlert={showAlert} />
                        </Section>
                    )}

                    {activeTab === 'builder' && (
                        <Section>
                            <div className="bg-gradient-to-br from-[#EEEEEE]/10 to-[#EEEEEE]/5 backdrop-blur-sm border border-[#EEEEEE]/20 rounded-2xl p-6 sm:p-8">
                                <div className="h-[80vh]">
                                    <TemplateBuilder onSave={handleSaveTemplate} isSaving={isSaving} />
                                </div>
                            </div>
                        </Section>
                    )}

                    {activeTab === 'templates' && (
                        <Section>
                            <div className="mb-8 flex justify-between items-center">
                                <h2 className="text-3xl font-bold text-white">Manajemen Template</h2>
                                <button
                                  onClick={() => setActiveTab('builder')}
                                  className="bg-[#00ADB5] hover:shadow-lg hover:shadow-[#00ADB5]/40 text-[#EEEEEE] px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
                                >
                                    <FilePlus className="w-5 h-5"/>
                                    <span>Buat Baru</span>
                                </button>
                            </div>
                            {templates.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {templates.map((template) => (
                                        <motion.div
                                            key={template.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="bg-gradient-to-br from-[#EEEEEE]/10 to-[#EEEEEE]/5 backdrop-blur-sm border border-[#EEEEEE]/20 rounded-2xl p-6 flex flex-col justify-between"
                                        >
                                            <div>
                                                <h3 className="text-xl font-bold text-white">{template.name}</h3>
                                                <p className="text-[#EEEEEE]/70 text-sm mt-2 mb-2 min-h-[40px]">
                                                  {template.description || 'Tidak ada deskripsi.'}
                                                </p>
                                                <p className="text-xs text-[#EEEEEE]/50">
                                                  Fields: {template.dynamicFields?.length || 0}
                                                </p>
                                            </div>
                                            <div className="flex space-x-3 mt-auto">
                                                <button
                                                  disabled
                                                  className="flex-1 text-sm font-medium py-2 px-3 border border-[#EEEEEE]/30 rounded-lg text-[#EEEEEE]/50 cursor-not-allowed flex items-center justify-center space-x-2"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                    <span>Ubah</span>
                                                </button>
                                                <button
                                                  onClick={() => handleDeleteTemplate(template.id)}
                                                  className="flex-1 text-red-400 text-sm font-medium py-2 px-3 border border-red-500/50 hover:bg-red-500/20 rounded-lg transition-colors flex items-center justify-center space-x-2"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    <span>Hapus</span>
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-black/20 rounded-2xl border border-white/10">
                                    <h3 className="text-2xl font-semibold text-white">Belum ada template.</h3>
                                    <p className="text-[#EEEEEE]/60 mt-2 mb-6">Mari mulai dengan membuat template kredensial pertama Anda.</p>
                                    <button
                                      onClick={() => setActiveTab('builder')}
                                      className="bg-[#00ADB5] hover:shadow-lg hover:shadow-[#00ADB5]/40 text-[#EEEEEE] px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105"
                                    >
                                        Buat Template Pertama
                                    </button>
                                </div>
                            )}
                        </Section>
                    )}
                </motion.div>
            </AnimatePresence>
        </main>
    </div>
  );
}