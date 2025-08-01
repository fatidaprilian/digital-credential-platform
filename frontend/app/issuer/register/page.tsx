'use client';

import { useState, FormEvent, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building, AtSign, Lock, Phone, MapPin, FileUp, CheckCircle, AlertCircle, ArrowLeft, UserPlus } from 'lucide-react';

// Komponen untuk menampilkan pesan status (error atau sukses)
const Alert = ({ message, type }: { message: string; type: 'success' | 'error' }) => {
    const styles = {
        success: {
            icon: <CheckCircle className="w-5 h-5 text-green-400" />,
            bgColor: 'bg-green-500/10',
            textColor: 'text-green-300',
        },
        error: {
            icon: <AlertCircle className="w-5 h-5 text-red-400" />,
            bgColor: 'bg-red-500/10',
            textColor: 'text-red-400',
        },
    };
    const currentStyle = styles[type];

    if (!message) return null;

    return (
        <div className={`p-3 rounded-lg flex items-center space-x-3 text-sm ${currentStyle.bgColor} ${currentStyle.textColor}`}>
            {currentStyle.icon}
            <span>{message}</span>
        </div>
    );
};

export default function RegisterIssuerPage() {
    const [formData, setFormData] = useState({
        name: '',
        officialEmail: '',
        password: '',
        phoneNumber: '',
        address: '',
    });
    const [verificationDocument, setVerificationDocument] = useState<File | null>(null);
    const [status, setStatus] = useState({ isLoading: false, error: '', success: '' });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setVerificationDocument(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setStatus({ isLoading: true, error: '', success: '' });

        if (!verificationDocument) {
            setStatus({ isLoading: false, error: 'Dokumen verifikasi legalitas wajib diunggah.', success: '' });
            return;
        }

        const data = new FormData();
        data.append('name', formData.name);
        data.append('officialEmail', formData.officialEmail);
        data.append('password', formData.password);
        data.append('phoneNumber', formData.phoneNumber);
        data.append('address', formData.address);
        data.append('verificationDocument', verificationDocument);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
            const response = await fetch(`${apiUrl}/auth/register/institution`, {
                method: 'POST',
                body: data,
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Terjadi kesalahan saat mendaftar.');
            }
            setStatus({ isLoading: false, error: '', success: "Pendaftaran berhasil! Silakan tunggu persetujuan dari admin." });
            setFormData({ name: '', officialEmail: '', password: '', phoneNumber: '', address: '' });
            setVerificationDocument(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error: any) {
            setStatus({ isLoading: false, error: error.message, success: '' });
        }
    };
    
    // Palet warna tema
    const theme = {
        background: "#222831",
        card: "#393E46",
        accent: "#00ADB5",
        text: "#EEEEEE"
    };

    return (
        <main className="min-h-screen w-full flex items-center justify-center p-4" style={{ background: `linear-gradient(135deg, ${theme.background}, ${theme.card})` }}>
            <div className="w-full max-w-lg">
                <div className="bg-[#222831]/60 backdrop-blur-lg border border-[#EEEEEE]/10 rounded-2xl shadow-2xl p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold" style={{ color: theme.text }}>
                            Daftar Sebagai Institusi
                        </h1>
                        <p style={{ color: theme.accent }}>
                            Isi formulir untuk memulai verifikasi
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Input Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="relative">
                                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: theme.accent }} />
                                <input id="name" name="name" type="text" required value={formData.name} onChange={handleInputChange} placeholder="Nama Institusi" className="w-full pl-10 pr-3 py-3 rounded-lg border-2 border-transparent focus:border-[#00ADB5] focus:ring-0 transition-all" style={{ backgroundColor: theme.card, color: theme.text }} />
                            </div>
                            <div className="relative">
                                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: theme.accent }} />
                                <input id="officialEmail" name="officialEmail" type="email" required value={formData.officialEmail} onChange={handleInputChange} placeholder="Email Resmi" className="w-full pl-10 pr-3 py-3 rounded-lg border-2 border-transparent focus:border-[#00ADB5] focus:ring-0 transition-all" style={{ backgroundColor: theme.card, color: theme.text }} />
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: theme.accent }} />
                                <input id="password" name="password" type="password" required minLength={8} value={formData.password} onChange={handleInputChange} placeholder="Password (min. 8 karakter)" className="w-full pl-10 pr-3 py-3 rounded-lg border-2 border-transparent focus:border-[#00ADB5] focus:ring-0 transition-all" style={{ backgroundColor: theme.card, color: theme.text }} />
                            </div>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: theme.accent }} />
                                <input id="phoneNumber" name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleInputChange} placeholder="Nomor Telepon (Opsional)" className="w-full pl-10 pr-3 py-3 rounded-lg border-2 border-transparent focus:border-[#00ADB5] focus:ring-0 transition-all" style={{ backgroundColor: theme.card, color: theme.text }} />
                            </div>
                        </div>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-4 w-5 h-5" style={{ color: theme.accent }} />
                            <textarea id="address" name="address" value={formData.address} onChange={handleInputChange} placeholder="Alamat (Opsional)" rows={2} className="w-full pl-10 pr-3 py-3 rounded-lg border-2 border-transparent focus:border-[#00ADB5] focus:ring-0 transition-all resize-none" style={{ backgroundColor: theme.card, color: theme.text }} />
                        </div>

                        {/* File Input */}
                        <div>
                            <label htmlFor="verificationDocument" className="block text-sm font-medium mb-2" style={{ color: theme.text }}>
                                Dokumen Verifikasi Legalitas
                            </label>
                            <div 
                                className="relative flex items-center justify-center w-full h-24 rounded-lg border-2 border-dashed transition-all" 
                                style={{ borderColor: theme.card, color: theme.text }}
                            >
                                <FileUp className="w-6 h-6 mr-2" style={{ color: theme.accent }}/>
                                <span className="text-sm">
                                    {verificationDocument ? verificationDocument.name : 'Klik atau seret file ke sini'}
                                </span>
                                <input ref={fileInputRef} id="verificationDocument" name="verificationDocument" type="file" required onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg" className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" />
                            </div>
                            <p className="mt-1 text-xs" style={{ color: theme.text, opacity: 0.7 }}>PNG, JPG, atau PDF (Maks. 5MB).</p>
                        </div>

                        <Alert message={status.error} type="error" />
                        <Alert message={status.success} type="success" />

                        <button type="submit" disabled={status.isLoading} className="w-full py-3 px-4 rounded-lg font-semibold text-lg flex items-center justify-center transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: theme.accent, color: theme.background }}>
                            {status.isLoading ? (
                                <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div> Mendaftarkan...</>
                            ) : (
                                <><UserPlus className="w-5 h-5 mr-2" /> Daftar</>
                            )}
                        </button>
                    </form>
                </div>

                <div className="text-center mt-6">
                    <Link href="/issuer/login" className="text-sm inline-flex items-center justify-center hover:underline" style={{ color: theme.text }}>
                        Sudah punya akun? Masuk di sini
                    </Link>
                </div>
                 <div className="text-center mt-4">
                    <button onClick={() => router.push('/')} className="text-sm inline-flex items-center justify-center hover:underline" style={{ color: theme.text }}>
                        <ArrowLeft className="w-4 h-4 mr-2"/> Kembali ke Halaman Utama
                    </button>
                </div>
            </div>
        </main>
    );
}