'use client';

import { useState } from 'react';
import { CreditCard, ShoppingCart, Shield, Loader2 } from 'lucide-react';
import { UserProfile } from '../types';

interface BillingSectionProps {
  user: UserProfile;
  showAlert: (msg: string, type: 'success' | 'error') => void;
}

export function BillingSection({ user, showAlert }: BillingSectionProps) {
  const [creditAmount, setCreditAmount] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [purchaseType, setPurchaseType] = useState<'credits' | 'subscription' | null>(null);
  const CREDIT_PRICE = 50;

  const handlePurchase = async (itemType: 'credits' | 'subscription') => {
    setIsLoading(true);
    setPurchaseType(itemType);
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const payload = {
        itemType,
        quantity: itemType === 'credits' ? creditAmount : undefined,
      };

      const response = await fetch(`${apiUrl}/payments/create-invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Gagal membuat invoice pembayaran.');
      }

      if (data.invoice_url) {
        window.location.href = data.invoice_url;
      } else {
        throw new Error('URL Invoice tidak diterima dari server.');
      }

    } catch (err: any) {
      showAlert(err.message, 'error');
    } finally {
      setIsLoading(false);
      setPurchaseType(null);
    }
  };
  
  const subscriptionActive = user.institution?.subscriptionExpiresAt && new Date(user.institution.subscriptionExpiresAt) > new Date();

  return (
    <div className="bg-gradient-to-br from-[#EEEEEE]/10 to-[#EEEEEE]/5 backdrop-blur-sm border border-[#EEEEEE]/20 rounded-2xl p-6 sm:p-8">
      <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-4">
        <CreditCard className="w-8 h-8 text-[#00ADB5]" />
        Kredit & Langganan
      </h2>
      <p className="text-md text-[#EEEEEE]/70 mb-8">Kelola saldo kredit dan status langganan untuk penerbitan tanpa batas.</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Kolom Kiri: Status & Saldo */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-black/20 p-6 rounded-xl border border-white/10 text-center">
              <h3 className="text-lg font-semibold text-[#EEEEEE]/80 mb-2">Saldo Kredit Anda</h3>
              <p className="text-5xl font-bold text-[#00ADB5] my-2">
                {user.institution?.issuanceCredits ?? 0}
              </p>
              <p className="text-sm text-[#EEEEEE]/60">Kredit Tersisa</p>
            </div>
             <div className="bg-black/20 p-6 rounded-xl border border-white/10 text-center">
              <h3 className="text-lg font-semibold text-[#EEEEEE]/80 mb-2">Status Langganan</h3>
              {subscriptionActive ? (
                <>
                    <p className="text-3xl font-bold text-green-400 my-2">Aktif</p>
                    <p className="text-sm text-[#EEEEEE]/60">Berakhir pada {new Date(user.institution!.subscriptionExpiresAt!).toLocaleDateString('id-ID', {day: 'numeric', month:'long', year:'numeric'})}</p>
                </>
              ) : (
                <>
                    <p className="text-3xl font-bold text-red-400 my-2">Tidak Aktif</p>
                    <p className="text-sm text-[#EEEEEE]/60">Upgrade untuk penerbitan tanpa batas.</p>
                </>
              )}
            </div>
        </div>

        {/* Kolom Kanan: Aksi Pembelian */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-black/20 p-6 rounded-xl border border-white/10 flex flex-col">
            <h4 className="text-xl font-bold text-white mb-2">Beli Kredit Satuan</h4>
            <p className="text-sm text-[#EEEEEE]/60 mb-4 flex-grow">
              Ideal untuk kebutuhan penerbitan yang fleksibel dan tidak menentu.
            </p>
            <div className="space-y-4">
              <label className="text-sm font-medium text-[#EEEEEE]/80">Jumlah Kredit</label>
              <input
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="block w-full rounded-lg border-2 border-[#EEEEEE]/10 bg-[#393E46]/50 p-3 text-[#EEEEEE] placeholder-[#EEEEEE]/50 transition-all duration-300 focus:outline-none focus:ring-0 focus:border-[#00ADB5] focus:bg-[#393E46]/70"
                min="1"
              />
              <div className="text-center text-white font-semibold text-lg">
                Total: Rp {(creditAmount * CREDIT_PRICE).toLocaleString('id-ID')}
              </div>
              <button
                onClick={() => handlePurchase('credits')}
                disabled={isLoading}
                className="w-full bg-[#00ADB5] hover:shadow-lg hover:shadow-[#00ADB5]/40 text-white py-2.5 px-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 flex items-center justify-center"
              >
                {isLoading && purchaseType === 'credits' ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <ShoppingCart className="w-5 h-5 mr-2"/>}
                {isLoading && purchaseType === 'credits' ? 'Memproses...' : 'Beli Kredit'}
              </button>
            </div>
          </div>

          <div className="bg-black/20 p-6 rounded-xl border-2 border-[#00ADB5]/50 flex flex-col shadow-lg shadow-[#00ADB5]/10">
            <h4 className="text-xl font-bold text-white mb-2">Langganan Bulanan</h4>
            <p className="text-sm text-[#EEEEEE]/60 mb-4 flex-grow">
              Dapatkan penerbitan kredensial <span className="text-white font-semibold">tanpa batas</span> dengan biaya tetap bulanan.
            </p>
            <div className="text-center text-white font-semibold mb-4">
              <span className="text-4xl font-bold">Rp 250rb</span>
              <span className="text-lg text-[#EEEEEE]/70">/bulan</span>
            </div>
            <button
              onClick={() => handlePurchase('subscription')}
              disabled={isLoading || subscriptionActive}
              className="w-full bg-gradient-to-r from-[#00ADB5] to-[#009da3] text-white py-2.5 px-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading && purchaseType === 'subscription' ? <Loader2 className="w-5 h-5 mr-2 animate-spin"/> : <Shield className="w-5 h-5 mr-2"/>}
              {isLoading && purchaseType === 'subscription' ? 'Memproses...' : (subscriptionActive ? 'Langganan Aktif' : 'Berlangganan Sekarang')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}