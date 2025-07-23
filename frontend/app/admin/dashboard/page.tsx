'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Institution {
  id: number;
  name: string;
  officialEmail: string;
  status: string;
  verificationDocumentUrl: string | null;
}

export default function AdminDashboardPage() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const fetchPendingInstitutions = async (token: string) => {
    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/admin/institutions/pending`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.status === 401 || response.status === 403) {
        router.push('/admin/login');
        return;
      }
      if (!response.ok) throw new Error('Gagal mengambil data institusi.');
      
      const data: Institution[] = await response.json();
      setInstitutions(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/admin/login');
    } else {
      fetchPendingInstitutions(token);
    }
  }, [router]);

  const handleAction = async (institutionId: number, action: 'approve' | 'reject') => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;

    let body = null;
    if (action === 'reject') {
        const reason = prompt('Masukkan alasan penolakan:');
        if (!reason) return;
        body = JSON.stringify({ rejectionReason: reason });
    }

    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        await fetch(`${apiUrl}/admin/institutions/${institutionId}/${action}`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: body,
        });
        setInstitutions(prev => prev.filter(inst => inst.id !== institutionId));
    } catch (err: any) {
        alert(err.message);
    }
  };

  const getDocumentUrl = (path: string | null) => {
    if (!path) return '#';
    // Menghapus '/api' dari base URL untuk file statis
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001';
    return `${baseUrl}/${path}`;
  };

  if (isLoading) return <div className="flex justify-center items-center min-h-screen bg-gray-900 text-white">Loading...</div>;
  if (error) return <div className="flex justify-center items-center min-h-screen bg-gray-900 text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        <h2 className="text-xl font-semibold mb-4">Persetujuan Institusi</h2>
        <div className="bg-gray-800 shadow-md rounded-lg overflow-hidden">
          {institutions.length === 0 ? (
            <p className="p-6 text-center text-gray-400">Tidak ada pendaftaran institusi yang menunggu persetujuan.</p>
          ) : (
            <table className="min-w-full leading-normal">
              <thead>
                <tr>
                  <th className="px-5 py-3 border-b-2 border-gray-700 bg-gray-700 text-left text-xs font-semibold uppercase tracking-wider">Nama Institusi</th>
                  <th className="px-5 py-3 border-b-2 border-gray-700 bg-gray-700 text-left text-xs font-semibold uppercase tracking-wider">Email</th>
                  <th className="px-5 py-3 border-b-2 border-gray-700 bg-gray-700 text-left text-xs font-semibold uppercase tracking-wider">Dokumen</th>
                  <th className="px-5 py-3 border-b-2 border-gray-700 bg-gray-700 text-left text-xs font-semibold uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {institutions.map((inst) => (
                  <tr key={inst.id} className="hover:bg-gray-700">
                    <td className="px-5 py-5 border-b border-gray-700 text-sm">{inst.name}</td>
                    <td className="px-5 py-5 border-b border-gray-700 text-sm">{inst.officialEmail}</td>
                    <td className="px-5 py-5 border-b border-gray-700 text-sm">
                      {inst.verificationDocumentUrl ? (
                        <a href={getDocumentUrl(inst.verificationDocumentUrl)} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">
                          Lihat Dokumen
                        </a>
                      ) : (
                        <span className="text-gray-500">Tidak ada</span>
                      )}
                    </td>
                    <td className="px-5 py-5 border-b border-gray-700 text-sm space-x-2">
                      <button onClick={() => handleAction(inst.id, 'approve')} className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-xs">Approve</button>
                      <button onClick={() => handleAction(inst.id, 'reject')} className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-xs">Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
