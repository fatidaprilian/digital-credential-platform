'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';

// Komponen untuk menampilkan pesan error atau sukses
const Alert = ({ message, type }: { message: string; type: 'success' | 'error' }) => {
  const baseClasses = 'p-4 rounded-md text-sm';
  const typeClasses = {
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
  };
  return <div className={`${baseClasses} ${typeClasses[type]}`}>{message}</div>;
};

export default function RegisterIssuerPage() {
  // State untuk menampung data dari setiap input form
  const [formData, setFormData] = useState({
    name: '',
    officialEmail: '',
    password: '',
    phoneNumber: '',
    address: '',
  });

  // State untuk menampung file yang di-upload
  const [verificationDocument, setVerificationDocument] = useState<File | null>(null);
  
  // State untuk mengelola status UI (loading, error, success)
  const [status, setStatus] = useState({
    isLoading: false,
    error: '',
    success: '',
  });

  // Handler untuk memperbarui state saat input teks berubah
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handler untuk memperbarui state saat file dipilih
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVerificationDocument(e.target.files[0]);
    }
  };

  // Fungsi yang dijalankan saat form di-submit
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Reset status sebelum submit baru
    setStatus({ isLoading: true, error: '', success: '' });

    if (!verificationDocument) {
      setStatus({ isLoading: false, error: 'Dokumen verifikasi wajib diunggah.', success: '' });
      return;
    }

    // Gunakan FormData karena kita mengirim file
    const data = new FormData();
    data.append('name', formData.name);
    data.append('officialEmail', formData.officialEmail);
    data.append('password', formData.password);
    data.append('phoneNumber', formData.phoneNumber);
    data.append('address', formData.address);
    data.append('verificationDocument', verificationDocument);

    try {
      // --- PERUBAHAN UNTUK PRODUCTION ---
      // Menggunakan Environment Variable untuk URL backend agar dinamis.
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
      const response = await fetch(`${apiUrl}/auth/register/institution`, {
        method: 'POST',
        body: data, // Tidak perlu header 'Content-Type', browser akan set otomatis untuk FormData
      });

      const result = await response.json();

      if (!response.ok) {
        // Tangani error dari backend (misal: email sudah ada, validasi gagal)
        throw new Error(result.message || 'Terjadi kesalahan saat mendaftar.');
      }
      
      // Jika berhasil, tampilkan pesan sukses
      setStatus({ isLoading: false, error: '', success: result.message });
      // Kosongkan form setelah berhasil
      setFormData({ name: '', officialEmail: '', password: '', phoneNumber: '', address: '' });
      setVerificationDocument(null);
      // Reset file input
      const fileInput = document.getElementById('verificationDocument') as HTMLInputElement;
      if(fileInput) fileInput.value = '';

    } catch (error: any) {
      setStatus({ isLoading: false, error: error.message, success: '' });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Daftarkan Institusi Anda
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sudah punya akun?{' '}
            <Link href="/issuer/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Masuk di sini
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            {/* Input fields */}
            <div>
              <label htmlFor="name" className="sr-only">Nama Institusi</label>
              <input id="name" name="name" type="text" required value={formData.name} onChange={handleInputChange} className="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm" placeholder="Nama Institusi"/>
            </div>
            <div>
              <label htmlFor="officialEmail" className="sr-only">Email Resmi</label>
              <input id="officialEmail" name="officialEmail" type="email" required value={formData.officialEmail} onChange={handleInputChange} className="relative block w-full appearance-none rounded-none border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm" placeholder="Email Resmi"/>
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input id="password" name="password" type="password" required minLength={8} value={formData.password} onChange={handleInputChange} className="relative block w-full appearance-none rounded-none border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm" placeholder="Password"/>
            </div>
            <div>
              <label htmlFor="phoneNumber" className="sr-only">Nomor Telepon</label>
              <input id="phoneNumber" name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleInputChange} className="relative block w-full appearance-none rounded-none border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm" placeholder="Nomor Telepon (Opsional)"/>
            </div>
            <div>
              <label htmlFor="address" className="sr-only">Alamat</label>
              <textarea id="address" name="address" value={formData.address} onChange={handleInputChange} className="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm" placeholder="Alamat (Opsional)"/>
            </div>
          </div>

          {/* File input */}
          <div>
            <label htmlFor="verificationDocument" className="block text-sm font-medium text-gray-700">
              Dokumen Verifikasi Legalitas
            </label>
            <div className="mt-1">
              <input id="verificationDocument" name="verificationDocument" type="file" required onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"/>
              <p className="mt-1 text-xs text-gray-500">PNG, JPG, JPEG, atau PDF (Maks. 5MB).</p>
            </div>
          </div>

          {/* Menampilkan pesan status */}
          {status.error && <Alert message={status.error} type="error" />}
          {status.success && <Alert message={status.success} type="success" />}

          <div>
            <button type="submit" disabled={status.isLoading} className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-300">
              {status.isLoading ? 'Mendaftarkan...' : 'Daftar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
