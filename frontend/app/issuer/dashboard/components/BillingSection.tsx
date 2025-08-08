'use client';

import { useState } from 'react';
import { CreditCard, ShoppingCart, Shield } from 'lucide-react';
import { UserProfile } from '../types';

interface BillingSectionProps {
  user: UserProfile;
  showAlert: (msg: string, type: 'success' | 'error') => void;
}

export function BillingSection({ user, showAlert }: BillingSectionProps) {
  const [creditAmount, setCreditAmount] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const CREDIT_PRICE = 50; // Rp 50 per kredit

  const handlePurchase = async (itemType: 'credits' | 'subscription') => {
    setIsLoading(true);
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
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#EEEEEE]/10 to-[#EEEEEE]/5 backdrop-blur-sm border border-[#EEEEEE]/20 rounded-2xl p-6 sm:p-8">
      <h2 className="text-3xl font-bold text-white mb-2 flex items-center">
        <CreditCard className="w-8 h-8 mr-4 text-[#00ADB5]" />
        Kredit & Langganan
      </h2>
      <p className="text-md text-[#EEEEEE]/70 mb-8">Kelola saldo kredit dan status langganan Anda.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        <div className="md:col-span-1 bg-black/20 p-6 rounded-xl border border-white/10 flex flex-col items-center justify-center text-center h-full">
          <h3 className="text-lg font-semibold text-[#EEEEEE]/80">Saldo Kredit Anda</h3>
          <p className="text-5xl font-bold text-[#00ADB5] my-2">
            {user.institution?.issuanceCredits ?? 0}
          </p>
          <p className="text-sm text-[#EEEEEE]/60">Kredit Tersisa</p>
        </div>

        <div className="md:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-black/20 p-6 rounded-xl border border-white/10">
            <h4 className="text-xl font-bold text-white mb-4">Beli Kredit Satuan</h4>
            <p className="text-sm text-[#EEEEEE]/60 mb-4">
              Harga per kredit: Rp {CREDIT_PRICE}. Ideal untuk kebutuhan penerbitan yang fleksibel.
            </p>
            <div className="space-y-4">
              <input
                type="number"
                value={creditAmount}
                onChange={(e) => setCreditAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="block w-full rounded-lg border border-[#EEEEEE]/30 bg-[#222831]/50 p-3 text-[#EEEEEE] placeholder-[#EEEEEE]/50 transition-colors focus:border-[#00ADB5] focus:ring-2 focus:ring-[#00ADB5]/50"
                min="1"
              />
              <div className="text-center text-white font-semibold">
                Total: Rp {(creditAmount * CREDIT_PRICE).toLocaleString('id-ID')}
              </div>
              <button
                onClick={() => handlePurchase('credits')}
                disabled={isLoading}
                className="w-full bg-[#00ADB5] hover:shadow-lg hover:shadow-[#00ADB5]/40 text-[#EEEEEE] py-2.5 px-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 flex items-center justify-center"
              >
                <ShoppingCart className="w-5 h-5 mr-2"/>
                {isLoading ? 'Memproses...' : 'Beli Kredit'}
              </button>
            </div>
          </div>

          <div className="bg-black/20 p-6 rounded-xl border border-white/10 flex flex-col">
            <h4 className="text-xl font-bold text-white mb-4">Langganan Bulanan</h4>
            <p className="text-sm text-[#EEEEEE]/60 mb-4 flex-grow">
              Dapatkan penerbitan tanpa batas dengan biaya tetap bulanan.
            </p>
            <div className="text-center text-white font-semibold mb-4">
              <span className="text-3xl">Rp 250rb</span>
              <span className="text-lg text-[#EEEEEE]/70">/bulan</span>
            </div>
            <button
              onClick={() => handlePurchase('subscription')}
              disabled={isLoading}
              className="w-full bg-transparent border-2 border-[#00ADB5] hover:bg-[#00ADB5] text-[#00ADB5] hover:text-white py-2.5 px-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 flex items-center justify-center"
            >
              <Shield className="w-5 h-5 mr-2"/>
              {isLoading ? 'Memproses...' : 'Berlangganan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}